/** Readings of one bill of lote B, which is the only lote with a building meter. */
export interface InfoData {
    date: string;
    floors: number[]; // kWh shown on the meter of each metered floor
    buildingConsumption: number; // kWh shown on the building meter
}

/**
 * LOTES C, E and I
 *
 * Unlike lote B, every floor has its own meter, so no consumption is deduced by
 * subtraction and nothing is normalized per day: the dates are only kept as a
 * reference of the billed period. Lote C has its own tank meter; lotes E and I
 * split a single shared tank meter in half.
 */

/** Meter reading in kWh, or null while the field has not been filled yet. */
export type Readings = Record<string, number | null>;

/** A tank meter whose consumption is divided equally between several lotes. */
export interface TankGroup {
    id: string;
    label: string;
    /** Lotes that split this meter. The consumption is divided by how many there are. */
    loteIds: string[];
}

export interface LoteConfig {
    /** Also used as the URL hash, so a link can point straight at this lote. */
    id: string;
    /** Shown on the tab. */
    label: string;
    /** Heading of the exported image. */
    sheetTitle: string;
    /** Prefix of the Firestore collections that hold this lote's data. */
    collectionPrefix: string;
    /** Set when the tank meter is shared instead of being this lote's own. */
    tankGroupId?: string;
}

export interface SharedTankInput {
    previousReading: number | null;
    currentReading: number | null;
    /** How many lotes split this meter. */
    shareCount: number;
}

export interface SplitInput {
    currentDate: string;
    previousDate: string;
    /** Floor meters, plus the tank when the lote has its own. */
    currentReadings: Readings;
    previousReadings: Readings;
    /** "Consumo de energía" charged by the utility, in soles. */
    energyCharge: number | null;
    /** Final amount of the bill, in soles. */
    totalBill: number | null;
    /** Only for lotes that share a tank meter with another lote. */
    sharedTank?: SharedTankInput;
}

export interface MeterResult {
    label: string;
    previousReading: number;
    currentReading: number;
    /** currentReading - previousReading, in kWh. */
    consumption: number;
    /** consumption x constant, in soles. */
    energyCost: number;
}

/**
 * How many kWh a meter used, however that was worked out. Lote B gets some of these
 * by subtraction instead of reading a meter, so the readings are left at zero there.
 */
export interface MeterConsumption {
    label: string;
    previousReading: number;
    currentReading: number;
    consumption: number;
}

export interface TankConsumption extends MeterConsumption {
    source: TankSource;
    /** kWh of the whole shared meter, or null when the meter is not shared. */
    sharedTotal: number | null;
    /** 1 unless the meter is shared between several lotes. */
    shareCount: number;
}

/** Everything the money split needs, once the consumptions are known. */
export interface SplitBillParams {
    floors: MeterConsumption[];
    tank: TankConsumption;
    energyCharge: number;
    totalBill: number;
    elapsedDays: number;
}

/**
 * Where the tank's kWh came from. Lote B has no tank meter, so there it is an estimate
 * the user types in; lotes E and I read one meter and take half each.
 */
export type TankSource = 'own' | 'shared' | 'estimated';

export interface TankResult extends MeterResult {
    source: TankSource;
    /** kWh of the whole shared meter, or null when the meter is not shared. */
    sharedTotal: number | null;
    /** 1 unless the meter is shared between several lotes. */
    shareCount: number;
}

export interface FloorResult extends MeterResult {
    tankShare: number;
    fixedShare: number;
    total: number;
    /** Cents added to `total` so that the floors add up to the bill exactly. */
    roundingAdjustment: number;
}

export interface SplitResult {
    floors: FloorResult[];
    tank: TankResult;
    /** kWh of the five floors plus the tank share of this lote. */
    totalConsumption: number;
    /** energyCharge / totalConsumption: the price of a kWh for this period. */
    constant: number;
    /** Part of the tank cost each floor pays. */
    tankShare: number;
    /** Part of the fixed charges each floor pays. */
    fixedShare: number;
    /** totalBill - energyCharge: everything in the bill that is not energy. */
    fixedCharges: number;
    total: number;
    /** Only informative for these lotes. */
    elapsedDays: number;
}

export interface SplitIssue {
    level: 'error' | 'warning';
    message: string;
}

/** A saved month, used to pre-fill the previous readings of the next one. */
export interface SavedMonth {
    date: string;
    readings: Readings;
    energyCharge: number | null;
    totalBill: number | null;
    /**
     * Reading of the shared tank meter on this month's date. Kept on the lote itself
     * so E and I can be on different months without overwriting each other.
     */
    tankReading: number | null;
}
