import type {
    FloorResult,
    LoteConfig,
    MeterResult,
    Readings,
    SplitBillParams,
    SplitInput,
    SplitIssue,
    SplitResult,
    TankResult,
} from '../model/Types';
import { FLOOR_LABELS, TANK_LABEL, meterLabelsFor, tankShareCountFor } from '../model/lotes';
import { getElapsedDays, roundTo2Decimals } from './utilityMethods';

export function createEmptyReadings(config: LoteConfig): Readings {
    return meterLabelsFor(config).reduce((readings: Readings, label: string) => {
        readings[label] = null;
        return readings;
    }, {});
}

export function createEmptyInput(config: LoteConfig): SplitInput {
    const input: SplitInput = {
        currentDate: '',
        previousDate: '',
        currentReadings: createEmptyReadings(config),
        previousReadings: createEmptyReadings(config),
        energyCharge: null,
        totalBill: null,
    };

    if (config.tankGroupId) {
        input.sharedTank = {
            previousReading: null,
            currentReading: null,
            shareCount: tankShareCountFor(config),
        };
    }

    return input;
}

function toNumber(value: number | null | undefined): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function measure(
    label: string,
    currentReadings: Readings,
    previousReadings: Readings
): Omit<MeterResult, 'energyCost'> {
    const currentReading = toNumber(currentReadings[label]);
    const previousReading = toNumber(previousReadings[label]);

    return {
        label,
        previousReading,
        currentReading,
        // Readings have 2 decimals, so rounding here only removes float noise.
        consumption: roundTo2Decimals(currentReading - previousReading),
    };
}

/**
 * The tank either has its own meter inside this lote, or is a meter shared with
 * other lotes whose consumption is divided equally between them.
 */
function measureTank(input: SplitInput): Omit<TankResult, 'energyCost'> {
    if (!input.sharedTank) {
        return {
            ...measure(TANK_LABEL, input.currentReadings, input.previousReadings),
            source: 'own',
            sharedTotal: null,
            shareCount: 1,
        };
    }

    const { previousReading, currentReading, shareCount } = input.sharedTank;
    const sharedTotal = roundTo2Decimals(toNumber(currentReading) - toNumber(previousReading));

    return {
        label: TANK_LABEL,
        previousReading: toNumber(previousReading),
        currentReading: toNumber(currentReading),
        consumption: roundTo2Decimals(sharedTotal / shareCount),
        source: 'shared',
        sharedTotal,
        shareCount,
    };
}

/**
 * The floor amounts are calculated with full precision but charged with 2 decimals,
 * so rounding can leave a couple of cents of difference against the bill. Those cents
 * are handed to the floors that lost the most when rounded, which keeps the sum of
 * what the tenants pay exactly equal to the amount of the bill.
 */
function reconcileCents(exactTotals: number[], totalBill: number): number[] {
    const rounded = exactTotals.map(roundTo2Decimals);
    const residualCents = Math.round((totalBill - sum(rounded)) * 100);

    if (residualCents === 0) return rounded.map(() => 0);

    const step = Math.sign(residualCents) * 0.01;
    const byLostValue = exactTotals
        .map((exact: number, index: number) => ({ index, lost: (exact - rounded[index]) * step }))
        .sort((a, b) => b.lost - a.lost);

    const adjustments = exactTotals.map(() => 0);
    for (let cent = 0; cent < Math.abs(residualCents); cent++) {
        // More cents than floors would be a bug elsewhere, but wrap around just in case.
        const { index } = byLostValue[cent % byLostValue.length];
        adjustments[index] = roundTo2Decimals(adjustments[index] + step);
    }

    return adjustments;
}

function sum(values: number[]): number {
    return values.reduce((acc: number, value: number) => acc + value, 0);
}

/**
 * Turns known consumptions into what each floor owes. Every lote shares this, so the
 * money is split the same way no matter how the kWh were obtained: the energy is
 * charged by consumption, while the tank and the fixed charges of the bill are divided
 * equally between the floors.
 */
