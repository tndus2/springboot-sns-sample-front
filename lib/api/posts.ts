import { apiClient } from './client'
import type { Post, PostCreateRequest, PostUpdateRequest } from '@/lib/types'

export const postsApi = {
  // 2026-08-17: 게시물 전체 목록 조회 API를 호출한다.
  getAll: () => {
    return apiClient.get<Post[]>('/api/v1/posts')
  },

  // 2026-08-17: 게시물 상세 화면에서 사용할 단건 게시물 조회 API를 호출한다.
  getById: (id: number) => {
    return apiClient.get<Post>(`/api/v1/posts/${id}`)
  },

  // 2026-08-17: 홈 작성 UI가 보낸 본문과 mediaIds 로 새 게시물을 생성한다.
  create: (data: PostCreateRequest) => {
    return apiClient.post<Post>('/api/v1/posts', data)
  },

  // 2026-08-17: 게시물 수정 API를 호출한다.
  update: (id: number, data: PostUpdateRequest) => {
    return apiClient.put<Post>(`/api/v1/posts/${id}`, data)
  },

  // 2026-08-17: 프로필 탭/상세 화면에서 선택한 게시물을 삭제한다.
  delete: (id: number) => {
    return apiClient.delete<void>(`/api/v1/posts/${id}`)
  },

  // 2026-08-17: 게시물 상세/카드 노출 시 조회수 증가 API를 호출한다.
  incrementView: (id: number) => {
    return apiClient.post<void>(`/api/v1/posts/${id}/view`)
  },
}
