import { useRef, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { useBoardStore } from '../../store/boardStore'

const MIN_LABEL_WIDTH = 60
const MIN_LABEL_HEIGHT = 24

export function LabeledEdge({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  markerEnd,
  style,
  selected,
}: EdgeProps) {
  const updateEdgeLabel = useBoardStore((s) => s.updateEdgeLabel)
  const updateEdgeLabelSize = useBoardStore((s) => s.updateEdgeLabelSize)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(typeof label === 'string' ? label : '')

  const labelData = data as { labelWidth?: number; labelHeight?: number } | undefined
  const [size, setSize] = useState<{ width?: number; height?: number }>({
    width: labelData?.labelWidth,
    height: labelData?.labelHeight,
  })
  const resizeRef = useRef<{
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  } | null>(null)
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  function startEditing() {
    setDraft(typeof label === 'string' ? label : '')
    setEditing(true)
  }

  function commit() {
    updateEdgeLabel(id, draft)
    setEditing(false)
  }

  function handleResizePointerDown(event: React.PointerEvent) {
    event.stopPropagation()
    event.preventDefault()
    const rect = boxRef.current?.getBoundingClientRect()
    const startWidth = size.width ?? rect?.width ?? 120
    const startHeight = size.height ?? rect?.height ?? 32
    resizeRef.current = { startX: event.clientX, startY: event.clientY, startWidth, startHeight }

    const handleMove = (moveEvent: PointerEvent) => {
      const start = resizeRef.current
      if (!start) return
      const nextWidth = Math.max(MIN_LABEL_WIDTH, start.startWidth + (moveEvent.clientX - start.startX))
      const nextHeight = Math.max(
        MIN_LABEL_HEIGHT,
        start.startHeight + (moveEvent.clientY - start.startY),
      )
      lastSizeRef.current = { width: nextWidth, height: nextHeight }
      setSize({ width: nextWidth, height: nextHeight })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      resizeRef.current = null
      if (lastSizeRef.current) {
        updateEdgeLabelSize(id, lastSizeRef.current)
        lastSizeRef.current = null
      }
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: selected ? 2.5 : 1.5 }}
      />
      <EdgeLabelRenderer>
        <div
          ref={boxRef}
          className={`edge-label nodrag nopan${selected ? ' edge-label-selected' : ''}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            width: size.width ? `${size.width}px` : undefined,
            height: size.height ? `${size.height}px` : undefined,
          }}
          onDoubleClick={(event) => {
            event.stopPropagation()
            startEditing()
          }}
        >
          {editing ? (
            <textarea
              autoFocus
              className="edge-label-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setEditing(false)
              }}
            />
          ) : label ? (
            <span className="edge-label-text">{label}</span>
          ) : (
            <span className="edge-label-text edge-label-empty">+</span>
          )}
          {selected && !editing && (
            <div
              className="edge-label-resize-handle"
              onPointerDown={handleResizePointerDown}
            />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
