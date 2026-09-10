from fontTools.ttLib import TTFont
import string, json

font = TTFont('C:/Windows/Fonts/segoeui.ttf')
units_per_em = font['head'].unitsPerEm
hmtx = font['hmtx']
cmap = font.getBestCmap()

chars = string.ascii_letters + string.digits + " .,:;!'|@%-+_/&()" + "\"?"
widths = {}
for c in chars:
    cp = ord(c)
    if cp in cmap:
        glyph_name = cmap[cp]
        advance_width, lsb = hmtx[glyph_name]
        widths[c] = round(advance_width / units_per_em, 4)

print(json.dumps(widths, indent=None))
