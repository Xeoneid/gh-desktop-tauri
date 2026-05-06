// Minimal net stub for the Tauri/web build.
// TrampolineServer (git credential helper) uses net.createServer() at load time.
// This stub allows the module to load; the server never actually binds.
'use strict'

function makeServer() {
  const callbacks = {}
  const srv = {
    listen: (_port, _host, cb) => { if (typeof cb === 'function') cb(); return srv },
    close: (cb) => { if (typeof cb === 'function') cb(); return srv },
    address: () => ({ port: 0, address: '127.0.0.1', family: 'IPv4' }),
    on: (event, fn) => { callbacks[event] = fn; return srv },
    once: (_ev, _fn) => srv,
    emit: (_ev, ..._a) => srv,
    unref: () => srv,
  }
  return srv
}

class Socket {
  constructor() {}
  on() { return this }
  once() { return this }
  write() { return this }
  end() { return this }
  destroy() {}
}

module.exports = {
  createServer: (_handler) => makeServer(),
  Socket,
  connect: (_port, _host, _cb) => new Socket(),
  isIP: (_s) => 0,
  isIPv4: (_s) => false,
  isIPv6: (_s) => false,
}
