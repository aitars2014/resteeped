#!/usr/bin/env python3
"""Generate App Store screenshots with phone mockups on gradient backgrounds with headline text."""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SCREENSHOTS_DIR = "/Users/tars/projects/resteeped/screenshots"
OUTPUT_DIR = "/Users/tars/projects/resteeped/screenshots/appstore"

# App Store 6.7" dimensions
CANVAS_WIDTH = 1290
CANVAS_HEIGHT = 2796

SLIDES = [
    {
        "input": "01-home.png",
        "headline": "Your Personal\nTea Companion",
        "subhead": "8,000+ teas from 70+ brands",
        "gradient": ["#2D4A2D", "#4A7C59"],
    },
    {
        "input": "02-discover.png",
        "headline": "Explore\n8,000+ Teas",
        "subhead": "Browse by type, brand, or flavor",
        "gradient": ["#6B8E6B", "#C4A265"],
    },
    {
        "input": "03-tea-detail.png",
        "headline": "Know Every\nDetail",
        "subhead": "Brewing guides, tasting notes & more",
        "gradient": ["#C17547", "#8B4513"],
    },
    {
        "input": "04-timer.png",
        "headline": "Perfect Steep,\nEvery Time",
        "subhead": "Western, gongfu & cold brew modes",
        "gradient": ["#3A6B4A", "#7FB89A"],
    },
    {
        "input": "05-collection.png",
        "headline": "Track Your\nTea Journey",
        "subhead": "Build your personal collection",
        "gradient": ["#8BA0B8", "#D0C8BE"],
        "dark_text": True,
    },
    {
        "input": "07-teafinder.png",
        "headline": "AI-Powered\nRecommendations",
        "subhead": "Tell Teabeard what you're craving",
        "gradient": ["#1B2B1A", "#3A5A3A"],
    },
]


def hex_to_rgb(hex_color):
    return (int(hex_color[1:3], 16), int(hex_color[3:5], 16), int(hex_color[5:7], 16))


def create_gradient(width, height, color1_hex, color2_hex):
    """Create a smooth diagonal gradient using numpy."""
    c1 = np.array(hex_to_rgb(color1_hex), dtype=np.float64)
    c2 = np.array(hex_to_rgb(color2_hex), dtype=np.float64)
    
    # Create coordinate grids
    y_ratio = np.linspace(0, 1, height).reshape(-1, 1)
    x_ratio = np.linspace(0, 1, width).reshape(1, -1)
    
    # Diagonal blend (70% vertical, 30% horizontal)
    ratio = np.clip(y_ratio * 0.7 + x_ratio * 0.3, 0, 1)
    
    # Interpolate colors
    pixels = np.zeros((height, width, 3), dtype=np.uint8)
    for i in range(3):
        pixels[:, :, i] = (c1[i] + (c2[i] - c1[i]) * ratio).astype(np.uint8)
    
    return Image.fromarray(pixels, "RGB")


