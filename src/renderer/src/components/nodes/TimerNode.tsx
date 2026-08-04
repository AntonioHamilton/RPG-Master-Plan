import { useEffect, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { RFNode } from '../../store/boardStore'
import { useBoardStore } from '../../store/boardStore'
import type { TimerData } from '../../../../shared/types/board'
import { CardResizer } from './CardResizer'
import { formatTime, parseTime, playBeep } from '../../lib/timeFormat'

export function TimerNode({ id, data, selected }: NodeProps<RFNode>) {
  const timerData = data as TimerData
  const updateNodeData = useBoardStore((s) => s.updateNodeData)

  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(timerData.label)
  const [editingDuration, setEditingDuration] = useState(false)
  const [durationDraft, setDurationDraft] = useState(formatTime(timerData.durationSec))
  const [remainingSec, setRemainingSec] = useState(timerData.durationSec)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setRunning(false)
          if (timerData.alertSound) playBeep()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, timerData.alertSound])

  function commitLabel() {
    updateNodeData(id, { label: labelDraft.trim() || timerData.label })
    setEditingLabel(false)
  }

  function commitDuration() {
    const parsed = parseTime(durationDraft)
    if (parsed !== null && parsed > 0) {
      updateNodeData(id, { durationSec: parsed })
      setRemainingSec(parsed)
    } else {
      setDurationDraft(formatTime(timerData.durationSec))
    }
    setEditingDuration(false)
  }

  function reset() {
    setRunning(false)
    setRemainingSec(timerData.durationSec)
  }

  return (
    <div className={`card card-timer${selected ? ' card-selected' : ''}`}>
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
              setLabelDraft(timerData.label)
              setEditingLabel(true)
            }}
          >
            {timerData.label}
          </span>
        )}
      </div>

      <div className="timer-body">
        {editingDuration ? (
          <input
            autoFocus
            className="nodrag timer-duration-input"
            value={durationDraft}
            onChange={(event) => setDurationDraft(event.target.value)}
            onBlur={commitDuration}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitDuration()
              if (event.key === 'Escape') {
                setDurationDraft(formatTime(timerData.durationSec))
                setEditingDuration(false)
              }
            }}
          />
        ) : (
          <span
            className={`timer-display${remainingSec === 0 ? ' timer-display-zero' : ''}`}
            onDoubleClick={() => {
              if (running) return
              setDurationDraft(formatTime(timerData.durationSec))
              setEditingDuration(true)
            }}
          >
            {formatTime(remainingSec)}
          </span>
        )}

        <div className="timer-controls">
          <button
            type="button"
            className="nodrag toolbar-button"
            onClick={() => setRunning((r) => !r)}
            disabled={remainingSec === 0}
          >
            {running ? 'Pausar' : 'Play'}
          </button>
          <button type="button" className="nodrag toolbar-button" onClick={reset}>
            Reset
          </button>
          <button
            type="button"
            className={`nodrag toolbar-button timer-sound-toggle${timerData.alertSound ? ' timer-sound-active' : ''}`}
            title="Aviso sonoro ao zerar"
            onClick={() => updateNodeData(id, { alertSound: !timerData.alertSound })}
          >
            🔔
          </button>
        </div>
      </div>
    </div>
  )
}
