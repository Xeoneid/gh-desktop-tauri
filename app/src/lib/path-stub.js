'use strict'
// Wraps path-browserify and adds a real path.win32 sub-module.
// path-browserify is POSIX-only; path.win32 is null, which crashes
// editors/win32.ts:69 (registryKey calls path.win32.join at load time).

const posix = require('path-browserify')

function winJoin(...args) {
  return args
    .filter(p => p != null && p !== '')
    .join('\\')
    .replace(/\//g, '\\')
    .replace(/\\{2,}/g, '\\')
}

function winNormalize(p) {
  return String(p).replace(/\//g, '\\').replace(/\\{2,}/g, '\\') || '.'
}

function winBasename(p, ext) {
  const base = String(p).replace(/\\/g, '/').split('/').pop() || ''
  if (ext && base.endsWith(ext)) return base.slice(0, -ext.length)
  return base
}

function winDirname(p) {
  const parts = String(p).replace(/\\/g, '/').split('/')
  parts.pop()
  return parts.join('\\') || '\\'
}

function winExtname(p) {
  const base = String(p).split(/[/\\]/).pop() || ''
  const idx = base.lastIndexOf('.')
  return idx > 0 ? base.slice(idx) : ''
}

function winIsAbsolute(p) {
  return /^([a-zA-Z]:[\\/]|\\\\)/.test(String(p))
}

function winResolve(...args) {
  return args.filter(Boolean).join('\\').replace(/\//g, '\\')
}

function winParse(p) {
  const str = String(p).replace(/\//g, '\\')
  const root = /^[a-zA-Z]:\\/.test(str) ? str.slice(0, 3) : ''
  const base = str.split('\\').pop() || ''
  const ext = base.includes('.') ? '.' + base.split('.').pop() : ''
  const name = ext ? base.slice(0, -ext.length) : base
  const dir = str.length > root.length + base.length ? str.slice(0, -(base.length + 1)) : root
  return { root, dir, base, ext, name }
}

function winFormat(obj) {
  const dir = obj.dir || obj.root || ''
  const base = obj.base || ((obj.name || '') + (obj.ext || ''))
  return dir ? dir + '\\' + base : base
}

const win32 = {
  sep: '\\',
  delimiter: ';',
  join: winJoin,
  resolve: winResolve,
  normalize: winNormalize,
  basename: winBasename,
  dirname: winDirname,
  extname: winExtname,
  isAbsolute: winIsAbsolute,
  relative: posix.relative,
  parse: winParse,
  format: winFormat,
}

module.exports = Object.assign({}, posix, { win32, posix })
