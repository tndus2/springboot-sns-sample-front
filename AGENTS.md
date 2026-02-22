# AGENTS.md

이 파일은 이 저장소에서 작업하는 Codex 에이전트를 위한 지침을 정의합니다.

## 프로젝트
- 경로: /Users/myeongsuyeon/Desktop/sns_project/sns_project_front
- 목적: SNS 프로젝트 프론트엔드

## 코딩 규칙
- 명확성을 최우선으로 합니다.
- 변경은 최소화하고 목적에 집중합니다.
- 가능한 한 기존 패턴과 컴포넌트를 재사용합니다.
- 사용자 허가 없이 코드를 수정하거나 커밋하지 않습니다.

## 프로젝트 개요
- Next.js(App Router) 기반의 SNS 프론트엔드이며, 페이지는 `app/` 아래에 구성되어 있습니다.
- UI는 shadcn/ui + Radix UI 컴포넌트 패턴을 사용합니다.

## 개발 스택
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4, PostCSS, tailwindcss-animate
- React Query(@tanstack/react-query)
- React Hook Form + Zod
- Radix UI, Lucide Icons, shadcn/ui 설정(`components.json`)

## 개발 환경
- Node.js 기반 실행
- 패키지 매니저: npm (README 기준)
- 주요 스크립트: `npm run dev`, `npm run build`, `npm run lint`, `npm run start`
- 개발 서버: http://localhost:3000

## 구조 요약
- `app/`: 라우팅/페이지 및 레이아웃(예: `layout.tsx`, `page.tsx`)
- `components/`: 공용 UI 컴포넌트
- `hooks/`: 커스텀 훅
- `lib/`: 유틸 및 공통 로직
- `public/`: 정적 자산
- `styles/`: 추가 스타일 리소스

## 작업 흐름
- 수정 전 관련 파일을 먼저 확인합니다.
- 무엇을 왜 바꿨는지 설명합니다.
- 필요 시 테스트/빌드 등 다음 단계를 제안합니다.
