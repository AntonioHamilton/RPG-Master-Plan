import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges, addEdge as rfAddEdge } from '@xyflow/react'
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, Viewport } from '@xyflow/react'
import type {
  BestiarioCardData,
  Board,
  BoardViewport,
  CardData,
  CardType,
  MidiaData,
  NotaData,
  PersonagemData,
  RelogioData,
  TimerData,
} from '../../../shared/types/board'
import type { Ficha } from '../../../shared/types/bestiario'
import { uniqueSlug } from '../../../shared/lib/slug'

export type RFNode = Node<CardData, CardType>
export type RFEdge = Edge

const AUTOSAVE_DEBOUNCE_MS = 1000

const DEFAULT_CARD_SIZE: Record<CardType, { width: number; height?: number }> = {
  nota: { width: 280 },
  personagem: { width: 240, height: 280 },
  relogio: { width: 200, height: 150 },
  timer: { width: 200, height: 150 },
  midia: { width: 240, height: 130 },
  bestiario: { width: 280, height: 320 },
}

function defaultCardData(type: CardType): CardData {
  switch (type) {
    case 'nota':
      return { title: 'Nova nota', color: 'slate', image: null, markdown: '' } satisfies NotaData
    case 'personagem':
      return {
        name: 'Novo personagem',
        image: null,
        resources: [{ label: 'Fôlego', current: 5, max: 5, color: 'red' }],
        markdown: '',
      } satisfies PersonagemData
    case 'relogio':
      return { label: 'Novo relógio', segments: 4, filled: 0 } satisfies RelogioData
    case 'timer':
      return { label: 'Novo timer', durationSec: 300, alertSound: true } satisfies TimerData
    case 'midia':
      return { label: 'Nova mídia', src: '', loop: false, volume: 0.8 } satisfies MidiaData
    case 'bestiario':
      return { refId: 0 } satisfies BestiarioCardData
  }
}

function cardLabel(type: CardType): string {
  switch (type) {
    case 'nota':
      return 'Nova nota'
    case 'personagem':
      return 'Novo personagem'
    case 'relogio':
      return 'Novo relógio'
    case 'timer':
      return 'Novo timer'
    case 'midia':
      return 'Nova mídia'
    case 'bestiario':
      return 'Ficha'
  }
}

interface BoardStoreState {
  boardId: string | null
  boardName: string
  nodes: RFNode[]
  edges: RFEdge[]
  viewport: BoardViewport | null
  dirty: boolean
  invalidError: string | null
  saveTimer: ReturnType<typeof setTimeout> | null

  loadBoard: (board: Board) => void
  onNodesChange: OnNodesChange<RFNode>
  onEdgesChange: OnEdgesChange<RFEdge>
  onConnect: OnConnect
  setViewport: (viewport: Viewport) => void
  addNode: (type: CardType, position: { x: number; y: number }) => void
  addBestiarioNode: (ficha: Ficha, position: { x: number; y: number }) => void
  updateNodeData: (id: string, patch: Record<string, unknown>) => void
  updateNodeGeometry: (
    id: string,
    geometry: { width: number; height: number; x?: number; y?: number },
  ) => void
  updateEdgeLabel: (id: string, label: string) => void
  updateEdgeLabelSize: (id: string, size: { width: number; height: number }) => void
  setInvalidError: (message: string | null) => void
  flush: () => Promise<void>
}

function boardToRF(board: Board): { nodes: RFNode[]; edges: RFEdge[] } {
  return {
    nodes: board.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      width: n.width,
      height: n.height,
      data: n.data,
    })),
    edges: board.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      type: 'labeled',
      data: { labelWidth: e.labelWidth, labelHeight: e.labelHeight },
    })),
  }
}

async function saveNow(
  get: () => BoardStoreState,
  set: (partial: Partial<BoardStoreState>) => void,
): Promise<void> {
  const state = get()
  if (!state.boardId || state.invalidError) return

  const board: Board = {
    id: state.boardId,
    name: state.boardName,
    nodes: state.nodes.map((n) => ({
      id: n.id,
      type: n.type as CardType,
      position: n.position,
      width: n.width,
      height: n.height,
      data: n.data,
    })),
    edges: state.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: typeof e.label === 'string' ? e.label : undefined,
      labelWidth: typeof e.data?.labelWidth === 'number' ? e.data.labelWidth : undefined,
      labelHeight: typeof e.data?.labelHeight === 'number' ? e.data.labelHeight : undefined,
    })),
    viewport: state.viewport ?? undefined,
  }

  await window.api.writeBoard(board)
  set({ dirty: false, saveTimer: null })
}

