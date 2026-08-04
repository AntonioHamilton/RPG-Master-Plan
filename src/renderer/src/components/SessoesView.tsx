import { useState } from 'react'
import type { BoardSummary } from '../../../shared/types/board'
import { useWorkspaceStore } from '../store/workspaceStore'

export function SessoesView({ onOpenBoard }: { onOpenBoard: () => void }) {
  const boards = useWorkspaceStore((s) => s.boards)
  const boardOrder = useWorkspaceStore((s) => s.boardOrder)
  const tabOrder = useWorkspaceStore((s) => s.tabOrder)
  const invalidBoards = useWorkspaceStore((s) => s.invalidBoards)
  const openTab = useWorkspaceStore((s) => s.openTab)
  const renameBoard = useWorkspaceStore((s) => s.renameBoard)
  const deleteBoard = useWorkspaceStore((s) => s.deleteBoard)
  const moveBoard = useWorkspaceStore((s) => s.moveBoard)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const boardsById = new Map(boards.map((b) => [b.id, b]))
  const sorted = boardOrder
    .map((id) => boardsById.get(id))
    .filter((b): b is BoardSummary => b !== undefined)

  function startRename(id: string, currentName: string) {
    setEditingId(id)
    setDraft(currentName)
  }

  function commitRename(id: string) {
    const name = draft.trim()
    setEditingId(null)
    if (name) void renameBoard(id, name)
  }

  async function handleOpen(id: string) {
    await openTab(id)
    onOpenBoard()
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Excluir o board "${name}"? O arquivo será apagado — esta ação não pode ser desfeita.`)) {
      void deleteBoard(id)
    }
  }

  return (
    <div className="sessions-view">
      <div className="sessions-list">
        <p className="sessions-hint">
          Todos os boards da pasta de sessões. Fechar uma tab não apaga o board — ele fica guardado aqui.
        </p>
        {sorted.map((board, index) => {
          const isOpen = tabOrder.includes(board.id)
          const isInvalid = Boolean(invalidBoards[board.id])
          return (
            <div key={board.id} className="session-row">
              <div className="session-move">
                <button
                  type="button"
                  className="session-move-btn"
                  title="Mover para cima"
                  disabled={index === 0}
                  onClick={() => moveBoard(board.id, -1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="session-move-btn"
                  title="Mover para baixo"
                  disabled={index === sorted.length - 1}
                  onClick={() => moveBoard(board.id, 1)}
                >
                  ▼
                </button>
              </div>
              {editingId === board.id ? (
                <input
                  autoFocus
                  className="session-rename-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => commitRename(board.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitRename(board.id)
                    if (event.key === 'Escape') setEditingId(null)
                  }}
                />
              ) : (
                <span
                  className={`session-row-name${isInvalid ? ' session-row-invalid' : ''}`}
                  onDoubleClick={() => startRename(board.id, board.name)}
                >
                  {board.name}
                </span>
              )}
              {isOpen && <span className="session-badge">aberto</span>}
              <button type="button" className="toolbar-button" onClick={() => void handleOpen(board.id)}>
                {isOpen ? 'Ir para' : 'Abrir'}
              </button>
              <button
                type="button"
                className="toolbar-button"
                onClick={() => startRename(board.id, board.name)}
              >
                Renomear
              </button>
              <button
                type="button"
                className="toolbar-button toolbar-button-danger"
                onClick={() => handleDelete(board.id, board.name)}
              >
                Excluir
              </button>
            </div>
          )
        })}
        {sorted.length === 0 && <p className="sessions-hint">Nenhum board na pasta.</p>}
      </div>
    </div>
  )
}
