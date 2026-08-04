import { app, BrowserWindow, dialog, ipcMain, net, protocol } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import chokidar, { type FSWatcher } from 'chokidar'
import {
  DEFAULT_DATA_DIR,
  sessionsDirOf,
  bestiarioDirOf,
  ensureDataDirs,
  readBestiarioFile,
  writeBestiarioFile,
  type BestiarioFile,
  loadSettings,
  saveSettings,
  listBoards,
  readBoard,
  writeBoard,
  createBoard,
  renameBoard,
  deleteBoard,
  loadWorkspace,
  saveWorkspace,
} from './fs-service.js'
import type { Board, WorkspaceFile } from '../shared/types/board.js'

app.disableHardwareAcceleration()

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app-media',
    privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true, bypassCSP: true },
  },
])

const settingsPath = path.join(app.getPath('userData'), 'settings.json')

let win: BrowserWindow | null = null
let watcher: FSWatcher | null = null
let currentDataDir = ''

const LEGACY_DATA_DIR = 'C:\\development\\Hamilton\\RPG\\masterplan'

function sessionsDir() {
  return sessionsDirOf(currentDataDir)
}

const iconPath = app.isPackaged
  ? path.join(process.resourcesPath, 'icon.png')
  : path.join(__dirname, '../../build/icon.png')

const OWN_WRITE_GRACE_MS = 1500
const ownWrites = new Map<string, number>()

function markOwnWrite(filename: string) {
  ownWrites.set(filename, Date.now())
}

function consumeOwnWrite(filename: string): boolean {
  const t = ownWrites.get(filename)
  if (t === undefined) return false
  ownWrites.delete(filename)
  return Date.now() - t <= OWN_WRITE_GRACE_MS
}

async function resolveDataDir(): Promise<string> {
  const settings = loadSettings(settingsPath)
  let dataDir = settings.dataDir || DEFAULT_DATA_DIR
  if (dataDir === LEGACY_DATA_DIR) dataDir = DEFAULT_DATA_DIR

  while (!fs.existsSync(dataDir)) {
    const choice = await dialog.showMessageBox({
      type: 'question',
      buttons: ['Criar pasta', 'Escolher outra pasta', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
      title: 'Pasta de dados não encontrada',
      message: `A pasta de dados configurada não existe:\n${dataDir}`,
    })

    if (choice.response === 0) {
      fs.mkdirSync(dataDir, { recursive: true })
    } else if (choice.response === 1) {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
      })
      if (!result.canceled && result.filePaths[0]) {
        dataDir = result.filePaths[0]
      }
    } else {
      app.quit()
      throw new Error('Usuário cancelou a seleção da pasta de dados')
    }
  }

  saveSettings(settingsPath, { dataDir })
  ensureDataDirs(dataDir)
  return dataDir
}

function handleBoardFileEvent(filePath: string, event: 'add' | 'change' | 'unlink') {
  const filename = path.basename(filePath)
  if (consumeOwnWrite(filename)) return

  const id = filename.replace(/\.board\.json$/, '')

  if (event === 'unlink') {
    win?.webContents.send('board:external-delete', id)
    return
  }

  const result = readBoard(sessionsDir(), id)
  if (result.ok) {
    win?.webContents.send('board:external-change', id)
  } else {
    win?.webContents.send('board:invalid', id, result.error)
  }
}

function handleBestiarioFileEvent(filePath: string) {
  const filename = path.basename(filePath)
  if (consumeOwnWrite(filename)) return
  win?.webContents.send('bestiario:external-change', filename.replace(/\.json$/, ''))
}

// chokidar v4+ não suporta glob: vigia os diretórios e filtra por nome no handler
function startWatcher(dataDir: string) {
  watcher?.close()
  watcher = chokidar.watch([sessionsDirOf(dataDir), bestiarioDirOf(dataDir)], {
    ignoreInitial: true,
  })

  const dispatch = (event: 'add' | 'change' | 'unlink') => (filePath: string) => {
    const filename = path.basename(filePath)
    if (filename.endsWith('.board.json')) {
      handleBoardFileEvent(filePath, event)
    } else if (filename.endsWith('.json') && path.dirname(filePath) === bestiarioDirOf(dataDir)) {
      handleBestiarioFileEvent(filePath)
    }
  }

  watcher.on('add', dispatch('add'))
  watcher.on('change', dispatch('change'))
  watcher.on('unlink', dispatch('unlink'))
}

function registerIpcHandlers() {
  ipcMain.handle('settings:get', () => loadSettings(settingsPath))

  ipcMain.handle('settings:choose-data-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    })
    if (result.canceled || !result.filePaths[0]) return null
    const dataDir = result.filePaths[0]
    saveSettings(settingsPath, { dataDir })
    ensureDataDirs(dataDir)
    currentDataDir = dataDir
    startWatcher(dataDir)
    return dataDir
  })

  ipcMain.handle('boards:list', () => listBoards(sessionsDir()))

  ipcMain.handle('board:read', (_e, id: string) => readBoard(sessionsDir(), id))

  ipcMain.handle('board:write', (_e, board: Board) => {
    writeBoard(sessionsDir(), board, markOwnWrite)
  })

  ipcMain.handle('board:create', (_e, name: string) => createBoard(sessionsDir(), name, markOwnWrite))

  ipcMain.handle('board:rename', (_e, id: string, name: string) =>
    renameBoard(sessionsDir(), id, name, markOwnWrite),
  )

  ipcMain.handle('board:delete', (_e, id: string) => deleteBoard(sessionsDir(), id))

  ipcMain.handle('workspace:get', () => loadWorkspace(sessionsDir()))

  ipcMain.handle('workspace:set', (_e, ws: WorkspaceFile) => saveWorkspace(sessionsDir(), ws, markOwnWrite))

  ipcMain.handle('bestiario:load', (_e, name: BestiarioFile) =>
    readBestiarioFile(bestiarioDirOf(currentDataDir), name),
  )

  ipcMain.handle('bestiario:save', (_e, name: BestiarioFile, value: unknown) =>
    writeBestiarioFile(bestiarioDirOf(currentDataDir), name, value, markOwnWrite),
  )
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  })

  win.on('ready-to-show', () => {
    win?.show()
  })

  win.webContents.on('console-message', (event) => {
    console.log(`[renderer:${event.level}] ${event.message} (${event.sourceId}:${event.lineNumber})`)
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('[renderer] gone:', details.reason)
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  protocol.handle('app-media', (request) => {
    const filePath = decodeURIComponent(request.url.replace('app-media://local/', ''))
    return net.fetch(pathToFileURL(filePath).toString())
  })

  currentDataDir = await resolveDataDir()
  startWatcher(currentDataDir)
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
