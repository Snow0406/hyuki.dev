---
name: "Crimson Pandemic"
description: "2D action survival game"
image: "./crimson-pandemic.webp"
tags:
  - Unity
  - Optimization
startDate: "2025-09-17"
links:
  - label: "Discord"
    url: "https://discord.gg/jcm4ktGQUu"
    icon: "discord"
  - label: "Steam"
    url: "https://store.steampowered.com/app/4943110/CRIMSON_PANDEMIC/"
    icon: "steam"
---

## 프로젝트 개요

**CRIMSON PANDEMIC**은 **subkan** 님이 개발한 2D 픽셀 슈팅 서바이벌 게임입니다.
저는 프로젝트에 합류하여 **게임 성능 최적화**와 일부 개발을 담당했습니다.

## My Contributions

- 게임 전반의 프레임워크 최적화
- 과도한 메모리 사용(GC) 문제 해결
- 키 바인딩 및 다국어 지원 등 유틸리티 시스템 구현
- 커스텀 에디터 툴 개발로 개발 생산성 향상
- 설비 및 일부 로직 구조 설계

## Credits

- **subkan** — Lead Developer
- **hy** — Developer (Optimization and Systems)

## 개발 동기

이 게임은 제게 게임 개발자라는 꿈을 심어준 특별한 프로젝트입니다.
제가 가진 기술로 게임의 완성도를 높이는 데 기여하고 싶어서 직접 개발자님께 연락하여, 최적화 및 시스템 개발 역할로 프로젝트에 합류하게 되었습니다.

## 핵심 기술 문제 해결

### 초기 성능 개선

초기 최적화 단계에서 다음과 같은 병목을 개선했습니다.

- 게임 로직 CPU 시간: 평균 **12ms → 4.5ms**
- 프레임당 GC Alloc: **500KB 이상 → 3.8KB**

### 설비 시스템 최적화

이후 설비 시스템이 추가되고 공장 규모가 커지면서 발생한 설비 병목은 Logic/View 분리, 청크 LOD,
부분 event-driven 구조를 적용해 개선했습니다.

[설비 시스템 최적화 사례 보기 →](/blog/cp-facility-optimization)
