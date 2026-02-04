# Illustration Strategy for Resteeped

*Proposal for replacing emojis with a consistent visual system*

## Current State

The app uses system emojis in several places:
- **Tea type buttons**: 🫖 Black, 🍃 Green, 🌿 Oolong, 🤍 White, 🏔️ Pu'erh, 🌸 Herbal
- **Teaware categories**: 🫖 Gaiwan, 🏺 Yixing, ☕ Teapot, 🍵 Kyusu, etc.
- **Empty states**: 🍵, 🔍, 🏪
- **Timer completion**: ☕
- **Health benefits**: Various icons
- **Temperature**: 🌡️

## Recommended Approach: Lucide + Custom SVGs

### Why This Approach
- **Lucide is already installed** — no new dependencies
- **Consistent line weight** — matches our minimalist aesthetic
- **Open source** — MIT licensed, no Twitter/X association
- **Tree-shakeable** — only imports icons we use

### Lucide Icons to Use

| Current | Replacement | Lucide Icon |
|---------|-------------|-------------|
| 🍃 Green | `Leaf` | ✅ Available |
| 🌸 Herbal | `Flower2` | ✅ Available |
| 🌿 Oolong | `TreeDeciduous` or `Sprout` | ✅ Available |
| ☕ Coffee/Tea | `Coffee` | ✅ Available |
| 🔍 Search | `Search` | ✅ Already using |
| 🏪 Shop | `Store` | ✅ Available |
| 🌡️ Temp | `Thermometer` | ✅ Already using |
| ⚖️ Scale | `Scale` | ✅ Available |

### Custom SVGs Needed

For tea-specific items not in Lucide:
1. **Gaiwan** — Traditional lidded bowl
2. **Teapot (Chinese style)** — Round pot with handle
3. **Yixing pot** — Distinctive clay pot shape
4. **Pu'erh cake** — Compressed tea disc (or mountain for terroir)
5. **White tea** — Delicate bud/leaf
6. **Kyusu** — Japanese side-handle pot

### Design Guidelines for Custom SVGs

- **Canvas**: 24x24 (matches Lucide)
- **Stroke**: 2px, round caps, round joins
- **Color**: Single color (inherits from props)
- **Style**: Line art, no fills (or duotone option)
- **Corners**: Slightly rounded (2px radius)

### Implementation Plan

1. **Phase 1: Quick wins with Lucide**
   - Replace Green tea emoji with `Leaf`
   - Replace Herbal emoji with `Flower2`
   - Replace empty state emojis with Lucide equivalents
   - Replace temperature with `Thermometer`

2. **Phase 2: Custom tea icons**
   - Design 6 custom SVG icons for tea types
   - Create `src/components/icons/` directory
   - Match Lucide's visual style

3. **Phase 3: Teaware icons**
   - Design category icons for teaware
   - Gaiwan, Yixing, Kyusu, etc.

### Example Custom Icon Component

```javascript
// src/components/icons/Gaiwan.js
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export const Gaiwan = ({ size = 24, color = 'currentColor', ...props }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Lid */}
    <Path d="M8 6h8" />
    <Path d="M6 8h12" />
    {/* Bowl */}
    <Path d="M5 10c0 4 3 8 7 8s7-4 7-8H5z" />
    {/* Saucer */}
    <Path d="M4 20h16" />
    <Path d="M6 18h12" />
  </Svg>
);
```

### Color Theming

Icons will use theme colors:
```javascript
const TEA_TYPE_ICONS = {
  black: { icon: TeaPot, color: theme.teaTypes.black },
  green: { icon: Leaf, color: theme.teaTypes.green },
  oolong: { icon: Sprout, color: theme.teaTypes.oolong },
  white: { icon: WhiteTeaBud, color: theme.teaTypes.white },
  puerh: { icon: Mountain, color: theme.teaTypes.puerh },
  herbal: { icon: Flower2, color: theme.teaTypes.herbal },
};
```

## Timeline Estimate

- Phase 1 (Lucide swap): 1-2 hours
- Phase 2 (Custom tea icons): 2-3 hours per icon, or source from SVG libraries
- Phase 3 (Teaware icons): Same as Phase 2

## Alternative: Source from Open Libraries

Could source SVGs from:
- **SVG Repo** — Has tea/coffee illustrations
- **Iconoir** — 1,500+ icons, similar aesthetic to Lucide
- **unDraw** — Has lifestyle illustrations

---

*Awaiting feedback before implementation.*
