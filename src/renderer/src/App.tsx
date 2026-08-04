import { useEffect, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BoardCanvas } from './components/BoardCanvas'
import { Tabs } from './components/Tabs'
import { SessionTimer } from './components/SessionTimer'
import { SessoesView } from './components/SessoesView'
import { BestiarioView } from './components/bestiario/BestiarioView'
import { useWorkspaceStore } from './store/workspaceStore'
import { useBoardStore } from './store/boardStore'
import { useBestiarioStore } from './store/bestiarioStore'
import './App.css'

type TopTab = 'boards' | 'bestiario' | 'sessoes'

const TOP_TABS: { id: TopTab; label: string }[] = [
  { id: 'boards', label: 'Boards' },
  { id: 'bestiario', label: 'Bestiário' },
  { id: 'sessoes', label: 'Sessões' },
]

function App() {
  const ready = useWorkspaceStore((s) => s.ready)
  const [topTab, setTopTab] = useState<TopTab>('boards')

  useEffect(() => {
    const offChange = window.api.onBoardExternalChange((id) => {
      void useWorkspaceStore.getState().handleExternalChange(id)
    })
    const offInvalid = window.api.onBoardInvalid((id, error) => {
      useWorkspaceStore.getState().handleInvalid(id, error)
    })
    const offDelete = window.api.onBoardExternalDelete((id) => {
      useWorkspaceStore.getState().handleExternalDelete(id)
    })
    const offBestiario = window.api.onBestiarioExternalChange((name) => {
      void useBestiarioStore.getState().handleExternalChange(name)
    })

    void useWorkspaceStore.getState().init()

    const handleBeforeUnload = () => {
      void useBoardStore.getState().flush()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      offChange()
      offInvalid()
      offDelete()
      offBestiario()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
    <div className="app-shell">
      <div className="top-bar">
        <nav className="top-tabs">
          {TOP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`top-tab ${topTab === tab.id ? 'top-tab-active' : ''}`}
              onClick={() => setTopTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <SessionTimer />
      </div>
      <div className={`view ${topTab === 'boards' ? '' : 'view-hidden'}`}>
        <div className="board-area">
          {ready && (
            <ReactFlowProvider>
              <BoardCanvas />
            </ReactFlowProvider>
          )}
        </div>
        <Tabs />
      </div>
      <div className={`view ${topTab === 'bestiario' ? '' : 'view-hidden'}`}>
        <BestiarioView />
      </div>
      {topTab === 'sessoes' && (
        <div className="view">
          <SessoesView onOpenBoard={() => setTopTab('boards')} />
        </div>
      )}
    </div>
  )
}

export default App
