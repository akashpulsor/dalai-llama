module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [

      'react-native-paper/babel',
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@components': './component',
          '@screens': './screens',
        },
      }],
      'react-native-reanimated/plugin', // <-- Add this as the LAST plugin
    ],
  };
};
