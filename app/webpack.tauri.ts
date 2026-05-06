import * as path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack from 'webpack'
import { getReplacements } from './app-info'

// Read the target triple set by cargo-tauri, or default to Windows.
const triple = process.env.TAURI_TARGET_TRIPLE ?? 'x86_64-pc-windows-msvc'
const __WIN32__ = triple.includes('windows')
const __DARWIN__ = triple.includes('apple')
const __LINUX__ = !__WIN32__ && !__DARWIN__

const replacements = getReplacements()

const config: webpack.Configuration = {
  mode: 'development',
  devtool: 'source-map',
  entry: { renderer: path.resolve(__dirname, 'src/ui/index') },

  // 'web' target: removes Electron-specific globals and enables browser polyfills
  target: 'web',

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '..', 'out'),
    library: { name: '[name]', type: 'var' },
    publicPath: '/',
  },

  module: {
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
      {
        test: /\.(jpe?g|png|gif|ico)$/,
        type: 'asset/resource',
      },
      // Stub out native Node addons — they cannot run in a web context
      {
        test: /\.node$/,
        use: 'null-loader',
      },
      // Stub entire native-addon packages
      {
        test: /node_modules[\\/](registry-js|desktop-notifications|keytar|desktop-trampoline|dugite|dugite-extra)[\\/]/,
        use: 'null-loader',
      },
      {
        test: /\.cmd$/,
        type: 'asset/resource',
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.ts', '.tsx'],

    // Redirect Electron/Node-specific modules to Tauri-compatible shims.
    // Relative aliases cover all the different import depths in the codebase.
    alias: {
      // ipc-renderer → Tauri IPC shim
      '../../lib/ipc-renderer': path.resolve(__dirname, 'src/lib/tauri-ipc-shim'),
      '../lib/ipc-renderer': path.resolve(__dirname, 'src/lib/tauri-ipc-shim'),
      './ipc-renderer': path.resolve(__dirname, 'src/lib/tauri-ipc-shim'),
      'ipc-renderer': path.resolve(__dirname, 'src/lib/tauri-ipc-shim'),

      // app-shell imports `shell` from electron
      '../lib/app-shell': path.resolve(__dirname, 'src/lib/tauri-app-shell-shim'),
      '../../lib/app-shell': path.resolve(__dirname, 'src/lib/tauri-app-shell-shim'),

      // token-store imports keytar
      '../lib/stores/token-store': path.resolve(__dirname, 'src/lib/tauri-token-store-shim'),
      '../../lib/stores/token-store': path.resolve(__dirname, 'src/lib/tauri-token-store-shim'),
      '../stores/token-store': path.resolve(__dirname, 'src/lib/tauri-token-store-shim'),

      // Replace the entire electron module with our shim
      'electron': path.resolve(__dirname, 'src/lib/tauri-electron-shim'),
    },

    // Don't prefer browser-field overrides in package.json;
    // our fallbacks handle the browser-specific polyfills explicitly.
    aliasFields: [],

    fallback: {
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      buffer: require.resolve('buffer/'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      fs: false,
      net: false,
      child_process: false,
      vm: false,
      http: false,
      https: false,
      zlib: false,
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'static', 'index.html'),
      chunks: ['renderer'],
    }),

    new webpack.DefinePlugin({
      // Spread base replacements (OAuth keys, version, SHA, etc.)
      ...replacements,
      // Override platform flags for the Tauri target
      __DARWIN__,
      __WIN32__,
      __LINUX__,
      __PROCESS_KIND__: JSON.stringify('ui'),
      'process.platform': JSON.stringify(
        __WIN32__ ? 'win32' : __DARWIN__ ? 'darwin' : 'linux'
      ),
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.TEST_ENV': 'undefined',
    }),

    // Inject browser-compatible process and Buffer shims globally
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),

    // vscode-jsonrpc ships two versions; pin to the Node one for compatibility
    new webpack.NormalModuleReplacementPlugin(/^vscode-jsonrpc$/, resource => {
      resource.request = 'vscode-jsonrpc/lib/node/main.js'
    }),
    new webpack.NormalModuleReplacementPlugin(
      /vscode-jsonrpc[\\/]node(\.js)?$/,
      resource => {
        resource.request = 'vscode-jsonrpc/lib/node/main.js'
      }
    ),
  ],
}

// eslint-disable-next-line no-restricted-syntax
export default config
