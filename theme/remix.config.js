/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  appDirectory: 'app',
  ignoredRouteFiles: ['**/.*'],
  watchPaths: ['./public', './.env'],
  server: './server.ts',
  /**
   * The following settings are required to deploy Hydrogen apps to Oxygen:
   */
  // stream polyfill has been added to handle a dependency issue with @sanity/styled-components
  resolveAlias: {
    'styled-components': '@sanity/styled-components',
    stream: 'stream-browserify',
  },
  publicPath: (process.env.HYDROGEN_ASSET_BASE_URL ?? '/') + 'build/',
  assetsBuildDirectory: 'dist/client/build',
  serverBuildPath: 'dist/worker/index.js',
  serverMainFields: ['browser', 'module', 'main'],
  serverConditions: ['worker', 'browser', process.env.NODE_ENV],
  serverDependenciesToBundle: 'all',
  serverModuleFormat: 'esm',
  serverPlatform: 'neutral',
  serverMinify: process.env.NODE_ENV === 'production',
  // Add esbuild plugins to handle Node.js built-ins
  serverNodeBuiltinsPolyfill: {
    modules: {
      stream: true,
    },
  },
  future: {
    v2_errorBoundary: true,
    v2_dev: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
    v2_headers: true,
    unstable_cssModules: true,
    unstable_cssSideEffectImports: true,
  },
  postcss: true,
  tailwind: true,
};
