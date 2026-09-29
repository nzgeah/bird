from pathlib import Path

out=Path(__file__).resolve().parents[1]/'assets'
verts=[]; faces=[]; mats=[]
def box(cx,cy,cz,sx,sy,sz,mat):
    i=len(verts)+1; x=sx/2; y=sy/2; z=sz/2
    verts.extend([(cx-x,cy-y,cz-z),(cx+x,cy-y,cz-z),(cx+x,cy+y,cz-z),(cx-x,cy+y,cz-z),
                  (cx-x,cy-y,cz+z),(cx+x,cy-y,cz+z),(cx+x,cy+y,cz+z),(cx-x,cy+y,cz+z)])
    for f in [(1,2,3,4),(5,8,7,6),(1,5,6,2),(2,6,7,3),(3,7,8,4),(4,8,5,1)]:
        faces.append((mat,tuple(i+j-1 for j in f)))

# Heavy industrial housing, front faces toward negative Z.
box(0,18,0,52,36,42,'housing'); box(0,39,0,44,5,34,'top');
box(0,20,-22,42,23,3,'screen_frame'); box(0,20,-24,34,16,1.2,'screen_glass')
# Five segmented charge bars, plus warning lamp.
for n in range(5): box(-14+n*7,20,-25,4.5,11,1,'charge_green')
box(17,29,-25,5,5,1,'warning');
# terminals, side rails, lower feet, and bolts
for x in (-13,13): box(x,43,0,12,5,12,'terminal'); box(x,47,0,5,4,5,'terminal_cap')
for x in (-25,25): box(x,20,0,4,30,36,'rail')
for x in (-18,18): box(x,0,0,9,4,30,'foot')
for x in (-19,19):
    for y in (8,30): box(x,y,-23,3,3,1,'bolt')

obj=['# SpaceBird industrial battery module','mtllib battery_module.mtl','o BatteryModule']
for v in verts: obj.append('v %.3f %.3f %.3f'%v)
for mat,f in faces:
    obj += ['usemtl '+mat,'f '+' '.join(map(str,f))]
(out/'battery_module.obj').write_text('\n'.join(obj)+'\n',encoding='utf-8')

mtl='''newmtl housing\nKd 0.12 0.18 0.21\nPm 0.55\nPr 0.38\nnewmtl top\nKd 0.04 0.07 0.08\nnewmtl screen_frame\nKd 0.02 0.04 0.05\nnewmtl screen_glass\nKd 0.02 0.22 0.24\nKe 0.02 0.35 0.32\nPm 0.2\nnewmtl charge_green\nKd 0.08 0.8 0.62\nKe 0.05 1.0 0.75\nnewmtl warning\nKd 0.9 0.22 0.08\nKe 1.0 0.08 0.02\nnewmtl terminal\nKd 0.48 0.34 0.17\nPm 0.7\nnewmtl terminal_cap\nKd 0.65 0.72 0.68\nnewmtl rail\nKd 0.28 0.34 0.36\nnewmtl foot\nKd 0.08 0.1 0.1\nnewmtl bolt\nKd 0.65 0.68 0.62\n'''
(out/'battery_module.mtl').write_text(mtl,encoding='utf-8')
print(out/'battery_module.obj')
