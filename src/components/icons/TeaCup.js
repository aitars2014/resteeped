import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Tea Cup icon - Simple handleless tea cup (yunomi style)
 * Matches Lucide style: 24x24, 2px stroke, round caps/joins
 */
export const TeaCup = ({ 
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
    {/* Cup body - slightly tapered */}
    <Path d="M5 6h14l-1 12c0 2-2 3-6 3s-6-1-6-3L5 6z" />
    {/* Steam lines */}
    <Path d="M9 3c0-1 1-1 1 0s1 1 1 0" />
    <Path d="M13 3c0-1 1-1 1 0s1 1 1 0" />
  </Svg>
);

export default TeaCup;
