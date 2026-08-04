import { useEffect, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { RFNode } from '../../store/boardStore'
import { useBoardStore } from '../../store/boardStore'
import type { MidiaData } from '../../../../shared/types/board'
import { CardResizer } from './CardResizer'

function resolveAudioSrc(src: string): string {
  if (!src) return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(src)) return src
  return `app-media://local/${encodeURIComponent(src)}`
}

export function MidiaNode({ id, data, selected }: NodeProps<RFNode>) {
  const midiaData = data as MidiaData
  const updateNodeData = useBoardStore((s) => s.updateNodeData)

  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(midiaData.label)
  const [editingSrc, setEditingSrc] = useState(false)
  const [srcDraft, setSrcDraft] = useState(midiaData.src)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = midiaData.volume
  }, [midiaData.volume])

  useEffect(() => {
    setPlaying(false)
  }, [midiaData.src])

  function commitLabel() {
    updateNodeData(id, { label: labelDraft.trim() || midiaData.label })
    setEditingLabel(false)
  }

  function commitSrc() {
    updateNodeData(id, { src: srcDraft.trim() })
    setEditingSrc(false)
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      void audio.play()
    }
    setPlaying(!playing)
  }

  return (
    <div className={`card card-midia${selected ? ' card-selected' : ''}`}>
      <CardResizer nodeId={id} selected={selected} minWidth={180} minHeight={110} />
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
              setLabelDraft(midiaData.label)
              setEditingLabel(true)
            }}
          >
            {midiaData.label}
          </span>
        )}
      </div>

      <div className="media-body">
        {editingSrc ? (
          <input
            autoFocus
            className="nodrag media-src-input"
            placeholder="Caminho local ou URL"
            value={srcDraft}
            onChange={(event) => setSrcDraft(event.target.value)}
            onBlur={commitSrc}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitSrc()
              if (event.key === 'Escape') setEditingSrc(false)
            }}
          />
        ) : (
          <span
            className="media-src"
            onDoubleClick={() => {
              setSrcDraft(midiaData.src)
              setEditingSrc(true)
            }}
          >
            {midiaData.src || '(duplo clique para definir o som)'}
          </span>
        )}

        {midiaData.src && (
          <audio
            ref={audioRef}
            src={resolveAudioSrc(midiaData.src)}
            preload="auto"
            loop={midiaData.loop}
            onEnded={() => setPlaying(false)}
          />
        )}

        <div className="media-controls">
          <button
            type="button"
            className="nodrag toolbar-button"
            onClick={togglePlay}
            disabled={!midiaData.src}
          >
            {playing ? 'Pausar' : 'Play'}
          </button>
          <button
            type="button"
            className={`nodrag toolbar-button${midiaData.loop ? ' timer-sound-active' : ''}`}
            onClick={() => updateNodeData(id, { loop: !midiaData.loop })}
          >
            Loop
          </button>
          <input
            type="range"
            className="nodrag media-volume"
            min={0}
            max={1}
            step={0.05}
            value={midiaData.volume}
            onChange={(event) => updateNodeData(id, { volume: Number(event.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}
