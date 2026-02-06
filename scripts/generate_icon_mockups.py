#!/usr/bin/env python3
"""Generate app icon mockup concepts for Resteeped"""
from PIL import Image, ImageDraw
import os

OUTPUT_DIR = os.path.expanduser("~/projects/resteeped/assets/icon_mockups")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIZE = 1024

# Brand colors
CREAM = (250, 249, 246)
DARK_GREEN = (56, 87, 35)
LIGHT_GREEN = (124, 179, 66)
MID_GREEN = (85, 139, 47)
CHARCOAL = (38, 38, 38)
WARM_WHITE = (255, 252, 245)

def draw_tea_leaves(draw, cx, cy, scale, colors):
    """Draw stylized tea leaves"""
    dark, mid, light = colors
    
    # Main leaf (large, dark)
    leaf1_points = [
        (cx - 80*scale, cy + 120*scale),
        (cx - 40*scale, cy - 80*scale),
        (cx + 20*scale, cy - 200*scale),
        (cx + 60*scale, cy - 80*scale),
        (cx + 20*scale, cy + 120*scale),
    ]
    draw.polygon(leaf1_points, fill=dark)
    
    # Second leaf (medium, mid-tone)
    leaf2_points = [
        (cx + 40*scale, cy + 80*scale),
        (cx + 100*scale, cy - 40*scale),
        (cx + 180*scale, cy - 120*scale),
        (cx + 160*scale, cy - 20*scale),
        (cx + 80*scale, cy + 80*scale),
    ]
    draw.polygon(leaf2_points, fill=mid)
    
    # Third leaf (small, light)
    leaf3_points = [
        (cx - 100*scale, cy + 60*scale),
        (cx - 160*scale, cy - 20*scale),
        (cx - 180*scale, cy - 100*scale),
        (cx - 140*scale, cy - 40*scale),
        (cx - 80*scale, cy + 40*scale),
    ]
    draw.polygon(leaf3_points, fill=light)

def draw_cup(draw, cx, cy, scale, color):
    """Draw stylized tea cup"""
    # Cup body (arc)
    cup_bbox = [
        cx - 140*scale, cy + 40*scale,
        cx + 140*scale, cy + 200*scale
    ]
    draw.arc(cup_bbox, 0, 180, fill=color, width=int(24*scale))
    
    # Cup handle
    handle_bbox = [
        cx + 100*scale, cy + 60*scale,
        cx + 180*scale, cy + 160*scale
    ]
    draw.arc(handle_bbox, -60, 120, fill=color, width=int(20*scale))

# Option 1: Clean edge-to-edge (light)
img1 = Image.new('RGB', (SIZE, SIZE), CREAM)
draw1 = ImageDraw.Draw(img1)
draw_tea_leaves(draw1, SIZE//2, SIZE//2 + 50, 1.8, (DARK_GREEN, MID_GREEN, LIGHT_GREEN))
draw_cup(draw1, SIZE//2, SIZE//2 + 50, 1.8, DARK_GREEN)
img1.save(f"{OUTPUT_DIR}/option1_light_clean.png")
print(f"Created: option1_light_clean.png")

# Option 2: Bold minimal (light) - larger, simpler
img2 = Image.new('RGB', (SIZE, SIZE), WARM_WHITE)
draw2 = ImageDraw.Draw(img2)
# Single bold leaf
draw2.ellipse([200, 150, 500, 700], fill=DARK_GREEN)
draw2.ellipse([400, 250, 750, 650], fill=MID_GREEN)
draw2.ellipse([500, 400, 850, 750], fill=LIGHT_GREEN)
# Simple cup arc
draw2.arc([250, 550, 750, 900], 0, 180, fill=DARK_GREEN, width=50)
draw2.arc([650, 620, 820, 820], -60, 120, fill=DARK_GREEN, width=40)
img2.save(f"{OUTPUT_DIR}/option2_bold_minimal.png")
print(f"Created: option2_bold_minimal.png")

# Option 3: Dark mode variant
img3 = Image.new('RGB', (SIZE, SIZE), CHARCOAL)
draw3 = ImageDraw.Draw(img3)
draw_tea_leaves(draw3, SIZE//2, SIZE//2 + 50, 1.8, (LIGHT_GREEN, MID_GREEN, (180, 220, 140)))
draw_cup(draw3, SIZE//2, SIZE//2 + 50, 1.8, LIGHT_GREEN)
img3.save(f"{OUTPUT_DIR}/option3_dark_mode.png")
print(f"Created: option3_dark_mode.png")

# Option 4: Gradient/modern dark
img4 = Image.new('RGB', (SIZE, SIZE), (30, 45, 30))
draw4 = ImageDraw.Draw(img4)
# Glowing leaves effect
draw4.ellipse([180, 130, 520, 720], fill=(70, 120, 50))
draw4.ellipse([380, 230, 770, 670], fill=(90, 150, 60))
draw4.ellipse([480, 380, 870, 770], fill=(120, 180, 80))
draw4.arc([230, 530, 770, 920], 0, 180, fill=(150, 200, 100), width=55)
draw4.arc([670, 600, 850, 840], -60, 120, fill=(150, 200, 100), width=45)
img4.save(f"{OUTPUT_DIR}/option4_modern_dark.png")
print(f"Created: option4_modern_dark.png")

print(f"\nAll mockups saved to: {OUTPUT_DIR}")
