import { create } from 'zustand'

interface SessionTimerState {
  accumulatedMs: number
  startedAt: number | null
  start: () => void
  pause: () => void
  reset: () => void
}

export const useSessionTimerStore = create<SessionTimerState>((set) => ({
  accumulatedMs: 0,
  startedAt: null,
  start: () => set((s) => (s.startedAt !== null ? s : { startedAt: Date.now() })),
  pause: () =>
    set((s) =>
      s.startedAt === null
        ? s
        : { accumulatedMs: s.accumulatedMs + (Date.now() - s.startedAt), startedAt: null },
    ),
  reset: () => set({ accumulatedMs: 0, startedAt: null }),
}))
