import json, sys, hashlib
from PIL import Image, ImageDraw
COL = {"air":None,"obsidian":(30,18,48),"polished_deepslate":(70,70,75),"deepslate_tiles":(55,55,60),"polished_andesite":(150,152,150),"smooth_stone":(165,165,165),
"sea_lantern":(170,235,235),"white_wool":(235,235,235),"green_wool":(80,110,40),"iron_bars":(110,110,110),"iron_block":(215,215,215),"black_concrete":(15,15,20),
"cyan_stained_glass":(40,130,150),"light_blue_stained_glass":(110,170,220),"daylight_detector":(120,100,70),"polished_blackstone":(45,40,48),"polished_blackstone_bricks":(40,35,42),
"polished_blackstone_stairs":(45,40,48),"yellow_concrete":(240,175,20),"red_concrete":(160,30,30),"white_concrete":(225,228,230),"quartz_block":(235,230,225),"brewing_stand":(120,100,80),
"green_terracotta":(75,85,40),"orange_terracotta":(160,85,40),"barrel":(125,90,50),"spruce_planks":(115,85,50),"spruce_stairs":(115,85,50),"dark_oak_planks":(65,45,25),"scaffolding":(200,170,90),
"ladder":(160,125,70),"glass":(200,230,240),"grass_block":(90,150,60),"dirt":(130,95,65),"stone":(120,120,120),"blast_furnace":(90,90,95),"ochre_froglight":(240,210,120),"polished_basalt":(90,90,95),
"cauldron":(60,60,65),"smoker":(85,75,65),"furnace":(100,100,100),"tinted_glass":(40,35,50),"gray_concrete":(55,58,62),"light_gray_concrete":(125,125,115),"stone_bricks":(122,122,122),"blue_concrete":(45,45,145),"bamboo_fence":(215,190,60),"polished_deepslate_stairs":(70,70,75),"light_blue_concrete":(60,170,215),"green_concrete":(75,95,35),"redstone_lamp":(150,80,40),"verdant_froglight":(200,230,150),"stone_brick_stairs":(122,122,122),"tinted_glass":(45,40,55),"light_block_15":None,"bars":(110,110,110),"redstone_block":(170,20,10),"redstone_torch":(200,60,30),"deepslate_bricks":(65,65,70),"cobbled_deepslate":(75,75,80),"oak_planks":(160,130,80),"red_terracotta":(140,60,45),"lime_concrete":(95,170,25),"cyan_concrete":(20,120,135),"orange_concrete":(225,100,0),"brown_concrete":(95,60,30),"terracotta":(150,95,65),"sandstone":(215,200,150),"smooth_sandstone":(220,205,155),"polished_tuff":(110,115,105),"water":(50,90,200),"chiseled_bookshelf":(120,90,55),"bookshelf":(120,90,55)}
def colour(name):
    n=name.split(":")[-1]
    if n in COL: return COL[n]
    h=hashlib.md5(n.encode()).digest(); return (60+h[0]%150,60+h[1]%150,60+h[2]%150)
d=json.load(open(sys.argv[1])); W,H,D=d["W"],d["H"],d["D"]; pal=d["pal"]; cells=d["cells"]; minY=d["minY"]
at=lambda x,y,z: pal[cells[(y*D+z)*W+x]]
out=sys.argv[2]; mode=sys.argv[3]
S=int(sys.argv[5]) if len(sys.argv)>5 else 6
if mode=="plan":
    wy=int(sys.argv[4])-minY  # walk level: show topmost non-air from wy+2 down to wy-1
    img=Image.new("RGB",(W*S,D*S),(0,0,0)); dr=ImageDraw.Draw(img)
    for z in range(D):
        for x in range(W):
            c=None
            for y in range(min(H-1,wy+2),wy-2,-1):
                n=at(x,y,z)
                if not n.endswith(":air"): c=colour(n); 
                if c: 
                    if y>wy+1: c=tuple(int(v*0.55) for v in c)  # walls/ceiling-level -> darker
                    break
            dr.rectangle([x*S,z*S,x*S+S-1,z*S+S-1],fill=c or (0,0,0))
    img.save(out)
elif mode=="elev":
    side=sys.argv[4]  # south|north|east|west : the face you look at
    horiz = W if side in ("south","north") else D
    depth = D if side in ("south","north") else W
    img=Image.new("RGB",(horiz*S,H*S),(150,190,230)); dr=ImageDraw.Draw(img)
    skip={"minecraft:air","minecraft:stone","minecraft:dirt"}
    for y in range(H):
        for h in range(horiz):
            c=None
            for k in range(depth):
                if side=="south": x,z=h,D-1-k
                elif side=="north": x,z=W-1-h,k
                elif side=="east": x,z=W-1-k,D-1-h
                else: x,z=k,h
                n=at(x,y,z)
                if n in skip or n.endswith("light_block_15"): continue
                c=colour(n); c=tuple(int(v*(1-min(k,12)*0.04)) for v in c); break
            if c: dr.rectangle([h*S,(H-1-y)*S,h*S+S-1,(H-1-y)*S+S-1],fill=c)
    img.save(out)
else:
    # isometric cutaway: render all blocks except natural terrain (stone/dirt/grass) as cubes, painter's order
    cut = mode=="cut"
    T=S; img=Image.new("RGB",((W+D)*T+40,(W+D)*T//2+H*T+40),(150,190,230)); dr=ImageDraw.Draw(img)
    ox=D*T+20; oy=20+H*T
    skip={"minecraft:air","minecraft:stone","minecraft:dirt","minecraft:grass_block"}
    zlim = int(sys.argv[4]) if cut else D
    def ex(x,y,z):
        if x<0 or y<0 or z<0 or x>=W or y>=H or z>=D: return True
        return at(x,y,z) in skip or (cut and z>=zlim)
    for y in range(H):
        for ssum in range(W+D-1):
            for x in range(max(0,ssum-D+1),min(W,ssum+1)):
                z=ssum-x
                if cut and z>=zlim: continue
                n=at(x,y,z)
                if n in skip or n.endswith('light_block_15'): continue
                if not (ex(x+1,y,z) or ex(x,y,z+1) or ex(x,y+1,z)): continue
                c=colour(n)
                px=ox+(x-z)*T; py=oy+(x+z)*T//2 - y*T
                top=[(px,py-T//2),(px+T,py),(px,py+T//2),(px-T,py)]
                left=[(px-T,py),(px,py+T//2),(px,py+T//2+T),(px-T,py+T)]
                right=[(px,py+T//2),(px+T,py),(px+T,py+T),(px,py+T//2+T)]
                dr.polygon(left,fill=tuple(int(v*0.7) for v in c)); dr.polygon(right,fill=tuple(int(v*0.85) for v in c)); dr.polygon(top,fill=c)
    from PIL import ImageChops
    bg=Image.new('RGB',img.size,(150,190,230)); bb=ImageChops.difference(img,bg).getbbox()
    img=img.crop(bb) if bb else img
    img.save(out)
