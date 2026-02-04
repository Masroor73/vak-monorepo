const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const monorepoPackages = [
    'react',
    'react-native',
    '@vak/ui',
    '@vak/contract'
  ];

  if (monorepoPackages.includes(moduleName)) {
    try {
      const resolvedPath = require.resolve(moduleName, {
        paths: [workspaceRoot]
      });
      return {
        filePath: resolvedPath,
        type: 'sourceFile',
      };
    } catch (e) {
      return context.resolveRequest(context, moduleName, platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });