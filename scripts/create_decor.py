"""Create only the new, original decor sprites. Never touches supplied artwork."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
OUT=Path('public/sprites/decor'); OUT.mkdir(parents=True,exist_ok=True)
C={'black':'#000000','wall':'#FFCD9E','peach':'#FFB671','wood':'#8B5018','dark':'#4A2A0E','cream':'#FEF0E0','steel':'#C5C2CD','fridge':'#D3C2B2','sky':'#9FD3F0','pot':'#B0733A','green':'#5A8A3C','leaf':'#86B85E','red':'#BD5141'}
manifest=[]
def make(name,w,h,paint,frames=1,fps=0):
 im=Image.new('RGBA',(w*frames,h));
 for frame in range(frames):
  part=Image.new('RGBA',(w,h));paint(ImageDraw.Draw(part),frame);im.paste(part,(frame*w,0))
 im.save(OUT/(name+'.png'));manifest.append(dict(file=name+'.png',frameWidth=w,frameHeight=h,frames=frames,fps=fps))
def box(d,xy,fill,outline='black'): d.rectangle(xy,fill=C.get(fill,fill),outline=C.get(outline,outline) if outline else None,width=1)
def window(d,f):
 box(d,(1,0,22,19),'wood');box(d,(3,2,20,17),'sky');
 d.rectangle((6,4,10,5),fill=C['cream']);d.rectangle((8,3,9,6),fill=C['cream']);d.rectangle((16,12,19,13),fill=C['cream'])
 box(d,(11,2,12,17),'wood');box(d,(3,9,20,10),'wood');
 d.polygon([(0,1),(5,1),(5,4),(3,8),(3,11),(5,17),(5,19),(0,19)],fill=C['cream'],outline=C['black'])
 d.polygon([(23,1),(18,1),(18,4),(20,8),(20,11),(18,17),(18,19),(23,19)],fill=C['cream'],outline=C['black'])
 d.line((0,10,3,10),fill=C['wood']);d.line((20,10,23,10),fill=C['wood'])
make('window',24,20,window)
def clock(d,f):
 d.polygon([(3,0),(6,0),(6,1),(8,1),(8,3),(9,3),(9,6),(8,6),(8,8),(6,8),(6,9),(3,9),(3,8),(1,8),(1,6),(0,6),(0,3),(1,3),(1,1),(3,1)],fill=C['wood'],outline=C['black'])
 box(d,(2,2,7,7),'cream',None);d.line((4,3,4,5,6,5),fill=C['dark'],width=1)
make('wall-clock',10,10,clock)
def calendar(d,f):
 box(d,(0,0,9,11),'cream');box(d,(0,0,9,3),'red');d.point((2,0),fill=C['steel']);d.point((7,0),fill=C['steel'])
 for y in [5,7,9]:
  for x in [2,4,6,8]: d.point((x,y),fill=C['dark'])
make('calendar',10,12,calendar)
def lamp(d,f):
 d.line((3,0,3,6),fill=C['black']);d.line((4,0,4,6),fill=C['dark'])
 d.polygon([(2,6),(5,6),(5,8),(6,8),(6,10),(7,10),(7,12),(0,12),(0,10),(1,10),(1,8),(2,8)],fill=C['peach'],outline=C['black'])
 d.line((2,13,5,13),fill=C['cream'] if f==0 else '#FFDC9F')
make('pendant-lamp',8,14,lamp,2,1)
def plant(d,f):
 d.line((5,2,5,12),fill=C['black'],width=1)
 for points,fill in [([(5,7),(1,6),(0,3),(3,3),(5,5)],'green'), ([(6,5),(7,1),(10,0),(11,3),(8,6)],'leaf'), ([(5,10),(1,10),(0,7),(3,7),(5,8)],'leaf'), ([(6,9),(8,6),(11,6),(10,9),(7,11)],'green')]: d.polygon(points,fill=C[fill],outline=C['black'])
 box(d,(1,11,10,13),'pot');d.polygon([(2,13),(9,13),(8,17),(3,17)],fill=C['pot'],outline=C['black']);d.line((4,14,4,15),fill=C['peach'])
make('plant',12,18,plant)
def sack(d,f):
 d.polygon([(4,0),(9,0),(9,2),(11,4),(12,7),(13,10),(12,15),(1,15),(0,10),(1,7),(2,4),(4,2)],fill=C['peach'],outline=C['black'])
 d.line((4,2,9,2),fill=C['dark']);box(d,(1,7,12,12),'cream')
 # Two-pixel-wide lettering at native resolution; no antialiasing.
 glyphs={'B':['10','11','11'],'I':['11','01','11'],'G':['11','10','11'],'A':['11','11','10'],'S':['11','10','11']}
 for i,ch in enumerate('BIGAS'):
  for y,row in enumerate(glyphs[ch]):
   for x,v in enumerate(row):
    if v=='1': d.point((2+i*2+x,8+y),fill=C['dark'])
make('rice-sack',14,16,sack)
def stool(d,f):
 box(d,(2,4,4,11),'wood');box(d,(8,4,10,11),'wood');box(d,(2,8,10,9),'dark');box(d,(0,0,11,4),'wood');d.line((2,1,9,1),fill=C['peach'])
make('stool',12,12,stool)
def rug(d,f):
 box(d,(0,0,29,5),'wood')
 for y in range(1,5):
  for x in range(1,29): d.point((x,y),fill=C['cream'] if (x+y)%4==0 else C['peach'] if x%3 else C['dark'])
make('banig-rug',30,6,rug)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('Created',len(manifest),'new decor PNGs.')
