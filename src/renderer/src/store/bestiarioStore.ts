import { create } from 'zustand'
import type { ConteudoCustom, Dificuldade, Ficha } from '../../../shared/types/bestiario'
import type { BestiarioData } from '../bestiario/data'
import { conteudoVazio, gerarMonstro, mesclarDados, preencherConteudo } from '../bestiario/gerador'

export type OrigemFicha = 'gerador' | 'monstros' | 'npcs'

interface BestiarioState {
  ready: boolean
  salvos: Ficha[]
  custom: ConteudoCustom
  dados: BestiarioData
  atual: Ficha | null
  origem: OrigemFicha | null
  ultimaSessao: string

  init: () => Promise<void>
  gerar: (dificuldade: Dificuldade, nomeCustom?: string) => void
  atualizarAtual: (mutator: (f: Ficha) => void) => void
  abrirSalvo: (id: number, origem: 'monstros' | 'npcs') => void
  fecharDetalhe: () => void
  salvarAtual: () => Promise<void>
  excluirSalvo: (id: number) => Promise<void>
  addOpcao: (caminho: string, item: unknown) => Promise<void>
  delOpcao: (caminho: string, idx: number) => Promise<void>
  handleExternalChange: (name: string) => Promise<void>
}

// fichas antigas guardavam uma nota única em `nota`
function normalizarFicha(f: Ficha): Ficha {
  if (f.dificuldade !== 'aflicao' && f.dificuldade !== 'npc' && !f.notas) {
    f.notas = f.nota ? [f.nota] : []
    delete f.nota
  }
  return f
}

export function listaEm(raiz: unknown, caminho: string): unknown[] {
  return caminho
    .split('.')
    .reduce<unknown>((obj, chave) => (obj as Record<string, unknown>)[chave], raiz) as unknown[]
}

let initPromise: Promise<void> | null = null

export const useBestiarioStore = create<BestiarioState>((set, get) => ({
  ready: false,
  salvos: [],
  custom: conteudoVazio(),
  dados: mesclarDados(conteudoVazio()),
  atual: null,
  origem: null,
  ultimaSessao: '',

  init: () => {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const salvos = (await window.api.loadSalvos()) ?? []
      const custom = preencherConteudo(conteudoVazio(), await window.api.loadConteudo())
      set({ salvos, custom, dados: mesclarDados(custom), ready: true })
    })()
    return initPromise
  },

  gerar: (dificuldade, nomeCustom) => {
    const state = get()
    const ficha = gerarMonstro(state.dados, dificuldade, nomeCustom)
    if (ficha.tipo === 'npc') ficha.sessao = state.ultimaSessao
    set({ atual: ficha, origem: 'gerador' })
  },

  atualizarAtual: (mutator) => {
    const atual = get().atual
    if (!atual) return
    const copia = structuredClone(atual)
    mutator(copia)
    set({ atual: copia, ultimaSessao: copia.sessao ?? get().ultimaSessao })
  },

  abrirSalvo: (id, origem) => {
    const salvo = get().salvos.find((s) => s.id === id)
    if (!salvo) return
    set({ atual: normalizarFicha(structuredClone(salvo)), origem })
  },

  fecharDetalhe: () => set({ origem: null }),

  salvarAtual: async () => {
    const state = get()
    if (!state.atual) return
    const copia = structuredClone(state.atual)
    if (!copia.id) copia.id = Date.now()
    const idx = state.salvos.findIndex((s) => s.id === copia.id)
    const salvos = idx >= 0 ? state.salvos.map((s, i) => (i === idx ? copia : s)) : [...state.salvos, copia]
    set({ salvos, atual: { ...state.atual, id: copia.id } })
    await window.api.saveSalvos(salvos)
  },

  excluirSalvo: async (id) => {
    const salvos = get().salvos.filter((s) => s.id !== id)
    set({ salvos })
    await window.api.saveSalvos(salvos)
  },

  addOpcao: async (caminho, item) => {
    const custom = structuredClone(get().custom)
    listaEm(custom, caminho).push(item)
    set({ custom, dados: mesclarDados(custom) })
    await window.api.saveConteudo(custom)
  },

  delOpcao: async (caminho, idx) => {
    const custom = structuredClone(get().custom)
    listaEm(custom, caminho).splice(idx, 1)
    set({ custom, dados: mesclarDados(custom) })
    await window.api.saveConteudo(custom)
  },

  handleExternalChange: async (name) => {
    if (!get().ready) return
    if (name === 'salvos') {
      const salvos = (await window.api.loadSalvos()) ?? []
      set({ salvos })
    } else if (name === 'conteudo') {
      const custom = preencherConteudo(conteudoVazio(), await window.api.loadConteudo())
      set({ custom, dados: mesclarDados(custom) })
    }
  },
}))
