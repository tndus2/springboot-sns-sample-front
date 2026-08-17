'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { postsApi } from '@/lib/api/posts'
import type { Post, PostCreateRequest, PostUpdateRequest } from '@/lib/types'

// 2026-08-17: 게시물 전체 목록 조회용 React Query 훅이다.
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => postsApi.getAll(),
  })
}

// 2026-08-17: 게시물 상세 페이지에서 postId 기준 단건 게시물을 조회하는 훅이다.
export function usePost(id: number | null) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => postsApi.getById(id!),
    enabled: !!id,
  })
}

// 2026-08-17: 홈 작성 UI에서 게시물 생성 후 관련 목록 캐시를 무효화하는 mutation 훅이다.
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PostCreateRequest) => postsApi.create(data),
    onSuccess: () => {
      // 캐시 무효화로 자동 리페칭
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'posts'] })
      toast.success('게시물이 작성되었습니다!')
    },
    onError: (error) => {
      toast.error('게시물 작성 실패')
      console.error('Create post error:', error)
    },
  })
}

// 2026-08-17: 게시물 수정 후 단건/목록 캐시를 갱신하는 mutation 훅이다.
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PostUpdateRequest }) =>
      postsApi.update(id, data),
    onSuccess: (updatedPost) => {
      // 특정 게시물 캐시 업데이트
      queryClient.setQueryData(['posts', updatedPost.id], updatedPost)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      toast.success('게시물이 수정되었습니다!')
    },
    onError: (error) => {
      toast.error('게시물 수정 실패')
      console.error('Update post error:', error)
    },
  })
}

// 세션 내 조회된 게시글 ID 추적 (중복 조회 방지)
const viewedPostIds = new Set<number>()

// 2026-08-17: 같은 세션에서 중복 증가를 피하면서 게시물 조회수 증가 API를 호출하는 훅이다.
export function useIncrementView() {
  return useMutation({
    mutationFn: (id: number) => {
      // 이미 조회한 게시글은 다시 호출하지 않음
      if (viewedPostIds.has(id)) {
        return Promise.resolve()
      }
      viewedPostIds.add(id)
      return postsApi.incrementView(id)
    },
  })
}

// 2026-08-17: 게시물 삭제 시 목록에서 즉시 제거하고, 실패하면 롤백하는 mutation 훅이다.
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    // Optimistic update
    onMutate: async (id) => {
      // 진행 중인 리페치 취소
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      await queryClient.cancelQueries({ queryKey: ['timeline'] })

      // 이전 데이터 백업
      const previousPosts = queryClient.getQueryData(['posts'])
      const previousTimeline = queryClient.getQueryData(['timeline'])

      // 즉시 UI에서 제거
      queryClient.setQueryData(['posts'], (old: Post[] | undefined) =>
        old?.filter((p) => p.id !== id)
      )
      queryClient.setQueryData(['timeline'], (old: Post[] | undefined) =>
        old?.filter((p) => p.id !== id)
      )

      return { previousPosts, previousTimeline }
    },
    onError: (error, id, context) => {
      // 에러 시 롤백
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts)
      }
      if (context?.previousTimeline) {
        queryClient.setQueryData(['timeline'], context.previousTimeline)
      }
      toast.error('게시물 삭제 실패')
      console.error('Delete post error:', error)
    },
    onSuccess: () => {
      toast.success('게시물이 삭제되었습니다!')
    },
    onSettled: () => {
      // 최종적으로 서버 데이터로 갱신
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'posts'] })
    },
  })
}
