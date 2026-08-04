import { create } from 'zustand'
import type { BoardSummary } from '../../../shared/types/board'
import { useBoardStore } from './boardStore'

interface WorkspaceState {
  boards: BoardSummary[]
  boardOrder: string[]
  tabOrder: string[]
  activeBoardId: string | null
  invalidBoards: Record<string, string>
  ready: boolean

  init: () => Promise<void>
  selectBoard: (id: string) => Promise<void>
  openTab: (id: string) => Promise<void>
  closeTab: (id: string) => Promise<void>
  createBoard: (name: string) => Promise<void>
  renameBoard: (id: string, name: string) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
  moveBoard: (id: string, direction: -1 | 1) => void
  reorderTabs: (newOrder: string[]) => void
  reloadBoards: () => Promise<void>
  handleExternalChange: (id: string) => Promise<void>
  handleInvalid: (id: string, error: string) => void
  handleExternalDelete: (id: string) => void
}

function persistWorkspace(tabOrder: string[], lastOpenBoard: string | null, boardOrder: string[]) {
  void window.api.setWorkspace({ tabOrder, lastOpenBoard: lastOpenBoard ?? undefined, boardOrder })
}

async function openBoard(id: string): Promise<void> {
  const result = await window.api.readBoard(id)
  if (result.ok) {
    useBoardStore.getState().loadBoard(result.board)
  } else {
    useBoardStore.getState().setInvalidError(result.error)
  }
}

