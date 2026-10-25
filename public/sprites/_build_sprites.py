"""Silog Kitchen sprite generator. Writes 1x transparent PNG strips + manifest + contact sheet."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

def hx(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

P = {k: hx(v) for k, v in dict(
    wall='#FFCD9E', peach='#FFB671', peachD='#E89A55', wood='#8B5018', woodL='#B0733A', woodD='#4A2A0E',
    ol='#000000', fr='#D3C2B2', frD='#A89C90', cream='#FEF0E0', creamD='#EAD8C0', white='#FFFFFF',
    steel='#C5C2CD', steelD='#8E8A99', steelL='#E4E2EA', iron='#2E2A2A', ironL='#5A5452',
    yolk='#F5C842', yolkD='#E0A010', fl1='#FF6600', fl2='#FFAA00', fl3='#FFE066', blue='#4A7BD0',
    meat='#B5432A', meatL='#D9705A', meatD='#7A2414', toc='#E8826A', tocL='#F7A890', tocD='#B0503A',
    lon='#C8903A', lonD='#8E5A1E', lonL='#E0B060', burnt='#2A1A10', burntL='#4A3428',
    green='#5A8A3C', greenL='#86B85E', red='#D23A2A', redD='#8E1E14', gold='#F5C842', goldD='#C88A10',
    rice='#FFFDF2', riceD='#E8E0C8', gar='#F4E7C8', smoke='#7A7272', smokeL='#A8A0A0', paper='#FFF8EE',
    pink='#F0B8B0', gray='#5A5A5A').items()}
T = (0, 0, 0, 0)

class C:
    def __init__(s, w, h): s.w, s.h = w, h; s.im = Image.new('RGBA', (w, h), T)
    def px(s, x, y, c):
        if 0 <= x < s.w and 0 <= y < s.h and c: s.im.putpixel((int(x), int(y)), c)
    def get(s, x, y): return s.im.getpixel((x, y)) if 0 <= x < s.w and 0 <= y < s.h else T
    def rect(s, x, y, w, h, c):
        for j in range(y, y + h):
            for i in range(x, x + w): s.px(i, j, c)
    def hl(s, x, y, w, c): s.rect(x, y, w, 1, c)
    def vl(s, x, y, h, c): s.rect(x, y, 1, h, c)
    def ell(s, x, y, w, h, c):  # filled ellipse in box
        cx, cy, rx, ry = x + w / 2, y + h / 2, w / 2, h / 2
        for j in range(y, y + h):
            for i in range(x, x + w):
                if ((i + .5 - cx) / rx) ** 2 + ((j + .5 - cy) / ry) ** 2 <= 1.0: s.px(i, j, c)
    def ring(s, x, y, w, h, c, t=1):
        cx, cy, rx, ry = x + w / 2, y + h / 2, w / 2, h / 2
        for j in range(y, y + h):
            for i in range(x, x + w):
                d = ((i + .5 - cx) / rx) ** 2 + ((j + .5 - cy) / ry) ** 2
                rin = ((rx - t) / rx) ** 2
                if rin < d <= 1.0: s.px(i, j, c)
    def rows(s, x, y, rows, key):
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch in key: s.px(x + i, y + j, key[ch])
    def outline(s, c=P['ol']):
        src = s.im.copy(); W, H = s.w, s.h
        for y in range(H):
            for x in range(W):
                if src.getpixel((x, y))[3] == 0:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        xx, yy = x + dx, y + dy
                        if 0 <= xx < W and 0 <= yy < H and src.getpixel((xx, yy))[3] > 0 and src.getpixel((xx, yy))[:3] != c[:3]:
                            s.im.putpixel((x, y), c); break
        return s
    def tint_outline(s, c):  # recolor existing outermost outline
        s.outline(c); return s

MANIFEST = []
SHEET = []

def save(name, frames, fps=0, group=''):
    w, h = frames[0].w, frames[0].h
    strip = Image.new('RGBA', (w * len(frames), h), T)
    for i, f in enumerate(frames): strip.paste(f.im, (i * w, 0))
    strip.save(os.path.join(OUT, name + '.png'))
    MANIFEST.append(dict(file=name + '.png', frameWidth=w, frameHeight=h, frames=len(frames), fps=fps, group=group))
    SHEET.append((name, strip, group))

def zoom(c, k=2, ol=True):
    """2x detail version: upscale the fill, then re-outline with a 1px line."""
    # strip existing outline pixels (pure black at the edge) before upscaling
    base = C(c.w, c.h); base.im = c.im.copy()
    for y in range(c.h):
        for x in range(c.w):
            p = c.im.getpixel((x, y))
            if p[3] and p[:3] == (0, 0, 0):
                edge = any(c.get(x + dx, y + dy)[3] == 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) or x in (0, c.w - 1) or y in (0, c.h - 1)
                if edge: base.im.putpixel((x, y), T)
    z = C(c.w * k, c.h * k); z.im = base.im.resize((c.w * k, c.h * k), Image.NEAREST)
    if ol: z.outline()
    return z

# ───────────────────────── A. stations ─────────────────────────
def fridge_frame(stage):
    c = C(40, 46)
    bx = 11  # body x (28 wide: 11..38)
    # body / interior
    c.rect(bx + 1, 1, 26, 44, P['fr'])
    c.rect(bx + 1, 1, 26, 6, P['cream'])  # top cap
    c.rect(bx + 1, 43, 26, 2, P['frD'])
    if stage == 0:
        # closed doors like the supplied fridge
        c.rect(bx + 2, 8, 24, 11, P['fr']); c.hl(bx + 2, 19, 24, P['ol']); c.hl(bx + 2, 20, 24, P['frD'])
        for (y, h) in ((8, 11), (21, 21)):
            c.hl(bx + 3, y, 22, P['ol']); c.hl(bx + 3, y + h - 1, 22, P['ol'])
            c.vl(bx + 2, y + 1, h - 2, P['ol']); c.vl(bx + 25, y + 1, h - 2, P['ol'])
        c.vl(bx + 23, 11, 4, P['gray']); c.vl(bx + 23, 24, 8, P['gray'])
    else:
        # interior visible
        c.rect(bx + 2, 8, 24, 34, P['cream'])
        c.rect(bx + 2, 8, 24, 2, P['white'])           # light
        c.hl(bx + 2, 19, 24, P['frD'])                 # freezer divider
        for y in (28, 35): c.hl(bx + 2, y, 24, P['steelD'])
        c.rect(bx + 2, 20, 24, 1, P['creamD'])
        # a few hints of food
        c.rect(bx + 4, 25, 4, 3, P['meatL']); c.rect(bx + 10, 26, 3, 2, P['toc'])
        c.rect(bx + 16, 32, 5, 3, P['cream']); c.hl(bx + 16, 32, 5, P['creamD'])
        c.rect(bx + 5, 15, 6, 4, P['steelL'])
        hinge = bx + 1
        if stage == 1:  # door ~1/4 open: foreshortened, still over the body
            for (y, h) in ((8, 11), (20, 23)):
                c.rect(hinge, y, 18, h, P['fr']); c.rect(hinge + 14, y, 4, h, P['frD'])
                c.hl(hinge, y, 18, P['ol']); c.hl(hinge, y + h - 1, 18, P['ol']); c.vl(hinge + 17, y, h, P['ol'])
            c.vl(hinge + 3, 11, 4, P['gray']); c.vl(hinge + 3, 24, 8, P['gray'])
        elif stage == 2:  # edge-on
            for (y, h) in ((7, 12), (19, 25)):
                c.rect(hinge - 6, y, 7, h, P['frD']); c.vl(hinge - 6, y, h, P['fr'])
                c.hl(hinge - 6, y, 7, P['ol']); c.hl(hinge - 6, y + h - 1, 7, P['ol'])
        else:  # fully open, inner side with door shelves
            for (y, h) in ((7, 12), (19, 25)):
                c.rect(1, y, 10, h, P['creamD']); c.vl(1, y, h, P['fr']); c.vl(10, y, h, P['fr'])
                c.hl(1, y, 10, P['ol']); c.hl(1, y + h - 1, 10, P['ol'])
            for y in (12, 26, 33, 40):
                c.hl(2, y, 8, P['steel']); c.hl(2, y + 1, 8, P['steelD'])
            c.rect(3, 23, 2, 3, P['green']); c.rect(6, 22, 2, 4, P['white']); c.rect(3, 30, 3, 3, P['yolk'])
    return c.outline()

def build_stations():
    save('fridge-open', [fridge_frame(i) for i in range(4)], fps=10, group='A stations')

    # sink overlay with stacked clean plates
    c = C(15, 12)
    c.rect(1, 3, 13, 8, P['steel']); c.rect(2, 4, 11, 6, P['steelD']); c.rect(3, 5, 9, 4, P['steel'])
    for i, y in enumerate((6, 5, 4)):
        c.ell(3, y, 9, 3, P['cream']); c.hl(4, y + 1, 7, P['white'])
    c.hl(1, 3, 13, P['steelL'])
    save('sink-highlight', [c.outline()], group='A stations')

    # basket
    c = C(16, 10)
    for y in range(3, 9):
        inset = (y - 3) // 3
        for x in range(1 + inset, 15 - inset):
            c.px(x, y, P['peach'] if (x + y) % 2 == 0 else P['woodL'])
    c.hl(1, 2, 14, P['wood']); c.hl(1, 3, 14, P['woodD'])
    c.hl(2, 8, 12, P['wood'])
    save('basket', [c.outline()], group='A stations')

    # trash bin closed/open
    fr = []
    for open_ in (0, 1):
        c = C(10, 14)
        c.rect(2, 4, 6, 9, P['steel']); c.vl(2, 4, 9, P['steelL']); c.vl(7, 4, 9, P['steelD'])
        for x in (4, 6): c.vl(x - 0, 6, 5, P['steelD'])
        if open_:
            c.rect(6, 0, 3, 4, P['steelD']); c.vl(8, 0, 4, P['steel']); c.rect(2, 3, 6, 1, P['iron'])
        else:
            c.rect(1, 2, 8, 2, P['steelD']); c.hl(1, 2, 8, P['steel']); c.rect(4, 1, 2, 1, P['steelD'])
        fr.append(c.outline())
    save('trash-bin', fr, group='A stations')

    # burner flame (no outline, glowing)
    fr = []
    for f in range(3):
        c = C(12, 5)
        for x in range(12):
            hgt = 2 + ((x + f) % 3 == 0) + ((x * 7 + f * 3) % 5 == 0)
            c.vl(x, 5 - hgt, hgt, P['fl2'])
            c.px(x, 4, P['blue'] if x % 2 == f % 2 else P['fl1'])
            if hgt >= 3: c.px(x, 5 - hgt, P['fl3'])
        fr.append(c)
    save('burner-flame', fr, fps=8, group='A stations')

# ───────────────────────── B. zoom views ─────────────────────────
def build_zoom_views():
    # stove zoom 160x100
    c = C(160, 100)
    c.rect(0, 0, 160, 100, P['wall'])
    c.rect(0, 0, 160, 3, P['peach'])
    # countertop strip on the right for docked plate
    c.rect(118, 52, 42, 48, P['peach']); c.hl(118, 52, 42, P['ol']); c.hl(118, 58, 42, P['peachD'])
    c.rect(124, 60, 32, 20, P['wood']); c.rect(126, 62, 28, 16, P['woodL'])
    for (x, y) in ((124, 60), (155, 60), (124, 79), (155, 79)): c.px(x, y, P['wall'])
    c.hl(124, 81, 32, P['peachD'])
    # stove back panel with knobs
    c.rect(4, 6, 112, 12, P['woodL']); c.rect(6, 8, 108, 8, P['wood'])
    for x in (16, 36, 76, 96): c.rect(x, 9, 8, 6, P['woodD']); c.rect(x + 3, 9, 2, 3, P['peach'])
    for y in (6, 17): c.hl(4, y, 112, P['ol'])
    c.vl(4, 6, 12, P['ol']); c.vl(115, 6, 12, P['ol'])
    # cooktop body
    c.rect(2, 18, 116, 82, P['peach']); c.rect(2, 18, 116, 2, P['peachD'])
    c.rect(10, 24, 100, 66, P['woodD'])
    c.hl(10, 24, 100, P['ol']); c.hl(10, 89, 100, P['ol']); c.vl(10, 24, 66, P['ol']); c.vl(109, 24, 66, P['ol'])
    c.hl(2, 18, 116, P['ol']); c.vl(2, 18, 82, P['ol']); c.vl(117, 18, 82, P['ol'])
    # 4 burners
    for (bx, by) in ((16, 27), (66, 27), (16, 58), (66, 58)):
        c.ell(bx, by, 38, 29, P['peach'])
        c.ell(bx + 3, by + 3, 32, 23, P['ol'])
        c.ring(bx + 7, by + 6, 24, 17, P['steelD'], 2)
        c.ell(bx + 14, by + 11, 10, 7, P['iron'])
        c.ell(bx + 16, by + 12, 6, 5, P['steelD'])
        # grate arms
        c.hl(bx + 5, by + 14, 28, P['ironL']); c.vl(bx + 19, by + 4, 21, P['ironL'])
    c.px(60, 56, P['ol']); c.px(59, 56, P['ol'])
    # knobs on front lip
    for x in (20, 44, 70, 94):
        c.rect(x, 92, 6, 5, P['woodD']); c.rect(x + 2, 92, 2, 2, P['peach'])
    c.hl(2, 99, 116, P['ol'])
    save('stove-zoom', [c], group='B zoom views')

    # fridge interior 160x100
    c = C(160, 100)
    c.rect(0, 0, 160, 100, P['fr'])
    c.rect(8, 6, 144, 90, P['cream'])
    c.rect(8, 6, 144, 4, P['white'])
    c.rect(70, 6, 20, 3, P['fl3'])  # light
    for x in range(8, 152, 24): c.vl(x, 10, 86, P['creamD'])
    # shelves
    for y in (34, 60, 86):
        c.rect(8, y, 144, 2, P['steel']); c.hl(8, y + 2, 144, P['steelD'])
        for x in range(10, 150, 6): c.px(x, y, P['steelD'])
    # crisper drawer
    c.rect(12, 88, 136, 8, P['steelL']); c.hl(12, 88, 136, P['steel']); c.rect(70, 91, 20, 2, P['steelD'])
    # frame lines
    c.hl(7, 5, 146, P['ol']); c.hl(7, 96, 146, P['ol']); c.vl(7, 5, 92, P['ol']); c.vl(152, 5, 92, P['ol'])
    c.rect(0, 0, 160, 1, P['ol']); c.rect(0, 99, 160, 1, P['ol']); c.vl(0, 0, 100, P['ol']); c.vl(159, 0, 100, P['ol'])
    c.rect(1, 97, 158, 2, P['frD'])
    save('fridge-interior', [c], group='B zoom views')

# ───────────────────────── C. cookware ─────────────────────────
def pan(w, h):
    c = C(w, h); bw = int(w * 0.72)
    c.ell(1, 1, bw, h - 2, P['iron'])
    c.ell(2, 2, bw - 2, h - 5, P['ironL'])
    c.ell(3, 3, bw - 4, h - 7, P['iron'])
    hy = h // 2 - 1
    c.rect(bw, hy, w - bw - 1, max(2, h // 5), P['woodD'])
    c.rect(bw, hy, 2, max(2, h // 5), P['iron'])
    return c.outline()

def wok(w, h):
    c = C(w, h); bw = w - 4
    c.ell(2, 2, bw, h - 3, P['steelD'])
    c.ell(3, 2, bw - 2, h - 6, P['steel'])
    c.ell(4, 3, bw - 4, h - 8, P['steelD'])
    c.rect(1, h // 2 - 1, 2, 2, P['woodD']); c.rect(w - 3, h // 2 - 1, 2, 2, P['woodD'])
    return c.outline()

def plate(w, h):
    c = C(w, h)
    c.ell(1, 1, w - 2, h - 2, P['cream'])
    c.ell(3, 2, w - 6, h - 4, P['white'])
    c.ell(4, 3, w - 8, h - 6, P['cream'])
    c.ell(5, 3, w - 10, h - 7, P['white'])
    c.hl(w // 4, h - 2, w // 2, P['steel'])
    return c.outline()

def build_cookware():
    save('pan', [pan(22, 10)], group='C cookware')
    save('pan-zoom', [pan(44, 20)], group='C cookware')
    save('wok', [wok(22, 11)], group='C cookware')
    save('wok-zoom', [wok(44, 22)], group='C cookware')
    save('plate', [plate(20, 9)], group='C cookware')
    save('plate-zoom', [plate(36, 16)], group='C cookware')

# ───────────────────────── D. ingredients ─────────────────────────
def ing(kind):
    c = C(12, 12)
    if kind == 'egg':
        for x in (2, 5, 8): c.ell(x, 2, 3, 5, P['cream']); c.px(x, 3, P['white'])
        c.rect(1, 6, 10, 4, P['frD']); c.hl(1, 6, 10, P['fr'])
        for x in (2, 5, 8): c.rect(x, 7, 2, 2, P['steelD'])
    elif kind == 'tapa':
        c.rect(1, 7, 10, 3, P['steel']); c.hl(1, 9, 10, P['steelD'])
        c.rect(2, 4, 8, 4, P['meat']); c.hl(3, 5, 5, P['meatL']); c.hl(2, 7, 8, P['meatD']); c.px(7, 6, P['meatL'])
    elif kind == 'tocino':
        c.rect(1, 3, 10, 7, P['white']); c.rect(2, 4, 8, 5, P['toc'])
        c.hl(3, 5, 5, P['tocL']); c.hl(2, 8, 8, P['tocD']); c.rect(1, 3, 10, 1, P['steel'])
    elif kind == 'longganisa':
        for i, (x, y) in enumerate(((1, 6), (4, 3), (7, 6))):
            c.ell(x, y, 4, 5, P['lon']); c.px(x + 1, y + 1, P['lonL'])
        c.px(4, 6, P['lonD']); c.px(7, 6, P['lonD'])
    elif kind == 'rice':
        c.rect(2, 4, 8, 6, P['steelL']); c.rect(2, 3, 8, 2, P['blue']); c.hl(2, 9, 8, P['steel'])
        c.rect(3, 5, 6, 3, P['rice']); c.px(4, 6, P['riceD']); c.px(7, 5, P['riceD'])
    elif kind == 'garlic':
        c.ell(2, 4, 8, 7, P['gar']); c.vl(5, 5, 5, P['creamD']); c.vl(7, 5, 4, P['creamD'])
        c.rect(5, 2, 2, 3, P['greenL']); c.px(4, 10, P['woodL']); c.px(7, 10, P['woodL'])
    return c.outline()

def build_ingredients():
    for k in ('egg', 'tapa', 'tocino', 'longganisa', 'rice', 'garlic'):
        a = ing(k); b = C(12, 12); b.im = a.im.copy()
        # hover: cream glow around the black outline
        b.outline(P['cream'])
        save('ing-' + k, [a, b], group='D ingredients')

# ───────────────────────── E. food in pan ─────────────────────────
STAGES = ['raw', 'cooking', 'cooked', 'overcooked', 'burnt']

def cook(kind, st):
    c = C(14, 8); s = STAGES.index(st)
    def dark(colors):
        return colors if s < 4 else [P['burnt'], P['burntL'], P['burnt']]
    if kind == 'egg':
        white = [hx('#F4F0E8', 200), P['white'], P['white'], P['white'], P['burnt']][s]
        edge = [None, None, P['woodL'], P['wood'], P['burntL']][s]
        yolk = [P['yolk'], P['yolk'], P['yolkD'], P['yolkD'], P['burnt']][s]
        c.ell(1, 1, 12, 6, white)
        if edge:
            for x, y in ((1, 3), (2, 2), (12, 4), (11, 5), (4, 6), (9, 1)): c.px(x, y, edge)
            if s >= 3: c.ring(1, 1, 12, 6, edge)
        c.ell(5, 2, 4, 3, yolk)
        if s < 4: c.px(6, 2, P['white'])
    elif kind in ('tapa', 'tocino'):
        base = {'tapa': [P['meat'], P['meatL'], P['meatD']], 'tocino': [P['toc'], P['tocL'], P['tocD']]}[kind]
        cookd = {'tapa': [hx('#8A3A1A'), hx('#A85A30'), hx('#5A2410')],
                 'tocino': [hx('#B8402E'), hx('#E06A50'), hx('#7A2014')]}[kind]
        over = [hx('#4E2414'), hx('#6A3420'), hx('#2E140A')]
        mid = [(a[0] + b[0]) // 2 for a, b in zip(base, cookd)]
        cols = [base, [tuple((a[i] + b[i]) // 2 for i in range(4)) for a, b in zip(base, cookd)], cookd, over, dark(None)][s]
        for (x, y, w, h) in ((1, 1, 8, 4), (5, 3, 8, 4)):
            c.ell(x, y, w, h, cols[0]); c.hl(x + 2, y + 1, w - 4, cols[1]); c.hl(x + 2, y + h - 1, w - 4, cols[2])
        if s == 2: c.px(4, 2, P['white']); c.px(9, 4, P['white'])  # glaze shine
    elif kind == 'longganisa':
        cols = [[P['lonL'], P['lon']], [P['lon'], P['lonD']], [hx('#9A5A20'), hx('#C07A30')],
                [hx('#5A3214'), hx('#6E4020')], [P['burnt'], P['burntL']]][s]
        for x in (1, 5, 9):
            c.ell(x, 2, 4, 5, cols[0]); c.px(x + 1, 3, cols[1])
        if s == 2: c.px(2, 3, P['white']); c.px(10, 3, P['white'])
    elif kind == 'rice':
        base = [P['rice'], hx('#F6E8B8'), hx('#EBC768'), hx('#B07A30'), P['burnt']][s]
        spot = [P['riceD'], P['gar'], hx('#C8962E'), hx('#7A4E1E'), P['burntL']][s]
        c.ell(1, 2, 12, 5, base); c.ell(3, 1, 8, 3, base)
        for x, y in ((3, 3), (6, 2), (9, 4), (5, 5), (10, 2), (7, 4)): c.px(x, y, spot)
        if s in (1, 2):
            for x, y in ((4, 4), (8, 3)): c.px(x, y, P['woodL'])  # garlic bits
    return c.outline()

def build_cooking():
    for k in ('egg', 'tapa', 'tocino', 'longganisa', 'rice'):
        fr = [cook(k, st) for st in STAGES]
        save('cook-' + k, fr, group='E cooking stages')
        save('cook-' + k + '-zoom', [zoom(f) for f in fr], group='E cooking stages')

# ───────────────────────── F. plated food ─────────────────────────
def plated(kind, over):
    if kind == 'rice':
        c = C(9, 6); b = hx('#B07A30') if over else hx('#EBC768'); sp = hx('#7A4E1E') if over else hx('#C8962E')
        c.ell(1, 1, 7, 5, b); c.px(3, 2, sp); c.px(5, 3, sp); c.px(4, 1, P['rice'] if not over else sp)
    elif kind == 'egg':
        c = C(8, 5); c.ell(1, 1, 6, 3, P['white'])
        if over: c.px(1, 2, P['wood']); c.px(6, 2, P['wood']); c.px(3, 3, P['wood'])
        c.rect(3, 1, 2, 2, P['yolkD'] if over else P['yolk'])
    else:
        c = C(8, 4)
        col = {'tapa': (hx('#8A3A1A'), hx('#A85A30')), 'tocino': (hx('#B8402E'), hx('#E06A50')),
               'longganisa': (hx('#9A5A20'), hx('#C07A30'))}[kind]
        if over: col = (hx('#4E2414'), hx('#6A3420'))
        if kind == 'longganisa':
            for x in (1, 4): c.rect(x, 1, 3, 2, col[0]); c.px(x, 1, col[1])
        else:
            c.rect(1, 1, 6, 2, col[0]); c.hl(2, 1, 3, col[1])
    return c.outline()

def build_plated():
    for k in ('rice', 'egg', 'tapa', 'tocino', 'longganisa'):
        fr = [plated(k, False), plated(k, True)]
        save('plated-' + k, fr, group='F plated food')
        save('plated-' + k + '-zoom', [zoom(f) for f in fr], group='F plated food')

# ───────────────────────── G. effects + UI ─────────────────────────
def wisps(w, h, col, col2, f, heavy=False):
    c = C(w, h)
    for i in range(3 if not heavy else 5):
        x0 = (i * (w // 3) + 1) % (w - 2)
        for k in range(3):
            y = (h - 2 - (f * 2 + k * 3 + i * 2) % h)
            x = x0 + ((y + i) // 3) % 2
            if heavy: c.ell(x, y - 1, 4, 3, col); c.px(x + 1, y - 1, col2)
            else: c.px(x, y, col); c.px(x, y - 1, col2)
    return c

def build_fx_ui():
    save('fx-steam', [wisps(8, 10, hx('#FFFFFF', 220), hx('#FFFFFF', 140), f) for f in range(4)], fps=6, group='G effects')
    save('fx-smoke-light', [wisps(8, 10, P['smokeL'], P['smoke'], f) for f in range(4)], fps=6, group='G effects')
    save('fx-smoke-heavy', [wisps(12, 14, P['iron'], P['gray'], f, True) for f in range(4)], fps=8, group='G effects')
    fr = []
    for f in range(4):
        c = C(9, 9); r = [1, 3, 4, 2][f]
        c.px(4, 4, P['white'])
        for d in range(1, r + 1):
            col = P['fl3'] if d < r else P['white']
            for dx, dy in ((d, 0), (-d, 0), (0, d), (0, -d)): c.px(4 + dx, 4 + dy, col)
        if f == 2:
            for dx, dy in ((1, 1), (-1, 1), (1, -1), (-1, -1)): c.px(4 + dx, 4 + dy, P['fl3'])
        fr.append(c)
    save('fx-sparkle', fr, fps=10, group='G effects')
    fr = []
    for f in range(4):
        c = C(8, 8); w = [6, 4, 2, 4][f]; x = (8 - w) // 2; y = [3, 2, 1, 0][f]
        c.rect(x, y + 1, w, 4, P['gold']); c.hl(x + (1 if w > 2 else 0), y, max(1, w - 2), P['gold'])
        if w >= 4: c.vl(x + w // 2, y + 2, 2, P['goldD'])
        fr.append(c.outline())
    save('fx-coin-pop', fr, fps=12, group='G effects')

    c = C(12, 12); c.ring(0, 0, 12, 12, P['ol'], 1); c.ring(1, 1, 10, 10, P['creamD'], 2); c.ring(3, 3, 6, 6, P['ol'], 1)
    save('ui-gauge', [c], group='G ui')

    fr = []
    for f in range(2):
        c = C(9, 9); o = f
        c.rect(2, 1 + o, 5, 3, P['steel']); c.hl(2, 1 + o, 5, P['steelL'])
        c.vl(4, 4 + o, 4 - o, P['woodD']); c.px(4, 7, P['woodD'])
        fr.append(c.outline())
    save('ui-flip', fr, fps=4, group='G ui')

    fr = []
    for f in range(2):
        c = C(7, 9); col = P['red'] if f == 0 else hx('#FF6A4A')
        c.rows(0, 0, ['   o   ', '  oRo  ', ' oRWRo ', 'oRRWRRo', 'oRRWRRo', 'oRRRRRo', ' oRWRo ', '  oRo  ', '   o   '],
               {'o': P['ol'], 'R': col, 'W': P['white']})
        fr.append(c)
    save('ui-warning', fr, fps=3, group='G ui')

    fr = []
    for f in range(2):
        c = C(9, 9); c.rect(1, 1, 7, 7, P['woodD'] if f == 0 else P['wood'])
        for i in range(5): c.px(2 + i, 2 + i, P['cream']); c.px(6 - i, 2 + i, P['cream'])
        fr.append(c.outline())
    save('ui-close', fr, group='G ui')

    c = C(24, 32); c.rect(1, 3, 22, 28, P['paper'])
    for x in range(1, 23, 2): c.px(x, 30, P['creamD'])
    for y in (11, 15, 19, 23): c.hl(4, y, 16, P['creamD'])
    c.hl(4, 7, 12, P['wood'])
    c.rect(10, 0, 4, 3, P['red']); c.px(11, 0, hx('#FF8A7A'))
    c.outline()
    save('ui-ticket', [c], group='G ui')

    fr = []
    for m in range(3):
        c = C(8, 8); col = [P['gold'], P['yolkD'], hx('#E06A3A')][m]
        c.ell(1, 1, 6, 6, col); c.px(3, 3, P['ol']); c.px(5, 3, P['ol'])
        if m == 0: c.px(3, 5, P['ol']); c.px(4, 6, P['ol']) if False else c.hl(3, 5, 2, P['ol']); c.px(2, 4, P['ol']) if False else None
        if m == 0: c.rows(2, 4, ['o  o', ' oo '], {'o': P['ol']})
        if m == 1: c.hl(3, 5, 3, P['ol'])
        if m == 2: c.rows(2, 4, [' oo ', 'o  o'], {'o': P['ol']}); c.px(2, 2, P['ol']); c.px(5, 2, P['ol'])
        fr.append(c.outline())
    # redraw happy face cleanly
    c = C(8, 8); c.ell(1, 1, 6, 6, P['gold']); c.px(3, 3, P['ol']); c.px(5, 3, P['ol']); c.rows(2, 4, ['o  o', ' oo '], {'o': P['ol']}); fr[0] = c.outline()
    save('ui-mood', fr, group='G ui')

    star = ['    o    ', '   oxo   ', 'oooxxxooo', 'oxxxxxxxo', ' oxxxxxo ', '  oxxxo  ', ' oxxoxxo ', ' oxo oxo ', ' oo   oo ']
    fr = []
    for f in range(2):
        c = C(9, 9); c.rows(0, 0, star, {'o': P['ol'], 'x': P['creamD'] if f == 0 else P['gold']}); fr.append(c)
    save('ui-star', fr, group='G ui')

    c = C(8, 8); c.ell(0, 0, 8, 8, P['ol']); c.ell(1, 1, 6, 6, P['gold']); c.vl(4, 2, 4, P['goldD']); c.hl(3, 3, 3, P['goldD']); c.px(2, 2, P['white'])
    save('ui-coin', [c], group='G ui')

build_stations(); build_zoom_views(); build_cookware(); build_ingredients()
build_cooking(); build_plated(); build_fx_ui()

with open(os.path.join(OUT, 'sprites.json'), 'w') as f: json.dump(MANIFEST, f, indent=1)

# contact sheet
S = 5; pad = 10; sheetW = 1400
font = ImageFont.load_default()
rows_, x, y, rowh = [], pad, pad, 0
placed = []
lastg = None
for name, strip, g in SHEET:
    w, h = strip.width * S, strip.height * S
    if g != lastg:
        if x > pad: y += rowh + 22; x = pad; rowh = 0
        placed.append(('H', g, pad, y)); y += 16; lastg = g
    if x + w > sheetW - pad: x = pad; y += rowh + 22; rowh = 0
    placed.append(('S', name, x, y, strip)); x += w + pad + 10; rowh = max(rowh, h)
H = y + rowh + 30
sheet = Image.new('RGBA', (sheetW, H), hx('#FFCD9E'))
d = ImageDraw.Draw(sheet)
for p in placed:
    if p[0] == 'H': d.text((p[2], p[3]), p[1].upper(), fill=(74, 42, 14, 255), font=font)
    else:
        _, name, x, y, strip = p
        big = strip.resize((strip.width * S, strip.height * S), Image.NEAREST)
        sheet.alpha_composite(big, (x, y)); d.text((x, y + big.height + 3), name, fill=(0, 0, 0, 255), font=font)
sheet.save(os.path.join(OUT, '_contact-sheet.png'))
print(len(MANIFEST), 'sprites')
