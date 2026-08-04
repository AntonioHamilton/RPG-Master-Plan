import { useRef, useState } from 'react'
import { useWorkspaceStore } from '../store/workspaceStore'

export function Tabs() {
  const boards = useWorkspaceStore((s) => s.boards)
  const tabOrder = useWorkspaceStore((s) => s.tabOrder)
  const activeBoardId = useWorkspaceStore((s) => s.activeBoardId)
  const invalidBoards = useWorkspaceStore((s) => s.invalidBoards)
  const selectBoard = useWorkspaceStore((s) => s.selectBoard)
  const createBoard = useWorkspaceStore((s) => s.createBoard)
  const renameBoard = useWorkspaceStore((s) => s.renameBoard)
  const closeTab = useWorkspaceStore((s) => s.closeTab)
  const reorderTabs = useWorkspaceStore((s) => s.reorderTabs)
  const reloadBoards = useWorkspaceStore((s) => s.reloadBoards)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const dragIndexRef = useRef<number | null>(null)

  const boardsById = new Map(boards.map((b) => [b.id, b]))

  function startRename(id: string, currentName: string) {
    setEditingId(id)
    setDraft(currentName)
  }

  function commitRename(id: string) {
    const name = draft.trim()
    setEditingId(null)
    if (name) void renameBoard(id, name)
  }

  function handleDrop(targetIndex: number) {
    const sourceIndex = dragIndexRef.current
    dragIndexRef.current = null
    if (sourceIndex === null || sourceIndex === targetIndex) return
    const next = [...tabOrder]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    reorderTabs(next)
  }

  return (
    <div className="tabs-bar">
      {tabOrder.map((id, index) => {
        const board = boardsById.get(id)
        if (!board) return null
        const isActive = id === activeBoardId
        const isInvalid = Boolean(invalidBoards[id])

        return (
          <div
            key={id}
            className={`tab${isActive ? ' tab-active' : ''}${isInvalid ? ' tab-invalid' : ''}`}
            draggable
            onDragStart={() => {
              dragIndexRef.current = index
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(index)}
            onClick={() => void selectBoard(id)}
            onDoubleClick={() => startRename(id, board.name)}
          >
            {editingId === id ? (
              <input
                autoFocus
                className="tab-rename-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => commitRename(id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitRename(id)
                  if (event.key === 'Escape') setEditingId(null)
                }}
              />
            ) : (
              <span className="tab-name">{board.name}</span>
            )}
            <button
              type="button"
              className="tab-delete"
              title="Fechar — o board fica guardado em Sessões"
              onClick={(event) => {
                event.stopPropagation()
                void closeTab(id)
              }}
            >
              ×
            </button>
          </div>
        )
      })}
      <button
        type="button"
        className="tab-add"
        onClick={() => void createBoard(`Board ${boards.length + 1}`)}
      >
        +
      </button>
      <button
        type="button"
        className="tab-reload"
        title="Recarregar boards"
        onClick={() => void reloadBoards()}
      >
        ⟳
      </button>
    </div>
  )
}
