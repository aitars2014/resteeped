import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Vibration,
  Alert,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { Button, TeaTypeBadge } from '../components';

const CIRCLE_SIZE = 280;
const STROKE_WIDTH = 12;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const TimerScreen = ({ route }) => {
  const tea = route?.params?.tea;
  const teaColor = tea ? getTeaTypeColor(tea.teaType) : null;
  
  // Default to 3 minutes, or tea's recommended time
  const defaultTimeSeconds = tea?.steepTimeMin 
    ? Math.round(tea.steepTimeMin * 60) 
    : 180;
  
  const [totalSeconds, setTotalSeconds] = useState(defaultTimeSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultTimeSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const intervalRef = useRef(null);
  
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsComplete(true);
            Vibration.vibrate([500, 200, 500, 200, 500]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const adjustTime = (delta) => {
    if (isRunning) return;
    
    const newTime = Math.max(30, Math.min(900, totalSeconds + delta)); // 30s to 15min
    setTotalSeconds(newTime);
    setRemainingSeconds(newTime);
    setIsComplete(false);
  };
  
  const handleStartPause = () => {
    if (isComplete) {
      // Reset if complete
      setRemainingSeconds(totalSeconds);
      setIsComplete(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };
  
  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    setIsComplete(false);
  };
  
  const progress = remainingSeconds / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  
  const recommendedTime = tea?.steepTimeMin 
    ? formatTime(Math.round(tea.steepTimeMin * 60))
    : null;
  
  const isCustomTime = totalSeconds !== defaultTimeSeconds;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Tea info if available */}
      {tea && (
        <View style={styles.teaInfo}>
          <Text style={styles.teaName}>{tea.name}</Text>
          <TeaTypeBadge teaType={tea.teaType} size="small" />
        </View>
      )}
      
      {/* Timer Circle */}
      <View style={styles.timerContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          {/* Background circle */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            stroke={colors.border.light}
            strokeWidth={STROKE_WIDTH}
            fill={colors.background.secondary}
          />
          {/* Progress circle */}
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
        
        {/* Time display */}
        <View style={styles.timeDisplay}>
          {isComplete ? (
            <Text style={styles.completeText}>Your tea is ready! ☕</Text>
          ) : (
            <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
          )}
        </View>
      </View>
      
      {/* Recommended time label */}
      {recommendedTime && (
        <Text style={styles.recommendedLabel}>
          Recommended: {recommendedTime}
          {isCustomTime && ' • Custom'}
        </Text>
      )}
      
      {/* Time adjustment controls */}
      <View style={styles.adjustControls}>
        <TouchableOpacity 
          style={styles.adjustButton}
          onPress={() => adjustTime(-30)}
          disabled={isRunning}
        >
          <Minus size={24} color={isRunning ? colors.text.secondary : colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={styles.adjustTimeText}>{formatTime(totalSeconds)}</Text>
        
        <TouchableOpacity 
          style={styles.adjustButton}
          onPress={() => adjustTime(30)}
          disabled={isRunning}
        >
          <Plus size={24} color={isRunning ? colors.text.secondary : colors.text.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Temperature display */}
      {tea?.steepTempF && (
        <View style={styles.tempContainer}>
          <Text style={styles.tempText}>🌡️ {tea.steepTempF}°F</Text>
        </View>
      )}
      
      {/* Control buttons */}
      <View style={styles.buttonContainer}>
        <Button 
          title={isComplete ? "Brew Again" : isRunning ? "Pause" : "Start Timer"}
          onPress={handleStartPause}
          variant="primary"
          style={styles.button}
        />
        <Button 
          title="Reset"
          onPress={handleReset}
          variant="secondary"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    paddingTop: 20,
  },
  teaInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  teaName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  timeDisplay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 56,
    fontWeight: '300',
    color: colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  completeText: {
    ...typography.headingMedium,
    color: colors.accent.primary,
    textAlign: 'center',
  },
  recommendedLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  adjustControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 20,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustTimeText: {
    ...typography.body,
    color: colors.text.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  tempContainer: {
    marginBottom: 30,
  },
  tempText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing.screenHorizontal,
    gap: spacing.elementSpacing,
    marginTop: 'auto',
    marginBottom: 34,
  },
  button: {
    width: '100%',
  },
});
