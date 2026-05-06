// Replacement for app-shell.ts in the Tauri/web build.
// Implements IAppShell using Tauri invoke() calls instead of Electron shell APIs.

import * as Path from 'path'
import { invoke } from '@tauri-apps/api/core'

import { Repository } from '../models/repository'
import {
  showItemInFolder,
  showFolderContents,
  openExternal,
  moveItemToTrash,
} from '../ui/main-process-proxy'

export interface IAppShell {
  readonly moveItemToTrash: (path: string) => Promise<void>
  readonly beep: () => void
  readonly openExternal: (path: string) => Promise<boolean>
  readonly openPath: (path: string) => Promise<string>
  readonly showItemInFolder: (path: string) => void
  readonly showFolderContents: (path: string) => void
}

export const shell: IAppShell = {
  moveItemToTrash,
  beep: () => { /* no Tauri equivalent in POC */ },
  openExternal,
  openPath: (path: string) =>
    invoke<boolean>('open_external', { path }).then(() => ''),
  showItemInFolder,
  showFolderContents,
}

export function revealInFileManager(repository: Repository, path: string) {
  const fullyQualifiedFilePath = Path.join(repository.path, path)
  return shell.showItemInFolder(fullyQualifiedFilePath)
}
