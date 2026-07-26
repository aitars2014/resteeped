const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const WATCH_TARGET_NAME = 'ResteepedWatch';
const WATCH_BUNDLE_ID = 'com.resteeped.app.watchkitapp';
const WATCH_ICON_SOURCE = 'assets/icon.png';

const WATCH_ICON_IMAGES = [
  { size: '24x24', role: 'notificationCenter', subtype: '38mm', scale: '2x', pixels: 48 },
  { size: '27.5x27.5', role: 'notificationCenter', subtype: '42mm', scale: '2x', pixels: 55 },
  { size: '29x29', role: 'companionSettings', scale: '2x', pixels: 58 },
  { size: '29x29', role: 'companionSettings', scale: '3x', pixels: 87 },
  { size: '40x40', role: 'appLauncher', subtype: '38mm', scale: '2x', pixels: 80 },
  { size: '44x44', role: 'appLauncher', subtype: '40mm', scale: '2x', pixels: 88 },
  { size: '50x50', role: 'appLauncher', subtype: '44mm', scale: '2x', pixels: 100 },
  { size: '86x86', role: 'quickLook', subtype: '38mm', scale: '2x', pixels: 172 },
  { size: '98x98', role: 'quickLook', subtype: '42mm', scale: '2x', pixels: 196 },
  { size: '108x108', role: 'quickLook', subtype: '44mm', scale: '2x', pixels: 216 },
  { idiom: 'watch-marketing', size: '1024x1024', scale: '1x', pixels: 1024 },
];

const MODULE_HEADER = `#import <React/RCTBridgeModule.h>

@interface ResteepedWatchTimerModule : NSObject <RCTBridgeModule>
@end
`;

const WATCH_APP_SWIFT = `import SwiftUI
import WatchConnectivity

struct TeaTimer: Codable, Equatable {
  let id: String?
  let status: String
  let teaName: String
  let teaType: String?
  let brewMethod: String?
  let infusion: Int?
  let totalSeconds: Int?
  let remainingSeconds: Int?
  let endsAt: Double?
  let updatedAt: Double?
}

final class WatchTimerStore: NSObject, ObservableObject, WCSessionDelegate {
  @Published var timer: TeaTimer?

  override init() {
    super.init()
    activateSession()
  }

  func activateSession() {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    session.delegate = self
    session.activate()
    apply(session.applicationContext)
  }

  func session(
    _ session: WCSession,
    activationDidCompleteWith activationState: WCSessionActivationState,
    error: Error?
  ) {
    apply(session.applicationContext)
  }

  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
    apply(applicationContext)
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
    if let timer = userInfo["timer"] as? [String: Any] {
      apply(timer)
    } else {
      apply(userInfo)
    }
  }

  func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
    if let timer = message["timer"] as? [String: Any] {
      apply(timer)
    } else {
      apply(message)
    }
  }

  private func apply(_ payload: [String: Any]) {
    guard !payload.isEmpty else { return }

    if (payload["status"] as? String) == "cleared" {
      DispatchQueue.main.async {
        self.timer = nil
      }
      return
    }

    guard JSONSerialization.isValidJSONObject(payload),
          let data = try? JSONSerialization.data(withJSONObject: payload),
          let decoded = try? JSONDecoder().decode(TeaTimer.self, from: data) else {
      return
    }

    DispatchQueue.main.async {
      self.timer = decoded
    }
  }
}

@main
struct ResteepedWatchApp: App {
  @StateObject private var timerStore = WatchTimerStore()

  var body: some Scene {
    WindowGroup {
      TimerView()
        .environmentObject(timerStore)
    }
  }
}

struct TimerView: View {
  @EnvironmentObject var timerStore: WatchTimerStore

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let timer = timerStore.timer
      let remaining = remainingSeconds(for: timer, at: timeline.date)
      let isActive = timer?.status == "running" && remaining > 0

      VStack(spacing: 8) {
        if let timer {
          Text(timer.teaName)
            .font(.headline)
            .lineLimit(2)
            .multilineTextAlignment(.center)

          ZStack {
            Circle()
              .stroke(Color.secondary.opacity(0.22), lineWidth: 8)

            Circle()
              .trim(from: 0, to: progress(for: timer, remaining: remaining))
              .stroke(Color.green, style: StrokeStyle(lineWidth: 8, lineCap: .round))
              .rotationEffect(.degrees(-90))

            Text(timeLabel(remaining))
              .font(.system(.title2, design: .rounded).monospacedDigit())
              .fontWeight(.semibold)
          }
          .frame(width: 112, height: 112)

          Text(statusLabel(for: timer, isActive: isActive, remaining: remaining))
            .font(.caption2)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        } else {
          VStack(spacing: 8) {
            Image(systemName: "cup.and.saucer")
              .font(.title2)
              .foregroundStyle(.green)
            Text("No active timer")
              .font(.headline)
              .multilineTextAlignment(.center)
            Text("Start one on iPhone")
              .font(.caption2)
              .foregroundStyle(.secondary)
          }
        }
      }
      .containerBackground(.background, for: .navigation)
      .padding(.horizontal, 4)
    }
  }

  private func remainingSeconds(for timer: TeaTimer?, at date: Date) -> Int {
    guard let timer else { return 0 }
    if timer.status == "running", let endsAt = timer.endsAt {
      return max(0, Int(ceil((endsAt / 1000) - date.timeIntervalSince1970)))
    }
    return max(0, timer.remainingSeconds ?? 0)
  }

  private func progress(for timer: TeaTimer, remaining: Int) -> Double {
    guard let total = timer.totalSeconds, total > 0 else { return 0 }
    return max(0, min(1, Double(remaining) / Double(total)))
  }

  private func timeLabel(_ seconds: Int) -> String {
    let hours = seconds / 3600
    let minutes = (seconds % 3600) / 60
    let remainingSeconds = seconds % 60

    if hours > 0 {
      return String(format: "%d:%02d", hours, minutes)
    }
    return String(format: "%d:%02d", minutes, remainingSeconds)
  }

  private func statusLabel(for timer: TeaTimer, isActive: Bool, remaining: Int) -> String {
    if timer.status == "completed" || remaining <= 0 {
      return "Ready"
    }
    if timer.status == "paused" {
      return "Paused"
    }
    if let infusion = timer.infusion {
      return isActive ? "Infusion \\(infusion)" : "Synced"
    }
    return isActive ? "Steeping" : "Synced"
  }
}
`;

