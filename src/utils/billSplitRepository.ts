import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type {
    LoteConfig,
    Readings,
    SavedMonth,
    SavedSharedTank,
    SplitInput,
} from '../model/Types';
import { meterLabelsFor } from '../model/lotes';
import { createEmptyReadings } from './billSplit';
import { convertDate } from './utilityMethods';

/**
 * Lote C used to be stored with the shape of lote B (a single building meter and
 * four floors), so these lotes get their own collections instead of reusing the
 * legacy ones.
 */
const STATE_DOCUMENT = 'ultimo';
const SHARED_TANK_COLLECTION = 'TANQUE COMPARTIDO';

function stateCollection(config: LoteConfig): string {
    return `${config.collectionPrefix} STATE`;
}

function billsCollection(config: LoteConfig): string {
    return `${config.collectionPrefix} RECIBOS`;
}

export interface LastMonths {
    current: SavedMonth;
    previous: SavedMonth;
}

function toReadingOrNull(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function sanitizeReadings(raw: unknown, config: LoteConfig): Readings {
    const readings = createEmptyReadings(config);
    if (!raw || typeof raw !== 'object') return readings;

    meterLabelsFor(config).forEach((label: string) => {
        readings[label] = toReadingOrNull((raw as Record<string, unknown>)[label]);
    });

    return readings;
}

function sanitizeMonth(raw: unknown, config: LoteConfig): SavedMonth {
    const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

    return {
        date: typeof source.date === 'string' ? source.date : '',
        readings: sanitizeReadings(source.readings, config),
        energyCharge: toReadingOrNull(source.energyCharge),
        totalBill: toReadingOrNull(source.totalBill),
    };
}

/** Last calculation saved, used to pre-fill the form of the following month. */
export async function fetchLastMonths(config: LoteConfig): Promise<LastMonths | null> {
    const snapshot = await getDoc(doc(db, stateCollection(config), STATE_DOCUMENT));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    return {
        current: sanitizeMonth(data.current, config),
        previous: sanitizeMonth(data.previous, config),
    };
}

export async function fetchSharedTank(groupId: string): Promise<SavedSharedTank | null> {
    const snapshot = await getDoc(doc(db, SHARED_TANK_COLLECTION, groupId));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    return {
        currentDate: typeof data.currentDate === 'string' ? data.currentDate : '',
        previousDate: typeof data.previousDate === 'string' ? data.previousDate : '',
        currentReading: toReadingOrNull(data.currentReading),
        previousReading: toReadingOrNull(data.previousReading),
    };
}

/**
 * Keeps one document per billed month plus a pointer to the latest pair of months,
 * which is what lets the next month start with the previous readings already filled.
 * A shared tank meter is stored once for the whole group, so entering it on one lote
 * is enough for the other one.
 */
export async function saveMonth(config: LoteConfig, input: SplitInput): Promise<void> {
    const current: SavedMonth = {
        date: input.currentDate,
        readings: sanitizeReadings(input.currentReadings, config),
        energyCharge: input.energyCharge,
        totalBill: input.totalBill,
    };
    const previous: SavedMonth = {
        date: input.previousDate,
        readings: sanitizeReadings(input.previousReadings, config),
        energyCharge: null,
        totalBill: null,
    };

    await setDoc(doc(db, billsCollection(config), convertDate(input.currentDate)), {
        ...current,
        previousDate: input.previousDate,
        sharedTank: input.sharedTank
            ? {
                  currentReading: input.sharedTank.currentReading,
                  previousReading: input.sharedTank.previousReading,
                  shareCount: input.sharedTank.shareCount,
              }
            : null,
        savedAt: new Date().toISOString(),
    });

    await setDoc(doc(db, stateCollection(config), STATE_DOCUMENT), { current, previous });

    if (config.tankGroupId && input.sharedTank) {
        const sharedTank: SavedSharedTank = {
            currentDate: input.currentDate,
            previousDate: input.previousDate,
            currentReading: input.sharedTank.currentReading,
            previousReading: input.sharedTank.previousReading,
        };
        await setDoc(doc(db, SHARED_TANK_COLLECTION, config.tankGroupId), sharedTank);
    }
}
