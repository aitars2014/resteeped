import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Gaiwan icon - Traditional Chinese lidded bowl
 * Matches Lucide style: 24x24, 2px stroke, round caps/joins
 */
export const Gaiwan = ({ 
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
    {/* Lid knob */}
    <Path d="M11 3h2" />
    {/* Lid top */}
    <Path d="M8 5h8" />
    {/* Lid rim */}
    <Path d="M6 7h12" />
    {/* Bowl */}
    <Path d="M5 9c0 5 3 8 7 8s7-3 7-8H5z" />
    {/* Saucer */}
    <Path d="M3 20c0-1 2-2 9-2s9 1 9 2" />
  </Svg>
);

export default Gaiwan;
