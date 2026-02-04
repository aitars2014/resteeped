import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

/**
 * Kyusu icon - Japanese side-handle teapot
 * Matches Lucide style: 24x24, 2px stroke, round caps/joins
 */
export const Kyusu = ({ 
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
    <Circle cx="12" cy="5" r="1" />
    {/* Lid */}
    <Path d="M8 7h8" />
    {/* Body - squat and wide */}
    <Path d="M5 9h14c0 6-3 10-7 10s-7-4-7-10z" />
    {/* Side handle (extending right at 90 degrees) */}
    <Path d="M19 11h3" />
    <Path d="M22 11v4" />
    <Path d="M22 15h-3" />
    {/* Spout */}
    <Path d="M5 11l-3-2" />
  </Svg>
);

export default Kyusu;
