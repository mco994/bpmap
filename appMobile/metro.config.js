const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const previous = config.resolver.blockList;
const inherited = Array.isArray(previous) ? previous : previous ? [previous] : [];
config.resolver.blockList = [...inherited, /web[\\/]\.next[\\/]/];

module.exports = config;