function scheduleSave(get: () => BoardStoreState, set: (partial: Partial<BoardStoreState>) => void) {
  const state = get()
  if (state.saveTimer) clearTimeout(state.saveTimer)
  const timer = setTimeout(() => {
    void saveNow(get, set)
  }, AUTOSAVE_DEBOUNCE_MS)
  set({ saveTimer: timer })
}

export const useBoardStore = create<BoardStoreState>((set, get) => ({
  boardId: null,
  boardName: '',
  nodes: [],
  edges: [],
  viewport: null,
  dirty: false,
  invalidError: null,
  saveTimer: null,

  loadBoard: (board) => {
    const prev = get()
    if (prev.saveTimer) clearTimeout(prev.saveTimer)
    const { nodes, edges } = boardToRF(board)
    set({
      boardId: board.id,
      boardName: board.name,
      nodes,
      edges,
      viewport: board.viewport ?? null,
      dirty: false,
      invalidError: null,
      saveTimer: null,
    })
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes), dirty: true })
    scheduleSave(get, set)
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges), dirty: true })
    scheduleSave(get, set)
  },

  setViewport: (viewport) => {
    set({ viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom }, dirty: true })
    scheduleSave(get, set)
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return
    const id = uniqueSlug(
      `${connection.source}-${connection.target}`,
      get().edges.map((e) => e.id),
    )
    set({
      edges: rfAddEdge({ ...connection, id, type: 'labeled' }, get().edges),
      dirty: true,
    })
    scheduleSave(get, set)
  },

  addNode: (type, position) => {
    const state = get()
    const id = uniqueSlug(
      cardLabel(type),
      state.nodes.map((n) => n.id),
    )
    const size = DEFAULT_CARD_SIZE[type]
    const node: RFNode = {
      id,
      type,
      position,
      width: size.width,
      height: size.height,
      data: defaultCardData(type),
    }
    set({ nodes: [...state.nodes, node], dirty: true })
    scheduleSave(get, set)
  },

  addBestiarioNode: (ficha, position) => {
    if (!ficha.id) return
    const state = get()
    const id = uniqueSlug(
      ficha.nome,
      state.nodes.map((n) => n.id),
    )
    const size = DEFAULT_CARD_SIZE.bestiario
    const data: BestiarioCardData = {
      refId: ficha.id,
      folegoAtual: ficha.folego ?? null,
      guardaAtual: ficha.guarda ? [...ficha.guarda] : null,
    }
    const node: RFNode = {
      id,
      type: 'bestiario',
      position,
      width: size.width,
      height: size.height,
      data,
    }
    set({ nodes: [...state.nodes, node], dirty: true })
    scheduleSave(get, set)
  },

  updateNodeData: (id, patch) => {
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
      dirty: true,
    })
    scheduleSave(get, set)
  },

  updateNodeGeometry: (id, geometry) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              width: geometry.width,
              height: geometry.height,
              position: {
                x: geometry.x ?? n.position.x,
                y: geometry.y ?? n.position.y,
              },
            }
          : n,
      ),
      dirty: true,
    })
    scheduleSave(get, set)
  },

  updateEdgeLabel: (id, label) => {
    set({
      edges: get().edges.map((e) => (e.id === id ? { ...e, label } : e)),
      dirty: true,
    })
    scheduleSave(get, set)
  },

  updateEdgeLabelSize: (id, size) => {
    set({
      edges: get().edges.map((e) =>
        e.id === id
          ? { ...e, data: { ...e.data, labelWidth: size.width, labelHeight: size.height } }
          : e,
      ),
      dirty: true,
    })
    scheduleSave(get, set)
  },

  setInvalidError: (message) => set({ invalidError: message }),

  flush: async () => {
    const state = get()
    if (state.saveTimer) {
      clearTimeout(state.saveTimer)
      set({ saveTimer: null })
    }
    if (state.dirty) {
      await saveNow(get, set)
    }
  },
}))
