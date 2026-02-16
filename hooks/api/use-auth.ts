'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { usersApi } from '@/lib/api/users'
import { useAuthContext } from '@/lib/auth/provider'
import type { UserSignupRequest } from '@/lib/types'

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isLoading, isAuthenticated } = useAuthContext()

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: () => {
      toast.success('로그인 성공!')
      // 전체 페이지 리로드로 모든 상태 초기화
      window.location.href = '/'
    },
    onError: (error) => {
      toast.error('로그인 실패: 아이디나 비밀번호를 확인해주세요.')
      console.error('Login error:', error)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      toast.success('로그아웃되었습니다.')
    },
    onError: (error) => {
      console.error('Logout error:', error)
    },
    onSettled: () => {
      // 전체 페이지 리로드로 모든 상태 초기화
      window.location.href = '/login'
    },
  })
  // 회원가입 함수
  const signupMutation = useMutation({
    mutationFn: (data: UserSignupRequest) => usersApi.signup(data),
    onSuccess: () => {
      toast.success('회원가입 성공! 로그인해주세요.')
      router.push('/login')
    },
    onError: (error) => {
      toast.error('회원가입 실패: 이미 존재하는 사용자명이거나 오류가 발생했습니다.')
      console.error('Signup error:', error)
    },
  })

  // 타입스트림트 : 자바스크립트에 타입만 얹는 언어
  // 에러를 실행 전에 잡아주는 역할을 해줌 , 기존 자바스크립트에 타입을 추가해줘었기 떄문에
  // 아래의 return 은 함수를 객체로 묶어서 반환하는 형태
  // > 커스텀 훅 처럼 쓰거나 api로 상태를 함계 넘기기 위함
  // 즉, 순수 자바스크립트 객체 형태 반환
  // isPending 해당 함수의 요청이 처리중인지 아닌지 상태를 알려주는 함수값
  return {
    user,
    isLoading,
    isAuthenticated,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    signup: signupMutation.mutate,
    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isSignupPending: signupMutation.isPending,
  }
}

// .tsx : ui담당
// .ts : 훅/로직 담당
// .tsx에서 버튼에 isSignupPending 을 임포트하고 호출하는거 같지만
// 실제함수명칭은 signupMutation - 실제 api 연결 함수 해당 함수를 호출
// isSignupPending 는 해당 함수의처리 상태값을 담은 반환값
