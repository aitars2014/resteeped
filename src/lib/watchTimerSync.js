import { NativeModules, Platform } from 'react-native';

const { ResteepedWatchTimer } = NativeModules;

const isWatchSyncAvailable = () => Platform.OS === 'ios' && !!ResteepedWatchTimer;

const runWatchSync = async (operation) => {
  if (!isWatchSyncAvailable()) return { available: false };

  try {
    return await operation();
  } catch (error) {
    console.log('Watch timer sync failed:', error);
    return { available: true, error };
  }
};

export const syncWatchTimer = async (timer) => {
  if (!timer) return { available: false };
  return runWatchSync(() => ResteepedWatchTimer.syncTimer(timer));
};

export const clearWatchTimer = async (timerId) => {
  return runWatchSync(() => ResteepedWatchTimer.clearTimer(timerId || null));
};

