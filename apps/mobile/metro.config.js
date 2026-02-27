// Metro configuration for Expo
// Ensures packages with conditional "exports" (like @firebase/auth) resolve the
// React Native entrypoints, preventing runtime errors like:
// "Component auth has not been registered yet".

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prefer the react-native condition when resolving package.json "exports".
// Metro's defaults can omit this, causing web builds of some packages to load.
config.resolver = config.resolver || {};
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'import',
  'default',
];

module.exports = config;
