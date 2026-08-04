---
name: "Division1D"
description: "Zombie High School Division-inspired 5-player multiplayer fan game"
image: "./assets/banner.png"
tags:
  - .NET
  - Unity
  - TCP/UDP
  - Redis
  - Docker
startDate: "2025-11-22"
---

## Overview

Division1D는 2022년 공개된 **좀비고등학교 스토리 모드 시즌 2: 디비전**을 기반으로 만든 온라인 멀티플레이 PvE 팬게임입니다.

저는 게임 서버와 Gateway 서버를 단독으로 설계·구현하고, Oracle Cloud에서 동작하는 Redis·Docker 운영 환경과 배포 파이프라인까지 서버 파트 전반을 담당했습니다. 클라이언트에서는 기존 구현된 싱글 플레이에다가 로직을 분리하여 멀티 플레이를 적용했습니다.

## My Contributions

- **Server Architecture** — .NET 게임 서버와 Redis 기반 Gateway를 설계하고 단독 구현
- **Realtime Networking** — 서버 권한 이동·전투·적 AI와 UDP 동기화 구조 구현
- **Infrastructure** — Admission Ticket 기반 입장 제어와 Docker·Oracle 배포 환경 구축

## Architecture

Division1D는 세 개의 애플리케이션으로 구성했습니다.

![division_architecture](.\assets\division_server_architecture.png)

## 핵심 기술 문제 해결

### 트래픽 절감과 이동 품질 사이의 균형

실시간 이동은 패킷을 자주 보낼수록 부드러워지지만, 플레이어마다 매 프레임 float 좌표와 부가 상태를 전송하면 트래픽이 빠르게 증가합니다. 초기에는 이를 줄이기 위해 **입력 변화만 전송하고 원격 클라이언트가 이동을 재현하는 방식**을 선택했습니다.

#### 첫 번째 시도 — Input Dead Reckoning

방향이 바뀌거나 이동 중일 때만 입력을 전송하고, 원격 클라이언트가 이를 이용해 같은 타일 이동을 재현하도록 했습니다. 
누적 오차는 별도의 저주기 위치 상태로 보정했습니다.

하지만 보내는쪽은 입력 순간부터, 원격쪽은 패킷 도착 순간부터 이동해 두 클라이언트의 진행도가 어긋났습니다. 
코루틴 제거, 위치 오차 임계값, 이동 변화량과 스냅샷 분리, Server Time과 보간 버퍼 등을 차례로 적용했지만 지연된 상태를 현재 예측 결과에 보정하는 구조는 계속 복잡해졌습니다.

결국 전송량을 조금 더 줄이기 위해 여러 패킷과 보정 경로를 유지하다가 패킷 크기가 커져서
간단하게 이동 프로토콜을 단순화하기로 결정했습니다.

#### 최종 구조 — Quantized State + Snapshot Interpolation

별도의 입력·델타·월드 스냅샷 패킷을 제거하고 절대 좌표 기반 `MoveState` 하나로 통합했습니다. 
좌표는 1/100 단위의 `short`로 양자화하여, 클라이언트 패킷 본문은 X·Y 좌표 4바이트, 
서버 패킷 본문은 PlayerId를 포함한 5바이트로 구성했습니다.

```csharp title="Network\Udp\Packets\Movement\SC_PlayerState.cs"
[MemoryPackable]
public partial struct SC_MoveState
{
    public short X;       // 1/100 unit
    public short Y;       // 1/100 unit
    public byte PlayerId;
}
```

이동 중에는 최신 상태만 의미가 있으므로 20Hz `Sequenced`로 전송하고, 
이동 종료 위치는 `ReliableOrdered`로 한 번 더 보내 최종 상태를 확정합니다.

원격 클라이언트에서는 서버가 알려준 위치와 실제 렌더링 위치를 분리했습니다. 
수신한 좌표는 스냅샷 버퍼에 저장하고, 렌더링 시점을 지연하여 패킷 도착 간격의 지터링을 최소화합니다.

```csharp title="Player/Modules/RemotePlayerMoveModule.cs"
double timeline = unscaledTime - _interpolationBackTime;
SnapshotInterpolationUtility.StepInterpolation(
    _renderSnapshots,
    timeline,
    out PositionSnapshot from,
    out PositionSnapshot to,
    out double t);

Vector3 renderTarget = Vector3.LerpUnclamped(
    from.position,
    to.position,
    (float)t);

ownerTransform.position = Vector3.MoveTowards(
    ownerTransform.position,
    renderTarget,
    _renderFollowSpeed * deltaTime);
```

### 다수의 적을 위한 AOI 동기화

적의 위치와 상태를 매 틱 모든 플레이어에게 브로드캐스트하면, 화면에 보이지 않는 적까지 계속 직렬화하고 전송하게 됩니다. 이를 줄이기 위해 맵을 15m 크기의 Spatial Grid로 나누고 플레이어 주변 셀만 후보로 탐색하는 AOI를 구현했습니다.

그리드는 후보를 줄이는 Broad Phase로만 사용하고, 최종 가시성은 실제 거리 제곱으로 판정합니다. 
적이 경계에서 반복적으로 나타났다 사라지는 현상을 막기 위해 진입 반경은 18m, 이탈 반경은 22m로 다르게 설정했습니다.

![division_aoi](.\assets\division_aoi.png)

가까운 적의 Transform은 20Hz, 먼 적은 2Hz로 전송합니다. Spawn·Despawn·상태·공격·Transform 변경은 Dirty Flag로 구분하고, 
해당 적을 볼 수 있는 플레이어가 없다면 직렬화 자체를 수행하지 않습니다.

### TCP 세션과 UDP 피어의 안전한 결속

TCP 로그인 성공 후 게임 서버가 짧은 수명의 일회용 UDP Token을 발급하고, 클라이언트는 `SessionId + Token`으로 UDP 피어를 인증합니다. 인증에 성공한 Token은 즉시 사용되며, 만료되기 전에 TCP를 통해 새 Token을 요청할 수 있습니다.

UDP 서버에는 다음 방어 로직을 추가했습니다.

- 인증 전 피어의 연결 수 제한
- 인증되지 않은 피어의 타임아웃 정리
- 짧거나 비정상적인 패킷 조기 폐기
- 인증 실패 로그 집계와 반복 로그 억제
- 현재 TCP 세션과 일치하지 않는 UDP 피어 차단

이를 통해 UDP 연결 요청만으로 서버 리소스를 계속 점유하거나, 다른 세션의 ID를 이용해 게임 패킷을 보내는 경로를 제한했습니다.
