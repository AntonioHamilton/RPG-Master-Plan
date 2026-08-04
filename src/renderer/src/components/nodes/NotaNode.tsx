import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { RFNode } from '../../store/boardStore'
import { useBoardStore } from '../../store/boardStore'
import { CARD_COLOR_HEX } from '../../lib/cardColors'
import { CARD_COLORS, type NotaData } from '../../../../shared/types/board'
import { CardImage } from './CardImage'
import { CardResizer } from './CardResizer'
import { MarkdownField } from './MarkdownField'

export function NotaNode({ id, data, selected }: NodeProps<RFNode>) {
  const notaData = data as NotaData
  const updateNodeData = useBoardStore((s) => s.updateNodeData)

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(notaData.title)
  const [pickerOpen, setPickerOpen] = useState(false)

  function commitTitle() {
    updateNodeData(id, { title: titleDraft.trim() || 'Sem título' })
    setEditingTitle(false)
  }

  return (
    <div
      className={`card card-nota${selected ? ' card-selected' : ''}`}
      style={{ borderColor: CARD_COLOR_HEX[notaData.color] }}
    >
      <CardResizer nodeId={id} selected={selected} />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />

      <div
        className="card-header"
        style={{ background: CARD_COLOR_HEX[notaData.color] }}
        onContextMenu={(event) => {
          event.preventDefault()
          setPickerOpen((open) => !open)
        }}
      >
        {editingTitle ? (
          <input
            autoFocus
            className="nodrag card-title-input"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitTitle()
              if (event.key === 'Escape') setEditingTitle(false)
            }}
          />
        ) : (
          <span
            className="card-title"
            onDoubleClick={() => {
              setTitleDraft(notaData.title)
              setEditingTitle(true)
            }}
          >
            {notaData.title}
          </span>
        )}
      </div>

      {pickerOpen && (
        <div className="color-picker nodrag">
          {CARD_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className="color-swatch"
              style={{ background: CARD_COLOR_HEX[color] }}
              onClick={() => {
                updateNodeData(id, { color })
                setPickerOpen(false)
              }}
            />
          ))}
        </div>
      )}

      {notaData.image && (
        <CardImage
          src={notaData.image}
          zoom={notaData.imageZoom ?? 1}
          onZoomChange={(imageZoom) => updateNodeData(id, { imageZoom })}
        />
      )}

      <div className="card-body">
        <MarkdownField
          markdown={notaData.markdown}
          onChange={(markdown) => updateNodeData(id, { markdown })}
        />
      </div>
    </div>
  )
}
