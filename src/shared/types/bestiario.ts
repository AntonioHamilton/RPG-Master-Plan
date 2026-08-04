export const ATRIBUTOS = ['Corpo', 'Instinto', 'Saber', 'Presença', 'Vontade'] as const
export type Atributo = (typeof ATRIBUTOS)[number]

export const ZONAS = ['Cabeça', 'Torço', 'Pernas'] as const

export type Dificuldade = 'capanga' | 'fera' | 'chefe' | 'aflicao' | 'npc'

export interface Habilidade {
  nome: string
  efeito: string
}

export interface BrechaMonstro {
  texto: string
  camada2: string
}

export interface AflicaoFicha {
  nome: string
  concede: string
  preco: string
  jogo: string
  brecha: string
}

export interface Ficha {
  id?: number
  dificuldade: Dificuldade
  tipo: string
  categoria?: string | null
  contexto: string
  nome: string
  imagem?: string
  sessao?: string
  aparencia?: string
  atributos?: Record<Atributo, number>
  guarda?: number[] | null
  folego?: number
  dano?: number
  habilidades?: Habilidade[]
  manobras?: string[] | null
  brecha?: BrechaMonstro
  notas?: string[]
  nota?: string
  caracteristica?: string
  plot?: string
  aflicao?: AflicaoFicha
}

export interface AparenciaMonstro {
  portes: string[]
  texturas: string[]
  detalhes: string[]
}

export interface AparenciaNpc {
  corpos: string[]
  roupas: string[]
  detalhes: string[]
}

export interface ConteudoCustom {
  habilidades: Record<string, Habilidade[]>
  brechas: Record<string, BrechaMonstro[]>
  aparencias: Record<string, AparenciaMonstro>
  npcs: {
    caracteristicas: string[]
    desejos: string[]
    motivos: string[]
    aparencias: AparenciaNpc
  }
}
