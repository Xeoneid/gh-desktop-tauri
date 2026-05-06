// POC stub replacing keytar/token-store.ts.
// Uses localStorage as the backing store (insecure — dev only).
// For production: use tauri-plugin-stronghold or a Rust command
// wrapping the OS credential store.

function makeKey(key: string, login: string) {
  return `__ghd_token__${key}__${login}`
}

function setItem(key: string, login: string, value: string): Promise<void> {
  localStorage.setItem(makeKey(key, login), value)
  return Promise.resolve()
}

function getItem(key: string, login: string): Promise<string | null> {
  return Promise.resolve(localStorage.getItem(makeKey(key, login)))
}

function deleteItem(key: string, login: string): Promise<boolean> {
  const k = makeKey(key, login)
  const existed = localStorage.getItem(k) !== null
  localStorage.removeItem(k)
  return Promise.resolve(existed)
}

export const TokenStore = { setItem, getItem, deleteItem }
