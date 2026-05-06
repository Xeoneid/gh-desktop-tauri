// Browser-compatible stub for Node's `url` module.
// Only pathToFileURL / fileURLToPath are needed by the app at load time.

function pathToFileURL(filePath) {
  // Normalize backslashes (Windows) to forward slashes
  const normalized = String(filePath).replace(/\\/g, '/')
  // Windows absolute path: C:/foo → file:///C:/foo
  // POSIX absolute path:  /foo   → file:///foo
  const prefix = /^[a-zA-Z]:/.test(normalized) ? 'file:///' : 'file://'
  return new URL(prefix + normalized)
}

function fileURLToPath(url) {
  const u = typeof url === 'string' ? new URL(url) : url
  const p = decodeURIComponent(u.pathname)
  // Windows: /C:/foo → C:\foo
  return p.replace(/^\/([a-zA-Z]):/, '$1:').replace(/\//g, '\\')
}

module.exports = {
  pathToFileURL,
  fileURLToPath,
  URL: globalThis.URL,
  URLSearchParams: globalThis.URLSearchParams,
  format: (url) => (typeof url === 'string' ? url : url && url.href ? url.href : String(url)),
  resolve: (from, to) => new URL(to, from).href,
}
