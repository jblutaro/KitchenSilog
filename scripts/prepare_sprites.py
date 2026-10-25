"""Recover the supplied 16px sprite grid and 8px scene grid from JPEGs.

Pass the directory containing the four original attachments as the first argument.
Only exterior black is transparent; a one-cell outline bordering color is retained.
"""
from collections import deque
from pathlib import Path
import statistics
import sys
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / 'Downloads'
FILES = {
    'stove': 'd5fc4761-4302-4ce1-9029-c3467016adc8.jpe',
    'counter': 'b8db1032-a2d3-4baa-a935-869a571f92aa.jpe',
    'fridge': '68446aba-d507-4a58-aab5-338708e9aa4a.jpe',
    'kitchen-mockup': '87703041-3c3f-4e78-b907-429e3e243974.jpe',
}
PALETTE = ['000000', 'ffcf9f', 'f7b579', 'ce9b68', 'c18e5b',
           '8b5928', '502d0d', 'fff0df', 'd3c3b3', 'ab9b8b',
           '5b4f43', 'c3c1cf', '8b8997', '5b596b', 'a26018',
           'efad61', 'f7f7ef', 'ef5145', 'b35951']
PALETTE = [tuple(bytes.fromhex(c)) for c in PALETTE]


def recover(path, step):
    original = Image.open(path).convert('RGB')
    small = Image.new('RGB', (original.width // step, original.height // step))
    for y in range(small.height):
        for x in range(small.width):
            block = list(original.crop((x*step+step//4, y*step+step//4,
                                       (x+1)*step-step//4, (y+1)*step-step//4)).getdata())
            rgb = tuple(int(statistics.median(p[c] for p in block)) for c in range(3))
            small.putpixel((x, y), min(PALETTE, key=lambda p: sum((p[c]-rgb[c])**2 for c in range(3))))
    return small


for name, filename in FILES.items():
    im = recover(SOURCE / filename, 8 if name == 'kitchen-mockup' else 16)
    if name == 'kitchen-mockup':
        mockup = im
        continue
    w, h = im.size
    # Flood only exterior black. Keep the black ring next to colored cells,
    # because the artwork's outline and its background share the same color.
    exterior = set()
    queue = deque([(x, y) for x in range(w) for y in (0, h-1)] +
                  [(x, y) for y in range(h) for x in (0, w-1)])
    while queue:
        x, y = queue.popleft()
        if not (0 <= x < w and 0 <= y < h) or (x, y) in exterior:
            continue
        if im.getpixel((x, y)) != (0, 0, 0):
            continue
        exterior.add((x, y))
        queue.extend([(x-1, y), (x+1, y), (x, y-1), (x, y+1)])
    color = im.convert('L').point(lambda p: 255 if p else 0)
    outline = color.filter(ImageFilter.MaxFilter(3))
    rgba = im.convert('RGBA')
    for x, y in exterior:
        if not outline.getpixel((x, y)):
            rgba.putpixel((x, y), (0, 0, 0, 0))
    rgba.save(ROOT / 'public' / f'{name}.png')

# Rebuild the wall and continue the floor's repeating diamonds behind appliances.
# The upper wall decorations remain exactly where they were in the mockup.
bg = mockup.copy()
for y in range(28, 74):
    for x in range(100):
        if y < 39 and x < 73:
            continue
        if y < 43 and 27 <= x < 73 and not (60 <= x < 63 and y >= 41):
            continue
        bg.putpixel((x, y), PALETTE[1] if y < 55 else mockup.getpixel((x, y+32 if y+32 < 100 else y+16)))
bg.save(ROOT / 'public' / 'kitchen-bg.png')
print('Saved three transparent 1x sprites and a 100x100 kitchen background.')
