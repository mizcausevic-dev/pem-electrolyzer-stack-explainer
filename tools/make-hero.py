#!/usr/bin/env python3
"""Hero image for the PEM electrolyzer explainer. Drawn, not generated.
1600x900. Same palette and stack geometry language as the animation."""
from PIL import Image, ImageDraw, ImageFont
import math, os

W, H = 1600, 900
INK = (11, 16, 25); PANEL = (17, 26, 42); STRUCT = (52, 66, 87)
STRUCT_L = (70, 88, 111); BONE = (232, 228, 216); MUTED = (138, 153, 176)
CYAN = (0, 229, 255); GOLD = (255, 209, 102); VIOLET = (157, 78, 221)

img = Image.new("RGB", (W, H), INK)
d = ImageDraw.Draw(img, "RGBA")

def font(path, size):
    return ImageFont.truetype(path, size)
MONO_B = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf"
MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf"
# Space Grotesk fallback: DejaVu Sans Bold reads close enough at hero scale
SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# grid
for x in range(0, W, 44):
    d.line([(x, 0), (x, H)], fill=(255, 255, 255, 10), width=1)
for y in range(0, H, 44):
    d.line([(0, y), (W, y)], fill=(255, 255, 255, 10), width=1)

# glow behind stack
for r in range(420, 0, -20):
    d.ellipse([800 - r, 470 - r * 0.62, 800 + r, 470 + r * 0.62], fill=(0, 229, 255, 3))

