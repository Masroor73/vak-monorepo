const { getDefaultConfig } = require("expo/metro-config");const { withNativeWind } = require("nativewind/metro");const path = require("path");
const projectRoot = __dirname;const workspaceRoot = path.resolve(projectRoot, "../..");
// 1. Get default configconst 
config = getDefaultConfig(projectRoot);
// 2. Configure Monorepo Watch Folders
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;
// 3. Configure SVG Transformer (Critical Step)
const { transformer, resolver } = config;

config.transformer = {
  ...transformer,  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};
config.resolver = {
  ...resolver,  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
};

// 4. Wrap with NativeWind
module.exports = withNativeWind(config, { input: "./global.css" });
 