import type {
    InfoData,
    MeterConsumption,
    SplitIssue,
    SplitResult,
    TankConsumption,
} from '../model/Types';
import { splitBill } from './billSplit';
import { getElapsedDays, roundTo2Decimals } from './utilityMethods';

/**
 * LOTE B
 *
 * There is a meter for the whole building and one for each of the four upper floors.
 * Neither the first floor nor the tank has a meter: what they used together is what is
 * left after taking the measured floors off the building meter, and the tank is an
 * estimate the user types in. Once those kWh are known, the money is divided by the
 * same `splitBill` the other lotes use.
 */
export const LOTE_B_FIRST_FLOOR_LABEL = '1er piso';

export const LOTE_B_TANK_LABEL = 'Tanque';

export interface LoteBParams {
    /** [current bill, previous bill]. */
    info: InfoData[];
    /** Labels of the metered floors, from the fifth down to the second. */
    floorLabels: string[];
    /** The tank is estimated as a daily rate, since a pump uses about the same every day. */
    tankWattsPerDay: number;
    energyCharge: number;
    totalBill: number;
}

export interface LoteBAmounts {
    tankWattsPerDay: number;
    energyCharge: number;
    totalBill: number;
}

export interface LoteBConsumptions {
    /** The building meter, which is what the unmetered consumption is deduced from. */
    building: MeterConsumption;
    /** The four floors that do have a meter. */
    meteredFloors: MeterConsumption[];
    /** kWh used by the first floor and the tank together, before splitting them. */
    firstFloorPlusTank: number;
    elapsedDays: number;
}

export interface LoteBResult extends SplitResult, LoteBConsumptions {}

function measure(label: string, current: number, previous: number): MeterConsumption {
    return {
        label,
        previousReading: previous,
        currentReading: current,
        consumption: roundTo2Decimals(current - previous),
    };
}

/** A meter whose consumption was worked out rather than read. */
function deduced(label: string, consumption: number): MeterConsumption {
    return { label, previousReading: 0, currentReading: 0, consumption };
}

/** What every meter used, which can already be shown before the bill amounts are known. */
export function loteBConsumptions(info: InfoData[], floorLabels: string[]): LoteBConsumptions {
    const [current, previous] = info;

    const building = measure(
        'Consumo total',
        current.buildingConsumption,
        previous.buildingConsumption
    );

    const meteredFloors = floorLabels.map((label: string, index: number) =>
        measure(label, current.floors[index], previous.floors[index])
    );

    return {
        building,
        meteredFloors,
        firstFloorPlusTank: roundTo2Decimals(
            building.consumption -
                meteredFloors.reduce((acc: number, floor) => acc + floor.consumption, 0)
        ),
        elapsedDays: getElapsedDays(current.date, previous.date),
    };
}

/** kWh the tank is assumed to have used, from the daily estimate and the period. */
export function tankConsumptionFrom(tankWattsPerDay: number, elapsedDays: number): number {
    return roundTo2Decimals((tankWattsPerDay * elapsedDays) / 1000);
}

export function calculateLoteB(params: LoteBParams): LoteBResult {
    const consumptions = loteBConsumptions(params.info, params.floorLabels);
    const { meteredFloors, firstFloorPlusTank, elapsedDays } = consumptions;

    // The estimate is a daily rate, so the days of the period are what turn it into kWh.
    // This is the only thing the dates are needed for.
    const tankConsumption = tankConsumptionFrom(params.tankWattsPerDay, elapsedDays);

    const tank: TankConsumption = {
        ...deduced(LOTE_B_TANK_LABEL, tankConsumption),
        source: 'estimated',
        sharedTotal: null,
        shareCount: 1,
    };

    const firstFloor = deduced(
        LOTE_B_FIRST_FLOOR_LABEL,
        roundTo2Decimals(firstFloorPlusTank - tankConsumption)
    );

    return {
        ...splitBill({
            floors: [...meteredFloors, firstFloor],
            tank,
            energyCharge: params.energyCharge,
            totalBill: params.totalBill,
            elapsedDays,
        }),
        ...consumptions,
    };
}

/** True once every reading and both amounts of the bill are filled in. */
export function isLoteBInputComplete(
    info: InfoData[] | null,
    amounts: Partial<LoteBAmounts> | null
): boolean {
    if (!info || info.length < 2 || !amounts) return false;

    const hasReadings = info.every(
        (bill: InfoData) =>
            bill.date !== '' &&
            bill.buildingConsumption > 0 &&
            bill.floors.length > 0 &&
            bill.floors.every((reading: number) => reading > 0)
    );

    return (
        hasReadings &&
        typeof amounts.tankWattsPerDay === 'number' &&
        typeof amounts.energyCharge === 'number' &&
        amounts.energyCharge > 0 &&
        typeof amounts.totalBill === 'number' &&
        amounts.totalBill > 0
    );
}

/**
 * Catches the data entry mistakes that would silently produce a wrong split. The first
 * floor deserves extra attention: since it is what is left over, it absorbs any mistake
 * made elsewhere and can even come out negative.
 */
export function validateLoteB(
    result: LoteBResult,
    info: InfoData[] | null,
    amounts: Partial<LoteBAmounts> | null
): SplitIssue[] {
    const issues: SplitIssue[] = [];

    const flagBackwards = (label: string, current: number, previous: number) => {
        if (current >= previous) return;

        issues.push({
            level: 'error',
            message: `${label}: la lectura actual (${current}) es menor que la anterior (${previous}). Revisa si se intercambiaron las columnas.`,
        });
    };

    if (info && info.length >= 2) {
        const [current, previous] = info;
        flagBackwards('Consumo total', current.buildingConsumption, previous.buildingConsumption);
        current.floors.forEach((reading: number, index: number) => {
            flagBackwards(result.meteredFloors[index].label, reading, previous.floors[index]);
        });
    }

    if (result.firstFloorPlusTank < 0) {
        issues.push({
            level: 'error',
            message:
                'Los pisos medidos suman más que el medidor general del edificio. ' +
                'Revisa las lecturas, porque alguna debe estar mal copiada.',
        });
    }

    const firstFloor = result.floors.find((floor) => floor.label === LOTE_B_FIRST_FLOOR_LABEL);
    if (firstFloor && firstFloor.consumption < 0) {
        issues.push({
            level: 'error',
            message:
                `El 1er piso sale en ${firstFloor.consumption.toFixed(2)} kWh, que es imposible. ` +
                `El tanque estimado (${result.tank.consumption.toFixed(2)} kWh) es mayor que los ` +
                `${result.firstFloorPlusTank.toFixed(2)} kWh que quedan para el 1er piso y el tanque juntos: ` +
                'baja los watts por día del tanque o revisa las lecturas.',
        });
    }

    if (
        typeof amounts?.energyCharge === 'number' &&
        typeof amounts?.totalBill === 'number' &&
        amounts.energyCharge > amounts.totalBill
    ) {
        issues.push({
            level: 'error',
            message: 'El consumo de energía no puede ser mayor que el total del recibo.',
        });
    }

    if (result.elapsedDays <= 0) {
        issues.push({
            level: 'error',
            message: 'La fecha de la factura actual debe ser posterior a la de la anterior.',
        });
    } else if (result.elapsedDays > 70) {
        issues.push({
            level: 'warning',
            message: `El periodo abarca ${result.elapsedDays} días, bastante más de un mes. Verifica las fechas.`,
        });
    }

    return issues;
}
