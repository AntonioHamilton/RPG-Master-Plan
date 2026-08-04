import { contextBridge, ipcRenderer } from 'electron'
import type { MasterPlanAPI } from '../shared/types/api.js'
import type { Board, WorkspaceFile } from '../shared/types/board.js'
import type { ConteudoCustom, Ficha } from '../shared/types/bestiario.js'

const api: MasterPlanAPI = {
  loadSalvos: () => ipcRenderer.invoke('bestiario:load', 'salvos'),
  saveSalvos: (lista: Ficha[]) => ipcRenderer.invoke('bestiario:save', 'salvos', lista),
  loadConteudo: () => ipcRenderer.invoke('bestiario:load', 'conteudo'),
  saveConteudo: (conteudo: ConteudoCustom) => ipcRenderer.invoke('bestiario:save', 'conteudo', conteudo),
  onBestiarioExternalChange(cb: (name: string) => void) {
    const listener = (_: unknown, name: string) => cb(name)
    ipcRenderer.on('bestiario:external-change', listener)
    return () => ipcRenderer.removeListener('bestiario:external-change', listener)
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  chooseDataDir: () => ipcRenderer.invoke('settings:choose-data-dir'),
  listBoards: () => ipcRenderer.invoke('boards:list'),
  readBoard: (id: string) => ipcRenderer.invoke('board:read', id),
  writeBoard: (board: Board) => ipcRenderer.invoke('board:write', board),
  createBoard: (name: string) => ipcRenderer.invoke('board:create', name),
  renameBoard: (id: string, name: string) => ipcRenderer.invoke('board:rename', id, name),
  deleteBoard: (id: string) => ipcRenderer.invoke('board:delete', id),
  getWorkspace: () => ipcRenderer.invoke('workspace:get'),
  setWorkspace: (ws: WorkspaceFile) => ipcRenderer.invoke('workspace:set', ws),
  onBoardExternalChange(cb: (id: string) => void) {
    const listener = (_: unknown, id: string) => cb(id)
    ipcRenderer.on('board:external-change', listener)
    return () => ipcRenderer.removeListener('board:external-change', listener)
  },
  onBoardInvalid(cb: (id: string, error: string) => void) {
    const listener = (_: unknown, id: string, error: string) => cb(id, error)
    ipcRenderer.on('board:invalid', listener)
    return () => ipcRenderer.removeListener('board:invalid', listener)
  },
  onBoardExternalDelete(cb: (id: string) => void) {
    const listener = (_: unknown, id: string) => cb(id)
    ipcRenderer.on('board:external-delete', listener)
    return () => ipcRenderer.removeListener('board:external-delete', listener)
  },
}

contextBridge.exposeInMainWorld('api', api)