const WATCH_INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>$(DEVELOPMENT_LANGUAGE)</string>
  <key>CFBundleDisplayName</key>
  <string>Resteeped</string>
  <key>CFBundleExecutable</key>
  <string>$(EXECUTABLE_NAME)</string>
  <key>CFBundleIdentifier</key>
  <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
  <key>CFBundleIconFiles</key>
  <array>
    <string>AppIcon</string>
  </array>
  <key>CFBundleIconName</key>
  <string>AppIcon</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>$(PRODUCT_NAME)</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>$(MARKETING_VERSION)</string>
  <key>CFBundleVersion</key>
  <string>$(CURRENT_PROJECT_VERSION)</string>
  <key>WKApplication</key>
  <true/>
  <key>WKCompanionAppBundleIdentifier</key>
  <string>com.resteeped.app</string>
</dict>
</plist>
`;

const MODULE_IMPLEMENTATION = `#import "ResteepedWatchTimerModule.h"
#import <WatchConnectivity/WatchConnectivity.h>

@interface ResteepedWatchTimerModule () <WCSessionDelegate>
@property (nonatomic, assign) BOOL hasActivatedSession;
@end

@implementation ResteepedWatchTimerModule

RCT_EXPORT_MODULE(ResteepedWatchTimer);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (BOOL)prepareSessionWithError:(NSError **)error
{
  if (![WCSession isSupported]) {
    if (error != nil) {
      *error = [NSError errorWithDomain:@"ResteepedWatchTimer"
                                   code:1
                               userInfo:@{NSLocalizedDescriptionKey: @"WatchConnectivity is not supported on this device."}];
    }
    return NO;
  }

  WCSession *session = [WCSession defaultSession];
  if (session.delegate != self) {
    session.delegate = self;
  }

  if (!self.hasActivatedSession || session.activationState == WCSessionActivationStateNotActivated) {
    [session activateSession];
    self.hasActivatedSession = YES;
  }

  return YES;
}

