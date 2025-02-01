// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const configWithReanimated = wrapWithReanimatedMetroConfig(config);
const resultConfig = withNativeWind(configWithReanimated, {
  input: './core/styles/global.css',
});

module.exports = resultConfig;
