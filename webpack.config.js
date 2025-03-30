const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@react-navigation/native',
          '@react-navigation/native-stack',
          'react-native-chart-kit',
          'react-native-svg',
        ],
      },
    },
    argv
  );

  // Use a compatible hash function
  config.output.hashFunction = 'xxhash64';
  
  // Add Node.js polyfills
  if (!config.resolve.fallback) {
    config.resolve.fallback = {};
  }
  
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    path: require.resolve('path-browserify'),
    util: require.resolve('util/'),
    process: require.resolve('process/browser'),
    fs: false,
    os: false,
  };
  
  // Add plugins to provide polyfills
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );
  
  // Fix for CachedInputFileSystem errors
  config.infrastructureLogging = {
    level: 'error',
  };
  
  // Optimize for production
  if (env.mode === 'production') {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'all',
        minSize: 30000,
        maxSize: 0,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: '~',
        name: false,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };
  }
  
  // Fix for LoaderRunner errors
  config.module.rules.forEach(rule => {
    if (rule.oneOf) {
      rule.oneOf.forEach(oneOfRule => {
        if (oneOfRule.loader && oneOfRule.loader.includes('babel-loader')) {
          oneOfRule.options = {
            ...oneOfRule.options,
            cacheDirectory: false,
            compact: false,
          };
        }
      });
    }
  });
  
  return config;
};
