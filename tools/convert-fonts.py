"""Convert a TTF/OTF font to WOFF2.  Usage: python tools/convert-fonts.py <input> <output.woff2>"""
import sys
from fontTools.ttLib import TTFont

src, dst = sys.argv[1], sys.argv[2]
font = TTFont(src)
font.flavor = "woff2"
font.save(dst)
print(f"{src} -> {dst}")