RCT_REMAP_METHOD(syncTimer,
                 syncTimer:(NSDictionary *)timer
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *sessionError = nil;
  if (![self prepareSessionWithError:&sessionError]) {
    resolve(@{@"supported": @NO, @"reason": sessionError.localizedDescription ?: @"unsupported"});
    return;
  }

  NSMutableDictionary *context = [timer mutableCopy];
  context[@"schemaVersion"] = @1;
  context[@"updatedAt"] = @([[NSDate date] timeIntervalSince1970] * 1000);

  NSError *contextError = nil;
  BOOL didUpdateContext = [[WCSession defaultSession] updateApplicationContext:context error:&contextError];

  [[WCSession defaultSession] transferUserInfo:@{
    @"type": @"resteeped.timer.sync",
    @"timer": context,
  }];

  if ([WCSession defaultSession].isReachable) {
    [[WCSession defaultSession] sendMessage:@{
      @"type": @"resteeped.timer.sync",
      @"timer": context,
    } replyHandler:nil errorHandler:nil];
  }

  if (!didUpdateContext && contextError != nil) {
    reject(@"watch_timer_sync_failed", contextError.localizedDescription, contextError);
    return;
  }

  resolve(@{
    @"supported": @YES,
    @"reachable": @([WCSession defaultSession].isReachable),
    @"paired": @([WCSession defaultSession].isPaired),
    @"watchAppInstalled": @([WCSession defaultSession].isWatchAppInstalled),
  });
}

RCT_REMAP_METHOD(clearTimer,
                 clearTimer:(NSString *)timerId
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary *payload = [@{
    @"status": @"cleared",
    @"schemaVersion": @1,
    @"updatedAt": @([[NSDate date] timeIntervalSince1970] * 1000),
  } mutableCopy];

  if (timerId != nil) {
    payload[@"id"] = timerId;
  }

  NSError *sessionError = nil;
  if (![self prepareSessionWithError:&sessionError]) {
    resolve(@{@"supported": @NO, @"reason": sessionError.localizedDescription ?: @"unsupported"});
    return;
  }

  NSError *contextError = nil;
  BOOL didUpdateContext = [[WCSession defaultSession] updateApplicationContext:payload error:&contextError];

  if ([WCSession defaultSession].isReachable) {
    [[WCSession defaultSession] sendMessage:@{
      @"type": @"resteeped.timer.clear",
      @"timer": payload,
    } replyHandler:nil errorHandler:nil];
  }

  if (!didUpdateContext && contextError != nil) {
    reject(@"watch_timer_clear_failed", contextError.localizedDescription, contextError);
    return;
  }

  resolve(@{
    @"supported": @YES,
    @"reachable": @([WCSession defaultSession].isReachable),
    @"paired": @([WCSession defaultSession].isPaired),
    @"watchAppInstalled": @([WCSession defaultSession].isWatchAppInstalled),
  });
}

#pragma mark - WCSessionDelegate

- (void)session:(WCSession *)session activationDidCompleteWithState:(WCSessionActivationState)activationState error:(NSError *)error
{
}

- (void)sessionDidBecomeInactive:(WCSession *)session
{
}

- (void)sessionDidDeactivate:(WCSession *)session
{
  [session activateSession];
}

