'use strict'
// Stub for registry-js in the Tauri/web build.
// Provides the HKEY constants and no-op query functions so that
// editors/win32.ts can load without crashing at the top-level constant
// definitions (line 79+). Registry queries always return empty results.

const HKEY = {
  HKEY_CLASSES_ROOT:   0x80000000,
  HKEY_CURRENT_USER:   0x80000001,
  HKEY_LOCAL_MACHINE:  0x80000002,
  HKEY_USERS:          0x80000003,
  HKEY_CURRENT_CONFIG: 0x80000005,
}

module.exports = {
  HKEY,
  // Named exports used by win32.ts
  HKCU:  HKEY.HKEY_CURRENT_USER,
  HKLM:  HKEY.HKEY_LOCAL_MACHINE,
  HKCR:  HKEY.HKEY_CLASSES_ROOT,
  // Top-level properties some code accesses as registry.HKEY_CURRENT_USER
  HKEY_CLASSES_ROOT:   HKEY.HKEY_CLASSES_ROOT,
  HKEY_CURRENT_USER:   HKEY.HKEY_CURRENT_USER,
  HKEY_LOCAL_MACHINE:  HKEY.HKEY_LOCAL_MACHINE,
  HKEY_USERS:          HKEY.HKEY_USERS,
  HKEY_CURRENT_CONFIG: HKEY.HKEY_CURRENT_CONFIG,
  // Query functions — always return empty (no real registry in web context)
  enumerateValues: (_hkey, _key) => [],
  enumerateSubkeys: (_hkey, _key) => [],
}
