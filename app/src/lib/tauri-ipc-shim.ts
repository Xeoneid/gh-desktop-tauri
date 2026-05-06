// Drop-in replacement for ipc-renderer.ts when building for Tauri.
// Selected via webpack alias in webpack.tauri.ts.
// Exports identical signatures to ipc-renderer.ts.

import { invoke as tauriInvoke } from '@tauri-apps/api/core'
import { listen, once as tauriOnce } from '@tauri-apps/api/event'
import type { RequestResponseChannels, RequestChannels } from './ipc-shared'

// Fake event type — all call sites use `_` for the event arg
export type IpcRendererEvent = Record<string, never>

// ─── Channel → Tauri command mapping ─────────────────────────────────────────

const INVOKE_MAP: Partial<Record<keyof RequestResponseChannels, string>> = {
  'get-path': 'get_path',
  'get-app-architecture': 'get_app_architecture',
  'get-app-path': 'get_app_path',
  'get-exec-path': 'get_app_path',
  'is-window-focused': 'is_window_focused',
  'is-window-maximized': 'is_window_maximized',
  'get-current-window-state': 'get_current_window_state',
  'open-external': 'open_external',
  'move-to-trash': 'move_to_trash',
  'show-item-in-folder': 'show_item_in_folder',
  'show-open-dialog': 'show_open_dialog',
  'show-save-dialog': 'show_save_dialog',
  'should-use-dark-colors': 'should_use_dark_colors',
}

const SEND_MAP: Partial<Record<keyof RequestChannels, string>> = {
  'minimize-window': 'minimize_window',
  'maximize-window': 'maximize_window',
  'unmaximize-window': 'unmaximize_window',
  'close-window': 'close_window',
  // renderer-ready → show_window triggers window.show() in Rust
  'renderer-ready': 'show_window',
}

// ─── Payload builders ─────────────────────────────────────────────────────────

function invokePayload(channel: keyof RequestResponseChannels, args: any[]): Record<string, any> {
  switch (channel) {
    case 'get-path': return { path: args[0] }
    case 'open-external': return { path: args[0] }
    case 'move-to-trash': return { path: args[0] }
    case 'show-item-in-folder': return { path: args[0] }
    case 'show-open-dialog': return { options: args[0] ?? {} }
    case 'show-save-dialog': return { options: args[0] ?? {} }
    default: return {}
  }
}

// ─── Exported functions (same signatures as ipc-renderer.ts) ─────────────────

export function invoke<T extends keyof RequestResponseChannels>(
  channel: T,
  ...args: Parameters<RequestResponseChannels[T]>
): ReturnType<RequestResponseChannels[T]> {
  const command = INVOKE_MAP[channel]
  if (!command) {
    console.debug(`[tauri-shim] invoke '${channel}' not implemented`)
    return Promise.resolve(undefined) as any
  }
  return tauriInvoke(command, invokePayload(channel, args)) as any
}

export function send<T extends keyof RequestChannels>(
  channel: T,
  ...args: Parameters<RequestChannels[T]>
): void {
  const command = SEND_MAP[channel]
  if (command) {
    tauriInvoke(command, {}).catch(e =>
      console.error(`[tauri-shim] send '${channel}' failed`, e)
    )
    return
  }

  if (channel === 'log') {
    const [level, message] = args as [string, string]
    const fn = (console as any)[level] ?? console.log
    fn(`[renderer] ${message}`)
    return
  }

  console.debug(`[tauri-shim] send '${channel}' is a noop`)
}

export function sendSync<T extends keyof RequestChannels>(
  channel: T,
  ...args: Parameters<RequestChannels[T]>
): void {
  send(channel, ...args)
}

// ─── Event subscriptions (Rust → renderer) ───────────────────────────────────

type AnyListener = (event: IpcRendererEvent, ...args: any[]) => void
const unlisteners = new Map<string, Map<AnyListener, () => void>>()

export function on<T extends keyof RequestChannels>(
  channel: T,
  listener: (event: IpcRendererEvent, ...args: Parameters<RequestChannels[T]>) => void
) {
  listen(channel, tauriEvt => {
    const payload = tauriEvt.payload
    const eventArgs = Array.isArray(payload) ? payload : payload !== undefined ? [payload] : []
    ;(listener as AnyListener)({} as IpcRendererEvent, ...eventArgs)
  }).then(unlisten => {
    if (!unlisteners.has(channel)) unlisteners.set(channel, new Map())
    unlisteners.get(channel)!.set(listener as AnyListener, unlisten)
  }).catch(e => console.error(`[tauri-shim] on '${channel}' failed`, e))
}

export function once<T extends keyof RequestChannels>(
  channel: T,
  listener: (event: IpcRendererEvent, ...args: Parameters<RequestChannels[T]>) => void
) {
  tauriOnce(channel, tauriEvt => {
    const payload = tauriEvt.payload
    const eventArgs = Array.isArray(payload) ? payload : payload !== undefined ? [payload] : []
    ;(listener as AnyListener)({} as IpcRendererEvent, ...eventArgs)
  }).catch(e => console.error(`[tauri-shim] once '${channel}' failed`, e))
}

export function removeListener<T extends keyof RequestChannels>(
  channel: T,
  listener: (event: IpcRendererEvent, ...args: Parameters<RequestChannels[T]>) => void
) {
  const channelMap = unlisteners.get(channel)
  if (channelMap) {
    const unlisten = channelMap.get(listener as AnyListener)
    if (unlisten) {
      unlisten()
      channelMap.delete(listener as AnyListener)
    }
  }
}
