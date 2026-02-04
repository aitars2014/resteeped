import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Tea Leaf icon - Elegant single tea leaf
 * Matches Lucide style: 24x24, 2px stroke, round caps/joins
 */
export const TeaLeaf = ({ 
  size = 24, 
  color = 'currentColor', 
  strokeWidth = 2,
  ...props 
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Leaf shape */}
    <Path d="M12 2c-4 0-8 4-8 10s4 10 8 10c4 0 8-4 8-10S16 2 12 2z" />
    {/* Center vein */}
    <Path d="M12 4v16" />
    {/* Side veins */}
    <Path d="M12 8l-4 3" />
    <Path d="M12 8l4 3" />
    <Path d="M12 13l-3 2" />
    <Path d="M12 13l3 2" />
  </Svg>
);

export default TeaLeaf;
