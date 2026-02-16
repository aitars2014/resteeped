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
import { Shuffle, X, Coffee, Sparkles, Leaf } from 'lucide-react-native';
import { typography, spacing, getPlaceholderImage } from '../constants';
import { useTheme, useCollection } from '../context';
import { Button } from './Button';
import { TeaTypeBadge } from './TeaTypeBadge';
import { StarRating } from './StarRating';
import { TeaCup, Teapot } from './icons';

const { width, height } = Dimensions.get('window');

/**
 * TeaRandomizer — now a controlled modal.
 * Props:
 *   visible: boolean — whether the modal is shown
 *   source: 'collection' | 'all' — which tea pool to use
 *   teas: array — all available teas
 *   onClose: () => void
 *   onBrewTea: (tea) => void
 *   onViewTea: (tea) => void
 *   onAddTea: () => void — navigate to add teas when collection empty
 */
export const TeaRandomizer = ({ visible, source = 'all', teas, onClose, onBrewTea, onViewTea, onAddTea }) => {
  const { theme, getTeaTypeColor } = useTheme();
  const { collection } = useCollection();
  const [selectedTea, setSelectedTea] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const shuffleEmojis = useRef(new Animated.Value(0)).current;
  
  const getTeaPool = () => {
    if (source === 'collection' && collection.length > 0) {
      return collection
        .map(item => item.tea || teas.find(t => t.id === item.tea_id))
        .filter(Boolean);
    }
    return teas;
  };
  
  // Auto-start spin when modal becomes visible
  useEffect(() => {
    if (visible) {
      runSpinAnimation();
    } else {
      // Reset state when hidden
      setSelectedTea(null);
      setIsSpinning(false);
    }
  }, [visible]);
  
  const runSpinAnimation = () => {
    setIsSpinning(true);
    setSelectedTea(null);
    
    spinValue.setValue(0);
    scaleValue.setValue(0.8);
    opacityValue.setValue(0);
    shuffleEmojis.setValue(0);
    
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
    
    Animated.timing(spinValue, {
      toValue: 3,
      duration: 1500,
      useNativeDriver: true,
    }).start();
    
    setTimeout(() => {
      const pool = getTeaPool();
      let tea = null;
      if (pool.length > 0) {
        if (source === 'all') {
          // Weight toward higher-rated teas
          const weighted = pool.map(t => ({
            tea: t,
            weight: Math.max(1, (t.avgRating || t.avg_rating || 3)) + ((t.ratingCount || t.rating_count || 0) > 5 ? 1 : 0),
          }));
          const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
          let rand = Math.random() * totalWeight;
          for (const w of weighted) {
            rand -= w.weight;
            if (rand <= 0) { tea = w.tea; break; }
          }
          if (!tea) tea = pool[Math.floor(Math.random() * pool.length)];
        } else {
          tea = pool[Math.floor(Math.random() * pool.length)];
        }
      }
      setSelectedTea(tea);
      setIsSpinning(false);
      
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
    onClose?.();
  };
  
  const handleBrewTea = () => {
    if (selectedTea) {
      handleClose();
      onBrewTea?.(selectedTea);
    }
  };
  
  const handleViewTea = () => {
    if (selectedTea) {
      handleClose();
      onViewTea?.(selectedTea);
    }
  };
  
  const spinRotation = spinValue.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['0deg', '360deg', '720deg', '1080deg'],
  });
  
  const teaColor = selectedTea ? getTeaTypeColor(selectedTea.teaType) : null;
  const teaPool = getTeaPool();
  const isFromCollection = source === 'collection';
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.background.primary }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={theme.text.secondary} />
          </TouchableOpacity>
          
          {isSpinning ? (
            <View style={styles.spinningContainer}>
              <Animated.View style={[styles.spinningIcon, { transform: [{ rotate: spinRotation }] }]}>
                <TeaCup size={80} color={theme.accent.primary} strokeWidth={1.5} />
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
              
              <Animated.View style={[styles.floatingIcon, styles.floatingIcon1, {
                opacity: shuffleEmojis,
                transform: [{
                  translateY: shuffleEmojis.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                }],
              }]}>
                <Coffee size={32} color={theme.text.secondary} strokeWidth={1.5} />
              </Animated.View>
              <Animated.View style={[styles.floatingIcon, styles.floatingIcon2, {
                opacity: shuffleEmojis,
                transform: [{
                  translateY: shuffleEmojis.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                }],
              }]}>
                <Teapot size={32} color={theme.text.secondary} strokeWidth={1.5} />
              </Animated.View>
            </View>
          ) : selectedTea ? (
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
              
              <View style={[styles.teaCard, { 
                backgroundColor: theme.background.secondary,
                borderColor: teaColor?.primary || theme.border.light,
              }]}>
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
              
              <Text style={[styles.sourceText, { color: theme.text.secondary }]}>
                {isFromCollection 
                  ? `Selected from your collection of ${collection.length} teas`
                  : `Selected from ${teaPool.length} teas`}
              </Text>
              
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
                  onPress={runSpinAnimation}
                >
                  <Shuffle size={16} color={theme.text.secondary} />
                  <Text style={[styles.rerollText, { color: theme.text.secondary }]}>
                    Pick again
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.background.secondary }]}>
                <Leaf size={48} color={theme.text.secondary} strokeWidth={1.5} />
              </View>
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
  );
};

const styles = StyleSheet.create({
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
  spinningIcon: {
    marginBottom: 24,
  },
  spinningText: {
    ...typography.body,
    fontWeight: '500',
  },
  floatingIcon: {
    position: 'absolute',
  },
  floatingIcon1: {
    top: 40,
    left: 20,
  },
  floatingIcon2: {
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
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
