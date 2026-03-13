const { withAppDelegate, withMainApplication, withDangerousMod, withInfoPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const HONEYCOMB_API_KEY = '0Qam7rs00Qt5MnULUsY8tA';
const SERVICE_NAME = 'resteeped-react-native';

/**
 * Expo Config Plugin to add Honeycomb native initialization for
 * @honeycombio/opentelemetry-react-native
 */

// iOS: Add import and initialization to AppDelegate.swift
function withHoneycombIOS(config) {
  config = withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    // Add import
    if (!contents.includes('HoneycombOpentelemetryReactNative')) {
      contents = contents.replace(
        'import Expo',
        'import Expo\nimport HoneycombOpentelemetryReactNative'
      );
    }

    // Add initialization at the start of application(didFinishLaunchingWithOptions:)
    if (!contents.includes('HoneycombReactNative.configure')) {
      contents = contents.replace(
        'didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil\n  ) -> Bool {',
        `didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil\n  ) -> Bool {\n    // Honeycomb Frontend Observability\n    let honeycombOptions = HoneycombReactNative.optionsBuilder()\n        .setAPIKey("${HONEYCOMB_API_KEY}")\n        .setServiceName("${SERVICE_NAME}")\n    HoneycombReactNative.configure(honeycombOptions)\n`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

// iOS: Enable use_frameworks! via Podfile.properties.json
// NOTE: Disabled — causes EAS cloud build failures with some Expo pods.
// The Honeycomb SDK docs say this is required, but the JS-side SDK + 
// autolinking may handle it without use_frameworks on Expo.
// If native startup metrics don't appear, re-enable and debug pod conflicts.
function withUseFrameworks(config) {
  // Intentionally no-op for now
  return config;
}

// Android: Add import and initialization to MainApplication.kt
function withHoneycombAndroid(config) {
  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // Add import
    if (!contents.includes('HoneycombOpentelemetryReactNativeModule')) {
      contents = contents.replace(
        'import expo.modules.ApplicationLifecycleDispatcher',
        'import expo.modules.ApplicationLifecycleDispatcher\nimport com.honeycombopentelemetryreactnative.HoneycombOpentelemetryReactNativeModule'
      );
    }

    // Add initialization at start of onCreate
    if (!contents.includes('HoneycombOpentelemetryReactNativeModule.configure')) {
      contents = contents.replace(
        'override fun onCreate() {',
        `override fun onCreate() {\n    // Honeycomb Frontend Observability\n    val honeycombOptions = HoneycombOpentelemetryReactNativeModule.optionsBuilder(this)\n        .setApiKey("${HONEYCOMB_API_KEY}")\n        .setServiceName("${SERVICE_NAME}")\n    HoneycombOpentelemetryReactNativeModule.configure(this, honeycombOptions)\n`
      );
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

// Android: Add Gradle dependencies
function withHoneycombGradle(config) {
  config = withDangerousMod(config, ['android', (config) => {
    const buildGradlePath = path.join(config.modRequest.platformProjectRoot, 'app', 'build.gradle');
    let contents = fs.readFileSync(buildGradlePath, 'utf8');

    if (!contents.includes('honeycomb-opentelemetry-android')) {
      contents = contents.replace(
        'dependencies {',
        `dependencies {\n    // Honeycomb Frontend Observability\n    implementation("io.honeycomb.android:honeycomb-opentelemetry-android:0.0.19")\n    implementation("io.opentelemetry.android:android-agent:0.11.0-alpha")`
      );
    }

    fs.writeFileSync(buildGradlePath, contents);
    return config;
  }]);

  return config;
}

module.exports = function withHoneycomb(config) {
  config = withHoneycombIOS(config);
  config = withUseFrameworks(config);
  config = withHoneycombAndroid(config);
  config = withHoneycombGradle(config);
  return config;
};
