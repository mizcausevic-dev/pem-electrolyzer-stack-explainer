from PIL import Image, ImageDraw, ImageFont
W,H=1600,900
img=Image.new('RGB',(W,H),'#0B1019'); d=ImageDraw.Draw(img,'RGBA')
for x in range(0,W,44): d.line([(x,0),(x,H)],fill=(255,255,255,12))
for y in range(0,H,44): d.line([(0,y),(W,y)],fill=(255,255,255,12))
def font(sz,bold=False):
    p="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(p,sz)
# stack section center
layers=[("#2A364C",70,"END PLATE"),("#344257",38,"BIPOLAR PLATE"),("#46586F",22,"GDL"),("#FFD166",14,"CATALYST"),("#E8EEF7",16,"MEMBRANE"),("#FFD166",14,"CATALYST"),("#46586F",22,"GDL"),("#344257",38,"BIPOLAR"),("#2A364C",70,"END PLATE")]
total=sum(w for _,w,_ in layers); x=800-total//2; y0,y1=300,640
for color,w,name in layers:
    d.rounded_rectangle([x,y0,x+w,y1],radius=4,fill=color,outline="#0B1019",width=2)
    x+=w
# flow arrows
d.line([(120,700),(620,700)],fill="#00E5FF",width=6); d.polygon([(620,700),(600,690),(600,710)],fill="#00E5FF"); d.text((120,660),"DI WATER IN",font=font(22,True),fill="#00E5FF")
d.line([(980,240),(1380,180)],fill="#00E5FF",width=6); d.polygon([(1380,180),(1358,182),(1366,200)],fill="#00E5FF"); d.text((1180,130),"H2 OUT",font=font(26,True),fill="#00E5FF")
d.line([(620,240),(260,180)],fill="#93A4BC",width=5); d.text((120,130),"O2 OUT",font=font(26,True),fill="#93A4BC")
d.line([(800,140),(800,290)],fill="#FFD166",width=4); d.text((820,150),"DC POWER  e-",font=font(22,True),fill="#FFD166")
d.text((800,90),"HOW A PEM ELECTROLYZER STACK WORKS",font=font(42,True),fill="#E8EEF7",anchor="ma")
d.text((800,760),"Water in  ·  Protons cross  ·  Electrons take the external circuit  ·  Hydrogen out",font=font(24),fill="#93A4BC",anchor="ma")
d.text((40,850),"GENERIC PEM · SCHEMATIC · NOT TO SCALE · NO EFFICIENCY CLAIMS",font=font(16),fill="#5A6B84")
d.text((1560,850),"34s · 1,020 FRAMES · 30 FPS",font=font(16,True),fill="#FFD166",anchor="ra")
img.save("public/hero-Cursor.png"); print("saved public/hero-Cursor.png", img.size)
