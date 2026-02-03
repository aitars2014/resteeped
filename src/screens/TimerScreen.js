import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Vibration,
  Alert,
  Platform,
  AppState,
} from 'react-native';
import { Minus, Plus, Coffee, Bell, BellOff } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { Button, TeaTypeBadge } from '../components';
import { useBrewHistory } from '../hooks';
import { useAuth } from '../context';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CIRCLE_SIZE = 260;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const TimerScreen = ({ route }) => {
  const tea = route?.params?.tea;
  const teaColor = tea ? getTeaTypeColor(tea.teaType) : null;
  
  const { user } = useAuth();
  const { logBrewSession, todayBrewCount } = useBrewHistory();
  
  const defaultTimeSeconds = tea?.steepTimeMin 
    ? Math.round(tea.steepTimeMin * 60) 
    : 180;
  
  const [totalSeconds, setTotalSeconds] = useState(defaultTimeSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultTimeSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasLogged, setHasLogged] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const intervalRef = useRef(null);
  const notificationIdRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const timerEndTimeRef = useRef(null);
  
  // Request notification permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      setNotificationsEnabled(finalStatus === 'granted');
    };
    
    requestPermissions();
    
    // Listen for app state changes to handle background timer
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
  
  // Handle app coming back to foreground - update timer based on elapsed time
  const handleAppStateChange = (nextAppState) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      timerEndTimeRef.current
    ) {
      // App came back to foreground - recalculate remaining time
      const now = Date.now();
      const endTime = timerEndTimeRef.current;
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      if (remaining <= 0) {
        // Timer finished while in background
        setRemainingSeconds(0);
        setIsRunning(false);
        setIsComplete(true);
        Vibration.vibrate([500, 200, 500, 200, 500]);
      } else {
        setRemainingSeconds(remaining);
      }
    }
    appStateRef.current = nextAppState;
  };
  
  // Schedule a notification for when the timer ends
  const scheduleNotification = async (seconds) => {
    if (!notificationsEnabled) return;
    
    // Cancel any existing notification
    await cancelNotification();
    
    // Store when timer will end
    timerEndTimeRef.current = Date.now() + (seconds * 1000);
    
    const teaName = tea?.name || 'Your tea';
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '☕ Tea is Ready!',
        body: `${teaName} has finished steeping. Enjoy!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds,
        channelId: 'tea-timer',
      },
    });
    
    notificationIdRef.current = id;
  };
  
  // Cancel scheduled notification
  const cancelNotification = async () => {
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      notificationIdRef.current = null;
    }
    timerEndTimeRef.current = null;
  };
  
  // Reset when tea changes
  useEffect(() => {
    const newDefault = tea?.steepTimeMin 
      ? Math.round(tea.steepTimeMin * 60) 
      : 180;
    setTotalSeconds(newDefault);
    setRemainingSeconds(newDefault);
    setIsComplete(false);
    setHasLogged(false);
    // Cancel any pending notification when switching teas
    cancelNotification();
  }, [tea?.id]);
  
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      // Schedule notification when timer starts
      if (notificationsEnabled) {
        scheduleNotification(remainingSeconds);
      }
      
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsComplete(true);
            Vibration.vibrate([500, 200, 500, 200, 500]);
            // Notification should have fired, clear the ref
            notificationIdRef.current = null;
            timerEndTimeRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning) {
      // Cancel notification when paused
      cancelNotification();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);
  
  // Log brew session when complete
  useEffect(() => {
    if (isComplete && !hasLogged) {
      setHasLogged(true);
      logBrewSession({
        teaId: tea?.id,
        steepTimeSeconds: totalSeconds,
        temperatureF: tea?.steepTempF,
        teaData: tea, // Pass full tea data for dev mode
      });
    }
  }, [isComplete, hasLogged, tea, totalSeconds, logBrewSession]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const adjustTime = (delta) => {
    if (isRunning) return;
    
    const newTime = Math.max(30, Math.min(900, totalSeconds + delta));
    setTotalSeconds(newTime);
    setRemainingSeconds(newTime);
    setIsComplete(false);
    setHasLogged(false);
  };
  
  const handleStartPause = () => {
    if (isComplete) {
      setRemainingSeconds(totalSeconds);
      setIsComplete(false);
      setHasLogged(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };
  
  const handleReset = async () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    setIsComplete(false);
    setHasLogged(false);
    await cancelNotification();
  };
  
  const progress = remainingSeconds / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  
  const recommendedTime = tea?.steepTimeMin 
    ? formatTime(Math.round(tea.steepTimeMin * 60))
    : null;
  
  const isCustomTime = totalSeconds !== defaultTimeSeconds;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with brew count */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Brew Timer</Text>
          {/* Notification status indicator */}
          <View style={[styles.notificationBadge, !notificationsEnabled && styles.notificationBadgeOff]}>
            {notificationsEnabled ? (
              <Bell size={12} color={colors.accent.primary} />
            ) : (
              <BellOff size={12} color={colors.text.secondary} />
            )}
          </View>
        </View>
        {todayBrewCount > 0 && (
          <View style={styles.brewCount}>
            <Coffee size={14} color={colors.accent.primary} />
            <Text style={styles.brewCountText}>{todayBrewCount} today</Text>
          </View>
        )}
      </View>
      
      {/* Tea info if available */}
      {tea && (
        <View style={styles.teaInfo}>
          <Text style={styles.teaName} numberOfLines={1}>{tea.name}</Text>
          <TeaTypeBadge teaType={tea.teaType} size="small" />
        </View>
      )}
      
      {/* Timer Circle */}
      <View style={styles.timerContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={colors.border.light}
            strokeWidth={STROKE_WIDTH}
            fill={colors.background.secondary}
          />
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={teaColor?.primary || colors.accent.primary}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            rotation="-90"
            origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
          />
        </Svg>
        
        <View style={styles.timeDisplay}>
          {isComplete ? (
            <>
              <Text style={styles.completeEmoji}>☕</Text>
              <Text style={styles.completeText}>Ready!</Text>
            </>
          ) : (
            <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
          )}
        </View>
      </View>
      
      {/* Recommended time label */}
      {recommendedTime && !isComplete && (
        <Text style={styles.recommendedLabel}>
          Recommended: {recommendedTime}
          {isCustomTime && ' • Custom'}
        </Text>
      )}
      
      {/* Time adjustment controls */}
      {!isComplete && (
        <View style={styles.adjustControls}>
          <TouchableOpacity 
            style={[styles.adjustButton, isRunning && styles.adjustButtonDisabled]}
            onPress={() => adjustTime(-30)}
            disabled={isRunning}
          >
            <Minus size={24} color={isRunning ? colors.text.secondary : colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.adjustTimeContainer}>
            <Text style={styles.adjustTimeText}>{formatTime(totalSeconds)}</Text>
            <Text style={styles.adjustTimeLabel}>total</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.adjustButton, isRunning && styles.adjustButtonDisabled]}
            onPress={() => adjustTime(30)}
            disabled={isRunning}
          >
            <Plus size={24} color={isRunning ? colors.text.secondary : colors.text.primary} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Temperature display */}
      {tea?.steepTempF && !isComplete && (
        <View style={styles.tempContainer}>
          <Text style={styles.tempText}>🌡️ {tea.steepTempF}°F</Text>
        </View>
      )}
      
      {/* Control buttons */}
      <View style={styles.buttonContainer}>
        <Button 
          title={isComplete ? "Brew Again" : isRunning ? "Pause" : "Start"}
          onPress={handleStartPause}
          variant="primary"
          style={styles.button}
        />
        {!isComplete && (
          <Button 
            title="Reset"
            onPress={handleReset}
            variant="secondary"
            style={styles.button}
          />
        )}
      </View>
      
      {/* Tip for no tea selected */}
      {!tea && (
        <Text style={styles.tipText}>
          Tip: Start a timer from a tea's detail page to track your brews
        </Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },
  notificationBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeOff: {
    opacity: 0.5,
  },
  brewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  brewCountText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  teaInfo: {
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: 8,
    gap: 8,
  },
  teaName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  timerContainer: {
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  timeDisplay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 52,
    fontWeight: '300',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  completeText: {
    ...typography.headingMedium,
    color: colors.accent.primary,
  },
  recommendedLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  adjustControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 16,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonDisabled: {
    borderColor: colors.text.secondary,
  },
  adjustTimeContainer: {
    alignItems: 'center',
    minWidth: 70,
  },
  adjustTimeText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  adjustTimeLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  tempContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tempText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  buttonContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: 10,
    marginTop: 'auto',
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
  tipText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: 24,
  },
});
