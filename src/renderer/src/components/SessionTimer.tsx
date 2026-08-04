import { useEffect, useState } from 'react'
import { useSessionTimerStore } from '../store/sessionTimerStore'
import { formatDuration } from '../lib/timeFormat'

export function SessionTimer() {
  const accumulatedMs = useSessionTimerStore((s) => s.accumulatedMs)
  const startedAt = useSessionTimerStore((s) => s.startedAt)
  const start = useSessionTimerStore((s) => s.start)
  const pause = useSessionTimerStore((s) => s.pause)
  const reset = useSessionTimerStore((s) => s.reset)

  const running = startedAt !== null
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [running])

  const elapsedMs = accumulatedMs + (startedAt !== null ? Date.now() - startedAt : 0)

  return (
    <div className="session-timer">
      <span className="session-timer-label">Sessão</span>
      <span className="session-timer-display">{formatDuration(elapsedMs / 1000)}</span>
      <button type="button" className="toolbar-button" onClick={running ? pause : start}>
        {running ? 'Pausar' : 'Play'}
      </button>
      <button type="button" className="toolbar-button" onClick={reset}>
        Reset
      </button>
    </div>
  )
}
