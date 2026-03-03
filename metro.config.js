const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const path = require("path");

const config = getSentryExpoConfig(__dirname);

// Stub out expo-speech-recognition for Expo Go (native module unavailable)
const stubPath = path.resolve(__dirname, "expo-speech-recognition-stub.js");
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver = config.resolver || {};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "expo-speech-recognition") {
    return { type: "sourceFile", filePath: stubPath };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
