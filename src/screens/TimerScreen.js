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
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { Minus, Plus, Coffee, Bell, BellOff, Repeat, ChevronLeft, ChevronRight, NotebookPen, X, Check } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { typography, spacing } from '../constants';
import { Button, TeaTypeBadge } from '../components';
import { useBrewHistory } from '../hooks';
import { useAuth, useTheme, useCollection } from '../context';
import { getBrewingGuide } from '../constants/brewingGuides';

const { width } = Dimensions.get('window');

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CIRCLE_SIZE = 240;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Play a pleasant completion sound (Tibetan singing bowl)
const playCompletionSound = async () => {
  try {
    // Configure audio mode for playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    
    // Use local Tibetan singing bowl sound
    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/tea-ready.mp3'),
      { shouldPlay: true, volume: 0.8 }
    );
    
    // Cleanup after playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.log('Error playing completion sound:', error);
  }
};

// Get recommended steep times for multiple infusions
const getInfusionTimes = (tea, totalInfusions) => {
  const guide = getBrewingGuide(tea);
  const baseTime = guide.steepTime.min;
  const times = [];
  
  // Different patterns for different tea types
  const teaType = tea?.teaType?.toLowerCase();
  
  if (teaType === 'puerh') {
    // Pu'erh: Start very short, increase gradually
    for (let i = 0; i < totalInfusions; i++) {
      if (i === 0) times.push(15); // 15 sec rinse/first steep
      else if (i === 1) times.push(20);
      else if (i < 5) times.push(20 + (i - 1) * 5);
      else times.push(30 + (i - 4) * 10);
    }
  } else if (teaType === 'oolong') {
    // Oolong: Start short, increase moderately
    for (let i = 0; i < totalInfusions; i++) {
      if (i === 0) times.push(30);
      else if (i < 3) times.push(30 + i * 15);
      else times.push(60 + (i - 2) * 20);
    }
  } else if (teaType === 'green' || teaType === 'white') {
    // Green/White: Moderate start, gentle increase
    for (let i = 0; i < totalInfusions; i++) {
      times.push(Math.round((baseTime * 60) + i * 30));
    }
  } else {
    // Default: Linear increase from base time
    for (let i = 0; i < totalInfusions; i++) {
      times.push(Math.round(baseTime * 60) + i * 30);
    }
  }
  
  return times;
};

