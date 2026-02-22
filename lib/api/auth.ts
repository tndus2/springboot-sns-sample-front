import { apiClient } from './client'

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthSessionsResponse {
  sessions: Array<{
    sessionId: string
    createdAt: string
    lastAccessedAt: string
  }>
}

export const authApi = {
  login: (username: string, password: string) => {
    // 백엔드 로그인 엔드포인트와 요청 타입(JSON)에 맞추기 위해 수정함
    return apiClient.post<void>('/api/v1/users/login', { username, password })
  },

  logout: () => {
    return apiClient.post<void>('/api/v1/logout')
  },

  getSessions: () => {
    return apiClient.get<AuthSessionsResponse>('/api/v1/sessions')
  },
}
