import { Car, CarPart, CarStats, PartType } from '../models/types';

// Formulas & Logic for Antigravity Gameplay

// 1. Calculate Stats (Base + Parts + Synergies)
export const calculateStats = (car: Car): CarStats => {
    // Start with base stats or default 0
    const current: CarStats = { ...car.baseStats || { ac: 0, mn: 0, tr: 0, cn: 0, es: 0, fi: 0 } };

    // Apply Parts
    car.parts.forEach(part => {
        if (part.bonusStats.ac) current.ac += part.bonusStats.ac;
        if (part.bonusStats.mn) current.mn += part.bonusStats.mn;
        if (part.bonusStats.tr) current.tr += part.bonusStats.tr;
        if (part.bonusStats.cn) current.cn += part.bonusStats.cn; // Usually negative for upgrades
        if (part.bonusStats.es) current.es += part.bonusStats.es;
        if (part.bonusStats.fi) current.fi += part.bonusStats.fi;
    });

    // Apply SYNERGIES
    const hasPart = (type: PartType) => car.parts.some(p => p.type === type);

    // Synergy "Stage 2": Turbo + Intercooler = +15% AC
    if (hasPart('turbo') && hasPart('intercooler')) {
        current.ac = Math.floor(current.ac * 1.15);
    }

    // Synergy "Manejo": Suspension + Tires = +10 MN
    if (hasPart('suspension') && hasPart('tires')) {
        current.mn += 10;
    }

    // Clamp values 0-100
    (Object.keys(current) as (keyof CarStats)[]).forEach(k => {
        current[k] = Math.max(0, Math.min(100, current[k]));
    });

    return current;
};

// 2. Risk of Malfunction (Chapuza)
export const checkMalfunctionRisk = (car: Car): { hasRisk: boolean, exploded: boolean } => {
    const lowQualityCount = car.parts.filter(p => p.quality === 'low').length;

    if (lowQualityCount > 2) {
        // 20% chance of failure
        const exploded = Math.random() < 0.2;
        return { hasRisk: true, exploded };
    }

    return { hasRisk: false, exploded: false };
};

// 3. Score Event
export type EventType = 'drift' | 'offroad' | 'consumption' | 'aesthetic' | 'acceleration';

export const calculateEventScore = (car: Car, type: EventType, adminNote: number = 0): number => {
    // specific logic for failure
    const { exploded } = checkMalfunctionRisk(car);
    if (exploded) return 0; // Avería total

    const stats = calculateStats(car);
    let rawScore = 0;

    switch (type) {
        case 'drift':
            // MN * 0.7 + FI * 0.3
            rawScore = (stats.mn * 0.7) + (stats.fi * 0.3);
            break;
        case 'offroad':
            // TR * 0.8 + FI * 0.2
            rawScore = (stats.tr * 0.8) + (stats.fi * 0.2);
            break;
        case 'consumption':
            // CN * 1.0 (Higher is better efficiency in stat terms usually, or we invert? 
            // Prompt says "Neumáticos: +MN, -CN". Assuming CN is "Efficiency" (0 bad, 100 good) or "Consumption" (0 good, 100 bad)?
            // Prompt: "Semana Consumo: CN * 1.0". 
            // Tires give "-CN". This implies CN is "Economy" (good thing) because Tires usually hurt economy (wider/stickier). 
            // Or CN is "Consumption" (bad) and Tires reduce it? No, Tires usually Increase consumption.
            // Let's assume CN is "Efficiency/Economy" (0-100). 100 is best.
            rawScore = stats.cn * 1.0;
            break;
        case 'aesthetic':
            // Nota Admin * ES
            // We assume Nota Admin is a multiplier? Or maybe (ES * 0.5 + Admin * 5)?
            // Prompt: "Nota Admin * ES". If Admin gives 0.8 (8/10), score is 80% of Aesthetics.
            // Let's normalize Admin Note to 0-1.0
            const adminMultiplier = Math.min(1, Math.max(0, adminNote / 10)); // 0-10 input
            rawScore = stats.es * (0.5 + adminMultiplier); // Modified to ensure ES matters even without admin
            break;
        case 'acceleration':
            // AC * 1.0
            rawScore = stats.ac * 1.0;
            break;
    }

    return Math.round(rawScore);
};

// Helper to get formatted part name
export const getPartName = (type: PartType): string => {
    switch (type) {
        case 'tires': return 'Neumáticos';
        case 'turbo': return 'Turbo';
        case 'intercooler': return 'Intercooler';
        case 'suspension': return 'Suspensión';
        case 'transmission': return 'Transmisión';
        default: return type;
    }
};
