import { ApiError } from '@/lib/types'

type CsrfBootstrapResponse = {
  token: string
  headerName: string
  parameterName: string
}

let csrfTokenCache: string | undefined

// 2026-08-17: GET 처럼 조회 전용 메서드는 제외하고
// POST/PUT/PATCH/DELETE 같은 상태 변경 요청에만 CSRF 헤더를 붙인다.
function isCsrfProtectedMethod(method?: string) {
  if (!method) {
    return false
  }

  const normalizedMethod = method.toUpperCase()
  return normalizedMethod === 'POST'
    || normalizedMethod === 'PUT'
    || normalizedMethod === 'PATCH'
    || normalizedMethod === 'DELETE'
}

async function ensureCsrfToken(baseURL: string) {
  const existingToken = csrfTokenCache
  if (existingToken) {
    return existingToken
  }

  // 2026-08-17: 프론트와 백엔드가 서로 다른 origin(localhost:3000 / localhost:8080) 이라
  // document.cookie 로는 8080 이 발급한 XSRF-TOKEN 을 읽을 수 없다.
  // 따라서 /api/v1/csrf 응답 JSON 에 담긴 token 값을 메모리에 캐시해 헤더로 사용한다.
  // 기존 방식:
  //
  //     - 웹에서 document.cookie 로 XSRF-TOKEN 을 직접 읽어서 헤더에 넣으려 했음
  // - 그런데 프론트 localhost:3000 과 백엔드 localhost:8080 이 분리되어 있어서, 웹 JS가 백엔드 origin 쿠키를 직접 읽을 수 없었음
  // - 그래서 토큰 헤더를 못 붙였고 403 이 났음
  //
  // 바뀐 방식:
  //
  //     - WAS가 /api/v1/csrf 응답에서 CSRF 토큰을 생성해서 JSON으로 내려줌
  // - 웹은 그 응답의 token 값을 받아 메모리에 저장함
  // - 이후 보호된 POST/PUT/PATCH/DELETE 요청 때 그 값을 X-XSRF-TOKEN 헤더에 넣어 보냄

  //   - “브라우저 쿠키를 직접 읽는 구조에서, WAS가 /api/v1/csrf 응답으로 내려준 토큰을 프론트가 저장했다가 헤더로 재전송하는 구조로 변경했다”
  const response = await fetch(`${baseURL}/api/v1/csrf`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`CSRF bootstrap failed with status ${response.status}`)
  }

  const data = await response.json() as CsrfBootstrapResponse
  csrfTokenCache = data.token
  return csrfTokenCache
}

export class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const requestMethod = options?.method?.toUpperCase() ?? 'GET'
    // 2026-08-17: 보호된 상태 변경 요청은 실행 직전에 토큰 쿠키를 확인하고,
    // 아직 없으면 /api/v1/csrf bootstrap 응답 JSON 에서 토큰을 받아 헤더를 붙인다.
    const csrfToken = isCsrfProtectedMethod(requestMethod)
      ? await ensureCsrfToken(this.baseURL)
      : csrfTokenCache

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // 쿠키 기반 세션을 위해 필요
      headers: {
        'Content-Type': 'application/json',
        // 2026-08-17: 세션 기반 보안을 유지하기 위해 상태 변경 요청은
        // XSRF-TOKEN 쿠키 값을 X-XSRF-TOKEN 헤더로 함께 전송한다.
        ...(isCsrfProtectedMethod(requestMethod) && csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        ...options?.headers,
      },
    })

    // 401 Unauthorized - /users/me 요청에서만 로그인 페이지로 리다이렉트
    // 다른 API는 에러만 throw하여 개별적으로 처리할 수 있게 함
    if (response.status === 401) {
      // 2026-08-17: 세션이 만료되면 기존 토큰 캐시는 더 이상 유효하지 않을 수 있으므로 비운다.
      csrfTokenCache = undefined
      const isAuthEndpoint = endpoint === '/api/v1/users/me'
      if (isAuthEndpoint && typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/signup') {
          window.location.href = '/login'
        }
      }
      throw new ApiError(401, 'Unauthorized')
    }

    // 204 No Content - 응답 본문 없음
    if (response.status === 204) {
      return undefined as T
    }

    // 응답이 성공적이지 않으면 에러
    if (!response.ok) {
      let errorMessage = 'Request failed'
      let errorDetails = undefined

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
        errorDetails = errorData
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      throw new ApiError(response.status, errorMessage, errorDetails)
    }

    // JSON 응답 파싱
  //   const text = await response.text()
  //   if (!text) {
  //     return undefined as T
  //   }
  //   try {
  //     return JSON.parse(text)
  //   } catch {
  //     return undefined as T
  //   }

    const text = await response.text()
    if (!text) {
      return null as T   // 🔥 undefined → null 로 변경
    }try {
      return JSON.parse(text)
    } catch {
      return null as T   // 🔥 undefined 말고 null
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    })
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async postForm<T>(
    endpoint: string,
    data: URLSearchParams,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options?.headers,
      },
      body: data.toString(),
    })
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    // 2026-08-17: 프로필 수정 같은 정석적인 JSON 상태 변경 API가
    // PATCH 메서드를 사용할 수 있도록 공통 클라이언트에 patch 헬퍼를 추가한다.
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }
}

// Singleton instance
export const apiClient = new ApiClient()
