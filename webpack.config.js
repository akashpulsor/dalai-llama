const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons']
    }
  }, argv);

  // Add polyfills
  if (!config.resolve.fallback) {
    config.resolve.fallback = {};
  }

  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
  };

  config.plugins.push(new BundleAnalyzerPlugin()); // Add the analyzer here

  
 

  return config; // Return the modified configuration
};