def get_font(bold=True, size=96):
    """Try system fonts, return best available."""
    if bold:
        paths = [
            "/System/Library/Fonts/SFProDisplay-Bold.otf",
            "/System/Library/Fonts/SFNS.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ]
    else:
        paths = [
            "/System/Library/Fonts/SFProDisplay-Regular.otf",
            "/System/Library/Fonts/SFNS.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
        ]
    
    for fp in paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except:
                continue
    return ImageFont.load_default()


def add_text(img, headline, subhead, dark_text=False):
    """Add headline and subhead text."""
    draw = ImageDraw.Draw(img)
    
    headline_font = get_font(bold=True, size=108)
    sub_font = get_font(bold=False, size=46)
    
    text_color = "#1a1a1a" if dark_text else "#FFFFFF"
    sub_color = "#444444" if dark_text else "rgba(255,255,255,200)"
    sub_fill = (68, 68, 68, 255) if dark_text else (255, 255, 255, 200)
    
    # Draw headline centered
    y_pos = 160
    for line in headline.split("\n"):
        bbox = draw.textbbox((0, 0), line, font=headline_font)
        tw = bbox[2] - bbox[0]
        x = (img.width - tw) // 2
        
        # Subtle text shadow for readability
        if not dark_text:
            draw.text((x + 3, y_pos + 3), line, fill=(0, 0, 0, 60), font=headline_font)
        
        draw.text((x, y_pos), line, fill=text_color, font=headline_font)
        y_pos += bbox[3] - bbox[1] + 16
    
    # Subhead
    y_pos += 24
    bbox = draw.textbbox((0, 0), subhead, font=sub_font)
    tw = bbox[2] - bbox[0]
    x = (img.width - tw) // 2
    draw.text((x, y_pos), subhead, fill=sub_fill, font=sub_font)
    
    return y_pos + bbox[3] - bbox[1]  # return bottom of text


def create_phone_mockup(screenshot_path, phone_height=2000):
    """Create a realistic phone frame with shadow."""
    screenshot = Image.open(screenshot_path).convert("RGBA")
    
    phone_width = int(phone_height * 0.462)  # iPhone aspect ratio
    bezel = 28
    corner_radius = 120
    
    inner_w = phone_width - 2 * bezel
    inner_h = phone_height - 2 * bezel
    
    # Crop status bar from screenshot (top ~177px at 3x = 59pt safe area)
    crop_top = 177  # Remove status bar
    crop_bottom = 0
    if screenshot.height > crop_top:
        screenshot = screenshot.crop((0, crop_top, screenshot.width, screenshot.height - crop_bottom))
    
    screenshot = screenshot.resize((inner_w, inner_h), Image.LANCZOS)
    
    # Phone body
    total_w = phone_width + 100  # Extra space for shadow
    total_h = phone_height + 100
    
    # Shadow layer
    shadow = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        [50 + 8, 50 + 12, 50 + phone_width + 8, 50 + phone_height + 12],
        radius=corner_radius,
        fill=(0, 0, 0, 100),
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=25))
    
    # Phone frame
    frame = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    
    # Outer body (titanium gray)
    frame_draw.rounded_rectangle(
        [50, 50, 50 + phone_width, 50 + phone_height],
        radius=corner_radius,
        fill=(30, 30, 30, 255),
    )
    
    # Subtle edge highlight (top-left)
    frame_draw.rounded_rectangle(
        [50, 50, 50 + phone_width, 50 + phone_height],
        radius=corner_radius,
        outline=(60, 60, 60, 255),
        width=2,
    )
    
    # Inner screen with rounded mask
    inner_corner = corner_radius - bezel
    screen_mask = Image.new("L", (inner_w, inner_h), 0)
    mask_draw = ImageDraw.Draw(screen_mask)
    mask_draw.rounded_rectangle(
        [0, 0, inner_w - 1, inner_h - 1],
        radius=inner_corner,
        fill=255,
    )
    
    frame.paste(screenshot, (50 + bezel, 50 + bezel), screen_mask)
    
    # Dynamic Island
    island_w, island_h = 280, 80
    island_x = 50 + (phone_width - island_w) // 2
    island_y = 50 + bezel + 20
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle(
        [island_x, island_y, island_x + island_w, island_y + island_h],
        radius=island_h // 2,
        fill=(0, 0, 0, 255),
    )
    
    # Composite shadow + frame
    result = Image.alpha_composite(shadow, frame)
    return result


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for i, slide in enumerate(SLIDES, 1):
        input_path = os.path.join(SCREENSHOTS_DIR, slide["input"])
        output_path = os.path.join(OUTPUT_DIR, f"appstore-{i:02d}.png")
        
        if not os.path.exists(input_path):
            print(f"⚠️  Missing: {input_path}")
            continue
        
        print(f"Generating slide {i}: {slide['headline'].replace(chr(10), ' ')}...")
        
        # Create gradient background
        bg = create_gradient(CANVAS_WIDTH, CANVAS_HEIGHT, *slide["gradient"])
        bg = bg.convert("RGBA")
        
        # Add text first to know where it ends
        dark_text = slide.get("dark_text", False)
        text_bottom = add_text(bg, slide["headline"], slide["subhead"], dark_text)
        
        # Create phone mockup
        phone = create_phone_mockup(input_path, phone_height=2050)
        
        # Position phone: top of phone starts just below text with some gap
        phone_x = (CANVAS_WIDTH - phone.width) // 2
        phone_y = text_bottom + 60  # Phone starts right after text
        
        # If phone extends below canvas, that's fine — bottom gets clipped naturally
        bg.paste(phone, (phone_x, phone_y), phone)
        
        # Convert back to RGB for PNG
        final = bg.convert("RGB")
        final.save(output_path, "PNG", optimize=True)
        print(f"  ✅ Saved: {output_path} ({os.path.getsize(output_path) // 1024}KB)")
    
    print(f"\nDone! {len(SLIDES)} screenshots in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
