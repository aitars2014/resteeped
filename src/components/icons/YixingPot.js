import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * Yixing Pot icon - Traditional Chinese clay teapot
 * Distinctive shape: flat-topped, compact body
 * Matches Lucide style: 24x24, 2px stroke, round caps/joins
 */
export const YixingPot = ({ 
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
    {/* Lid knob - button style */}
    <Circle cx="12" cy="5" r="1.5" />
    {/* Lid - flat */}
    <Path d="M7 8h10" />
    {/* Body - compact, rounded rectangle shape */}
    <Path d="M6 10h12c1 0 2 1 2 2v4c0 3-2 5-8 5s-8-2-8-5v-4c0-1 1-2 2-2z" />
    {/* Handle - loop style */}
    <Path d="M20 12c1.5 0 2.5 1 2.5 2.5S21.5 17 20 17" />
    {/* Spout - straight */}
    <Path d="M4 13l-2.5-1.5" />
    <Path d="M1.5 11.5l-0.5 2" />
  </Svg>
);

export default YixingPot;
