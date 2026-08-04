export const CARD_COLORS = [
  'slate',
  'red',
  'amber',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
] as const

export type CardColor = (typeof CARD_COLORS)[number]

export type CardType = 'nota' | 'personagem' | 'relogio' | 'timer' | 'midia' | 'bestiario'

export interface NotaData {
  [key: string]: unknown
  title: string
  color: CardColor
  image?: string | null
  imageZoom?: number
  markdown: string
}

export interface PersonagemResource {
  label: string
  current: number
  max: number
  color?: CardColor
}

export interface PersonagemData {
  [key: string]: unknown
  name: string
  image?: string | null
  imageZoom?: number
  resources: PersonagemResource[]
  markdown: string
}

export interface RelogioData {
  [key: string]: unknown
  label: string
  segments: number
  filled: number
}

export interface TimerData {
  [key: string]: unknown
  label: string
  durationSec: number
  alertSound: boolean
}

export interface MidiaData {
  [key: string]: unknown
  label: string
  src: string
  loop: boolean
  volume: number
}

// referência viva a uma ficha do bestiário (bestiario\salvos.json);
// só o estado de mesa da cena fica no card
export interface BestiarioCardData {
  [key: string]: unknown
  refId: number
  folegoAtual?: number | null
  guardaAtual?: number[] | null
  imageZoom?: number
}

export type CardData =
  | NotaData
  | PersonagemData
  | RelogioData
  | TimerData
  | MidiaData
  | BestiarioCardData

export interface BoardNode<T = CardData> {
  id: string
  type: CardType
  position: { x: number; y: number }
  width?: number
  height?: number
  data: T
}

export interface BoardEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  label?: string
  labelWidth?: number
  labelHeight?: number
}

export interface BoardViewport {
  x: number
  y: number
  zoom: number
}

export interface Board {
  id: string
  name: string
  nodes: BoardNode[]
  edges: BoardEdge[]
  viewport?: BoardViewport
}

export interface BoardSummary {
  id: string
  name: string
}

export interface WorkspaceFile {
  tabOrder: string[]
  lastOpenBoard?: string
  boardOrder?: string[]
}

export interface AppSettings {
  dataDir: string
}
