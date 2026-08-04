import fs from 'node:fs'
import path from 'node:path'
import type { AppSettings, Board, BoardSummary, WorkspaceFile } from '../shared/types/board.js'
import { uniqueSlug } from '../shared/lib/slug.js'

export const DEFAULT_DATA_DIR = 'C:\\development\\RPGMasterPlan'

export function sessionsDirOf(dataDir: string) {
  return path.join(dataDir, 'sessions')
}

export function bestiarioDirOf(dataDir: string) {
  return path.join(dataDir, 'bestiario')
}

export function ensureDataDirs(dataDir: string) {
  fs.mkdirSync(sessionsDirOf(dataDir), { recursive: true })
  fs.mkdirSync(bestiarioDirOf(dataDir), { recursive: true })
}

export type ReadBoardResult = { ok: true; board: Board } | { ok: false; error: string }

function writeFileAtomic(filePath: string, content: string, onWrite?: (filename: string) => void) {
  const tmpPath = `${filePath}.tmp`
  fs.writeFileSync(tmpPath, content, 'utf-8')
  onWrite?.(path.basename(filePath))
  fs.renameSync(tmpPath, filePath)
}

export function loadSettings(settingsPath: string): AppSettings {
  if (!fs.existsSync(settingsPath)) {
    const defaults: AppSettings = { dataDir: DEFAULT_DATA_DIR }
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true })
    writeFileAtomic(settingsPath, JSON.stringify(defaults, null, 2))
    return defaults
  }
  const raw = fs.readFileSync(settingsPath, 'utf-8')
  return JSON.parse(raw) as AppSettings
}

export function saveSettings(settingsPath: string, settings: AppSettings) {
  writeFileAtomic(settingsPath, JSON.stringify(settings, null, 2))
}

function boardFilePath(dataDir: string, id: string) {
  return path.join(dataDir, `${id}.board.json`)
}

export function listBoardIds(dataDir: string): string[] {
  if (!fs.existsSync(dataDir)) return []
  return fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith('.board.json'))
    .map((f) => f.replace(/\.board\.json$/, ''))
}

export function listBoards(dataDir: string): BoardSummary[] {
  return listBoardIds(dataDir).map((id) => {
    try {
      const board = JSON.parse(fs.readFileSync(boardFilePath(dataDir, id), 'utf-8')) as Board
      return { id, name: board.name ?? id }
    } catch {
      return { id, name: id }
    }
  })
}

export function readBoard(dataDir: string, id: string): ReadBoardResult {
  const filePath = boardFilePath(dataDir, id)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const board = JSON.parse(raw) as Board
    return { ok: true, board }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function writeBoard(dataDir: string, board: Board, onWrite?: (filename: string) => void) {
  writeFileAtomic(boardFilePath(dataDir, board.id), JSON.stringify(board, null, 2), onWrite)
}

export function createBoard(dataDir: string, name: string, onWrite?: (filename: string) => void): Board {
  const id = uniqueSlug(name, listBoardIds(dataDir))
  const board: Board = { id, name, nodes: [], edges: [] }
  writeBoard(dataDir, board, onWrite)
  return board
}

export function renameBoard(dataDir: string, id: string, name: string, onWrite?: (filename: string) => void): Board {
  const result = readBoard(dataDir, id)
  if (!result.ok) throw new Error(result.error)
  const board: Board = { ...result.board, name }
  writeBoard(dataDir, board, onWrite)
  return board
}

export function deleteBoard(dataDir: string, id: string) {
  const filePath = boardFilePath(dataDir, id)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

export type BestiarioFile = 'salvos' | 'conteudo'

export function readBestiarioFile(bestiarioDir: string, name: BestiarioFile): unknown {
  try {
    return JSON.parse(fs.readFileSync(path.join(bestiarioDir, `${name}.json`), 'utf-8'))
  } catch {
    return null
  }
}

export function writeBestiarioFile(
  bestiarioDir: string,
  name: BestiarioFile,
  value: unknown,
  onWrite?: (filename: string) => void,
) {
  fs.mkdirSync(bestiarioDir, { recursive: true })
  writeFileAtomic(path.join(bestiarioDir, `${name}.json`), JSON.stringify(value, null, 2), onWrite)
}

function workspacePath(dataDir: string) {
  return path.join(dataDir, 'workspace.json')
}

export function loadWorkspace(dataDir: string): WorkspaceFile {
  const filePath = workspacePath(dataDir)
  if (!fs.existsSync(filePath)) {
    return { tabOrder: listBoardIds(dataDir) }
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as WorkspaceFile
  } catch {
    return { tabOrder: listBoardIds(dataDir) }
  }
}

export function saveWorkspace(dataDir: string, workspace: WorkspaceFile, onWrite?: (filename: string) => void) {
  writeFileAtomic(workspacePath(dataDir), JSON.stringify(workspace, null, 2), onWrite)
}
