import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { InfoData } from '../model/Types';
import type { LoteBAmounts } from './loteB';
import { convertDate } from './utilityMethods';

/**
 * Lote B keeps the collections it has used since 2024, so the months already stored
 * stay readable and picking an old date still brings its readings back. What is new
 * is that the amounts of the bill are saved too, instead of being typed every month.
 */
const BILLS_COLLECTION = 'LOTE B';
const STATE_COLLECTION = 'LAST BILL';
const STATE_DOCUMENT = 'LOTE B';

/** The field names used in Firestore, which are the labels in Spanish. */
const BUILDING_FIELD = 'consumo total';

export const DEFAULT_TANK_WATTS_PER_DAY = 500;

export interface SavedLoteBBill {
    info: InfoData[];
    amounts: LoteBAmounts;
}

function toNumber(value: unknown, fallback = 0): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function emptyBill(date = ''): InfoData {
    return { date, buildingConsumption: 0, floors: [] };
}

function sanitizeBill(raw: unknown, floorLabels: string[]): InfoData {
    const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const floors = Array.isArray(source.floors) ? source.floors : [];

    return {
        date: typeof source.date === 'string' ? source.date : '',
        buildingConsumption: toNumber(source.buildingConsumption),
        floors: floorLabels.map((_label: string, index: number) => toNumber(floors[index])),
    };
}

/**
 * Months saved before the amounts were stored only have readings, so they fall back
 * to the usual tank estimate and leave the amounts of the bill empty.
 */
function sanitizeAmounts(raw: unknown): LoteBAmounts {
    const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

    return {
        tankWattsPerDay: toNumber(source.tankWattsPerDay, DEFAULT_TANK_WATTS_PER_DAY),
        energyCharge: toNumber(source.energyCharge),
        totalBill: toNumber(source.totalBill),
    };
}

/** Last pair of months saved, which is what pre-fills the form. */
export async function fetchLastLoteBBill(floorLabels: string[]): Promise<SavedLoteBBill | null> {
    const snapshot = await getDoc(doc(db, STATE_COLLECTION, STATE_DOCUMENT));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    return {
        info: [
            sanitizeBill(data.currentDate, floorLabels),
            sanitizeBill(data.prevDate, floorLabels),
        ],
        amounts: sanitizeAmounts(data.amounts),
    };
}

/**
 * Readings of one month already stored, so typing a date that was billed before
 * brings its numbers back instead of having to look them up.
 */
export async function fetchLoteBReadings(
    date: string,
    floorLabels: string[]
): Promise<InfoData | null> {
    if (!date) return null;

    const snapshot = await getDoc(doc(db, BILLS_COLLECTION, convertDate(date)));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();

    return {
        date,
        buildingConsumption: toNumber(data[BUILDING_FIELD]),
        floors: floorLabels.map((label: string) => toNumber(data[label])),
    };
}

function readingsDocument(bill: InfoData, floorLabels: string[]): Record<string, number> {
    const document: Record<string, number> = { [BUILDING_FIELD]: bill.buildingConsumption };
    floorLabels.forEach((label: string, index: number) => {
        document[label] = toNumber(bill.floors[index]);
    });

    return document;
}

/**
 * Writes one document per month with its readings and a pointer to the latest pair,
 * which is what lets the next month start already filled in. The amounts only belong
 * to the current month, since they come from the bill that is being split.
 *
 * Re-saving a month overwrites it, so a reading that was copied wrong can be fixed.
 */
export async function saveLoteBBill(
    info: InfoData[],
    amounts: LoteBAmounts,
    floorLabels: string[]
): Promise<void> {
    const [current, previous] = info;

    await setDoc(
        doc(db, BILLS_COLLECTION, convertDate(current.date)),
        {
            ...readingsDocument(current, floorLabels),
            ...amounts,
            previousDate: previous.date,
            savedAt: new Date().toISOString(),
        },
        { merge: true }
    );

    // The previous month keeps whatever it already had; only its readings are refreshed.
    await setDoc(
        doc(db, BILLS_COLLECTION, convertDate(previous.date)),
        readingsDocument(previous, floorLabels),
        { merge: true }
    );

    await setDoc(doc(db, STATE_COLLECTION, STATE_DOCUMENT), {
        currentDate: current,
        prevDate: previous,
        amounts,
        savedAt: new Date().toISOString(),
    });
}
