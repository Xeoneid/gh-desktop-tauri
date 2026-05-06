'use strict'
// CommonJS webpack config for the Tauri build — no ts-node required.
// Mirrors webpack.tauri.ts but with hardcoded POC values for replacements.

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

// Resolve loader paths absolutely so webpack finds them in app/node_modules
// even when the config is invoked from the project root.
const NULL_LOADER = require.resolve('null-loader')

// ─── Platform / Build defines ─────────────────────────────────────────────────
const triple = process.env.TAURI_TARGET_TRIPLE || 'x86_64-pc-windows-msvc'
const WIN32  = triple.includes('windows')
const DARWIN = triple.includes('apple')
const LINUX  = !WIN32 && !DARWIN

const DEV_CLIENT_ID     = '3a723b10ac5575cc5bb9'
const DEV_CLIENT_SECRET = '22c34d87789a365981ed921352a7b9a8c3f69d54'

const defines = {
  __OAUTH_CLIENT_ID__:  JSON.stringify(process.env.DESKTOP_OAUTH_CLIENT_ID || DEV_CLIENT_ID),
  __OAUTH_SECRET__:     JSON.stringify(process.env.DESKTOP_OAUTH_CLIENT_SECRET || DEV_CLIENT_SECRET),
  __DARWIN__:           DARWIN,
  __WIN32__:            WIN32,
  __LINUX__:            LINUX,
  __APP_NAME__:         JSON.stringify('GitHub Desktop'),
  __APP_VERSION__:      JSON.stringify('3.5.9-beta2'),
  __DEV__:              true,
  __DEV_SECRETS__:      true,
  __RELEASE_CHANNEL__:  JSON.stringify('development'),
  __UPDATES_URL__:      JSON.stringify(''),
  __SHA__:              JSON.stringify('development'),
  __PROCESS_KIND__:     JSON.stringify('ui'),
  'process.platform':     JSON.stringify(WIN32 ? 'win32' : DARWIN ? 'darwin' : 'linux'),
  'process.env.NODE_ENV': JSON.stringify('development'),
  'process.env.TEST_ENV': 'undefined',
}

// Packages whose native addons / child_process usage are stubbed out.
// git/* files fail at runtime (not build time) when called — acceptable for POC.
const NULL_LOADED_PACKAGES =
  // registry-js is replaced with a proper stub (see resolve.alias below)
  'keytar|desktop-trampoline|' +
  'byline|fs-admin|process-proxy|' +
  // execa uses process.binding('uv') at load time; app-path depends on it.
  // Both are only used by editors/darwin.ts (macOS path detection) which
  // won't run on Windows anyway.
  'execa|app-path|cross-spawn|which|shebang-command|shebang-regex|get-stream'

const SHIM = f => path.resolve(__dirname, `src/lib/${f}`)