export function splitBill(params: SplitBillParams): SplitResult {
    const { floors: floorMeasures, tank: tankMeasure, energyCharge, totalBill } = params;
    const floorCount = floorMeasures.length;

    const totalConsumption = roundTo2Decimals(
        sum([...floorMeasures, tankMeasure].map((meter) => meter.consumption))
    );

    // Price of a kWh for this period. The spreadsheet displays it rounded to 2
    // decimals but calculates with every decimal, which is what we do here.
    const constant = totalConsumption > 0 ? energyCharge / totalConsumption : 0;

    const tank: TankResult = {
        ...tankMeasure,
        energyCost: tankMeasure.consumption * constant,
    };

    const fixedCharges = totalBill - energyCharge;
    const tankShare = floorCount > 0 ? tank.energyCost / floorCount : 0;
    const fixedShare = floorCount > 0 ? fixedCharges / floorCount : 0;

    const exactTotals = floorMeasures.map(
        (floor) => floor.consumption * constant + tankShare + fixedShare
    );
    const adjustments =
        totalBill > 0 ? reconcileCents(exactTotals, totalBill) : exactTotals.map(() => 0);

    const floors: FloorResult[] = floorMeasures.map((floor, index: number) => ({
        ...floor,
        energyCost: floor.consumption * constant,
        tankShare,
        fixedShare,
        total: roundTo2Decimals(roundTo2Decimals(exactTotals[index]) + adjustments[index]),
        roundingAdjustment: adjustments[index],
    }));

    return {
        floors,
        tank,
        totalConsumption,
        constant,
        tankShare,
        fixedShare,
        fixedCharges,
        total: roundTo2Decimals(sum(floors.map((floor) => floor.total))),
        elapsedDays: params.elapsedDays,
    };
}

export function calculateSplit(input: SplitInput): SplitResult {
    return splitBill({
        floors: FLOOR_LABELS.map((label: string) =>
            measure(label, input.currentReadings, input.previousReadings)
        ),
        tank: measureTank(input),
        energyCharge: toNumber(input.energyCharge),
        totalBill: toNumber(input.totalBill),
        elapsedDays: getElapsedDays(input.currentDate, input.previousDate),
    });
}

export function isSplitInputComplete(input: SplitInput, config: LoteConfig): boolean {
    const hasEveryReading = (readings: Readings) =>
        meterLabelsFor(config).every((label: string) => typeof readings[label] === 'number');

    const hasSharedTank =
        !input.sharedTank ||
        (typeof input.sharedTank.previousReading === 'number' &&
            typeof input.sharedTank.currentReading === 'number');

    return (
        input.currentDate !== '' &&
        input.previousDate !== '' &&
        typeof input.energyCharge === 'number' &&
        typeof input.totalBill === 'number' &&
        hasEveryReading(input.currentReadings) &&
        hasEveryReading(input.previousReadings) &&
        hasSharedTank
    );
}

/**
 * Catches the data entry mistakes that would silently produce a wrong split:
 * a reading that went backwards, a bill smaller than its own energy charge or
 * dates in the wrong order.
 */
export function validateSplit(input: SplitInput, config: LoteConfig): SplitIssue[] {
    const issues: SplitIssue[] = [];

    const flagBackwards = (label: string, current: unknown, previous: unknown) => {
        if (typeof current !== 'number' || typeof previous !== 'number') return;
        if (current >= previous) return;

        issues.push({
            level: 'error',
            message: `${label}: la lectura actual (${current}) es menor que la anterior (${previous}). Revisa si se intercambiaron las columnas.`,
        });
    };

    meterLabelsFor(config).forEach((label: string) => {
        flagBackwards(label, input.currentReadings[label], input.previousReadings[label]);
    });

    if (input.sharedTank) {
        flagBackwards(
            'Tanque compartido',
            input.sharedTank.currentReading,
            input.sharedTank.previousReading
        );
    }

    if (typeof input.energyCharge === 'number' && typeof input.totalBill === 'number') {
        if (input.energyCharge > input.totalBill) {
            issues.push({
                level: 'error',
                message: 'El consumo de energía no puede ser mayor que el total del recibo.',
            });
        }
    }

    if (input.currentDate && input.previousDate) {
        const days = getElapsedDays(input.currentDate, input.previousDate);
        if (days <= 0) {
            issues.push({
                level: 'error',
                message: 'La fecha actual debe ser posterior a la fecha anterior.',
            });
        } else if (days > 70) {
            issues.push({
                level: 'warning',
                message: `El periodo abarca ${days} días, bastante más de un mes. Verifica las fechas.`,
            });
        }
    }

    return issues;
}

export function formatSoles(value: number): string {
    return `S/ ${value.toFixed(2)}`;
}

export function formatKwh(value: number): string {
    return value.toFixed(2);
}

export function formatDate(date: string): string {
    if (!date) return '--';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
}
