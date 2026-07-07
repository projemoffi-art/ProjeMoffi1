/**
 * MoffiModel3D v3 — Pixar/Disney Spec
 *
 * Spec from user prompt:
 * - Thick lavender-purple fur
 * - WHITE muzzle, small PINK nose
 * - Big bright GREEN eyes with eyelashes (open, expressive)
 * - White paws with PINK TOE BEANS
 * - Orange hoodie, WHITE drawstrings, CYAN-BLUE glowing M on CHEST
 * - Dark blue shorts, 2 WHITE stripes
 * - Arms raised playfully in the air
 * - Purple tail, WHITE TIP
 */

import * as THREE from 'three';

const C = {
    FUR: 0xB57BDE,  // Lavender purple fur
    FUR_MID: 0x9B6BB5,  // Mid purple
    FUR_DARK: 0x7B4F9E,  // Dark purple (ear outer, shadows)
    FUR_LIGHT: 0xD4A8F0,  // Light puffy highlight
    MUZZLE: 0xFFF5E6,  // White/cream muzzle
    NOSE: 0xFF8FAB,  // Pink nose
    PAW: 0xFFFFFF,  // White paws
    TOE_BEAN: 0xFFB3C6,  // Pink toe beans
    HOODIE: 0xF97316,  // Orange hoodie
    HOODIE_D: 0xC2560E,  // Dark orange shadow
    DRAWSTRING: 0xFFFFFF,  // White drawstrings
    SHORTS: 0x1D4ED8,  // Dark blue shorts
    STRIPE: 0xFFFFFF,  // White side stripe
    EYE_WHITE: 0xFFFFFF,
    EYE_GREEN: 0x22C55E,  // Bright green iris!
    EYE_DARK: 0x14532D,  // Dark green pupil base
    PUPIL: 0x0A0A0A,  // Black pupil
    EYE_SHINE: 0xFFFFFF,
    TEETH: 0xFFFAF0,
    TONGUE: 0xFF8FAB,
    INNER_EAR: 0xFFB3C6,  // Pink inner ear
    LASH: 0x1A0A2E,  // Dark eyelash
    TAIL: 0x9B6BB5,  // Purple tail
    TAIL_TIP: 0xFFFFFF,  // WHITE tail tip
    CYAN_M: 0x00FFFF,  // Neon cyan M
    CYAN_GLOW: 0x67E8F9,
};

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0, ...opts });
}
function S(rx: number, ry: number, rz: number, color: number, opts = {}) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), mat(color, opts));
    m.scale.set(rx, ry, rz); return m;
}
function B(w: number, h: number, d: number, color: number, opts = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(color, opts));
    m.scale.set(w, h, d); return m;
}
function Cy(rT: number, rB: number, h: number, color: number, segs = 16) {
    return new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, segs), mat(color));
}
function Cn(r: number, h: number, color: number) {
    return new THREE.Mesh(new THREE.ConeGeometry(r, h, 14), mat(color));
}
function add(parent: THREE.Object3D, child: THREE.Object3D) {
    parent.add(child); return child;
}

