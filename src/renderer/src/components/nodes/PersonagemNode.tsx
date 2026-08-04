import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { RFNode } from '../../store/boardStore'
import { useBoardStore } from '../../store/boardStore'
import { CARD_COLOR_HEX } from '../../lib/cardColors'
import { CARD_COLORS, type PersonagemData, type PersonagemResource } from '../../../../shared/types/board'
import { CardImage } from './CardImage'
import { CardResizer } from './CardResizer'
import { MarkdownField } from './MarkdownField'

const VALUE_PATTERN = /^\s*(\d+)\s*\/\s*(\d+)\s*$/

function ResourceRow({
  resource,
  onChange,
  onRemove,
}: {
  resource: PersonagemResource
  onChange: (patch: Partial<PersonagemResource>) => void
  onRemove?: () => void
}) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(resource.label)
  const [editingValue, setEditingValue] = useState(false)
  const [valueDraft, setValueDraft] = useState(`${resource.current}/${resource.max}`)
  const [pickerOpen, setPickerOpen] = useState(false)

  const color = resource.color ?? 'red'
  const pct = resource.max > 0 ? Math.min(100, Math.max(0, (resource.current / resource.max) * 100)) : 0

  function commitLabel() {
    onChange({ label: labelDraft.trim() || resource.label })
    setEditingLabel(false)
  }

  function adjust(delta: number) {
    const next = Math.max(0, Math.min(resource.max, resource.current + delta))
    onChange({ current: next })
  }

  function commitValue() {
    const match = valueDraft.match(VALUE_PATTERN)
    if (match) {
      const max = Math.max(0, parseInt(match[2], 10))
      const current = Math.max(0, Math.min(max, parseInt(match[1], 10)))
      onChange({ current, max })
    }
    setEditingValue(false)
  }

  return (
    <div className="resource-row">
      <div className="resource-row-header">
        {onRemove && (
          <button type="button" className="nodrag resource-remove" onClick={onRemove}>
            ×
          </button>
        )}
        {editingLabel ? (
          <input
            autoFocus
            className="nodrag resource-label-input"
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
            className="resource-label"
            onDoubleClick={() => {
              setLabelDraft(resource.label)
              setEditingLabel(true)
            }}
          >
            {resource.label}
          </span>
        )}
      </div>

      <div className="resource-bar-row">
        <button type="button" className="nodrag resource-btn" onClick={() => adjust(-1)}>
          −
        </button>

        <div
          className="resource-bar nodrag"
          onContextMenu={(event) => {
            event.preventDefault()
            setPickerOpen((open) => !open)
          }}
          onDoubleClick={() => {
            setValueDraft(`${resource.current}/${resource.max}`)
            setEditingValue(true)
          }}
        >
          <div className="resource-bar-fill" style={{ width: `${pct}%`, background: CARD_COLOR_HEX[color] }} />
          {editingValue ? (
            <input
              autoFocus
              className="nodrag resource-bar-input"
              value={valueDraft}
              onChange={(event) => setValueDraft(event.target.value)}
              onBlur={commitValue}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitValue()
                if (event.key === 'Escape') setEditingValue(false)
              }}
            />
          ) : (
            <span className="resource-bar-label">
              {resource.current}/{resource.max}
            </span>
          )}
        </div>

        <button type="button" className="nodrag resource-btn" onClick={() => adjust(1)}>
          +
        </button>
      </div>

      {pickerOpen && (
        <div className="color-picker nodrag">
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="color-swatch"
              style={{ background: CARD_COLOR_HEX[c] }}
              onClick={() => {
                onChange({ color: c })
                setPickerOpen(false)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PersonagemNode({ id, data, selected }: NodeProps<RFNode>) {
  const personagemData = data as PersonagemData
  const updateNodeData = useBoardStore((s) => s.updateNodeData)

  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(personagemData.name)

  function commitName() {
    updateNodeData(id, { name: nameDraft.trim() || 'Sem nome' })
    setEditingName(false)
  }

  function updateResource(index: number, patch: Partial<PersonagemResource>) {
    const resources = personagemData.resources.map((r, i) => (i === index ? { ...r, ...patch } : r))
    updateNodeData(id, { resources })
  }

  function addSecondResource() {
    updateNodeData(id, {
      resources: [...personagemData.resources, { label: 'Aura', current: 3, max: 3, color: 'blue' }],
    })
  }

  function removeSecondResource() {
    updateNodeData(id, { resources: personagemData.resources.slice(0, 1) })
  }

  return (
    <div className={`card card-personagem${selected ? ' card-selected' : ''}`}>
      <CardResizer nodeId={id} selected={selected} />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />

      <div className="card-header card-header-plain">
        {editingName ? (
          <input
            autoFocus
            className="nodrag card-title-input card-title-input-plain"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onBlur={commitName}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitName()
              if (event.key === 'Escape') setEditingName(false)
            }}
          />
        ) : (
          <span
            className="card-title"
            onDoubleClick={() => {
              setNameDraft(personagemData.name)
              setEditingName(true)
            }}
          >
            {personagemData.name}
          </span>
        )}
      </div>

      {personagemData.image && (
        <CardImage
          src={personagemData.image}
          zoom={personagemData.imageZoom ?? 1}
          onZoomChange={(imageZoom) => updateNodeData(id, { imageZoom })}
        />
      )}

      <div className="resources">
        <ResourceRow
          resource={personagemData.resources[0]}
          onChange={(patch) => updateResource(0, patch)}
        />
        {personagemData.resources[1] ? (
          <ResourceRow
            resource={personagemData.resources[1]}
            onChange={(patch) => updateResource(1, patch)}
            onRemove={removeSecondResource}
          />
        ) : (
          <button type="button" className="nodrag add-resource-btn" onClick={addSecondResource}>
            + Aura
          </button>
        )}
      </div>

      <div className="card-body">
        <MarkdownField
          markdown={personagemData.markdown}
          onChange={(markdown) => updateNodeData(id, { markdown })}
        />
      </div>
    </div>
  )
}
