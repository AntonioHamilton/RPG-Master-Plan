export function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(clamped / 3600)
  if (hours === 0) return formatTime(clamped)

  const minutes = Math.floor((clamped % 3600) / 60)
  const seconds = clamped % 60
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function parseTime(text: string): number | null {
  const trimmed = text.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed)

  const match = trimmed.match(/^(\d+):([0-5]?\d)$/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function playBeep(): void {
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return

  const ctx = new AudioContextCtor()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = 880
  gain.gain.setValueAtTime(0.2, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + 0.6)
  oscillator.onended = () => void ctx.close()
}
