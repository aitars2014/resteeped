import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * Teapot icon - Classic round teapot
 * Matches Lucide style: 24x24, 2px stroke, round caps/joins
 */
export const Teapot = ({ 
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
    <Circle cx="12" cy="4" r="1" />
    {/* Lid */}
    <Path d="M8 6h8" />
    {/* Body */}
    <Path d="M6 8c-1 0-2 1-2 3v2c0 4 3 7 8 7s8-3 8-7v-2c0-2-1-3-2-3" />
    {/* Handle */}
    <Path d="M20 10c2 0 3 1 3 3s-1 3-3 3" />
    {/* Spout */}
    <Path d="M4 12c-2 0-3-1-3-2s1-2 2-2l1 1" />
  </Svg>
);

export default Teapot;
