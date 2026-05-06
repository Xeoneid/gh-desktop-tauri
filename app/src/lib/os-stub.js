'use strict'
// Browser-compatible os stub for the Tauri build.
// os-browserify's release() returns the user-agent string, which compare-versions
// cannot parse as semver. This stub extracts a real version from the UA.

function release() {
  if (typeof navigator === 'undefined') return '10.0.0'
  const ua = navigator.userAgent
  // Windows NT 10.0 → "10.0.0"
  const win = ua.match(/Windows NT (\d+\.\d+)/)
  if (win) return win[1] + '.0'
  // macOS: "Mac OS X 10_15_7" or "Mac OS X 10.15.7"
  const mac = ua.match(/Mac OS X (\d+[_.]\d+(?:[_.]\d+)?)/)
  if (mac) return mac[1].replace(/_/g, '.')
  // Linux: no reliable version in UA; return a placeholder
  return '5.0.0'
}

function type() {
  if (typeof navigator === 'undefined') return 'Windows_NT'
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'Windows_NT'
  if (ua.includes('Mac')) return 'Darwin'
  return 'Linux'
}

module.exports = {
  release,
  type,
  platform: () => type() === 'Windows_NT' ? 'win32' : type() === 'Darwin' ? 'darwin' : 'linux',
  arch: () => 'x64',
  homedir: () => '/',
  tmpdir: () => '/tmp',
  hostname: () => 'desktop',
  EOL: '\r\n',
  cpus: () => [],
  networkInterfaces: () => ({}),
  totalmem: () => 8 * 1024 * 1024 * 1024,
  freemem: () => 4 * 1024 * 1024 * 1024,
  userInfo: () => ({ username: 'user', homedir: '/', shell: null, uid: -1, gid: -1 }),
  loadavg: () => [0, 0, 0],
  uptime: () => 0,
}
