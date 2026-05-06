'use strict'
// Minimal browser stub for Node's `util` module.
// Real util is unavailable in web context; modules call promisify() at
// load time, so we provide a working version that wraps callback-style
// functions. The wrapped function will reject at call time if the
// underlying function is also stubbed out.

function promisify(fn) {
  if (typeof fn !== 'function') {
    return () => Promise.reject(new Error('promisify: target is not a function (likely null-loaded in Tauri build)'))
  }
  return function (...args) {
    return new Promise((resolve, reject) => {
      try {
        fn.call(this, ...args, (err, result) => {
          if (err) reject(err)
          else resolve(result)
        })
      } catch (e) {
        reject(e)
      }
    })
  }
}

function inherits(ctor, superCtor) {
  if (superCtor) {
    ctor.super_ = superCtor
    Object.setPrototypeOf(ctor.prototype, superCtor.prototype)
  }
}

function inspect(obj) {
  try { return JSON.stringify(obj) } catch { return String(obj) }
}

function format(...args) {
  return args.map(a => typeof a === 'string' ? a : inspect(a)).join(' ')
}

const types = {
  isDate: v => v instanceof Date,
  isRegExp: v => v instanceof RegExp,
  isNativeError: v => v instanceof Error,
  isMap: v => v instanceof Map,
  isSet: v => v instanceof Set,
  isPromise: v => v && typeof v.then === 'function',
}

class TextEncoder { encode(s) { return new globalThis.TextEncoder().encode(s) } }
class TextDecoder { constructor(...a) { this._d = new globalThis.TextDecoder(...a) } decode(b) { return this._d.decode(b) } }

module.exports = {
  promisify,
  inherits,
  inspect,
  format,
  types,
  TextEncoder: globalThis.TextEncoder || TextEncoder,
  TextDecoder: globalThis.TextDecoder || TextDecoder,
  debuglog: () => () => {},
  deprecate: (fn) => fn,
  isArray: Array.isArray,
  isBuffer: () => false,
  isFunction: v => typeof v === 'function',
  isObject: v => v !== null && typeof v === 'object',
  isString: v => typeof v === 'string',
  isNumber: v => typeof v === 'number',
  isNull: v => v === null,
  isUndefined: v => v === undefined,
  isNullOrUndefined: v => v == null,
}
