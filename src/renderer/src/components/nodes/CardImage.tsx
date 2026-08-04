import { useState } from 'react'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

export function CardImage({
  src,
  zoom,
  onZoomChange,
}: {
  src: string
  zoom: number
  onZoomChange: (zoom: number) => void
}) {
  const [hovered, setHovered] = useState(false)

  function adjust(delta: number) {
    const next = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta)) * 100) / 100
    onZoomChange(next)
  }

  return (
    <div
      className="card-image-wrap"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        className="card-image"
        src={src}
        alt=""
        draggable={false}
        style={{ transform: `scale(${zoom})` }}
      />
      {hovered && (
        <div className="card-image-zoom nodrag nowheel">
          <button type="button" onClick={() => adjust(-ZOOM_STEP)} title="Reduzir imagem">
            −
          </button>
          <button type="button" onClick={() => adjust(ZOOM_STEP)} title="Aumentar imagem">
            +
          </button>
        </div>
      )}
    </div>
  )
}
