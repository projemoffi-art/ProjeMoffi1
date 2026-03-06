"""
moffi_build.py — Blender 4.3+ / 5.0 Compatible
"""

import bpy
import os

# -------------------------------------------------
# CONFIG
# -------------------------------------------------
FBX_DIR = r"C:\Users\uveys\OneDrive\Masaüstü\ProjeMoffi1\MoffiVercel\public\models"
OUTPUT  = r"C:\Users\uveys\OneDrive\Masaüstü\ProjeMoffi1\MoffiVercel\public\models\moffi.glb"

CLIPS = {
    "RUN":      os.path.join(FBX_DIR, "run.fbx"),
    "JUMP":     os.path.join(FBX_DIR, "jump.fbx"),
    "SLIDE":    os.path.join(FBX_DIR, "slide.fbx"),
    "IDLE":     os.path.join(FBX_DIR, "idle.fbx"),
    "SIDESTEP": os.path.join(FBX_DIR, "sidestep.fbx"),
    "HIT":      os.path.join(FBX_DIR, "hit.fbx"),
}

# Moffi renkleri (linear RGB, alpha=1)
COL_FUR     = (0.234, 0.096, 0.369, 1.0)
COL_HOODIE  = (0.884, 0.243, 0.008, 1.0)
COL_SHORTS  = (0.022, 0.074, 0.180, 1.0)
COL_SHOE    = (0.030, 0.030, 0.030, 1.0)

# -------------------------------------------------
# HELPERS
# -------------------------------------------------
def make_mat(name, color):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = 0.75
    return m

def colorize(obj):
    if obj.type != 'MESH':
        return
    for slot in obj.material_slots:
        if not slot.material:
            continue
        n = slot.material.name.lower()
        if any(k in n for k in ["body","skin","fur","wolf"]):
            slot.material = make_mat("M_Fur", COL_FUR)
        elif any(k in n for k in ["shirt","jacket","hoodie","top","upper"]):
            slot.material = make_mat("M_Hoodie", COL_HOODIE)
        elif any(k in n for k in ["pant","jean","short","lower"]):
            slot.material = make_mat("M_Shorts", COL_SHORTS)
        elif any(k in n for k in ["shoe","boot","foot"]):
            slot.material = make_mat("M_Shoe", COL_SHOE)
        else:
            slot.material = make_mat("M_Fur", COL_FUR)

def add_ears(armature):
    """Kedi kulaklarını Head kemiğine ekle"""
    for side, x in [("L", 0.09), ("R", -0.09)]:
        bpy.ops.mesh.primitive_cone_add(radius1=0.035, depth=0.08, enter_editmode=False)
        ear = bpy.context.active_object
        ear.name = f"Ear_{side}"
        ear.data.materials.append(make_mat("M_Ear", (0.18, 0.06, 0.28, 1.0)))
        ear.parent = armature
        ear.parent_type = 'BONE'
        ear.parent_bone = 'Head'
        ear.location = (x, -0.02, 0.13)
        ear.rotation_euler = (0, 0, 0)

# -------------------------------------------------
# MAIN
# -------------------------------------------------
print("\n🎭 Moffi Build — Blender 5.0 Uyumlu\n")

# 1) Temizle
bpy.ops.wm.read_homefile(use_empty=True)

# 2) FBX addon etkinleştir (4.3'te varsayılan, 5.0'da kontrol gerekebilir)
if hasattr(bpy.ops, 'preferences'):
    try:
        bpy.ops.preferences.addon_enable(module="io_scene_fbx")
    except:
        pass

# 3) Base model
print("📁 RUN animasyonu import ediliyor...")
bpy.ops.import_scene.fbx(
    filepath=CLIPS["RUN"],
    use_anim=True,
    ignore_leaf_bones=False,
    force_connect_children=False,
    automatic_bone_orientation=False,
    primary_bone_axis='Y',
    secondary_bone_axis='X',
)

# Armature bul
armature = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
if not armature:
    print("❌ Armature bulunamadı!")
    raise RuntimeError("No armature")

armature.name = "Moffi"
print(f"✅ Armature: {armature.name}")

# İlk action'ı RUN olarak işaretle
for a in bpy.data.actions:
    a.name = "RUN"
    break

# 4) Renkleri uygula
for obj in bpy.data.objects:
    colorize(obj)

# 5) Kedi kulakları
print("🐱 Kulaklar ekleniyor...")
try:
    add_ears(armature)
except Exception as e:
    print(f"⚠️ Kulak hatası (atlandı): {e}")

# 6) Animasyonları import et
for clip_name, path in CLIPS.items():
    if clip_name == "RUN":
        continue
    print(f"🎬 {clip_name} import: {os.path.basename(path)}")
    try:
        bpy.ops.import_scene.fbx(filepath=path, use_anim=True)
        
        # Yeni import edilen armature'un action'ını al
        for obj in bpy.context.selected_objects:
            if obj.type == 'ARMATURE' and obj != armature:
                if obj.animation_data and obj.animation_data.action:
                    action = obj.animation_data.action
                    action.name = clip_name
                    print(f"   ✅ Action: {action.name}")
                # Kopyayı sil
                bpy.data.objects.remove(obj, do_unlink=True)
    except Exception as e:
        print(f"   ⚠️ {clip_name} atlandı: {e}")

# 7) Ana armature seç
bpy.ops.object.select_all(action='DESELECT')
armature.select_set(True)
bpy.context.view_layer.objects.active = armature

print(f"\n📦 Toplam action: {len(bpy.data.actions)}")
for a in bpy.data.actions:
    print(f"   → {a.name} ({a.frame_range[0]:.0f}-{a.frame_range[1]:.0f} frame)")

# 8) GLB Export
print(f"\n💾 Export: {OUTPUT}")
bpy.ops.export_scene.gltf(
    filepath=OUTPUT,
    export_format='GLB',
    export_animations=True,
    export_optimize_animation_size=True,
    export_image_format='NONE',
    export_cameras=False,
    export_lights=False,
)

size_kb = os.path.getsize(OUTPUT) / 1024
print(f"\n✅ BITTI! moffi.glb — {size_kb:.0f} KB")