/** @type {webpack.Configuration} */
const config = {
  mode: 'development',
  devtool: 'source-map',
  entry: { renderer: path.resolve(__dirname, 'src/ui/index') },
  target: 'web',

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '..', 'out'),
    library: { name: '[name]', type: 'var' },
    publicPath: '/',
  },

  module: {
    parser: {
      javascript: {
        // Downgrade "named export not found" from error to warning.
        // This suppresses the flood of errors from git/* files that import
        // named exports from null-loaded dugite.
        exportsPresence: 'warn',
      },
    },
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.tauri.json'),
              transpileOnly: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|css)$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { sourceMap: true } },
          { loader: 'sass-loader', options: { sourceMap: true } },
        ],
      },
      { test: /\.(jpe?g|png|gif|ico)$/, type: 'asset/resource' },
      // Treat all node_modules JS as auto (handles CJS/ESM ambiguity in Deno's layout)
      {
        test: /\.(?:js|mjs|cjs)$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      // Stub native Node addons — cannot run in a web/Tauri context
      { test: /\.node$/, use: NULL_LOADER },
      {
        // Stub native-addon packages and packages that spawn child_process
        test: new RegExp(`node_modules[\\\\/](${NULL_LOADED_PACKAGES})[\\\\/]`),
        use: NULL_LOADER,
      },
      {
        // Stub vendor modules that depend on native Node APIs
        test: /[\\/]vendor[\\/](desktop-trampoline|windows-argv-parser)[\\/]/,
        use: NULL_LOADER,
      },
      {
        // Stub problematic third-party packages: copilot-sdk uses `module` built-in,
        // react-confetti has ESM/CJS compat issues in Deno's layout.
        // These features are optional and won't work in a Tauri web context.
        test: /node_modules[\\/](@github[\\/]copilot-sdk|react-confetti)[\\/]/,
        use: NULL_LOADER,
      },
      { test: /\.cmd$/, type: 'asset/resource' },
    ],
  },

  resolve: {
    extensions: ['.js', '.ts', '.tsx'],

    alias: {
      // ipc-renderer → Tauri IPC shim (relative-path aliases for all import depths)
      '../../lib/ipc-renderer': SHIM('tauri-ipc-shim'),
      '../lib/ipc-renderer':    SHIM('tauri-ipc-shim'),
      './ipc-renderer':         SHIM('tauri-ipc-shim'),

      // app-shell imports `shell` from electron
      '../lib/app-shell':    SHIM('tauri-app-shell-shim'),
      '../../lib/app-shell': SHIM('tauri-app-shell-shim'),

      // token-store imports keytar (also covered by NormalModuleReplacementPlugin below)
      '../lib/stores/token-store':    SHIM('tauri-token-store-shim'),
      '../../lib/stores/token-store': SHIM('tauri-token-store-shim'),
      '../stores/token-store':        SHIM('tauri-token-store-shim'),
      './token-store':                SHIM('tauri-token-store-shim'),

      // Replace the entire electron module
      'electron': SHIM('tauri-electron-shim'),

      // desktop-notifications: vendor package whose dist/ hasn't been compiled
      'desktop-notifications': SHIM('empty-stub.js'),

      // registry-js: provide HKEY constants so win32.ts top-level code doesn't crash
      'registry-js': SHIM('registry-js-stub.js'),

      // dugite: stub GitError as a Proxy so top-level enum reads don't crash
      'dugite': SHIM('dugite-stub.js'),
      'dugite-extra': SHIM('dugite-stub.js'),

      // @floating-ui/core is a peer dep of @floating-ui/react-dom installed
      // only in Deno's .deno/ subdirectory, not hoisted to a flat symlink.
      // Point webpack directly to the versioned location.
      '@floating-ui/core': path.resolve(
        __dirname,
        'node_modules/.deno/@floating-ui+core@1.7.5/node_modules/@floating-ui/core'
      ),

      // node: prefixed built-ins — handled via alias since fallback may not catch them
      'node:path':   SHIM('path-stub.js'),
      'node:os':     SHIM('os-stub.js'),
      'node:buffer': require.resolve('buffer/'),
      'node:stream': require.resolve('stream-browserify'),
      'node:crypto': require.resolve('crypto-browserify'),
    },

    // Don't prefer browser-field overrides; our fallbacks handle this explicitly.
    aliasFields: [],

    fallback: {
      // path: wrap path-browserify with a real path.win32 sub-module so
      // editors/win32.ts can call path.win32.join() at load time without crashing.
      path:          SHIM('path-stub.js'),
      // os: use our stub instead of os-browserify so release() returns
      // a real semver-parseable version string, not the UA string.
      os:            SHIM('os-stub.js'),
      buffer:        require.resolve('buffer/'),
      stream:        require.resolve('stream-browserify'),
      crypto:        require.resolve('crypto-browserify'),
      fs:            false,
      // net: provide a no-op stub so modules that call net.createServer()
      // at load time (e.g. trampoline-server.ts) don't crash on import.
      net:           SHIM('net-stub.js'),
      child_process: false,
      vm:            false,
      http:          false,
      https:         false,
      zlib:          false,
      assert:        false,
      util:          SHIM('util-stub.js'),
      // url: provide pathToFileURL / fileURLToPath used at load time in path.ts
      url:           SHIM('url-stub.js'),
      querystring:   false,
      events:        false,
      // node: prefixed — these map via alias above; fallback as safety net
      'node:child_process': false,
      'node:fs':            false,
      'node:fs/promises':   false,
      'node:net':           false,
      'node:http':          false,
      'node:https':         false,
      'node:vm':            false,
      'node:util':          SHIM('util-stub.js'),
      'node:url':           false,
      'node:assert':        false,
      'node:zlib':          false,
      'node:events':        false,
      'node:module':        false,
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'static', 'index.html'),
      chunks: ['renderer'],
    }),

    new webpack.DefinePlugin(defines),

    // Inject browser-compatible Buffer and process shims globally.
    // Use absolute paths so webpack can resolve them from any nested
    // context (e.g. packages inside Deno's node_modules/.deno/ subdirs).
    new webpack.ProvidePlugin({
      Buffer:  ['buffer', 'Buffer'],
      process: require.resolve('process/browser'),
    }),

    // Rewrite `node:foo` imports to plain `foo` so resolve.fallback handles them.
    // Packages from Deno's node_modules commonly use the node: protocol prefix.
    new webpack.NormalModuleReplacementPlugin(/^node:(.+)$/, resource => {
      resource.request = resource.request.slice(5) // 'node:path' → 'path'
    }),

    // vscode-jsonrpc ships two versions; pin to the Node one for compatibility
    new webpack.NormalModuleReplacementPlugin(/^vscode-jsonrpc$/, resource => {
      resource.request = 'vscode-jsonrpc/lib/node/main.js'
    }),
    new webpack.NormalModuleReplacementPlugin(
      /vscode-jsonrpc[\\/]node(\.js)?$/,
      resource => { resource.request = 'vscode-jsonrpc/lib/node/main.js' }
    ),

    // Replace token-store regardless of import depth or directory.
    // Catches: './token-store', '../stores/token-store', '../lib/stores/token-store'
    new webpack.NormalModuleReplacementPlugin(
      /token-store$/,
      resource => {
        // Avoid replacing the shim itself (would cause infinite loop)
        if (!resource.request.includes('tauri-token-store-shim')) {
          resource.request = SHIM('tauri-token-store-shim')
        }
      }
    ),

    // Replace ipc-renderer by resolved path (fallback for the alias)
    new webpack.NormalModuleReplacementPlugin(
      /[/\\]ipc-renderer$/,
      SHIM('tauri-ipc-shim')
    ),

    // Replace app-shell by resolved path
    new webpack.NormalModuleReplacementPlugin(
      /[/\\]app-shell$/,
      SHIM('tauri-app-shell-shim')
    ),

    // editors module: registry/fs-based editor detection won't work in web context.
    // Match any import that resolves to an editors file, regardless of import depth.
    // Covers: '../editors', '../../lib/editors', './editors/index', './win32', etc.
    new webpack.NormalModuleReplacementPlugin(
      /editors/,
      resource => {
        // Guard: don't replace the stub itself or unrelated modules with "editors" in the path
        if (
          !resource.request.includes('editors-stub') &&
          !resource.request.includes('node_modules') &&
          // Only intercept app source imports and relative imports from the editors dir
          (resource.request.match(/\/editors/) ||
           (resource.context || '').replace(/\\/g, '/').includes('/editors'))
        ) {
          resource.request = SHIM('editors-stub.js')
        }
      }
    ),

    // exec-file.ts calls promisify(execFileOrig) at load time — both util and
    // child_process are stubbed as empty, causing a crash before React mounts.
    // Replace with a stub that safely exports a rejecting async function.
    new webpack.NormalModuleReplacementPlugin(
      /[/\\]exec-file$/,
      SHIM('exec-file-stub.js')
    ),
  ],

  ignoreWarnings: [
    { module: /dugite/ },
    { module: /trampoline/ },
    { message: /Critical dependency/ },
    // Suppress "export not found" warnings from null-loaded packages
    { message: /export .* was not found in/ },
  ],
}

module.exports = config
