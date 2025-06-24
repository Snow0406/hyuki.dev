import React, { useEffect, useState, useMemo, useRef } from 'react'

const SnowfallEffect = () => {
  const [snowflakes, setSnowflakes] = useState([])
  const [isDark, setIsDark] = useState(false)
  const containerRef = useRef(null)
  const animationFrameRef = useRef(null)
  const observerRef = useRef(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window === 'undefined' || initializedRef.current) return
    initializedRef.current = true

    // 화면 너비와 디바이스 성능에 따라 눈송이 개수 조정
    const isMobile = window.innerWidth < 768
    const isLowPerfDevice = window.navigator.hardwareConcurrency <= 4

    // 다크모드 감지 (ThemeToggle과 동일한 방식 사용)
    const checkDarkMode = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      setIsDark(theme === 'dark')
    }

    checkDarkMode()
    observerRef.current = new MutationObserver(checkDarkMode)
    observerRef.current.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    const createSnowflake = (isInitial = false) => {
      const id = Math.random().toString(36).substring(2, 9)
      const size = Math.random() * 4 + 3 // 3px ~ 7px
      const left = Math.random() * 100 // 0% ~ 100%
      const baseOpacity = Math.random() * 0.25 + 0.05 // 0.05 ~ 0.3
      const duration = Math.random() * 15 + 15 // 15s ~ 30s
      const delay = isInitial ? 0 : Math.random() * 10 // 초기 눈송이는 지연 없음, 이후 0s ~ 10s
      const isStrawberry = Math.random() > 0.8 // 20% 확률로 strawberry 색상

      return { id, size, left, baseOpacity, duration, delay, isStrawberry }
    }

    let initialSnowflakesCount = Math.floor(Math.random() * 6) + 15
    if (isMobile)
      initialSnowflakesCount = Math.max(10, initialSnowflakesCount - 4)
    if (isLowPerfDevice)
      initialSnowflakesCount = Math.max(8, initialSnowflakesCount - 6)

    const initialSnowflakes = Array.from(
      { length: initialSnowflakesCount },
      () => createSnowflake(true),
    )
    setSnowflakes(initialSnowflakes)

    const interval = setInterval(
      () => {
        if (document.hidden) return

        const newSnowflakesCount = Math.floor(Math.random() * 2) + 1
        const newSnowflakes = Array.from({ length: newSnowflakesCount }, () =>
          createSnowflake(false),
        )

        let maxSnowflakes = 30
        if (isMobile) maxSnowflakes = 18
        if (isLowPerfDevice) maxSnowflakes = 12

        setSnowflakes((prev) => {
          const updatedSnowflakes = [...prev, ...newSnowflakes]
          if (updatedSnowflakes.length > maxSnowflakes) {
            return [
              ...newSnowflakes,
              ...prev.slice(0, maxSnowflakes - newSnowflakes.length),
            ]
          }
          return updatedSnowflakes
        })
      },
      isMobile || isLowPerfDevice ? 8000 : 5000,
    )

    // 스크롤 및 resize 이벤트 최적화
    const handleVisibilityChange = () => {
      if (document.hidden && animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      } else if (
        !document.hidden &&
        !animationFrameRef.current &&
        containerRef.current
      ) {
        // 화면이 다시 보일 때 애니메이션 재개
        containerRef.current.style.display = 'block'
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 화면 크기에 따라 눈송이 밀도 조절
    const handleResize = () => {
      const width = window.innerWidth
      const maxSnowflakes = width < 640 ? 18 : width < 1024 ? 25 : 30

      setSnowflakes((prev) => {
        if (prev.length > maxSnowflakes) {
          return prev.slice(0, maxSnowflakes)
        }
        return prev
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      clearInterval(interval)
      observerRef.current.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 눈송이 스타일 계산을 메모이제이션 (불필요한 계산 방지)
  const snowflakeStyles = useMemo(() => {
    return snowflakes.map((flake) => {
      // 눈송이 색상 결정
      let backgroundColor
      if (flake.isStrawberry) {
        backgroundColor = isDark ? 'var(--strawberry)' : 'var(--strawberry)'
      } else {
        backgroundColor = isDark ? 'var(--snowflake)' : 'var(--snowflake)'
      }

      return {
        width: `${flake.size}px`,
        height: `${flake.size}px`,
        left: `${flake.left}%`,
        backgroundColor,
        '--opacity': flake.baseOpacity,
        animation: `snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
        filter: `blur(${flake.size > 5 ? 0.8 : 0.4}px) drop-shadow(0 0 1px ${backgroundColor})`,
      }
    })
  }, [snowflakes, isDark])

  // will-change 속성을 사용한 GPU 가속 최적화
  return (
    <div
      ref={containerRef}
      className="snowfall-container pointer-events-none fixed inset-0 z-[1] overflow-hidden"
    >
      {snowflakes.map((flake, index) => (
        <div
          key={flake.id}
          className="snowflake absolute top-0 rounded-full opacity-0"
          style={snowflakeStyles[index]}
        />
      ))}
      <style jsx global>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--opacity);
          }
          90% {
            opacity: var(--opacity);
          }
          100% {
            transform: translateY(calc(100vh + 10px)) rotate(360deg);
            opacity: 0;
          }
        }

        .snowflake {
          --opacity: 0;
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
    </div>
  )
}

export default React.memo(SnowfallEffect)
