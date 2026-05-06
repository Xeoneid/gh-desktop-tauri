// Minimal replacement for the `electron` module in the Tauri/web build.
// Only the APIs actually imported in renderer code are implemented.

// clipboard — used in several components
export const clipboard = {
  writeText: (text: string): Promise<void> => navigator.clipboard.writeText(text),
  readText: (): string => '',
}

// webUtils — used in app.tsx to get filesystem path for dropped File objects
export const webUtils = {
  getPathForFile: (file: File): string => {
    // Web File objects don't expose filesystem paths; return the name as fallback.
    return file.name
  },
}

// shell — mostly covered by tauri-app-shell-shim alias; stubs here
// prevent import errors if this module is resolved first.
export const shell = {
  beep: (): void => {},
  openExternal: async (_path: string): Promise<void> => {},
  openPath: async (_path: string): Promise<string> => '',
  showItemInFolder: (_path: string): void => {},
}

// Electron namespace types used in ipc-shared.ts and related files
export namespace Electron {
  export interface OpenDialogOptions {
    title?: string
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
    properties?: string[]
    message?: string
  }
  export interface SaveDialogOptions {
    title?: string
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }
  export type AppleActionOnDoubleClickPref = 'Minimize' | 'Maximize' | 'None'
  export interface Certificate {
    [key: string]: unknown
  }
  export interface IpcRendererEvent {
    [key: string]: unknown
  }
}

// ipcRenderer stub — not used directly (aliased away), but prevents
// compile errors from any remaining `import { ipcRenderer } from 'electron'`
export const ipcRenderer = {
  invoke: async (_channel: string, ..._args: any[]): Promise<any> => undefined,
  send: (_channel: string, ..._args: any[]): void => {},
  sendSync: (_channel: string, ..._args: any[]): any => undefined,
  on: (_channel: string, _listener: any): void => {},
  once: (_channel: string, _listener: any): void => {},
  removeListener: (_channel: string, _listener: any): void => {},
}

// nativeTheme stub
export const nativeTheme = {
  shouldUseDarkColors: false,
  themeSource: 'system' as const,
}

// app stub — used in a few places for version/name info
export const app = {
  getVersion: () => '',
  getName: () => 'GitHub Desktop',
  getLocaleCountryCode: () => '',
}

// IpcRendererEvent type alias for compatibility
export type IpcRendererEvent = Electron.IpcRendererEvent
