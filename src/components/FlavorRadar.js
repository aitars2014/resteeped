import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { typography, spacing } from '../constants';
import { useTheme } from '../context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Standard flavor dimensions for tea
const FLAVOR_DIMENSIONS = [
  'Sweet',
  'Floral',
  'Vegetal',
  'Earthy',
  'Smoky',
  'Astringent',
];

// Map common flavor notes to dimensions
const FLAVOR_MAPPING = {
  // Sweet
  sweet: 'Sweet', honey: 'Sweet', caramel: 'Sweet', malty: 'Sweet', 
  chocolate: 'Sweet', vanilla: 'Sweet', fruity: 'Sweet',
  // Floral
  floral: 'Floral', jasmine: 'Floral', rose: 'Floral', orchid: 'Floral',
  lavender: 'Floral', fragrant: 'Floral',
  // Vegetal
  vegetal: 'Vegetal', grassy: 'Vegetal', fresh: 'Vegetal', green: 'Vegetal',
  herbaceous: 'Vegetal', spinach: 'Vegetal', seaweed: 'Vegetal',
  // Earthy
  earthy: 'Earthy', mineral: 'Earthy', woody: 'Earthy', mossy: 'Earthy',
  forest: 'Earthy', mushroom: 'Earthy', wet: 'Earthy',
  // Smoky
  smoky: 'Smoky', roasted: 'Smoky', toasted: 'Smoky', charred: 'Smoky',
  campfire: 'Smoky', burnt: 'Smoky',
  // Astringent
  astringent: 'Astringent', bitter: 'Astringent', tannic: 'Astringent',
  dry: 'Astringent', brisk: 'Astringent', bold: 'Astringent',
};

/**
 * Convert flavor notes array to radar chart values
 */
const computeFlavorProfile = (flavorNotes = []) => {
  const profile = {};
  FLAVOR_DIMENSIONS.forEach(dim => {
    profile[dim] = 0;
  });
  
  flavorNotes.forEach(note => {
    const normalizedNote = note.toLowerCase();
    const dimension = FLAVOR_MAPPING[normalizedNote];
    if (dimension) {
      profile[dimension] = Math.min(5, profile[dimension] + 1.5);
    }
  });
  
  // Ensure minimum visibility if any notes exist
  if (flavorNotes.length > 0) {
    Object.keys(profile).forEach(key => {
      if (profile[key] > 0 && profile[key] < 1) {
        profile[key] = 1;
      }
    });
  }
  
  return profile;
};

export const FlavorRadar = ({ 
  flavorNotes = [], 
  size = SCREEN_WIDTH - (spacing.screenHorizontal * 2) - 40,
  showLabels = true,
}) => {
  const { theme, isDark } = useTheme();
  const profile = computeFlavorProfile(flavorNotes);
  const center = size / 2;
  const maxRadius = (size / 2) - 30; // Leave room for labels
  const levels = 5;
  
  // Grid color - more visible in dark mode
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.3)' : theme.border.light;
  
  // Calculate points for each dimension
  const angleStep = (2 * Math.PI) / FLAVOR_DIMENSIONS.length;
  const startAngle = -Math.PI / 2; // Start from top
  
  const getPoint = (dimension, value) => {
    const index = FLAVOR_DIMENSIONS.indexOf(dimension);
    const angle = startAngle + (index * angleStep);
    const radius = (value / 5) * maxRadius;
    return {
      x: center + (radius * Math.cos(angle)),
      y: center + (radius * Math.sin(angle)),
    };
  };
  
  // Generate polygon points for the data
  const dataPoints = FLAVOR_DIMENSIONS.map(dim => {
    const point = getPoint(dim, profile[dim] || 0);
    return `${point.x},${point.y}`;
  }).join(' ');
  
  // Generate background grid
  const renderGrid = () => {
    const gridLines = [];
    
    // Concentric polygons
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (level / levels) * maxRadius;
      const points = FLAVOR_DIMENSIONS.map((_, index) => {
        const angle = startAngle + (index * angleStep);
        return `${center + (levelRadius * Math.cos(angle))},${center + (levelRadius * Math.sin(angle))}`;
      }).join(' ');
      
      gridLines.push(
        <Polygon
          key={`grid-${level}`}
          points={points}
          fill="none"
          stroke={gridColor}
          strokeWidth={1}
        />
      );
    }
    
    // Radial lines
    FLAVOR_DIMENSIONS.forEach((_, index) => {
      const angle = startAngle + (index * angleStep);
      const endX = center + (maxRadius * Math.cos(angle));
      const endY = center + (maxRadius * Math.sin(angle));
      
      gridLines.push(
        <Line
          key={`line-${index}`}
          x1={center}
          y1={center}
          x2={endX}
          y2={endY}
          stroke={gridColor}
          strokeWidth={1}
        />
      );
    });
    
    return gridLines;
  };
  
  // Render dimension labels
  const renderLabels = () => {
    return FLAVOR_DIMENSIONS.map((dim, index) => {
      const angle = startAngle + (index * angleStep);
      const labelRadius = maxRadius + 20;
      const x = center + (labelRadius * Math.cos(angle));
      const y = center + (labelRadius * Math.sin(angle));
      
      return (
        <SvgText
          key={`label-${dim}`}
          x={x}
          y={y}
          fontSize={11}
          fill={theme.text.secondary}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {dim}
        </SvgText>
      );
    });
  };
  
  const hasData = Object.values(profile).some(v => v > 0);
  
  if (!hasData) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={styles.noData}>
          <Text style={[styles.noDataText, { color: theme.text.secondary }]}>No flavor profile available</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background grid */}
        {renderGrid()}
        
        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill={theme.accent.primary + '40'}
          stroke={theme.accent.primary}
          strokeWidth={2}
        />
        
        {/* Data points */}
        {FLAVOR_DIMENSIONS.map((dim, index) => {
          const value = profile[dim] || 0;
          if (value === 0) return null;
          
          const point = getPoint(dim, value);
          return (
            <Circle
              key={`point-${dim}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={theme.accent.primary}
            />
          );
        })}
        
        {/* Labels */}
        {showLabels && renderLabels()}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noData: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    ...typography.caption,
  },
});

export default FlavorRadar;