let initPromise: Promise<void> | null = null

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  boards: [],
  boardOrder: [],
  tabOrder: [],
  activeBoardId: null,
  invalidBoards: {},
  ready: false,

  init: () => {
    if (initPromise) return initPromise
    initPromise = (async () => {
      let boards = await window.api.listBoards()
      const workspace = await window.api.getWorkspace()
      let tabOrder: string[]

      if (boards.length === 0) {
        const created = await window.api.createBoard('Board 1')
        boards = [{ id: created.id, name: created.name }]
        tabOrder = [created.id]
      } else {
        // tabOrder guarda só as tabs abertas; boards fora dela ficam guardados em Sessões
        const boardIds = new Set(boards.map((b) => b.id))
        tabOrder = workspace.tabOrder.filter((id) => boardIds.has(id))
      }

      // ordem manual da lista de Sessões; boards novos entram no fim
      const boardOrder = (workspace.boardOrder ?? []).filter((id) => boards.some((b) => b.id === id))
      for (const board of boards) {
        if (!boardOrder.includes(board.id)) boardOrder.push(board.id)
      }

      const activeBoardId =
        workspace.lastOpenBoard && tabOrder.includes(workspace.lastOpenBoard)
          ? workspace.lastOpenBoard
          : (tabOrder[0] ?? null)

      set({ boards, boardOrder, tabOrder, activeBoardId, ready: true })
      persistWorkspace(tabOrder, activeBoardId, boardOrder)
      if (activeBoardId) await openBoard(activeBoardId)
    })()
    return initPromise
  },

  selectBoard: async (id) => {
    const state = get()
    if (id === state.activeBoardId) return
    await useBoardStore.getState().flush()
    set({ activeBoardId: id })
    persistWorkspace(get().tabOrder, id, get().boardOrder)
    await openBoard(id)
  },

  openTab: async (id) => {
    const state = get()
    if (!state.boards.some((b) => b.id === id)) return
    if (!state.tabOrder.includes(id)) {
      const tabOrder = [...state.tabOrder, id]
      set({ tabOrder })
      persistWorkspace(tabOrder, state.activeBoardId, state.boardOrder)
    }
    await get().selectBoard(id)
  },

  closeTab: async (id) => {
    const state = get()
    const index = state.tabOrder.indexOf(id)
    if (index === -1) return
    const tabOrder = state.tabOrder.filter((t) => t !== id)

    if (state.activeBoardId === id) {
      await useBoardStore.getState().flush()
      const nextId = tabOrder[Math.min(index, tabOrder.length - 1)] ?? null
      set({ tabOrder, activeBoardId: nextId })
      persistWorkspace(tabOrder, nextId, state.boardOrder)
      if (nextId) {
        await openBoard(nextId)
      } else {
        useBoardStore.setState({
          boardId: null,
          boardName: '',
          nodes: [],
          edges: [],
          dirty: false,
          invalidError: null,
        })
      }
    } else {
      set({ tabOrder })
      persistWorkspace(tabOrder, state.activeBoardId, state.boardOrder)
    }
  },

  createBoard: async (name) => {
    const board = await window.api.createBoard(name)
    const state = get()
    const boards = [...state.boards, { id: board.id, name: board.name }]
    const boardOrder = [...state.boardOrder, board.id]
    const tabOrder = [...state.tabOrder, board.id]
    set({ boards, boardOrder, tabOrder })
    await get().selectBoard(board.id)
  },

  renameBoard: async (id, name) => {
    await window.api.renameBoard(id, name)
    set({
      boards: get().boards.map((b) => (b.id === id ? { ...b, name } : b)),
    })
    if (id === get().activeBoardId) {
      useBoardStore.setState({ boardName: name })
    }
  },

  deleteBoard: async (id) => {
    await window.api.deleteBoard(id)
    const state = get()
    const boards = state.boards.filter((b) => b.id !== id)
    const boardOrder = state.boardOrder.filter((b) => b !== id)
    const tabOrder = state.tabOrder.filter((t) => t !== id)
    const invalidBoards = { ...state.invalidBoards }
    delete invalidBoards[id]

    if (state.activeBoardId === id) {
      const nextId = tabOrder[0] ?? null
      set({ boards, boardOrder, tabOrder, invalidBoards, activeBoardId: nextId })
      persistWorkspace(tabOrder, nextId, boardOrder)
      if (nextId) {
        await openBoard(nextId)
      } else {
        useBoardStore.setState({
          boardId: null,
          boardName: '',
          nodes: [],
          edges: [],
          dirty: false,
          invalidError: null,
        })
      }
    } else {
      set({ boards, boardOrder, tabOrder, invalidBoards })
      persistWorkspace(tabOrder, state.activeBoardId, boardOrder)
    }
  },

  moveBoard: (id, direction) => {
    const state = get()
    const index = state.boardOrder.indexOf(id)
    const target = index + direction
    if (index === -1 || target < 0 || target >= state.boardOrder.length) return
    const boardOrder = [...state.boardOrder]
    ;[boardOrder[index], boardOrder[target]] = [boardOrder[target], boardOrder[index]]
    set({ boardOrder })
    persistWorkspace(state.tabOrder, state.activeBoardId, boardOrder)
  },

  reorderTabs: (newOrder) => {
    set({ tabOrder: newOrder })
    persistWorkspace(newOrder, get().activeBoardId, get().boardOrder)
  },

  reloadBoards: async () => {
    const state = get()
    const boards = await window.api.listBoards()
    const boardIds = new Set(boards.map((b) => b.id))

    const tabOrder = state.tabOrder.filter((id) => boardIds.has(id))

    const boardOrder = state.boardOrder.filter((id) => boardIds.has(id))
    for (const board of boards) {
      if (!boardOrder.includes(board.id)) boardOrder.push(board.id)
    }

    const invalidBoards = { ...state.invalidBoards }
    for (const id of Object.keys(invalidBoards)) {
      if (!boardIds.has(id)) delete invalidBoards[id]
    }

    let activeBoardId = state.activeBoardId
    if (activeBoardId && !boardIds.has(activeBoardId)) {
      activeBoardId = tabOrder[0] ?? null
    }

    set({ boards, boardOrder, tabOrder, invalidBoards, activeBoardId })
    persistWorkspace(tabOrder, activeBoardId, boardOrder)

    if (activeBoardId) {
      await openBoard(activeBoardId)
    } else {
      useBoardStore.setState({
        boardId: null,
        boardName: '',
        nodes: [],
        edges: [],
        dirty: false,
        invalidError: null,
      })
    }
  },

  handleExternalChange: async (id) => {
    const state = get()
    if (state.invalidBoards[id]) {
      const invalidBoards = { ...state.invalidBoards }
      delete invalidBoards[id]
      set({ invalidBoards })
    }

    const result = await window.api.readBoard(id)
    if (result.ok) {
      const boards = state.boards.some((b) => b.id === id)
        ? state.boards.map((b) => (b.id === id ? { id, name: result.board.name } : b))
        : [...state.boards, { id, name: result.board.name }]

      if (state.boardOrder.includes(id)) {
        set({ boards })
      } else {
        const boardOrder = [...state.boardOrder, id]
        set({ boards, boardOrder })
        persistWorkspace(state.tabOrder, state.activeBoardId, boardOrder)
      }
      if (id === get().activeBoardId) {
        useBoardStore.getState().loadBoard(result.board)
      }
    }
  },

  handleInvalid: (id, error) => {
    set({ invalidBoards: { ...get().invalidBoards, [id]: error } })
    if (id === get().activeBoardId) {
      useBoardStore.getState().setInvalidError(error)
    }
  },

  handleExternalDelete: (id) => {
    const state = get()
    const boards = state.boards.filter((b) => b.id !== id)
    const boardOrder = state.boardOrder.filter((b) => b !== id)
    const tabOrder = state.tabOrder.filter((t) => t !== id)
    const invalidBoards = { ...state.invalidBoards }
    delete invalidBoards[id]

    if (state.activeBoardId === id) {
      const nextId = tabOrder[0] ?? null
      set({ boards, boardOrder, tabOrder, invalidBoards, activeBoardId: nextId })
      persistWorkspace(tabOrder, nextId, boardOrder)
      if (nextId) void openBoard(nextId)
    } else {
      set({ boards, boardOrder, tabOrder, invalidBoards })
    }
  },
}))
