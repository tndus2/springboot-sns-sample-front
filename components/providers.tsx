'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth/provider'
import { ApiError } from '@/lib/types'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1분
        gcTime: 1000 * 60 * 5, // 5분
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status === 401) {
            return false
          }
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false
          }
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <CsrfBootstrap />
      <AuthProvider>
        {children}
        <Toaster position="top-center" richColors />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

function CsrfBootstrap() {
  useEffect(() => {
    const controller = new AbortController()

    // 2026-08-17: 로그인 직후나 새로고침 직후에도 보호된 POST/PATCH 요청이 바로 동작하도록
    // 앱 시작 시 /api/v1/csrf 를 먼저 호출해 XSRF-TOKEN 쿠키를 미리 확보한다.
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/v1/csrf`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    }).catch((error) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      // 2026-08-17: CSRF bootstrap 실패는 앱 전체 렌더링을 막을 수준은 아니므로
      // 콘솔에만 남기고, 이후 개별 보호 요청에서 다시 원인을 확인할 수 있게 둔다.
      console.error('CSRF bootstrap failed:', error)
    })

    return () => controller.abort()
  }, [])

  // 2026-08-17: 이 컴포넌트는 화면을 렌더링하지 않고
  // 앱 시작 시점에 CSRF 쿠키를 준비하는 사이드이펙트만 담당한다.
  return null
}
