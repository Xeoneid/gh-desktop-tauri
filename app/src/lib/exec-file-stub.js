// Stub for exec-file.ts in the Tauri/web build.
// child_process is not available in a web context so execFile always rejects.
module.exports = {
  execFile: () =>
    Promise.reject(
      new Error('[tauri-poc] exec-file: child_process not available in web context')
    ),
}
