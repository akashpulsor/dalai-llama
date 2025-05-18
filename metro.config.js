const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable experimental splitChunks for web
config.transformer = {
  ...config.transformer,
  experimentalImportBundleSupport: true,
};
config.serializer = {
  ...config.serializer,
  splitChunks: true,
};

module.exports = config;

// For bundle analysis, see webpack.config.js or use metro-visualizer as described below.
// To analyze bundle size and see which dependencies take up the most space:
// 1. Install metro-visualizer: npm install -D metro-visualizer
// 2. Build your bundle: npx expo export:web (or your build command)
// 3. Run: npx metro-visualizer ./web-build
// This will open a visual breakdown of your JS bundle sizes by dependency.
// For more: https://github.com/kristerkari/metro-visualizer