export function buildMoffiModel(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'Moffi_v3';

    // ==============================================
    // BODY (orange hoodie)
    // ==============================================
    const bodyGrp = new THREE.Group();
    bodyGrp.name = 'Body';
    bodyGrp.position.y = -0.15;
    root.add(bodyGrp);

    // Torso — slightly taller for upright pose
    const torso = S(0.62, 0.72, 0.54, C.HOODIE);
    bodyGrp.add(torso);

    // Front hoodie center seam / texture depth
    const frontPanel = S(0.40, 0.55, 0.12, C.HOODIE_D);
    frontPanel.position.set(0, 0, 0.44);
    bodyGrp.add(frontPanel);

    // Chest area (white fur showing at collar)
    const collarFur = S(0.24, 0.16, 0.12, C.MUZZLE);
    collarFur.position.set(0, 0.44, 0.36);
    bodyGrp.add(collarFur);

    // Kangaroo pocket
    const pocket = S(0.32, 0.16, 0.09, C.HOODIE_D);
    pocket.position.set(0, -0.20, 0.50);
    bodyGrp.add(pocket);

    // Hood (back of head/neck)
    const hood = S(0.34, 0.26, 0.26, C.HOODIE_D);
    hood.position.set(0, 0.46, -0.36);
    bodyGrp.add(hood);

    // White drawstrings
    [-0.06, 0.06].forEach(x => {
        const ds = Cy(0.012, 0.012, 0.28, C.DRAWSTRING);
        ds.position.set(x, 0.05, 0.52);
        ds.rotation.x = 0.2;
        bodyGrp.add(ds);
        // Drawstring tip (small ball)
        const tip = S(0.022, 0.022, 0.022, C.DRAWSTRING);
        tip.position.set(x, -0.10, 0.54);
        bodyGrp.add(tip);
    });

    // GLOWING CYAN M on chest
    const mGrp = new THREE.Group();
    mGrp.position.set(0, 0.14, 0.54);
    mGrp.name = 'ChestM';
    bodyGrp.add(mGrp);

    const glowMat = mat(C.CYAN_M, {
        emissive: new THREE.Color(C.CYAN_M),
        emissiveIntensity: 3.5,
        roughness: 0.1,
    });
    const glowPointLight = new THREE.PointLight(C.CYAN_M, 2, 1.2);
    glowPointLight.position.set(0, 0, 0.1);
    mGrp.add(glowPointLight);

    // M letter parts
    [
        { s: [0.022, 0.18, 0.022], p: [-0.09, 0, 0] },
        { s: [0.022, 0.18, 0.022], p: [0.09, 0, 0] },
        { s: [0.022, 0.14, 0.022], p: [-0.046, 0.04, 0], rz: -0.45 },
        { s: [0.022, 0.14, 0.022], p: [0.046, 0.04, 0], rz: 0.45 },
    ].forEach(p => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), glowMat);
        m.scale.set(...p.s as [number, number, number]);
        m.position.set(...p.p as [number, number, number]);
        if ((p as any).rz) m.rotation.z = (p as any).rz;
        mGrp.add(m);
    });

    // M glow halo
    const halo = S(0.20, 0.20, 0.03, C.CYAN_M, { transparent: true, opacity: 0.12 });
    mGrp.add(halo);

    // ==============================================
    // ARMS — raised up playfully
    // ==============================================
    [[-1, 'L'], [1, 'R']].forEach(([s, lbl]) => {
        const side = s as number;
        const armGrp = new THREE.Group();
        armGrp.name = `Arm_${lbl}`;
        bodyGrp.add(armGrp);

        // Upper arm (angled up)
        const upper = Cy(0.13, 0.11, 0.40, C.HOODIE);
        upper.position.set(side * 0.48, 0.22, 0);
        upper.rotation.z = side * -1.1;  // arm raised up!
        armGrp.add(upper);

        // Forearm
        const fore = Cy(0.11, 0.10, 0.32, C.HOODIE);
        fore.position.set(side * 0.74, 0.54, 0);
        fore.rotation.z = side * -0.7;
        armGrp.add(fore);

        // White paw (at top since arms raised)
        const paw = S(0.18, 0.16, 0.15, C.PAW);
        paw.position.set(side * 0.86, 0.76, 0.02);
        paw.name = `Paw_${lbl}`;
        armGrp.add(paw);

        // Pink toe beans (3 per paw)
        for (let i = -1; i <= 1; i++) {
            const bean = S(0.037, 0.028, 0.025, C.TOE_BEAN);
            bean.position.set(side * 0.90 + i * 0.065, 0.82, 0.10);
            armGrp.add(bean);
        }
        // Palm bean (bigger center)
        const palmBean = S(0.048, 0.038, 0.030, C.TOE_BEAN);
        palmBean.position.set(side * 0.88, 0.72, 0.12);
        armGrp.add(palmBean);
    });

    // ==============================================
    // SHORTS
    // ==============================================
    const shortsGrp = new THREE.Group();
    shortsGrp.name = 'Shorts';
    shortsGrp.position.y = -0.68;
    root.add(shortsGrp);

    const shorts = S(0.58, 0.30, 0.50, C.SHORTS);
    shortsGrp.add(shorts);

    [-1, 1].forEach(s => {
        // Side stripe (2 stripes as specified)
        const stripe1 = B(0.032, 0.28, 0.070, C.STRIPE);
        stripe1.position.set(s * 0.31, 0, 0.18);
        shortsGrp.add(stripe1);
        const stripe2 = B(0.032, 0.28, 0.070, C.STRIPE);
        stripe2.position.set(s * 0.24, 0, 0.20);
        shortsGrp.add(stripe2);
    });

    // ==============================================
    // LEGS (short, chibi)
    // ==============================================
    [[-1, 'L'], [1, 'R']].forEach(([s, lbl]) => {
        const side = s as number;
        const legGrp = new THREE.Group();
        legGrp.name = `Leg_${lbl}`;
        root.add(legGrp);

        const thigh = Cy(0.16, 0.14, 0.28, C.FUR_MID);
        thigh.position.set(side * 0.21, -0.90, 0);
        legGrp.add(thigh);

        const shin = Cy(0.14, 0.11, 0.24, C.FUR);
        shin.position.set(side * 0.21, -1.12, 0);
        legGrp.add(shin);

        // White paw / foot
        const foot = S(0.24, 0.15, 0.30, C.PAW);
        foot.position.set(side * 0.21, -1.26, 0.07);
        foot.name = `Foot_${lbl}`;
        legGrp.add(foot);

        // Toe beans on feet (2 visible)
        for (let i = -1; i <= 1; i++) {
            const bean = S(0.044, 0.034, 0.030, C.TOE_BEAN);
            bean.position.set(side * 0.21 + i * 0.07, -1.28, 0.26);
            legGrp.add(bean);
        }
    });

    // ==============================================
    // HEAD — Large chibi head with GREEN EYES
    // ==============================================
    const headGrp = new THREE.Group();
    headGrp.name = 'Head';
    headGrp.position.set(0, 0.68, 0);
    root.add(headGrp);

    // Main skull — very large (Pixar proportions)
    const skull = S(0.68, 0.64, 0.62, C.FUR);
    skull.name = 'Skull';
    headGrp.add(skull);

    // Top head lighter fluff
    const topFluff = S(0.46, 0.22, 0.34, C.FUR_LIGHT);
    topFluff.position.set(0, 0.50, 0.10);
    headGrp.add(topFluff);

    // Cheek puffs (big fluffy!)
    [-1, 1].forEach(s => {
        const cheek = S(0.30, 0.26, 0.22, C.FUR_LIGHT);
        cheek.position.set(s * 0.50, -0.06, 0.26);
        headGrp.add(cheek);

        // Whisker dots (small bumps on cheeks)
        for (let i = 0; i < 3; i++) {
            const dot = S(0.018, 0.018, 0.012, C.FUR_DARK);
            dot.position.set(s * 0.50 + (s * i * 0.04), -0.02 + i * -0.05, 0.40);
            headGrp.add(dot);
        }
    });

    // White muzzle
    const muzzle = S(0.32, 0.24, 0.24, C.MUZZLE);
    muzzle.position.set(0, -0.12, 0.52);
    headGrp.add(muzzle);

    // Pink nose
    const nose = S(0.09, 0.065, 0.065, C.NOSE);
    nose.position.set(0, 0.06, 0.70);
    headGrp.add(nose);

    // ---- BRIGHT GREEN EYES (open, expressive) ----
    [-1, 1].forEach(s => {
        // Eye socket (slight indent — white sclera)
        const sclera = S(0.17, 0.19, 0.10, C.EYE_WHITE);
        sclera.position.set(s * 0.26, 0.16, 0.56);
        headGrp.add(sclera);

        // Green iris
        const iris = S(0.13, 0.15, 0.08, C.EYE_GREEN);
        iris.position.set(s * 0.26, 0.16, 0.60);
        headGrp.add(iris);

        // Pupil
        const pupil = S(0.07, 0.09, 0.06, C.PUPIL);
        pupil.position.set(s * 0.26, 0.16, 0.62);
        headGrp.add(pupil);

        // 2x Eye shines
        const shine1 = S(0.04, 0.04, 0.03, C.EYE_SHINE);
        shine1.position.set(s * 0.295, 0.22, 0.63);
        headGrp.add(shine1);
        const shine2 = S(0.022, 0.022, 0.015, C.EYE_SHINE);
        shine2.position.set(s * 0.23, 0.13, 0.63);
        headGrp.add(shine2);

        // Eyelashes (top) — 4 lashes
        for (let i = 0; i < 4; i++) {
            const lash = B(0.012, 0.055, 0.010, C.LASH);
            const lx = s * 0.26 + (i - 1.5) * 0.055 * s;
            lash.position.set(lx, 0.33, 0.575);
            lash.rotation.z = (i - 1.5) * -0.22 * s;
            headGrp.add(lash);
        }

        // Lower lash line
        const lowerLash = B(0.26, 0.012, 0.010, C.LASH);
        lowerLash.position.set(s * 0.26, 0.075, 0.572);
        headGrp.add(lowerLash);
    });

    // Brow (expressive, slight arch)
    [-1, 1].forEach(s => {
        const brow = B(0.20, 0.022, 0.014, C.FUR_DARK);
        brow.position.set(s * 0.27, 0.38, 0.54);
        brow.rotation.z = s * -0.22;
        headGrp.add(brow);
    });

    // ---- MOUTH (open happy) ----
    const upperLip = S(0.28, 0.05, 0.05, C.FUR_DARK);
    upperLip.position.set(0, -0.06, 0.72);
    headGrp.add(upperLip);

    const innerMouth = S(0.21, 0.14, 0.07, C.TONGUE, { roughness: 0.8 });
    innerMouth.position.set(0, -0.14, 0.73);
    headGrp.add(innerMouth);

    [-0.065, 0.065].forEach(tx => {
        const tooth = B(0.078, 0.075, 0.045, C.TEETH);
        tooth.position.set(tx, -0.07, 0.75);
        headGrp.add(tooth);
    });

    const tongue = S(0.13, 0.085, 0.055, C.TONGUE);
    tongue.position.set(0, -0.19, 0.73);
    headGrp.add(tongue);

    [-1, 1].forEach(s => {
        const corner = B(0.060, 0.042, 0.032, C.FUR_DARK);
        corner.position.set(s * 0.24, -0.06, 0.71);
        corner.rotation.z = -s * 0.85;
        headGrp.add(corner);
    });

    // ---- CAT EARS ----
    [-1, 1].forEach(s => {
        const earGrp = new THREE.Group();
        earGrp.position.set(s * 0.40, 0.54, -0.06);
        earGrp.rotation.z = -s * 0.15;
        earGrp.rotation.x = -0.05;
        headGrp.add(earGrp);

        const outer = Cn(0.20, 0.36, C.FUR_DARK);
        earGrp.add(outer);

        const inner = Cn(0.11, 0.24, C.INNER_EAR);
        inner.position.set(0, 0.02, 0.05);
        earGrp.add(inner);

        // Ear tuft
        const tuft1 = S(0.06, 0.09, 0.05, C.FUR_DARK);
        tuft1.position.set(0, 0.22, 0.04);
        earGrp.add(tuft1);
    });

    // ---- WHISKERS ----
    [-1, 1].forEach(s => {
        [0.02, -0.06].forEach((wy, wi) => {
            const whisker = B(0.28, 0.009, 0.007, 0xEEEEEE);
            whisker.position.set(s * 0.38, wy, 0.62);
            whisker.rotation.z = s * (wi * 0.12 - 0.06);
            headGrp.add(whisker);
        });
    });

    // ==============================================
    // TAIL — purple with WHITE tip
    // ==============================================
    const tailGrp = new THREE.Group();
    tailGrp.name = 'Tail';
    tailGrp.position.set(0.28, -0.48, -0.42);
    root.add(tailGrp);

    const segs = [
        { p: [0, 0, 0] as const, r: [0.7, 0, 0.3] as const, c: C.TAIL, rT: 0.12, rB: 0.11 },
        { p: [0.10, 0.22, -0.06] as const, r: [0.4, 0, 0.6] as const, c: C.TAIL, rT: 0.11, rB: 0.10 },
        { p: [0.24, 0.40, -0.05] as const, r: [0.05, 0, 0.9] as const, c: C.TAIL, rT: 0.10, rB: 0.09 },
        { p: [0.38, 0.54, 0.06] as const, r: [-0.3, 0, 1.1] as const, c: C.TAIL, rT: 0.09, rB: 0.08 },
        { p: [0.46, 0.64, 0.16] as const, r: [-0.55, 0, 1.2] as const, c: C.TAIL_TIP, rT: 0.08, rB: 0.07 },
    ] as const;

    segs.forEach(seg => {
        const t = Cy(seg.rT, seg.rB, 0.22, seg.c);
        t.position.set(...seg.p);
        t.rotation.set(...seg.r);
        tailGrp.add(t);
    });

    // White fluffy tip
    const tailTip = S(0.18, 0.18, 0.18, C.TAIL_TIP);
    tailTip.position.set(0.48, 0.72, 0.22);
    tailGrp.add(tailTip);

    // Extra fluff
    const tipFuzz = S(0.12, 0.10, 0.12, C.TAIL_TIP);
    tipFuzz.position.set(0.44, 0.66, 0.16);
    tailGrp.add(tipFuzz);

    // ==============================================
    // CAST SHADOWS
    // ==============================================
    root.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return root;
}
