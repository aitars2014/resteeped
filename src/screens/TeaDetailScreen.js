import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Thermometer, Clock, MapPin, Star } from 'lucide-react-native';
import { colors, typography, spacing, getTeaTypeColor } from '../constants';
import { Button, TeaTypeBadge, StarRating, FactCard } from '../components';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.35;

export const TeaDetailScreen = ({ route, navigation }) => {
  const { tea } = route.params;
  const teaColor = getTeaTypeColor(tea.teaType);
  const [isInCollection, setIsInCollection] = useState(false);
  
  const handleAddToCollection = () => {
    setIsInCollection(!isInCollection);
    // TODO: Save to Supabase
  };
  
  const handleBrewTea = () => {
    navigation.navigate('Timer', { tea });
  };
  
  const formatSteepTime = () => {
    if (tea.steepTimeMin && tea.steepTimeMax) {
      return `${tea.steepTimeMin}-${tea.steepTimeMax} minutes`;
    }
    return tea.steepTimeMin ? `${tea.steepTimeMin} minutes` : 'Not specified';
  };
  
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={[teaColor.primary, teaColor.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          />
          {/* Overlay for text legibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.heroOverlay}
          />
          
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Tea Name and Brand */}
          <Text style={styles.teaName}>{tea.name}</Text>
          <Text style={styles.brandName}>{tea.brandName}</Text>
          
          {/* Tea Type Badge */}
          <View style={styles.badgeRow}>
            <TeaTypeBadge teaType={tea.teaType} size="large" />
          </View>
          
          {/* Fact Cards */}
          <View style={styles.factsContainer}>
            {tea.steepTempF && (
              <FactCard 
                icon={<Thermometer size={24} color={colors.accent.primary} />}
                value={`${tea.steepTempF}°F`}
                label="Recommended temperature"
              />
            )}
            
            {tea.steepTimeMin && (
              <FactCard 
                icon={<Clock size={24} color={colors.accent.primary} />}
                value={formatSteepTime()}
                label="Recommended steep time"
              />
            )}
            
            {tea.origin && (
              <FactCard 
                icon={<MapPin size={24} color={colors.accent.primary} />}
                value={tea.origin}
                label="Origin"
              />
            )}
            
            <FactCard 
              icon={<Star size={24} color={colors.rating.star} fill={colors.rating.star} />}
              value={`${tea.avgRating.toFixed(1)} out of 5`}
              label={`Based on ${tea.ratingCount} review${tea.ratingCount !== 1 ? 's' : ''}`}
            />
          </View>
          
          {/* Description */}
          {tea.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this tea</Text>
              <Text style={styles.description}>{tea.description}</Text>
            </View>
          )}
          
          {/* Flavor Notes */}
          {tea.flavorNotes && tea.flavorNotes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Flavor notes</Text>
              <View style={styles.flavorTags}>
                {tea.flavorNotes.map((note, index) => (
                  <View key={index} style={styles.flavorTag}>
                    <Text style={styles.flavorTagText}>{note}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Spacer for buttons */}
          <View style={{ height: 140 }} />
        </View>
      </ScrollView>
      
      {/* Sticky Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button 
          title={isInCollection ? "In My Collection ✓" : "Add to My Teas"}
          onPress={handleAddToCollection}
          variant="primary"
          style={[
            styles.button,
            isInCollection && styles.inCollectionButton,
          ]}
        />
        <Button 
          title="Brew This Tea"
          onPress={handleBrewTea}
          variant="secondary"
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow.elevated,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.sectionSpacing,
  },
  teaName: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: 4,
  },
  brandName: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  badgeRow: {
    marginBottom: spacing.sectionSpacing,
  },
  factsContainer: {
    gap: spacing.elementSpacing,
    marginBottom: spacing.sectionSpacing,
  },
  section: {
    marginBottom: spacing.sectionSpacing,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  flavorTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flavorTag: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  flavorTagText: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.elementSpacing,
  },
  button: {
    width: '100%',
  },
  inCollectionButton: {
    backgroundColor: colors.accent.secondary,
  },
});