export const TimerScreen = ({ route }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const tea = route?.params?.tea;
  const teaColor = tea ? getTeaTypeColor(tea.teaType) : null;
  
  const { user } = useAuth();
  const { updateInCollection, isInCollection, getCollectionItem } = useCollection();
  const { logBrewSession, todayBrewCount } = useBrewHistory();
  
  // Get brewing guide
  const guide = tea ? getBrewingGuide(tea) : null;
  const maxInfusions = guide?.infusions || 1;
  const isMultiSteep = maxInfusions > 1;
  
  const defaultTimeSeconds = tea?.steepTimeMin 
    ? Math.round(tea.steepTimeMin * 60) 
    : 180;
  
  // Multi-steep state
  const [multiSteepMode, setMultiSteepMode] = useState(isMultiSteep);
  const [currentInfusion, setCurrentInfusion] = useState(1);
  const [totalInfusions, setTotalInfusions] = useState(Math.min(maxInfusions, 7));
  const [infusionTimes, setInfusionTimes] = useState([]);
  const [infusionNotes, setInfusionNotes] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  
  // Timer state
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
  
  // Initialize infusion times when tea changes
  useEffect(() => {
    if (tea && multiSteepMode) {
      const times = getInfusionTimes(tea, totalInfusions);
      setInfusionTimes(times);
      setTotalSeconds(times[0] || defaultTimeSeconds);
      setRemainingSeconds(times[0] || defaultTimeSeconds);
    }
  }, [tea?.id, multiSteepMode, totalInfusions]);
  
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
  
  // Handle app coming back to foreground
  const handleAppStateChange = (nextAppState) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      timerEndTimeRef.current
    ) {
      const now = Date.now();
      const endTime = timerEndTimeRef.current;
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      if (remaining <= 0) {
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
  
  // Schedule notification
  const scheduleNotification = async (seconds) => {
    if (!notificationsEnabled) return;
    await cancelNotification();
    timerEndTimeRef.current = Date.now() + (seconds * 1000);
    
    const teaName = tea?.name || 'Your tea';
    const infusionText = multiSteepMode ? ` (Infusion ${currentInfusion})` : '';
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🍵 It's tea time!",
        body: `${teaName}${infusionText} is ready to enjoy.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, seconds),
        repeats: false,
      },
    });
    
    notificationIdRef.current = id;
  };
  
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
    
    if (!multiSteepMode) {
      setTotalSeconds(newDefault);
      setRemainingSeconds(newDefault);
    }
    
    setIsComplete(false);
    setHasLogged(false);
    setCurrentInfusion(1);
    setInfusionNotes({});
    cancelNotification();
  }, [tea?.id]);
  
  // Timer effect
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
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
            playCompletionSound();
            notificationIdRef.current = null;
            timerEndTimeRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isRunning) {
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
      
      // Log the brew session
      logBrewSession({
        teaId: tea?.id,
        steepTimeSeconds: totalSeconds,
        temperatureF: tea?.steepTempF,
        teaData: tea,
        infusionNumber: multiSteepMode ? currentInfusion : null,
        note: infusionNotes[currentInfusion] || null,
      });

      // Mark tea as tried in collection if it exists
      if (tea?.id && isInCollection(tea.id)) {
        const collectionItem = getCollectionItem(tea.id);
        if (collectionItem?.status !== 'tried') {
          updateInCollection(tea.id, { 
            status: 'tried',
            tried_at: new Date().toISOString(),
          });
        }
        
        // Prompt for review if not yet reviewed
        if (!collectionItem?.user_rating) {
          setTimeout(() => {
            Alert.alert(
              'How was your tea?',
              `Would you like to rate "${tea.name}"?`,
              [
                { text: 'Later', style: 'cancel' },
                { 
                  text: 'Rate Now', 
                  onPress: () => navigation.navigate('TeaDetail', { tea, openReview: true })
                },
              ]
            );
          }, 1500); // Delay to let the completion UI show first
        }
      }
    }
  }, [isComplete, hasLogged, tea, totalSeconds, currentInfusion, multiSteepMode, infusionNotes, logBrewSession, isInCollection, getCollectionItem, updateInCollection, navigation]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const adjustTime = (delta) => {
    if (isRunning) return;
    
    const newTime = Math.max(10, Math.min(900, totalSeconds + delta));
    setTotalSeconds(newTime);
    setRemainingSeconds(newTime);
    setIsComplete(false);
    setHasLogged(false);
    
    // Update infusion time if in multi-steep mode
    if (multiSteepMode) {
      const newTimes = [...infusionTimes];
      newTimes[currentInfusion - 1] = newTime;
      setInfusionTimes(newTimes);
    }
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
  
  // Multi-steep navigation
  const goToNextInfusion = () => {
    if (currentInfusion < totalInfusions) {
      const nextInfusion = currentInfusion + 1;
      setCurrentInfusion(nextInfusion);
      const nextTime = infusionTimes[nextInfusion - 1] || totalSeconds + 30;
      setTotalSeconds(nextTime);
      setRemainingSeconds(nextTime);
      setIsComplete(false);
      setHasLogged(false);
    }
  };
  
  const goToPrevInfusion = () => {
    if (currentInfusion > 1) {
      const prevInfusion = currentInfusion - 1;
      setCurrentInfusion(prevInfusion);
      const prevTime = infusionTimes[prevInfusion - 1] || totalSeconds - 30;
      setTotalSeconds(Math.max(10, prevTime));
      setRemainingSeconds(Math.max(10, prevTime));
      setIsComplete(false);
      setHasLogged(false);
    }
  };
  
  const handleSaveNote = () => {
    if (currentNote.trim()) {
      setInfusionNotes(prev => ({
        ...prev,
        [currentInfusion]: currentNote.trim(),
      }));
    } else {
      // Remove note if empty
      const newNotes = { ...infusionNotes };
      delete newNotes[currentInfusion];
      setInfusionNotes(newNotes);
    }
    setShowNotesModal(false);
    setCurrentNote('');
  };
  
  const openNotesModal = () => {
    setCurrentNote(infusionNotes[currentInfusion] || '');
    setShowNotesModal(true);
  };
  
  const progress = remainingSeconds / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  
  const recommendedTime = tea?.steepTimeMin 
    ? formatTime(Math.round(tea.steepTimeMin * 60))
    : null;
  
  const isCustomTime = !multiSteepMode && totalSeconds !== defaultTimeSeconds;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with brew count */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Tea Timer</Text>
            <View style={[styles.notificationBadge, { backgroundColor: theme.background.secondary }, !notificationsEnabled && styles.notificationBadgeOff]}>
              {notificationsEnabled ? (
                <Bell size={12} color={theme.accent.primary} />
              ) : (
                <BellOff size={12} color={theme.text.secondary} />
              )}
            </View>
          </View>
          {todayBrewCount > 0 && (
            <View style={[styles.brewCount, { backgroundColor: theme.background.secondary }]}>
              <Coffee size={14} color={theme.accent.primary} />
              <Text style={[styles.brewCountText, { color: theme.accent.primary }]}>{todayBrewCount} today</Text>
            </View>
          )}
        </View>
        
        {/* Tea info if available */}
        {tea && (
          <View style={styles.teaInfo}>
            <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={1}>{tea.name}</Text>
            <TeaTypeBadge teaType={tea.teaType} size="small" />
          </View>
        )}
        
        {/* Multi-Steep Toggle (only show if tea supports it) */}
        {tea && maxInfusions > 1 && (
          <View style={styles.multiSteepToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { borderColor: theme.border.medium },
                !multiSteepMode && { backgroundColor: theme.accent.primary, borderColor: theme.accent.primary },
              ]}
              onPress={() => {
                setMultiSteepMode(false);
                setTotalSeconds(defaultTimeSeconds);
                setRemainingSeconds(defaultTimeSeconds);
                setCurrentInfusion(1);
                setIsComplete(false);
                setHasLogged(false);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Single steep mode"
              accessibilityState={{ selected: !multiSteepMode }}
            >
              <Text style={[
                styles.modeButtonText,
                { color: theme.text.secondary },
                !multiSteepMode && { color: theme.text.inverse },
              ]}>
                Single Steep
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { borderColor: theme.border.medium },
                multiSteepMode && { backgroundColor: theme.accent.primary, borderColor: theme.accent.primary },
              ]}
              onPress={() => {
                setMultiSteepMode(true);
                const times = getInfusionTimes(tea, totalInfusions);
                setInfusionTimes(times);
                setTotalSeconds(times[0] || defaultTimeSeconds);
                setRemainingSeconds(times[0] || defaultTimeSeconds);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Gongfu mode, ${maxInfusions} infusions`}
              accessibilityState={{ selected: multiSteepMode }}
            >
              <Repeat size={14} color={multiSteepMode ? theme.text.inverse : theme.text.secondary} style={{ marginRight: 4 }} />
              <Text style={[
                styles.modeButtonText,
                { color: theme.text.secondary },
                multiSteepMode && { color: theme.text.inverse },
              ]}>
                Gongfu ({maxInfusions})
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Infusion Progress (Multi-Steep Mode) */}
        {multiSteepMode && (
          <View style={styles.infusionProgress}>
            <View style={styles.infusionHeader}>
              <TouchableOpacity 
                onPress={goToPrevInfusion}
                disabled={currentInfusion <= 1 || isRunning}
                style={[styles.infusionNavButton, (currentInfusion <= 1 || isRunning) && { opacity: 0.3 }]}
              >
                <ChevronLeft size={24} color={theme.text.primary} />
              </TouchableOpacity>
              
              <View style={styles.infusionInfo}>
                <Text style={[styles.infusionLabel, { color: theme.text.secondary }]}>Infusion</Text>
                <Text style={[styles.infusionNumber, { color: theme.accent.primary }]}>
                  {currentInfusion} of {totalInfusions}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={goToNextInfusion}
                disabled={currentInfusion >= totalInfusions || isRunning}
                style={[styles.infusionNavButton, (currentInfusion >= totalInfusions || isRunning) && { opacity: 0.3 }]}
              >
                <ChevronRight size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Infusion Dots */}
            <View style={styles.infusionDots}>
              {Array.from({ length: totalInfusions }).map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.infusionDot,
                    { backgroundColor: theme.border.light },
                    idx + 1 <= currentInfusion && { backgroundColor: teaColor?.primary || theme.accent.primary },
                    idx + 1 === currentInfusion && styles.currentInfusionDot,
                  ]}
                />
              ))}
            </View>
            
            {/* Add Note Button */}
            <TouchableOpacity 
              style={[styles.addNoteButton, { borderColor: theme.border.light }]}
              onPress={openNotesModal}
            >
              <NotebookPen size={14} color={theme.text.secondary} />
              <Text style={[styles.addNoteText, { color: theme.text.secondary }]}>
                {infusionNotes[currentInfusion] ? 'Edit note' : 'Add note for this infusion'}
              </Text>
              {infusionNotes[currentInfusion] && (
                <Check size={14} color={theme.accent.primary} />
              )}
            </TouchableOpacity>
          </View>
        )}
        
        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={theme.border.light}
              strokeWidth={STROKE_WIDTH}
              fill={theme.background.secondary}
            />
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={RADIUS}
              stroke={teaColor?.primary || theme.accent.primary}
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
              <View style={styles.completeContainer}>
                <Coffee size={48} color={theme.accent.primary} strokeWidth={1.5} />
                <Text style={[styles.completeText, { color: theme.accent.primary }]}>Ready!</Text>
              </View>
            ) : (
              <Text style={[styles.timeText, { color: theme.text.primary }]}>{formatTime(remainingSeconds)}</Text>
            )}
          </View>
        </View>
        
        {/* Recommended time label */}
        {!isComplete && (
          <Text style={[styles.recommendedLabel, { color: theme.text.secondary }]}>
            {multiSteepMode 
              ? `Steep ${currentInfusion}: ${formatTime(infusionTimes[currentInfusion - 1] || totalSeconds)}`
              : recommendedTime 
                ? `Recommended: ${recommendedTime}${isCustomTime ? ' • Custom' : ''}`
                : 'Set your steep time'
            }
          </Text>
        )}
        
        {/* Time adjustment controls */}
        {!isComplete && (
          <View style={styles.adjustControls}>
            <TouchableOpacity 
              style={[styles.adjustButton, { borderColor: isRunning ? theme.text.secondary : theme.text.primary }]}
              onPress={() => adjustTime(-15)}
              disabled={isRunning}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Decrease time by 15 seconds"
              accessibilityState={{ disabled: isRunning }}
            >
              <Minus size={24} color={isRunning ? theme.text.secondary : theme.text.primary} />
            </TouchableOpacity>
            
            <View 
              style={styles.adjustTimeContainer}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Total steep time: ${formatTime(totalSeconds)}`}
            >
              <Text style={[styles.adjustTimeText, { color: theme.text.primary }]}>{formatTime(totalSeconds)}</Text>
              <Text style={[styles.adjustTimeLabel, { color: theme.text.secondary }]}>total</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.adjustButton, { borderColor: isRunning ? theme.text.secondary : theme.text.primary }]}
              onPress={() => adjustTime(15)}
              disabled={isRunning}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Increase time by 15 seconds"
              accessibilityState={{ disabled: isRunning }}
            >
              <Plus size={24} color={isRunning ? theme.text.secondary : theme.text.primary} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Temperature display */}
        {tea?.steepTempF && !isComplete && (
          <View style={styles.tempContainer}>
            <Text style={[styles.tempText, { color: theme.text.secondary }]}>🌡️ {tea.steepTempF}°F</Text>
          </View>
        )}
        
        {/* Show current note if exists */}
        {multiSteepMode && infusionNotes[currentInfusion] && !isComplete && (
          <View style={[styles.notePreview, { backgroundColor: theme.background.secondary }]}>
            <NotebookPen size={14} color={theme.text.secondary} />
            <Text style={[styles.notePreviewText, { color: theme.text.secondary }]} numberOfLines={2}>
              {infusionNotes[currentInfusion]}
            </Text>
          </View>
        )}
        
        {/* Control buttons */}
        <View style={styles.buttonContainer}>
          <Button 
            title={isComplete ? (multiSteepMode && currentInfusion < totalInfusions ? "Next Infusion →" : "Brew Again") : isRunning ? "Pause" : "Start"}
            onPress={isComplete && multiSteepMode && currentInfusion < totalInfusions ? goToNextInfusion : handleStartPause}
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
        
        {/* Infusion Summary (when completed session) */}
        {multiSteepMode && isComplete && Object.keys(infusionNotes).length > 0 && (
          <View style={[styles.sessionSummary, { borderColor: theme.border.light }]}>
            <Text style={[styles.summaryTitle, { color: theme.text.primary }]}>Session Notes</Text>
            {Object.entries(infusionNotes).map(([infusion, note]) => (
              <View key={infusion} style={styles.summaryItem}>
                <Text style={[styles.summaryInfusion, { color: theme.accent.primary }]}>
                  Infusion {infusion}:
                </Text>
                <Text style={[styles.summaryNote, { color: theme.text.secondary }]}>
                  {note}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Tip for no tea selected */}
        {!tea && (
          <Text style={[styles.tipText, { color: theme.text.secondary }]}>
            Tip: Start a timer from a tea's detail page to track your brews
          </Text>
        )}
      </ScrollView>
      
      {/* Notes Modal */}
      <Modal
        visible={showNotesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotesModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.notesModal, { backgroundColor: theme.background.primary }]}>
            <View style={styles.notesModalHeader}>
              <Text style={[styles.notesModalTitle, { color: theme.text.primary }]}>
                Infusion {currentInfusion} Notes
              </Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <X size={24} color={theme.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.notesModalSubtitle, { color: theme.text.secondary }]}>
              Record your impressions of this steep
            </Text>
            
            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: theme.background.secondary,
                borderColor: theme.border.light,
                color: theme.text.primary,
              }]}
              placeholder="E.g., Lighter color, more floral notes..."
              placeholderTextColor={theme.text.tertiary}
              value={currentNote}
              onChangeText={setCurrentNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.notesModalButtons}>
              <Button
                title="Save Note"
                onPress={handleSaveNote}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  },
  notificationBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  brewCountText: {
    ...typography.bodySmall,
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
    textAlign: 'center',
  },
  multiSteepToggle: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    gap: 10,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeButtonText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  infusionProgress: {
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: 16,
  },
  infusionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infusionNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infusionInfo: {
    alignItems: 'center',
  },
  infusionLabel: {
    ...typography.caption,
  },
  infusionNumber: {
    ...typography.headingMedium,
    fontWeight: '700',
  },
  infusionDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infusionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  currentInfusionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addNoteText: {
    ...typography.caption,
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
    fontSize: 48,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  completeContainer: {
    alignItems: 'center',
  },
  completeText: {
    ...typography.headingMedium,
    marginTop: 8,
  },
  recommendedLabel: {
    ...typography.caption,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustTimeContainer: {
    alignItems: 'center',
    minWidth: 70,
  },
  adjustTimeText: {
    ...typography.body,
    fontWeight: '600',
  },
  adjustTimeLabel: {
    ...typography.caption,
  },
  tempContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tempText: {
    ...typography.body,
  },
  notePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: 16,
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  notePreviewText: {
    ...typography.caption,
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    gap: 10,
    marginTop: 8,
  },
  button: {
    width: '100%',
  },
  sessionSummary: {
    marginHorizontal: spacing.screenHorizontal,
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  summaryTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryItem: {
    marginBottom: 8,
  },
  summaryInfusion: {
    ...typography.caption,
    fontWeight: '600',
  },
  summaryNote: {
    ...typography.caption,
    marginTop: 2,
  },
  tipText: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  notesModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  notesModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesModalTitle: {
    ...typography.headingSmall,
  },
  notesModalSubtitle: {
    ...typography.caption,
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    ...typography.body,
    marginBottom: 16,
  },
  notesModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
});
