'use strict'
// Stub for dugite in the Tauri/web build. Real git operations won't work
// (no child_process), but top-level imports of GitError enum members must
// resolve to *something* so the module graph loads.

// Proxy that returns a unique symbol for any property access — lets code
// like `DugiteError.HTTPSAuthenticationFailed` evaluate without crashing.
const GitError = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === Symbol.toPrimitive || prop === 'toString') return () => 'GitError'
      return `__GitError_${String(prop)}__`
    },
  }
)

class GitProcess {
  static exec() {
    return Promise.reject(new Error('dugite not available in Tauri web build'))
  }
  static spawn() {
    throw new Error('dugite not available in Tauri web build')
  }
}

class RepositoryDoesNotExistErrorCode {}
class GitNotFoundErrorCode {}

module.exports = {
  GitError,
  GitProcess,
  RepositoryDoesNotExistErrorCode,
  GitNotFoundErrorCode,
  parseError: () => null,
  parseBadConfigValueErrorInfo: () => null,
}
