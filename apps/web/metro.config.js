const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Enables Symlinks (pnpm standard)
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// 2. Watches the root
config.watchFolders = [workspaceRoot];

// 3. Forces Singleton Resolution(The Robust Way)
config.resolver.resolveRequest = (context, moduleName, platform) => {
    const monorepoPackages = [
    'react',
    'react-dom',
    'react-native',
    'react-native-web',
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

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });