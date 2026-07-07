// =====================================================
// MOFFI RUN — LEVEL GENERATOR (Subway-Level Architecture)
// =====================================================

export type ObstacleType =
    | 'BARRIER_LOW'   // Zıpla (log)
    | 'BARRIER_HIGH'  // Kay (branch)
    | 'BUSH'          // Kaç (mantar)
    | 'TRAFFIC_CONE'  // Kaç (kütük)
    | 'DOUBLE_LANE';  // 2 şerit blok — ortadan geç

export type ItemType = 'COIN' | 'MAGNET' | 'ROCKET' | 'SNAIL' | 'SHIELD' | 'MULTIPLIER';

export interface LevelObject {
    id: string;
    uniqueId?: string;
    type: ObstacleType | ItemType;
    x: number;   // Lane: -1, 0, 1
    z: number;   // Local Z within chunk
    y?: number;  // Height (coin arcs)
    collected?: boolean;
}

export interface Chunk {
    id: string;
    length: number;
    difficulty: 'easy' | 'medium' | 'hard';
    objects: LevelObject[];
}

// =====================================================
// CHUNK LIBRARY
// =====================================================

const CHUNKS: Chunk[] = [
    // --- EASY ---
    {
        id: 'EMPTY',
        difficulty: 'easy',
        length: 20,
        objects: []
    },
    {
        id: 'COIN_LINE_CENTER',
        difficulty: 'easy',
        length: 30,
        objects: [
            { id: 'c1', type: 'COIN', x: 0, z: 5 },
            { id: 'c2', type: 'COIN', x: 0, z: 8 },
            { id: 'c3', type: 'COIN', x: 0, z: 11 },
            { id: 'c4', type: 'COIN', x: 0, z: 14 },
            { id: 'c5', type: 'COIN', x: 0, z: 17 },
        ]
    },
    {
        id: 'COIN_LEFT',
        difficulty: 'easy',
        length: 25,
        objects: [
            { id: 'c1', type: 'COIN', x: -1, z: 5 },
            { id: 'c2', type: 'COIN', x: -1, z: 8 },
            { id: 'c3', type: 'COIN', x: -1, z: 11 },
            { id: 'ob1', type: 'BARRIER_LOW', x: 1, z: 10 },
        ]
    },
    {
        id: 'COIN_RIGHT',
        difficulty: 'easy',
        length: 25,
        objects: [
            { id: 'c1', type: 'COIN', x: 1, z: 5 },
            { id: 'c2', type: 'COIN', x: 1, z: 8 },
            { id: 'c3', type: 'COIN', x: 1, z: 11 },
            { id: 'ob1', type: 'BARRIER_LOW', x: -1, z: 10 },
        ]
    },
    {
        id: 'DODGE_LEFT',
        difficulty: 'easy',
        length: 30,
        objects: [
            { id: 'ob1', type: 'BUSH', x: 0, z: 10 },
            { id: 'ob2', type: 'BUSH', x: 1, z: 10 },
            { id: 'c1', type: 'COIN', x: -1, z: 10 },
            { id: 'c2', type: 'COIN', x: -1, z: 13 },
        ]
    },
    {
        id: 'DODGE_RIGHT',
        difficulty: 'easy',
        length: 30,
        objects: [
            { id: 'ob1', type: 'BUSH', x: 0, z: 10 },
            { id: 'ob2', type: 'BUSH', x: -1, z: 10 },
            { id: 'c1', type: 'COIN', x: 1, z: 10 },
            { id: 'c2', type: 'COIN', x: 1, z: 13 },
        ]
    },
    {
        id: 'JUMP_OVER',
        difficulty: 'easy',
        length: 35,
        objects: [
            { id: 'ob1', type: 'BARRIER_LOW', x: 0, z: 12 },
            { id: 'c1', type: 'COIN', x: 0, z: 12, y: 2.5 }, // Jump reward
            { id: 'c2', type: 'COIN', x: -1, z: 20 },
            { id: 'c3', type: 'COIN', x: 1, z: 20 },
        ]
    },

    // --- MEDIUM ---
    {
        id: 'COIN_ARC',
        difficulty: 'medium',
        length: 30,
        objects: [
            { id: 'c1', type: 'COIN', x: 0, z: 5, y: 0.5 },
            { id: 'c2', type: 'COIN', x: 0, z: 7, y: 1.5 },
            { id: 'c3', type: 'COIN', x: 0, z: 9, y: 2.3 },
            { id: 'c4', type: 'COIN', x: 0, z: 11, y: 2.5 },
            { id: 'c5', type: 'COIN', x: 0, z: 13, y: 2.3 },
            { id: 'c6', type: 'COIN', x: 0, z: 15, y: 1.5 },
            { id: 'c7', type: 'COIN', x: 0, z: 17, y: 0.5 },
        ]
    },
    {
        id: 'SLIDE_UNDER',
        difficulty: 'medium',
        length: 35,
        objects: [
            { id: 'ob1', type: 'BARRIER_HIGH', x: 0, z: 12 },
            { id: 'c1', type: 'COIN', x: -1, z: 10 },
            { id: 'c2', type: 'COIN', x: 1, z: 10 },
            { id: 'c3', type: 'COIN', x: 0, z: 18 },
        ]
    },
    {
        id: 'SLALOM_LR',
        difficulty: 'medium',
        length: 50,
        objects: [
            { id: 'ob1', type: 'BARRIER_LOW', x: 0, z: 10 },
            { id: 'ob2', type: 'BARRIER_LOW', x: 1, z: 10 },
            { id: 'c1', type: 'COIN', x: -1, z: 10 },
            { id: 'ob3', type: 'BARRIER_LOW', x: -1, z: 30 },
            { id: 'ob4', type: 'BARRIER_LOW', x: 0, z: 30 },
            { id: 'c2', type: 'COIN', x: 1, z: 30 },
        ]
    },
    {
        id: 'POWERUP_RUN',
        difficulty: 'medium',
        length: 40,
        objects: [
            { id: 'c1', type: 'COIN', x: -1, z: 8 },
            { id: 'c2', type: 'COIN', x: 0, z: 8 },
            { id: 'c3', type: 'COIN', x: 1, z: 8 },
            { id: 'p1', type: 'MAGNET', x: 0, z: 16 },
            { id: 'ob1', type: 'TRAFFIC_CONE', x: -1, z: 28 },
            { id: 'ob2', type: 'TRAFFIC_CONE', x: 1, z: 28 },
            { id: 'c4', type: 'COIN', x: 0, z: 28 },
        ]
    },
    {
        id: 'DUAL_THREAT',
        difficulty: 'medium',
        length: 40,
        objects: [
            // 2 lanes blocked, must go to 1 escape lane
            { id: 'ob1', type: 'BUSH', x: -1, z: 12 },
            { id: 'ob2', type: 'BUSH', x: 0, z: 12 },
            { id: 'c1', type: 'COIN', x: 1, z: 12 }, // escape right
            { id: 'ob3', type: 'BUSH', x: 0, z: 28 },
            { id: 'ob4', type: 'BUSH', x: 1, z: 28 },
            { id: 'c2', type: 'COIN', x: -1, z: 28 }, // escape left
        ]
    },
    {
        id: 'SHIELD_RUN',
        difficulty: 'medium',
        length: 35,
        objects: [
            { id: 'p1', type: 'SHIELD', x: 0, z: 8 },
            { id: 'ob1', type: 'BARRIER_LOW', x: -1, z: 18 },
            { id: 'ob2', type: 'BUSH', x: 1, z: 18 },
            { id: 'c1', type: 'COIN', x: 0, z: 18 },
        ]
    },

    // --- HARD ---
    {
        id: 'ZIGZAG',
        difficulty: 'hard',
        length: 60,
        objects: [
            { id: 'ob1', type: 'TRAFFIC_CONE', x: -1, z: 10 },
            { id: 'ob2', type: 'TRAFFIC_CONE', x: 0, z: 10 },
            { id: 'c1', type: 'COIN', x: 1, z: 10 },
            { id: 'ob3', type: 'BARRIER_LOW', x: 1, z: 22 },
            { id: 'ob4', type: 'BARRIER_LOW', x: 0, z: 22 },
            { id: 'c2', type: 'COIN', x: -1, z: 22 },
            { id: 'ob5', type: 'BUSH', x: -1, z: 38 },
            { id: 'ob6', type: 'BUSH', x: 0, z: 38 },
            { id: 'c3', type: 'COIN', x: 1, z: 38 },
            { id: 'ob7', type: 'TRAFFIC_CONE', x: 0, z: 52 },
            { id: 'ob8', type: 'TRAFFIC_CONE', x: 1, z: 52 },
            { id: 'c4', type: 'COIN', x: -1, z: 52 },
        ]
    },
    {
        id: 'GAUNTLET',
        difficulty: 'hard',
        length: 70,
        objects: [
            { id: 'ob1', type: 'BARRIER_HIGH', x: 0, z: 10 }, // slide
            { id: 'c1', type: 'COIN', x: -1, z: 10 },
            { id: 'c2', type: 'COIN', x: 1, z: 10 },
            { id: 'ob2', type: 'BARRIER_LOW', x: -1, z: 24 }, // jump
            { id: 'ob3', type: 'BARRIER_LOW', x: 1, z: 24 },
            { id: 'c3', type: 'COIN', x: 0, z: 24, y: 2.5 },
            { id: 'p1', type: 'MULTIPLIER', x: 0, z: 36 }, // reward powerup
            { id: 'ob4', type: 'BUSH', x: -1, z: 50 },
            { id: 'ob5', type: 'BUSH', x: 0, z: 50 },
            { id: 'ob6', type: 'BUSH', x: 1, z: 50 },  // Triple — must be impossible? No, there's gap after
        ]
    },
    {
        id: 'JUMP_SLIDE_COMBO',
        difficulty: 'hard',
        length: 50,
        objects: [
            { id: 'ob1', type: 'BARRIER_LOW', x: 0, z: 10 },
            { id: 'ob2', type: 'BARRIER_LOW', x: -1, z: 10 },
            { id: 'c1', type: 'COIN', x: 1, z: 10 },
            { id: 'ob3', type: 'BARRIER_HIGH', x: 0, z: 24 }, // Right after jump land
            { id: 'c2', type: 'COIN', x: -1, z: 24 },
            { id: 'c3', type: 'COIN', x: 1, z: 24 },
            { id: 'ob4', type: 'TRAFFIC_CONE', x: 0, z: 40 },
            { id: 'p1', type: 'SHIELD', x: -1, z: 40 },
        ]
    },
    {
        id: 'DENSE_FOREST',
        difficulty: 'hard',
        length: 60,
        objects: [
            { id: 'ob1', type: 'TRAFFIC_CONE', x: -1, z: 10 },
            { id: 'ob2', type: 'TRAFFIC_CONE', x: 1, z: 15 },
            { id: 'ob3', type: 'BUSH', x: 0, z: 22 },
            { id: 'ob4', type: 'BARRIER_LOW', x: -1, z: 30 },
            { id: 'ob5', type: 'BARRIER_HIGH', x: 1, z: 38 },
            { id: 'c1', type: 'COIN', x: 0, z: 38 },
            { id: 'p1', type: 'SNAIL', x: 0, z: 48 },
        ]
    },
];

// =====================================================
// WEIGHTED RANDOM SELECTOR
// =====================================================

const DIFFICULTY_WEIGHTS = {
    easy: [
        { threshold: 0, weights: { easy: 100, medium: 0, hard: 0 } }, // 0–15 hız
        { threshold: 18, weights: { easy: 70, medium: 30, hard: 0 } }, // 18–30 hız
        { threshold: 30, weights: { easy: 40, medium: 50, hard: 10 } }, // 30–40
        { threshold: 40, weights: { easy: 15, medium: 50, hard: 35 } }, // 40+
    ]
};

function selectDifficulty(speed: number): 'easy' | 'medium' | 'hard' {
    let weights = { easy: 100, medium: 0, hard: 0 };
    for (const band of DIFFICULTY_WEIGHTS.easy) {
        if (speed >= band.threshold) weights = band.weights;
    }
    const roll = Math.random() * 100;
    if (roll < weights.easy) return 'easy';
    if (roll < weights.easy + weights.medium) return 'medium';
    return 'hard';
}

function weightedPickChunk(pool: Chunk[]): Chunk {
    return pool[Math.floor(Math.random() * pool.length)];
}

// =====================================================
// CONSTRAINT ENGINE (Impossibility Prevention)
// =====================================================

function isCompatible(prev: Chunk | null, next: Chunk): boolean {
    if (!prev) return true;
    // Never place two hard chunks in a row
    if (prev.difficulty === 'hard' && next.difficulty === 'hard') return false;
    // Never repeat same chunk
    if (prev.id === next.id) return false;
    return true;
}

