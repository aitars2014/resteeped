import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shuffle, X, Coffee, Sparkles } from 'lucide-react-native';
import { typography, spacing, getPlaceholderImage } from '../constants';
import { useTheme, useCollection } from '../context';
import { Button } from './Button';
import { TeaTypeBadge } from './TeaTypeBadge';
import { StarRating } from './StarRating';

const { width, height } = Dimensions.get('window');

export const TeaRandomizer = ({ teas, onBrewTea, onViewTea }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const { collection } = useCollection();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTea, setSelectedTea] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const shuffleEmojis = useRef(new Animated.Value(0)).current;
  
  // Get teas to pick from - prefer user's collection, fall back to all teas
  const getTeaPool = () => {
    if (collection.length > 0) {
      // Map collection items to their full tea data
      return collection
        .map(item => item.tea || teas.find(t => t.id === item.tea_id))
        .filter(Boolean);
    }
    return teas;
  };
  
  const pickRandomTea = () => {
    const pool = getTeaPool();
    if (pool.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  };
  
  const startRandomize = () => {
    setModalVisible(true);
    setIsSpinning(true);
    setSelectedTea(null);
    
    // Reset animations
    spinValue.setValue(0);
    scaleValue.setValue(0.8);
    opacityValue.setValue(0);
    shuffleEmojis.setValue(0);
    
    // Shuffle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shuffleEmojis, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(shuffleEmojis, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 5 }
    ).start();
    
    // Spin animation
    Animated.timing(spinValue, {
      toValue: 3,
      duration: 1500,
      useNativeDriver: true,
    }).start();
    
    // After spinning, reveal the tea
    setTimeout(() => {
      const tea = pickRandomTea();
      setSelectedTea(tea);
      setIsSpinning(false);
      
      // Reveal animation
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);
  };
  
  const handleClose = () => {
    setModalVisible(false);
    setSelectedTea(null);
    setIsSpinning(false);
  };
  
  const handleBrewTea = () => {
    if (selectedTea) {
      handleClose();
      onBrewTea(selectedTea);
    }
  };
  
  const handleViewTea = () => {
    if (selectedTea) {
      handleClose();
      onViewTea(selectedTea);
    }
  };
  
  const spinRotation = spinValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['0deg', '360deg', '720deg', '1080deg'],
  });
  
  const teaColor = selectedTea ? getTeaTypeColor(selectedTea.teaType) : null;
  const teaPool = getTeaPool();
  const isFromCollection = collection.length > 0;
  
  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[styles.triggerButton, { backgroundColor: theme.accent.primary }]}
        onPress={startRandomize}
        activeOpacity={0.8}
        disabled={teaPool.length === 0}
      >
        <LinearGradient
          colors={[theme.accent.primary, theme.accent.secondary]}
          style={styles.triggerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Shuffle size={20} color={theme.text.inverse} />
          <Text style={[styles.triggerText, { color: theme.text.inverse }]}>
            What should I brew?
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Randomizer Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background.primary }]}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={theme.text.secondary} />
            </TouchableOpacity>
            
            {isSpinning ? (
              // Spinning state
              <View style={styles.spinningContainer}>
                <Animated.View style={[styles.spinningEmoji, { transform: [{ rotate: spinRotation }] }]}>
                  <Text style={styles.bigEmoji}>🍵</Text>
                </Animated.View>
                <Animated.Text style={[styles.spinningText, { 
                  color: theme.text.primary,
                  opacity: shuffleEmojis.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.5],
                  }),
                }]}>
                  Finding your perfect brew...
                </Animated.Text>
                
                {/* Floating tea emojis */}
                <Animated.Text style={[styles.floatingEmoji, styles.floatingEmoji1, {
                  opacity: shuffleEmojis,
                  transform: [{
                    translateY: shuffleEmojis.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  }],
                }]}>
                  ☕
                </Animated.Text>
                <Animated.Text style={[styles.floatingEmoji, styles.floatingEmoji2, {
                  opacity: shuffleEmojis,
                  transform: [{
                    translateY: shuffleEmojis.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 20],
                    }),
                  }],
                }]}>
                  🫖
                </Animated.Text>
              </View>
            ) : selectedTea ? (
              // Tea reveal
              <Animated.View style={[styles.teaReveal, {
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
              }]}>
                <View style={styles.revealHeader}>
                  <Sparkles size={24} color={theme.accent.primary} />
                  <Text style={[styles.revealTitle, { color: theme.accent.primary }]}>
                    You should brew...
                  </Text>
                </View>
                
                {/* Tea Card */}
                <View style={[styles.teaCard, { 
                  backgroundColor: theme.background.secondary,
                  borderColor: teaColor?.primary || theme.border.light,
                }]}>
                  {/* Tea Image */}
                  <View style={[styles.teaImageContainer, { backgroundColor: teaColor?.gradient || theme.background.tertiary }]}>
                    <Image 
                      source={selectedTea.imageUrl ? { uri: selectedTea.imageUrl } : getPlaceholderImage(selectedTea.teaType)} 
                      style={styles.teaImage}
                    />
                  </View>
                  
                  <View style={styles.teaInfo}>
                    <TeaTypeBadge teaType={selectedTea.teaType} size="small" />
                    <Text style={[styles.teaName, { color: theme.text.primary }]} numberOfLines={2}>
                      {selectedTea.name}
                    </Text>
                    <Text style={[styles.brandName, { color: theme.text.secondary }]}>
                      {selectedTea.brandName}
                    </Text>
                    {selectedTea.avgRating > 0 && (
                      <StarRating rating={selectedTea.avgRating} size={14} />
                    )}
                  </View>
                </View>
                
                {/* Source info */}
                <Text style={[styles.sourceText, { color: theme.text.secondary }]}>
                  {isFromCollection 
                    ? `Selected from your collection of ${collection.length} teas`
                    : `Selected from ${teaPool.length} teas`}
                </Text>
                
                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <Button
                    title="Brew This Tea!"
                    onPress={handleBrewTea}
                    variant="primary"
                    icon={<Coffee size={18} color={theme.text.inverse} />}
                    style={styles.brewButton}
                  />
                  <Button
                    title="View Details"
                    onPress={handleViewTea}
                    variant="secondary"
                    style={styles.detailsButton}
                  />
                  <TouchableOpacity 
                    style={[styles.rerollButton, { borderColor: theme.border.medium }]}
                    onPress={startRandomize}
                  >
                    <Shuffle size={16} color={theme.text.secondary} />
                    <Text style={[styles.rerollText, { color: theme.text.secondary }]}>
                      Pick again
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ) : (
              // No tea available
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🍃</Text>
                <Text style={[styles.emptyText, { color: theme.text.primary }]}>
                  No teas available
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.text.secondary }]}>
                  Add some teas to your collection first!
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    borderRadius: spacing.buttonBorderRadius,
    overflow: 'hidden',
    marginHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.sectionSpacing,
  },
  triggerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  triggerText: {
    ...typography.body,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width - 40,
    maxHeight: height * 0.8,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  spinningContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    position: 'relative',
  },
  spinningEmoji: {
    marginBottom: 24,
  },
  bigEmoji: {
    fontSize: 80,
  },
  spinningText: {
    ...typography.body,
    fontWeight: '500',
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  floatingEmoji1: {
    top: 40,
    left: 20,
  },
  floatingEmoji2: {
    top: 40,
    right: 20,
  },
  teaReveal: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 20,
  },
  revealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  revealTitle: {
    ...typography.headingSmall,
    fontWeight: '600',
  },
  teaCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: 12,
  },
  teaImageContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  teaInfo: {
    padding: 16,
    gap: 6,
  },
  teaName: {
    ...typography.headingSmall,
    fontWeight: '700',
    marginTop: 4,
  },
  brandName: {
    ...typography.bodySmall,
    marginBottom: 4,
  },
  sourceText: {
    ...typography.caption,
    fontStyle: 'italic',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    gap: 10,
  },
  brewButton: {
    width: '100%',
  },
  detailsButton: {
    width: '100%',
  },
  rerollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  rerollText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    ...typography.headingSmall,
    marginBottom: 8,
  },
  emptySubtext: {
    ...typography.body,
    textAlign: 'center',
  },
});

export default TeaRandomizer;
