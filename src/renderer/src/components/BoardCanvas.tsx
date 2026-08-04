import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactFlow, Background, Controls, Panel, useReactFlow } from '@xyflow/react'
import type { Viewport } from '@xyflow/react'
import { useBoardStore } from '../store/boardStore'
import type { CardType } from '../../../shared/types/board'
import { useBestiarioStore } from '../store/bestiarioStore'
import type { Ficha } from '../../../shared/types/bestiario'
import { textoTipo } from '../bestiario/gerador'
import { NotaNode } from './nodes/NotaNode'
import { PersonagemNode } from './nodes/PersonagemNode'
import { RelogioNode } from './nodes/RelogioNode'
import { TimerNode } from './nodes/TimerNode'
import { MidiaNode } from './nodes/MidiaNode'
import { BestiarioNode } from './nodes/BestiarioNode'
import { LabeledEdge } from './edges/LabeledEdge'

const nodeTypes = {
  nota: NotaNode,
  personagem: PersonagemNode,
  relogio: RelogioNode,
  timer: TimerNode,
  midia: MidiaNode,
  bestiario: BestiarioNode,
}
const edgeTypes = { labeled: LabeledEdge }

const ADD_BUTTONS: { type: CardType; label: string }[] = [
  { type: 'nota', label: '+ Nota' },
  { type: 'personagem', label: '+ Personagem' },
  { type: 'relogio', label: '+ Relógio' },
  { type: 'timer', label: '+ Timer' },
  { type: 'midia', label: '+ Mídia' },
]

export function BoardCanvas() {
  const boardId = useBoardStore((s) => s.boardId)
  const nodes = useBoardStore((s) => s.nodes)
  const edges = useBoardStore((s) => s.edges)
  const onNodesChange = useBoardStore((s) => s.onNodesChange)
  const onEdgesChange = useBoardStore((s) => s.onEdgesChange)
  const onConnect = useBoardStore((s) => s.onConnect)
  const setViewport = useBoardStore((s) => s.setViewport)
  const addNode = useBoardStore((s) => s.addNode)
  const addBestiarioNode = useBoardStore((s) => s.addBestiarioNode)
  const invalidError = useBoardStore((s) => s.invalidError)
  const salvos = useBestiarioStore((s) => s.salvos)
  const { screenToFlowPosition, setViewport: setRfViewport, fitView } = useReactFlow()
  const isRestoringViewport = useRef(false)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'monstros' | 'npcs'>('todos')

  useEffect(() => {
    if (!boardId) return
    isRestoringViewport.current = true
    const saved = useBoardStore.getState().viewport
    if (saved) {
      setRfViewport(saved, { duration: 0 })
    } else {
      fitView({ duration: 0 })
    }
    const release = setTimeout(() => {
      isRestoringViewport.current = false
    }, 0)
    return () => clearTimeout(release)
  }, [boardId, setRfViewport, fitView])

  const handleMoveEnd = useCallback(
    (_event: unknown, viewport: Viewport) => {
      if (isRestoringViewport.current) return
      setViewport(viewport)
    },
    [setViewport],
  )

  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      setColorMode(event.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  const defaultEdgeOptions = useMemo(() => ({ type: 'labeled' }), [])

  const handleAdd = useCallback(
    (type: CardType) => {
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      addNode(type, position)
    },
    [addNode, screenToFlowPosition],
  )

  const handleAddFicha = useCallback(
    (ficha: Ficha) => {
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      addBestiarioNode(ficha, position)
      setPickerOpen(false)
    },
    [addBestiarioNode, screenToFlowPosition],
  )

  const fichasFiltradas = salvos.filter((f) => {
    if (filtro === 'monstros' && f.tipo === 'npc') return false
    if (filtro === 'npcs' && f.tipo !== 'npc') return false
    const termo = busca.trim().toLowerCase()
    return !termo || f.nome.toLowerCase().includes(termo)
  })

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onMoveEnd={handleMoveEnd}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      deleteKeyCode={['Delete', 'Backspace']}
      colorMode={colorMode}
    >
      <Background />
      <Controls />
      <Panel position="top-left">
        <div className="add-card-toolbar">
          {ADD_BUTTONS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className="toolbar-button"
              disabled={!boardId}
              onClick={() => handleAdd(type)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="toolbar-button"
            disabled={!boardId}
            onClick={() => setPickerOpen((open) => !open)}
          >
            + Bestiário
          </button>
        </div>
        {pickerOpen && boardId && (
          <div className="bestiario-picker">
            <input
              autoFocus
              type="text"
              className="bestiario-picker-busca"
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setPickerOpen(false)
              }}
            />
            <div className="bestiario-picker-filtros">
              {(
                [
                  ['todos', 'Todos'],
                  ['monstros', 'Monstros'],
                  ['npcs', 'NPCs'],
                ] as const
              ).map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  className={`bestiario-picker-filtro${filtro === valor ? ' filtro-ativo' : ''}`}
                  onClick={() => setFiltro(valor)}
                >
                  {rotulo}
                </button>
              ))}
            </div>
            <ul className="bestiario-picker-lista">
              {fichasFiltradas.length === 0 && (
                <li className="bestiario-picker-vazio">
                  {salvos.length === 0 ? 'Nenhuma ficha salva no bestiário.' : 'Nenhuma ficha encontrada.'}
                </li>
              )}
              {fichasFiltradas.map((f) => (
                <li key={f.id}>
                  <button type="button" className="bestiario-picker-item" onClick={() => handleAddFicha(f)}>
                    <span className="bestiario-picker-nome">
                      {f.dificuldade === 'aflicao' ? `Aflição: ${f.nome}` : f.nome}
                    </span>
                    <span className="bestiario-picker-tag">
                      {textoTipo(f)} · {f.contexto}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>
      {invalidError && (
        <Panel position="top-center">
          <div className="invalid-banner">
            JSON inválido neste board — corrija o arquivo para retomar o autosave.
            <span className="invalid-detail">{invalidError}</span>
          </div>
        </Panel>
      )}
    </ReactFlow>
  )
}