// =====================================================
// LEVEL GENERATOR CLASS
// =====================================================

export class LevelGenerator {
    private currentZ: number;
    private lastChunk: Chunk | null = null;
    public currentSpeed: number = 12;

    constructor(startZ: number = -20) {
        this.currentZ = startZ;
    }

    generateNextChunk(): { objects: LevelObject[], length: number } {
        const difficulty = selectDifficulty(this.currentSpeed);
        const pool = CHUNKS.filter(c => c.difficulty === difficulty);

        let candidate = weightedPickChunk(pool);
        let attempts = 0;
        while (!isCompatible(this.lastChunk, candidate) && attempts < 5) {
            candidate = weightedPickChunk(pool);
            attempts++;
        }

        this.lastChunk = candidate;

        const worldObjects: LevelObject[] = candidate.objects.map(obj => ({
            ...obj,
            uniqueId: `${obj.id}_${this.currentZ}_${Math.random().toString(36).substr(2, 5)}`,
            z: this.currentZ - obj.z,
            collected: false,
        }));

        this.currentZ -= candidate.length;
        return { objects: worldObjects, length: candidate.length };
    }

    reset(startZ: number = -20) {
        this.currentZ = startZ;
        this.lastChunk = null;
        this.currentSpeed = 12;
    }
}
