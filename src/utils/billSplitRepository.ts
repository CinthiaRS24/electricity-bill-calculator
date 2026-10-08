import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { LoteConfig, Readings, SavedMonth, SplitInput } from '../model/Types';
import { meterLabelsFor } from '../model/lotes';
import { createEmptyReadings } from './billSplit';
import { convertDate } from './utilityMethods';

/**
 * Lote C used to be stored with the shape of lote B (a single building meter and
 * four floors), so these lotes get their own collections instead of reusing the
 * legacy ones.
 */
const STATE_DOCUMENT = 'ultimo';

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

    const nestedTank =
        source.sharedTank && typeof source.sharedTank === 'object'
            ? (source.sharedTank as Record<string, unknown>)
            : null;

    return {
        date: typeof source.date === 'string' ? source.date : '',
        readings: sanitizeReadings(source.readings, config),
        energyCharge: toReadingOrNull(source.energyCharge),
        totalBill: toReadingOrNull(source.totalBill),
        tankReading:
            toReadingOrNull(source.tankReading) ??
            toReadingOrNull(nestedTank?.currentReading),
    };
}

/** Last calculation saved, used to pre-fill the form of the following month. */
export async function fetchLastMonths(config: LoteConfig): Promise<LastMonths | null> {
    const snapshot = await getDoc(doc(db, stateCollection(config), STATE_DOCUMENT));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    const current = sanitizeMonth(data.current, config);
    const previous = sanitizeMonth(data.previous, config);

    // Older STATE documents did not store the tank on each month. The bill of that
    // date still has it, so the lote can reopen without borrowing the other lote's tank.
    if (config.tankGroupId && current.tankReading === null && current.date) {
        const bill = await getDoc(doc(db, billsCollection(config), convertDate(current.date)));
        if (bill.exists()) {
            const tank = bill.data().sharedTank as Record<string, unknown> | undefined;
            current.tankReading = toReadingOrNull(tank?.currentReading);
            if (previous.tankReading === null) {
                previous.tankReading = toReadingOrNull(tank?.previousReading);
            }
        }
    }

    return { current, previous };
}

/**
 * Keeps one document per billed month plus a pointer to the latest pair of months,
 * which is what lets the next month start with the previous readings already filled.
 * A shared tank is stored on the lote that typed it, not on a group document, so
 * filling September on E does not overwrite August on I.
 */
export async function saveMonth(config: LoteConfig, input: SplitInput): Promise<void> {
    const current: SavedMonth = {
        date: input.currentDate,
        readings: sanitizeReadings(input.currentReadings, config),
        energyCharge: input.energyCharge,
        totalBill: input.totalBill,
        tankReading: input.sharedTank?.currentReading ?? null,
    };
    const previous: SavedMonth = {
        date: input.previousDate,
        readings: sanitizeReadings(input.previousReadings, config),
        energyCharge: null,
        totalBill: null,
        tankReading: input.sharedTank?.previousReading ?? null,
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
}
