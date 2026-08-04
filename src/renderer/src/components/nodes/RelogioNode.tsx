import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { RFNode } from '../../store/boardStore'
import { useBoardStore } from '../../store/boardStore'
import type { RelogioData } from '../../../../shared/types/board'
import { CardResizer } from './CardResizer'

const SEGMENT_OPTIONS = [4, 6, 8] as const

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

export function RelogioNode({ id, data, selected }: NodeProps<RFNode>) {
  const relogioData = data as RelogioData
  const updateNodeData = useBoardStore((s) => s.updateNodeData)

  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(relogioData.label)

  function commitLabel() {
    updateNodeData(id, { label: labelDraft.trim() || relogioData.label })
    setEditingLabel(false)
  }

  function clickSegment(index: number) {
    const filled = index < relogioData.filled ? index : index + 1
    updateNodeData(id, { filled })
  }

  function setSegments(segments: number) {
    updateNodeData(id, { segments, filled: Math.min(relogioData.filled, segments) })
  }

  const size = 96
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4
  const anglePer = 360 / relogioData.segments

  return (
    <div className={`card card-relogio${selected ? ' card-selected' : ''}`}>
      <CardResizer nodeId={id} selected={selected} minWidth={150} minHeight={130} />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />

      <div className="card-header card-header-plain">
        {editingLabel ? (
          <input
            autoFocus
            className="nodrag card-title-input card-title-input-plain"
            value={labelDraft}
            onChange={(event) => setLabelDraft(event.target.value)}
            onBlur={commitLabel}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitLabel()
              if (event.key === 'Escape') setEditingLabel(false)
            }}
          />
        ) : (
          <span
            className="card-title"
            onDoubleClick={() => {
              setLabelDraft(relogioData.label)
              setEditingLabel(true)
            }}
          >
            {relogioData.label}
          </span>
        )}
      </div>

      <div className="clock-body">
        <svg width={size} height={size} className="clock-svg nodrag">
          {Array.from({ length: relogioData.segments }, (_, index) => {
            const startAngle = index * anglePer
            const endAngle = startAngle + anglePer
            const filled = index < relogioData.filled
            return (
              <path
                key={index}
                d={slicePath(cx, cy, r, startAngle, endAngle)}
                className={`clock-segment${filled ? ' clock-segment-filled' : ''}`}
                onClick={() => clickSegment(index)}
              />
            )
          })}
        </svg>

        <div className="clock-segment-picker nodrag">
          {SEGMENT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`segment-option${relogioData.segments === option ? ' segment-option-active' : ''}`}
              onClick={() => setSegments(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
