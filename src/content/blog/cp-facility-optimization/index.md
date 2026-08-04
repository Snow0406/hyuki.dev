---
title: "CRIMSON PANDEMIC: Unity 설비 최적화"
description: "시뮬레이션과 View 분리, 청크 LOD, 부분 event-driven 구조로 대규모 설비 시스템의 병목을 줄인 과정"
date: 2026-08-04
authors:
  - hy
image: ./assets/banner.png
tags:
  - Unity
  - C#
  - Optimization
---

<style>
  dim-span {
    opacity: 0.6;
  }

  delta-down {
    color: light-dark(oklch(48% 0.12 150), oklch(83% 0.1 150));
  }
</style>

## Introduction

CRIMSON PANDEMIC에는 플레이어가 직접 설비를 배치하고 전송기로 연결하는 공장 시스템이 있습니다.
처음에는 설비가 몇 개 없어서 별문제가 없었지만, 공장의 규모가 커질수록 CPU 사용 시간이 급격하게 늘어났습니다.

당시 설비가 많이 설치된 테스트 환경에서는 설비 관련 CPU 시간이 약 **330ms**까지 올라갔습니다.
<small><dim-span>(Unity Editor + Deep Profile 기준)</dim-span></small>

처음에는 [명일방주: 엔드필드가 Unity 위에 자체 ECS 프레임워크를 구축했다는 개발 사례](https://developer.apple.com/news/?id=cpt08xv8)를 보고,
공장 설비 부분만 ECS로 옮겨야 할까 생각했습니다.
하지만 기존 설비 시스템은 이미 수많은 `MonoBehaviour` 참조로 강하게 연결되어 있었습니다.
이를 한 번에 ECS로 옮기기에는 기대되는 성능 이익보다 기존 기능을 다시 구현하고 검증하는 비용이 더 컸습니다. 
지금 단계에서는 오버엔지니어링이라고 판단했습니다.

그래서 우선 ECS 전환 자체를 목표로 삼기보다, 차근차근 구조부터 바꿔 보기로 했습니다.

> **로직과 View를 분리해 시뮬레이션은 계속 돌리고, LOD 밖의 설비 View만 꺼버리자.**

먼저 이 구조로 어디까지 성능을 줄일 수 있는지 확인하고, 그래도 부족하면 그때 ECS를 검토하기로 했습니다.

## Benchmark

| | Before | After | Δ |
| - | -: | -: | -: |
| CPU 시간 | 약 330ms | 약 40ms | <delta-down>관측값 ↓87.9%</delta-down> |

<small><dim-span>Unity Editor + Deep Profile 기준 측정값입니다.</dim-span></small>

::::::::note[측정 환경]
병목을 빠르게 좁히기 위해 코드에 별도의 `ProfilerMarker`를 추가하지 않고 Unity Editor의 Deep Profile을 사용했습니다.
계측 오버헤드가 포함된 최적화 도중의 참고값이며, Player Build에서 측정한 실제 프레임 시간은 아닙니다.
::::::::

## 최적화 과정

작업은 대략 다음 순서로 진행했습니다.

<!-- 내부 재현용 체크포인트: baseline 96e64d3fa, LOD 361201c92, event-driven c079a28c5 -->

| 단계 | 주요 변경 사항 |
| - | - |
| 1. 실행 구조 변경 | 설비 Logic과 View를 분리하고 중앙 시뮬레이션으로 이동 |
| 2. View LOD | 멀리 있는 설비의 표현만 청크 단위로 비활성화 |
| 3. 부분 event-driven 전환 | 전송 가능 여부가 바뀐 전송기만 비싼 전송 경로를 다시 실행 |
| 4. 안정화와 후속 최적화 | Watchdog 진단, 누락 이벤트 수정, 전송선 풀링과 dirty flag 적용 |

### 기존 구조의 문제

기존 크림슨펜데믹 게임의 설비 하나는 보통 하나의 `GameObject`와 여러 `MonoBehaviour`로 구성됩니다.
설비가 자신의 `Update`에서 상태를 계산하고, 애니메이션과 파티클을 갱신하고,
필요한 경우 주변 설비나 저장소까지 탐색하는 구조였습니다.

설비 수가 적을 때는 단순하고 편리했지만, 설비 수가 늘어나면서 몇 가지 문제가 생겼습니다.

1. 화면에 보이지 않는 설비도 발생하는 Animator, ParticleSystem, LineRenderer 같은 View 비용.
2. 각 설비가 개별적으로 Unity의 `Update`를 호출하는 비용.
3. 주변 설비나 저장소의 복잡한 로직 및 비용.

## Logic과 View 분리

가장 먼저 한 일은 설비의 **Logic**과 **View**를 분리하는 것이었습니다.

기존 구조에서는 설비 오브젝트가 계산과 표현을 모두 담당했습니다.

```text
Facility GameObject
├─ 생산 상태 계산
├─ 아이템 이동
├─ 전력과 물 계산
├─ Animator 갱신
├─ ParticleSystem 갱신
└─ UI와 경고 아이콘 갱신
```

이를 `FacilitySimWorld`라는 Mono가 아닌 중앙 실행 지점으로 옮기고,
각 설비의 시뮬레이션 상태를 구조체 배열에 저장하도록 변경했습니다.

```text
FacilitySimWorld
├─ Gather: GameObject에서 시뮬레이션에 필요한 입력 수집
├─ Tick: 구조체 배열에 저장된 상태 계산
└─ Apply: 계산 결과를 필요한 View에만 반영
```

실제 실행 흐름도 비슷합니다.

```csharp title="FacilitySimWorld.cs" showLineNumbers=false
public void Tick(float dt)
{
    TickPowerProducers(dt);
    PrepareFacilityResourcesForLogic();
    TickFacilityLogic(dt);
    TickFacilityResources(dt);
    ApplyFacilityViewOutputs(dt);
}
```

`DrillSimSystem`, `MakerSimSystem`, `SenderSimSystem` 같은 계산 코드는 GameObject나 View를 직접 참조하지 않도록 분리했습니다. 
`View`는 `Gather` 단계에서 필요한 값을 시뮬레이션 상태로 복사하고, 
`SimSystem`은 전달받은 배열만 계산합니다. 계산이 끝나면 View가 결과를 받아 화면에 반영합니다.

```csharp title="DrillSimSystem.cs" showLineNumbers=false
for (int i = 0; i < _drillCount; i++)
{
    Drill view = _drillViews[i];
    if (view) view.GatherSimInputs(ref _drillSims[i], timeNotStopped);
}

DrillSimSystem.Tick(_drillSims, _drillCount, dt);

for (int i = 0; i < _drillCount; i++)
{
    Drill view = _drillViews[i];
    if (view) view.ApplySimOutputs(ref _drillSims[i], dt);
}
```

## 설비 LOD

Logic과 View를 분리한 다음에는 멀리 있는 설비의 View를 비활성화하는 LOD를 적용했습니다.

초기 구현에서는 월드 좌표를 **16칸 단위의 청크**로 나누었습니다.
플레이어 주변 1청크 안에 있는 설비를 활성화하고, 이미 활성화된 설비는 2청크까지 유지했습니다.

```csharp title="FacilitySimWorld.cs" showLineNumbers=false
public const int LOD_CHUNK_GRID_SIZE = 16;
public const int LOD_ACTIVE_RANGE = 1;
public const int LOD_KEEP_RANGE = 2;
```

활성 범위와 유지 범위를 다르게 둔 이유는 청크 경계에서 발생하는 깜빡임 때문입니다.
두 값이 같으면 플레이어가 경계를 조금만 왕복해도 설비가 계속 켜졌다 꺼집니다.

이미 켜진 설비에는 더 넓은 유지 범위를 적용하여 일종의 **히스테리시스**를 만들었습니다.

```csharp showLineNumbers=false
int range = wasActive ? LOD_KEEP_RANGE : LOD_ACTIVE_RANGE;
```

CRIMSON PANDEMIC는 횡으로 긴 2D 월드이기 때문에 이후에는 X축 청크를 중심으로 판정하도록 단순화했습니다.
실내에서는 거리 대신 플레이어가 현재 들어가 있는 건물을 기준으로 LOD가 작동했습니다.

```text
화면 밖 Facility
├─ Simulation: 계속 실행
└─ GameObject View: 비활성화
```

덕분에 플레이어가 멀리 떨어져 있어도 생산 결과는 동일하면서,
Animator, ParticleSystem, Transform, UI 같은 Unity 오브젝트 비용은 줄일 수 있었습니다.

## 전송기의 반복 Polling 제거

LOD로 화면 밖의 표현 비용을 줄였지만, 전송기 로직은 아직도 큰 비용을 차지했습니다.
기존 전송기는 보낼 아이템이 있으면 매 Tick마다 목적지에 아이템을 보낼 수 있는지 확인했습니다.

```csharp title="SenderSimSystem.cs (Before)" showLineNumbers=false
if (!sending && hasSavedItem && (sendNearby || hasSendTarget))
{
    sim.Events |= SenderSimEvents.TRY_SEND;
}
```

목적지 저장소가 가득 차 있으면 어차피 실패입니다.
그런데 수백 개의 전송기가 매 프레임 같은 질문을 반복하고 있었습니다.

> "목적지에 공간이 생겼나요?"
>
> "아뇨"
>
> 다음 프레임: "이제는 생겼나요?"
>
> "그만물어봐"

이를 완전히 매 프레임 확인할 필요는 없었습니다.
목적지의 상태가 실제로 변경됐을 때만 다시 확인하면 됩니다.

### Availability Version

전송기가 아이템을 보낼 수 있는지는 여러 상태에 영향을 받습니다.

- 목적지 저장소의 남은 공간
- 제작 설비가 현재 받을 수 있는 아이템
- 연결된 전송기 경로의 변경
- 경로를 이동 중인 아이템 수
- 외부 물 저장 상태

전송이 실패하면 해당 전송기가 의존하는 저장소와 경로의 version을 저장했습니다.
그 후 관찰 중인 version이 변경됐을 때만 `AVAILABILITY_CHANGED`를 설정하여 다시 전송을 시도했습니다.

```csharp title="SenderSimSystem.cs (After)" showLineNumbers=false
bool waiting = (sim.RuntimeFlags & SenderSimRuntimeFlags.WAITING_FOR_AVAILABILITY) != 0;
bool availabilityChanged = (sim.RuntimeFlags & SenderSimRuntimeFlags.AVAILABILITY_CHANGED) != 0;

if (!sending && hasSavedItem && hasSendTarget &&
    (!waiting || availabilityChanged))
{
    sim.Events |= SenderSimEvents.TRY_SEND;
}
```

이 방식은 전송기 전체를 완전한 event-driven으로 바꾼것이 아닌
아무것도 바뀌지 않은 막힌 전송기가 비싼 `TrySend` 경로를 계속 실행하지 않도록 이 부분만 event-driven으로 전환했습니다.

### Watchdog

Event-driven 구조로 바꾸면서 가장 걱정됐던 것은 **이벤트 누락**이었습니다.

Polling 방식은 느리지만 언젠가는 상태를 다시 확인합니다.
반대로 event-driven 방식은 어떤 상태 변경에서 version 증가를 빠뜨리면,
전송기가 영원히 깨어나지 않을 수 있습니다.

이때 대학교의 마이크로컨트롤러 수업에서 배웠던 **Watchdog Timer**가 생각났습니다.

마이크로컨트롤러의 Watchdog은 프로그램이 정상적으로 동작하고 있다면 주기적으로 timer를 갱신하고,
일정 시간 동안 갱신되지 않으면 시스템에 문제가 있다고 판단해 복구하는 방식입니다.

전송기에도 비슷한 안전망을 넣었습니다.

1. 정상적인 경우에는 availability version 변경으로 전송기를 깨웁니다.
2. 깨어나지 않은 전송기는 5초마다 Watchdog이 강제로 한 번 재시도합니다.
3. 동시에 모든 전송기가 재시도하지 않도록 slot마다 시간을 조금씩 분산했습니다.
4. Watchdog 재시도에서만 전송에 성공했다면 누락된 이벤트가 있다는 뜻이므로 로그를 남깁니다.

```csharp title="FacilitySimWorld.cs" showLineNumbers=false
if (sim.LocalTime >= meta.NextWatchdogTime)
{
    sim.RuntimeFlags |= SenderSimRuntimeFlags.AVAILABILITY_CHANGED;
    meta.Flags |= SenderSlotFlags.WATCHDOG_RETRY;

    meta.NextWatchdogTime =
        sim.LocalTime + SEND_AVAILABILITY_WATCHDOG_SECONDS + retryJitter;
}
```

처음에는 단순히 영원히 멈춘 전송기를 다시 살리는 fallback 용도였습니다.
하지만 여기서 끝내면 이벤트 누락 버그가 Watchdog 뒤에 숨어버립니다.

Watchdog는 말그대로 이벤트 누락을 찾기 위해 넣은 로직이라
누락된곳을 찾기 위해 실패 시점과 Watchdog 재시도 직전의 상태를 각각 snapshot으로 저장했습니다.

```text
PENDING_ITEM_CHANGED_WITHOUT_WAKE
TOPOLOGY_CHANGED_WITHOUT_REBUILD
TARGET_CHANGED_WITHOUT_REBUILD
RECIPE_CHANGED_WITHOUT_STORE_VERSION
EXTERNAL_WATER_STATE_CHANGED_WITHOUT_GLOBAL_VERSION
DIRECT_TARGET_CHANGED_WITHOUT_STORE_VERSION
```

로그에는 source와 target, Store index, 관찰한 version과 현재 version,
전송 중인 아이템 수 같은 정보를 함께 기록했습니다.

이 로그를 보고 실제로 누락된 wake-up 경로들을 찾아 수정했습니다.

수업에서 들을 때는 Watchdog을 실제 게임 코드에 사용하게 될 것이라고 생각하지 못했는데,
event-driven 시스템의 안정성을 확인하는 데 꽤 유용하게 사용할 수 있었습니다.

## Dirty Flag와 작은 최적화들

큰 구조를 바꾼 뒤에는 Profiler에서 계속 보이는 작은 비용들을 줄였습니다.

- 전송선 endpoint는 연결이나 높이가 바뀌었을 때만 다시 계산
- 전송선과 이동 아이템 View는 현재 LOD에서만 Pool에서 빌려 표시하고, 화면 밖에서는 상태만 유지
- 경고 아이콘은 `WarningFlags`가 달라졌을 때만 `SetActive`
- LOD 밖의 TrainBox는 시뮬레이션만 갱신하고 Transform 반영 생략
- UI 문자열은 값이 바뀔 때만 다시 만들고 자주 실행되는 곳에는 ZString 사용
- 생산량과 목표 추적은 매번 전체 설비를 탐색하지 않고 실제 생산 event를 관찰
- 전송기 filter와 표시 상태는 dirty flag로 필요한 경우에만 갱신

각각의 차이는 작지만 설비 수만큼 매 프레임 반복되면 무시할 수 없는 비용이 됩니다.

## 결과보다 오래 걸렸던 것

Deep Profile에서 330ms가 40ms로 내려가는 것 자체는 보기 좋았습니다.
하지만 실제로 가장 오래 걸린 부분은 숫자를 줄이는 일이 아니라 기존 동작을 보존하는 일이었습니다.

Logic과 View를 분리하면 기존에는 자연스럽게 같은 GameObject 안에서 함께 바뀌던 상태를
명시적으로 동기화해야 합니다. LOD를 넣으면 비활성화된 동안의 변화를 복귀 시점에 다시 적용해야 합니다.
Event-driven으로 바꾸면 어떤 변경이 누구를 깨워야 하는지 의존성을 전부 정의해야 합니다.

## Afterword

처음에는 ECS로 넘어가기 위한 중간 단계로 시작했지만, View LOD만으로도 많은 성능을 확보해 ECS까지는 가지 않았습니다.
ECS 구조를 한번에 도입하지 않고, 당시 요구 성능을 만족한 지점에서 멈춘 것도 좋은 판단이라고 생각합니다.

현재 `FacilitySimWorld`에는 여전히 모든 설비를 매 프레임 순회하는 한계가 남아 있습니다.
앞으로 설비 규모가 더 커지면 변화가 있는 설비만 처리하는 event-driven 시뮬레이션을 완성하고,
그다음 Native 데이터와 Burst를 적용해 ECS 전환을 이어갈 예정입니다.

<small><dim-span>다음부터는 최적화 할때 Profiler 원본 기록해야겟다... 옵치하러가야지</dim-span></small>