import type { AppSettings, Board, BoardSummary, WorkspaceFile } from './board.js'
import type { ConteudoCustom, Ficha } from './bestiario.js'

export type ReadBoardResult = { ok: true; board: Board } | { ok: false; error: string }

export interface MasterPlanAPI {
  loadSalvos(): Promise<Ficha[] | null>
  saveSalvos(lista: Ficha[]): Promise<void>
  loadConteudo(): Promise<ConteudoCustom | null>
  saveConteudo(conteudo: ConteudoCustom): Promise<void>
  onBestiarioExternalChange(cb: (name: string) => void): () => void
  getSettings(): Promise<AppSettings>
  chooseDataDir(): Promise<string | null>
  listBoards(): Promise<BoardSummary[]>
  readBoard(id: string): Promise<ReadBoardResult>
  writeBoard(board: Board): Promise<void>
  createBoard(name: string): Promise<Board>
  renameBoard(id: string, name: string): Promise<Board>
  deleteBoard(id: string): Promise<void>
  getWorkspace(): Promise<WorkspaceFile>
  setWorkspace(ws: WorkspaceFile): Promise<void>
  onBoardExternalChange(cb: (id: string) => void): () => void
  onBoardInvalid(cb: (id: string, error: string) => void): () => void
  onBoardExternalDelete(cb: (id: string) => void): () => void
}