@end
`;

const writeWatchTimerModule = (iosRoot) => {
  const appRoot = path.join(iosRoot, 'Resteeped');
  fs.mkdirSync(appRoot, { recursive: true });
  fs.writeFileSync(path.join(appRoot, 'ResteepedWatchTimerModule.h'), MODULE_HEADER);
  fs.writeFileSync(path.join(appRoot, 'ResteepedWatchTimerModule.m'), MODULE_IMPLEMENTATION);
};

const writeWatchApp = (iosRoot) => {
  const watchRoot = path.join(iosRoot, WATCH_TARGET_NAME);
  fs.mkdirSync(watchRoot, { recursive: true });
  fs.writeFileSync(path.join(watchRoot, 'ResteepedWatchApp.swift'), WATCH_APP_SWIFT);
  fs.writeFileSync(path.join(watchRoot, `${WATCH_TARGET_NAME}-Info.plist`), WATCH_INFO_PLIST);
};

const resizePng = (source, destination, pixels) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  childProcess.execFileSync('sips', [
    '-s',
    'format',
    'png',
    '-z',
    String(pixels),
    String(pixels),
    source,
    '--out',
    destination,
  ], { stdio: 'ignore' });
};

const writeWatchAppIcons = (projectRoot, iosRoot) => {
  const source = path.join(projectRoot, WATCH_ICON_SOURCE);
  const iconSetRoot = path.join(
    iosRoot,
    WATCH_TARGET_NAME,
    'Assets.xcassets',
    'AppIcon.appiconset'
  );
  fs.mkdirSync(iconSetRoot, { recursive: true });

  const images = WATCH_ICON_IMAGES.map((icon) => {
    const filename = `AppIcon-${icon.pixels}.png`;
    resizePng(source, path.join(iconSetRoot, filename), icon.pixels);
    return {
      idiom: icon.idiom || 'watch',
      ...(icon.role ? { role: icon.role } : {}),
      ...(icon.subtype ? { subtype: icon.subtype } : {}),
      size: icon.size,
      scale: icon.scale,
      filename,
    };
  });

  fs.writeFileSync(
    path.join(iconSetRoot, 'Contents.json'),
    `${JSON.stringify({
      images,
      info: {
        author: 'xcode',
        version: 1,
      },
    }, null, 2)}\n`
  );
};

const addSourceFileOnce = (project, filePath, groupKey, targetUuid) => {
  if (!project.hasFile(filePath)) {
    project.addSourceFile(filePath, { target: targetUuid }, groupKey);
  }
};

const addFrameworkOnce = (project, framework, targetUuid) => {
  if (!project.hasFile(framework)) {
    project.addFramework(framework, { target: targetUuid });
  }
};

const addResourceFileOnce = (project, filePath, groupKey, targetUuid) => {
  if (!project.hasFile(filePath)) {
    project.addResourceFile(filePath, { target: targetUuid }, groupKey);
  }
};

const stripUndefinedValues = (value) => {
  if (!value || typeof value !== 'object') {
    return;
  }

  for (const key of Object.keys(value)) {
    if (value[key] === undefined || value[key] === 'undefined') {
      delete value[key];
    } else {
      stripUndefinedValues(value[key]);
    }
  }
};

const unquote = (value) => String(value || '').replace(/^"(.*)"$/, '$1');

const hasBuildPhase = (target, name) => {
  return (target.buildPhases || []).some((phase) => phase.comment === name);
};

const ensureDependencySections = (project) => {
  const objects = project.hash.project.objects;
  objects.PBXTargetDependency = objects.PBXTargetDependency || {};
  objects.PBXContainerItemProxy = objects.PBXContainerItemProxy || {};
};

const hasTargetDependency = (project, targetUuid, dependencyTargetUuid) => {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const dependencies = target.dependencies || [];
  const dependencySection = project.hash.project.objects.PBXTargetDependency || {};

  return dependencies.some((dependency) => {
    const dependencyRecord = dependencySection[dependency.value];
    return dependencyRecord?.target === dependencyTargetUuid;
  });
};

const addTargetDependencyOnce = (project, targetUuid, dependencyTargetUuid) => {
  ensureDependencySections(project);

  const target = project.pbxNativeTargetSection()[targetUuid];
  target.dependencies = target.dependencies || [];

  if (!hasTargetDependency(project, targetUuid, dependencyTargetUuid)) {
    project.addTargetDependency(targetUuid, [dependencyTargetUuid]);
  }
};

const ensureBuildPhase = (project, targetUuid, type, name) => {
  const target = project.pbxNativeTargetSection()[targetUuid];
  if (!hasBuildPhase(target, name)) {
    project.addBuildPhase([], type, name, targetUuid);
  }
};

const ensureWatchTarget = (project) => {
  for (const [uuid, target] of Object.entries(project.pbxNativeTargetSection())) {
    if (uuid.endsWith('_comment')) continue;
    if (unquote(target.name) === WATCH_TARGET_NAME) {
      return { uuid, target };
    }
  }

  return project.addTarget(WATCH_TARGET_NAME, 'watch2_app', WATCH_TARGET_NAME, WATCH_BUNDLE_ID);
};

const ensureWatchGroup = (project) => {
  const existingGroupKey = project.findPBXGroupKey({ name: WATCH_TARGET_NAME });
  if (existingGroupKey) {
    return existingGroupKey;
  }

  const groupKey = project.pbxCreateGroup(WATCH_TARGET_NAME, WATCH_TARGET_NAME);
  const mainGroup = project.getFirstProject().firstProject.mainGroup;
  project.addToPbxGroup(groupKey, mainGroup);
  return groupKey;
};

const ensureResourcesGroup = (project) => {
  const existingGroupKey = project.findPBXGroupKey({ name: 'Resources' });
  if (existingGroupKey) {
    return existingGroupKey;
  }

  const groupKey = project.pbxCreateGroup('Resources', 'Resources');
  const mainGroup = project.getFirstProject().firstProject.mainGroup;
  project.addToPbxGroup(groupKey, mainGroup);
  return groupKey;
};

const updateWatchBuildSettings = (project, watchTargetUuid, config) => {
  const target = project.pbxNativeTargetSection()[watchTargetUuid];
  target.productType = '"com.apple.product-type.application"';
  const appVersion = config.version || '1.0.0';
  const watchBuildNumber = config.ios?.buildNumber || '1';

  const configurationListId = target.buildConfigurationList;
  const configurationList = project.pbxXCConfigurationList()[configurationListId];
  const buildConfigurations = project.pbxXCBuildConfigurationSection();

  for (const configuration of configurationList.buildConfigurations || []) {
    const buildSettings = buildConfigurations[configuration.value].buildSettings;
    buildSettings.ALWAYS_SEARCH_USER_PATHS = 'NO';
    buildSettings.ASSETCATALOG_COMPILER_APPICON_NAME = 'AppIcon';
    buildSettings.CURRENT_PROJECT_VERSION = watchBuildNumber;
    buildSettings.DEVELOPMENT_TEAM = 'A5ZVGXZSH4';
    buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
    buildSettings.INFOPLIST_FILE = `${WATCH_TARGET_NAME}/${WATCH_TARGET_NAME}-Info.plist`;
    buildSettings.LD_RUNPATH_SEARCH_PATHS = [
      '"$(inherited)"',
      '"@executable_path/Frameworks"',
    ];
    buildSettings.MARKETING_VERSION = appVersion;
    buildSettings.PRODUCT_BUNDLE_IDENTIFIER = WATCH_BUNDLE_ID;
    buildSettings.PRODUCT_NAME = '"$(TARGET_NAME)"';
    buildSettings.SDKROOT = 'watchos';
    buildSettings.SKIP_INSTALL = 'YES';
    buildSettings.SUPPORTED_PLATFORMS = '"watchos watchsimulator"';
    buildSettings.SWIFT_VERSION = '5.0';
    buildSettings.TARGETED_DEVICE_FAMILY = 4;
    buildSettings.WATCHOS_DEPLOYMENT_TARGET = '10.0';
  }
};

const addWatchAppTarget = (project, appTargetUuid, config) => {
  const watchTarget = ensureWatchTarget(project);
  const watchTargetUuid = watchTarget.uuid;
  const watchGroupKey = ensureWatchGroup(project);
  ensureResourcesGroup(project);

  ensureBuildPhase(project, watchTargetUuid, 'PBXSourcesBuildPhase', 'Sources');
  ensureBuildPhase(project, watchTargetUuid, 'PBXFrameworksBuildPhase', 'Frameworks');
  ensureBuildPhase(project, watchTargetUuid, 'PBXResourcesBuildPhase', 'Resources');

  addSourceFileOnce(
    project,
    'ResteepedWatchApp.swift',
    watchGroupKey,
    watchTargetUuid
  );
  addFrameworkOnce(project, 'WatchConnectivity.framework', watchTargetUuid);
  addResourceFileOnce(project, 'Assets.xcassets', watchGroupKey, watchTargetUuid);
  updateWatchBuildSettings(project, watchTargetUuid, config);
  addTargetDependencyOnce(project, appTargetUuid, watchTargetUuid);
};

const withWatchTimerSync = (config) => {
  config = withDangerousMod(config, [
    'ios',
    (modConfig) => {
      writeWatchTimerModule(modConfig.modRequest.platformProjectRoot);
      writeWatchApp(modConfig.modRequest.platformProjectRoot);
      writeWatchAppIcons(
        modConfig.modRequest.projectRoot,
        modConfig.modRequest.platformProjectRoot
      );
      return modConfig;
    },
  ]);

  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const targetUuid = project.getFirstTarget().uuid;
    const groupKey = project.findPBXGroupKey({ name: 'Resteeped' });

    addSourceFileOnce(project, 'Resteeped/ResteepedWatchTimerModule.m', groupKey, targetUuid);
    addFrameworkOnce(project, 'WatchConnectivity.framework', targetUuid);
    addWatchAppTarget(project, targetUuid, modConfig);
    stripUndefinedValues(project.hash.project.objects);

    return modConfig;
  });
};

module.exports = withWatchTimerSync;
