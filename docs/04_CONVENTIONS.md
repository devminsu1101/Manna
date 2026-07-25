# 개발 컨벤션

## Git Commit
- feat: 새 기능
- fix: 버그 수정
- docs: 문서
- style: 포맷팅
- refactor: 코드 구조 변경

예: feat(prayer): 기도짝 랜덤 배정 구현

## Java 네이밍
- Class: PascalCase
- Method/Variable: camelCase
- Constants: UPPER_SNAKE_CASE

## TypeScript 네이밍
- Component: PascalCase
- Function/Variable: camelCase
- Type: PascalCase

## Folder Structure
- Backend: domain 기반 수직 슬라이싱
- Frontend: app/ components/ features/ hooks/ lib/

## 코드 스타일
- Java: 2칸 indent, Lombok 활용
- TypeScript: Prettier (printWidth: 100)