# exploded stack (side section), centered
layers = [
    ("END PLATE", 52, (35, 47, 66), STRUCT_L),
    ("BIPOLAR PLATE", 34, STRUCT, STRUCT_L),
    ("PTL", 28, (44, 58, 80), (61, 79, 107)),
    ("ANODE CATALYST", 16, (74, 63, 34), GOLD),
    ("PEM MEMBRANE", 22, (216, 210, 190), BONE),
    ("CATHODE CATALYST", 16, (74, 63, 34), GOLD),
    ("PTL", 28, (44, 58, 80), (61, 79, 107)),
    ("BIPOLAR PLATE", 34, STRUCT, STRUCT_L),
    ("END PLATE", 52, (35, 47, 66), STRUCT_L),
]
gap = 18
total = sum(l[1] for l in layers) + gap * (len(layers) - 1)
x = 800 - total // 2
cy, sh = 470, 330
centers = []
for name, w, fill, edge in layers:
    d.rounded_rectangle([x, cy - sh // 2, x + w, cy + sh // 2], 4, fill=fill, outline=edge, width=2)
    centers.append(x + w // 2)
    x += w + gap
# tie rods
for dy in (-sh // 2 - 20, sh // 2 + 20):
    d.line([(centers[0] - 50, cy + dy), (centers[-1] + 50, cy + dy)], fill=STRUCT_L, width=7)
# membrane hydration ticks
mx = centers[4]
for k in range(10):
    d.rectangle([mx - 6, cy - sh // 2 + 18 + k * 31, mx + 6, cy - sh // 2 + 20 + k * 31], fill=(0, 229, 255, 90))
# catalyst speckle (deterministic)
import random
rng = random.Random(42)
for ci in (3, 5):
    for _ in range(26):
        px = centers[ci] - 6 + rng.random() * 12
        py = cy - sh // 2 + 12 + rng.random() * (sh - 24)
        d.rectangle([px, py, px + 3, py + 3], fill=GOLD)

# electron path (gold, over the top)
top = cy - sh // 2
d.line([(centers[3], top - 8), (centers[3], top - 74), (centers[5], top - 74), (centers[5], top - 8)], fill=GOLD, width=5)
d.rounded_rectangle([800 - 52, top - 96, 800 + 52, top - 52], 8, fill=INK, outline=GOLD, width=2)
d.text((800, top - 74), "DC", font=font(MONO_B, 26), fill=GOLD, anchor="mm")
d.text((800, top - 122), "ELECTRONS: EXTERNAL CIRCUIT", font=font(MONO_B, 19), fill=GOLD, anchor="mm")

# protons + bubbles
for i in range(7):
    px = centers[3] + 14 + i * ((centers[5] - centers[3] - 28) / 6)
    py = cy - 120 + (i % 3) * 80
    d.ellipse([px - 8, py - 8, px + 8, py + 8], fill=CYAN)
    d.text((px, py - 20), "H+", font=font(MONO_B, 14), fill=CYAN, anchor="mm")
for i in range(6):  # O2 left
    bx = centers[2] - 26 + (i % 2) * 10; by = cy + 110 - i * 38
    d.ellipse([bx - 7, by - 7, bx + 7, by + 7], outline=CYAN, width=2)
for i in range(11):  # H2 right, ~2:1
    bx = centers[6] + 22 + (i % 2) * 10; by = cy + 130 - i * 24
    d.ellipse([bx - 6, by - 6, bx + 6, by + 6], outline=CYAN, width=2)
d.text((centers[2] - 22, top - 34), "O2", font=font(MONO_B, 24), fill=CYAN, anchor="mm")
d.text((centers[6] + 24, top - 30), "H2", font=font(MONO_B, 24), fill=CYAN, anchor="mm")

# side labels
def label(s, x, y, color=MUTED, anchor="lm"):
    d.text((x, y), s, font=font(MONO_B, 19), fill=color, anchor=anchor)
label("END PLATE", centers[0] - 70, cy - 190, anchor="rm")
label("BIPOLAR PLATE", centers[7], cy + sh // 2 + 52, anchor="mm")
label("PEM MEMBRANE", mx, cy + sh // 2 + 88, VIOLET, "mm")
label("ANODE CAT.", centers[3]-34, cy + sh // 2 + 52, GOLD, "mm")
label("CATHODE CAT.", centers[5]+88, cy - 196, GOLD, "lm")
d.line([(centers[0] - 60, cy - 180), (centers[0] - 6, cy - 166)], fill=MUTED, width=1)
d.line([(mx, cy + sh // 2 + 8), (mx, cy + sh // 2 + 70)], fill=VIOLET, width=1)

# BOP hints
d.rounded_rectangle([70, 120, 330, 196], 12, fill=PANEL, outline=GOLD, width=2)
d.text((200, 148), "DC POWER SUPPLY", font=font(MONO_B, 19), fill=BONE, anchor="mm")
d.text((200, 174), "ACTUATION · GOLD", font=font(MONO, 14), fill=MUTED, anchor="mm")
d.rounded_rectangle([1270, 120, 1530, 196], 12, fill=PANEL, outline=CYAN, width=2)
d.text((1400, 148), "H2 OUT · DRYER", font=font(MONO_B, 19), fill=BONE, anchor="mm")
d.text((1400, 174), "PRIMARY PATH · CYAN", font=font(MONO, 14), fill=MUTED, anchor="mm")
d.rounded_rectangle([1270, 640, 1530, 716], 12, fill=PANEL, outline=VIOLET, width=2)
d.text((1400, 668), "SENSORS + CONTROL", font=font(MONO_B, 19), fill=BONE, anchor="mm")
d.text((1400, 694), "STATE · VIOLET", font=font(MONO, 14), fill=MUTED, anchor="mm")

# title block
d.text((70, 56), "PEM ELECTROLYZER STACK", font=font(SANS_B, 54), fill=(255, 255, 255))
d.text((72, 806), "ANATOMY MOTION EXPLAINER · 34 SECONDS · 1,020 FRAMES · GENERIC PEM · NO EFFICIENCY CLAIMS", font=font(MONO_B, 20), fill=CYAN)
d.text((72, 842), "Water in. Protons across. Electrons around. Hydrogen out.", font=font(SANS, 24), fill=BONE)

os.makedirs("public", exist_ok=True)
img.save("public/hero-Cursor.png", optimize=True)
print("wrote public/hero-Cursor.png", img.size)
