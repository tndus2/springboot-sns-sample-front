import { ApiError } from '@/lib/types'

// function getXsrfToken() {
//    const raw =document.cookie
//       .split('; ')
//       .find(row => row.startsWith('XSRF-TOKEN='))
//       ?.split('=')[1];
//
//   return raw ? decodeURIComponent(raw) : undefined;
// }

export class ApiClient {
  private baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      credentials: 'include', // 쿠키 기반 세션을 위해 필요
      headers: {
        'Content-Type': 'application/json',
        // JSON 요청이 서버에서 파싱되도록 Content-Type 오타를 수정함
        // ...(getXsrfToken() && { 'XSRF-TOKEN': getXsrfToken() }),
        ...options?.headers,
      },
    })

    // 401 Unauthorized - /users/me 요청에서만 로그인 페이지로 리다이렉트
    // 다른 API는 에러만 throw하여 개별적으로 처리할 수 있게 함
    if (response.status === 401) {
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

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    })
  }
}

// Singleton instance
export const apiClient = new ApiClient()
