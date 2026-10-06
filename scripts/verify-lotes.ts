/**
 * Comprueba el motor de reparto contra los meses que se calcularon a mano en los
 * sheets (periodo 20/07/2026 al 22/08/2026) para los lotes C, E e I, y además contra
 * miles de recibos inventados, para confirmar que lo que paga cada piso siempre suma
 * exactamente el total del recibo.
 *
 * Uso: npm run verify
 */
import { calculateSplit, validateSplit } from '../src/utils/billSplit';
import { calculateLoteB, isLoteBInputComplete, validateLoteB } from '../src/utils/loteB';
import { SPLIT_LOTES } from '../src/model/lotes';
import type { InfoData, LoteConfig, SplitInput } from '../src/model/Types';

interface ExpectedFloor {
    consumption: number;
    energyCost: number;
    total: number;
}

interface Case {
    loteId: string;
    input: SplitInput;
    expected: {
        totalConsumption: number;
        constant: number;
        tankConsumption: number;
        tankCost: number;
        tankShare: number;
        fixedShare: number;
        floors: Record<string, ExpectedFloor>;
    };
}

const dates = { previousDate: '2026-07-20', currentDate: '2026-08-22' };

/** Las dos lecturas del tanque que comparten los lotes E e I: 329.3 - 280.5 = 48.80 kWh. */
const sharedTank = { previousReading: 280.5, currentReading: 329.3, shareCount: 2 };

const cases: Case[] = [
    {
        loteId: 'lote-c',
        input: {
            ...dates,
            previousReadings: {
                '5to piso': 2128.26,
                '4to piso': 1671.08,
                '3er piso': 2064.6,
                '2do piso': 1785.3,
                '1er piso': 387.4,
                Tanque: 125,
            },
            currentReadings: {
                '5to piso': 2136.94,
                '4to piso': 1706.85,
                '3er piso': 2126.7,
                '2do piso': 1810.4,
                '1er piso': 435.9,
                Tanque: 141.1,
            },
            energyCharge: 127.24,
            totalBill: 170.8,
        },
        expected: {
            totalConsumption: 196.25,
            constant: 0.65,
            tankConsumption: 16.1,
            tankCost: 10.44,
            tankShare: 2.09,
            fixedShare: 8.71,
            floors: {
                '5to piso': { consumption: 8.68, energyCost: 5.63, total: 16.43 },
                '4to piso': { consumption: 35.77, energyCost: 23.19, total: 33.99 },
                '3er piso': { consumption: 62.1, energyCost: 40.26, total: 51.06 },
                '2do piso': { consumption: 25.1, energyCost: 16.27, total: 27.07 },
                '1er piso': { consumption: 48.5, energyCost: 31.45, total: 42.25 },
            },
        },
    },
    {
        loteId: 'lote-e',
        input: {
            ...dates,
            previousReadings: {
                '5to piso': 315.5,
                '4to piso': 130.3,
                '3er piso': 165.1,
                '2do piso': 533.3,
                '1er piso': 283.4,
            },
            currentReadings: {
                '5to piso': 374.5,
                '4to piso': 137.1,
                '3er piso': 189.4,
                '2do piso': 619.3,
                '1er piso': 303.6,
            },
            energyCharge: 134.98,
            totalBill: 180.5,
            sharedTank: { ...sharedTank },
        },
        expected: {
            totalConsumption: 220.7,
            constant: 0.61,
            tankConsumption: 24.4,
            tankCost: 14.92,
            tankShare: 2.98,
            fixedShare: 9.1,
            floors: {
                '5to piso': { consumption: 59, energyCost: 36.08, total: 48.17 },
                '4to piso': { consumption: 6.8, energyCost: 4.16, total: 16.25 },
                '3er piso': { consumption: 24.3, energyCost: 14.86, total: 26.95 },
                '2do piso': { consumption: 86, energyCost: 52.6, total: 64.69 },
                '1er piso': { consumption: 20.2, energyCost: 12.35, total: 24.44 },
            },
        },
    },
    {
        loteId: 'lote-i',
        input: {
            ...dates,
            previousReadings: {
                '5to piso': 29.6,
                '4to piso': 18,
                '3er piso': 290.8,
                '2do piso': 95.1,
                '1er piso': 46.5,
            },
            currentReadings: {
                '5to piso': 35.1,
                '4to piso': 18.9,
                '3er piso': 360.9,
                '2do piso': 159.8,
                '1er piso': 62.8,
            },
            energyCharge: 139.9,
            totalBill: 186.2,
            sharedTank: { ...sharedTank },
        },
        expected: {
            totalConsumption: 181.9,
            constant: 0.77,
            tankConsumption: 24.4,
            tankCost: 18.77,
            tankShare: 3.75,
            fixedShare: 9.26,
            floors: {
                '5to piso': { consumption: 5.5, energyCost: 4.23, total: 17.24 },
                '4to piso': { consumption: 0.9, energyCost: 0.69, total: 13.71 },
                '3er piso': { consumption: 70.1, energyCost: 53.91, total: 66.93 },
                '2do piso': { consumption: 64.7, energyCost: 49.76, total: 62.77 },
                '1er piso': { consumption: 16.3, energyCost: 12.54, total: 25.55 },
            },
        },
    },
];

let failures = 0;

function check(label: string, actual: number, expected: number) {
    const ok = Math.abs(actual - expected) < 0.005;
    if (!ok) failures++;
    console.log(
        `  ${ok ? 'OK  ' : 'FALLA'} ${label.padEnd(26)} esperado ${expected.toFixed(2).padStart(7)}` +
            `  obtenido ${actual.toFixed(2).padStart(7)}`
    );
}

function configFor(loteId: string): LoteConfig {
    const config = SPLIT_LOTES.find((lote) => lote.id === loteId);
    if (!config) throw new Error(`No existe la configuración del lote ${loteId}`);
    return config;
}

for (const testCase of cases) {
    const config = configFor(testCase.loteId);
    const { expected } = testCase;
    const result = calculateSplit(testCase.input);

    console.log(`\n${config.sheetTitle}`);
    check('suma de kWh', result.totalConsumption, expected.totalConsumption);
    check('constante k', result.constant, expected.constant);
    check('tanque en kWh', result.tank.consumption, expected.tankConsumption);
    check('tanque en soles', result.tank.energyCost, expected.tankCost);
    check('reparto del tanque', result.tankShare, expected.tankShare);
    check('cargo fijo por piso', result.fixedShare, expected.fixedShare);

    result.floors.forEach((floor) => {
        const want = expected.floors[floor.label];
        check(`${floor.label} kWh`, floor.consumption, want.consumption);
        check(`${floor.label} consumo de luz`, floor.energyCost, want.energyCost);
        check(`${floor.label} total a pagar`, floor.total, want.total);
    });

    check('total repartido', result.total, testCase.input.totalBill ?? 0);

    const issues = validateSplit(testCase.input, config);
    if (issues.length > 0) {
        failures++;
        console.log(`  FALLA el mes del sheet no debería tener observaciones:`, issues);
    }
}

// Barrido de recibos para confirmar que el reparto nunca descuadra con el total.
let swept = 0;
let needingAdjustment = 0;
let mismatched = 0;

for (const testCase of cases) {
    for (let billInCents = 3000; billInCents <= 60000; billInCents += 11) {
        for (let energyPercent = 35; energyPercent <= 97; energyPercent += 3) {
            const totalBill = billInCents / 100;
            const energyCharge = Math.round(totalBill * energyPercent) / 100;
            const result = calculateSplit({ ...testCase.input, energyCharge, totalBill });
            const paidByFloors = Number(
                result.floors.reduce((acc, floor) => acc + floor.total, 0).toFixed(2)
            );

            swept++;
            if (Math.abs(paidByFloors - totalBill) > 0.0001) mismatched++;
            if (result.floors.some((floor) => floor.roundingAdjustment !== 0)) needingAdjustment++;
        }
    }
}

console.log(`\nrecibos probados: ${swept}`);
console.log(`necesitaron ajuste de centavos: ${needingAdjustment}`);
console.log(`descuadrados contra el recibo: ${mismatched}`);
if (mismatched > 0) failures++;

// ---------------------------------------------------------------------------
// LOTE B: usa el mismo reparto, pero deduce el 1er piso y estima el tanque.
// ---------------------------------------------------------------------------
const loteBFloorLabels = ['5to piso', '4to piso', '3er piso', '2do piso'];

/** Lecturas reales del lote B guardadas en Firebase. */
const loteBInfo: InfoData[] = [
    {
        date: '2026-09-20',
        buildingConsumption: 12880.6,
        floors: [1558.8, 2513.9, 1158.4, 2768.5],
    },
    {
        date: '2026-08-22',
        buildingConsumption: 12774.7,
        floors: [1521.9, 2497.6, 1154.5, 2755.77],
    },
];

// Recibo real del 20/09/2026: S/ 106.20. Ese mes no se separó cargo fijo ni energía
// activa, así que el total entero entra como consumo de energía (cargo fijo = 0).
const loteBAmounts = { tankWattsPerDay: 500, energyCharge: 106.2, totalBill: 106.2 };

console.log('\nLOTE B');
const loteB = calculateLoteB({
    info: loteBInfo,
    floorLabels: loteBFloorLabels,
    ...loteBAmounts,
});

// 105.90 kWh del edificio menos 69.83 de los cuatro pisos medidos.
check('consumo del edificio', loteB.building.consumption, 105.9);
check('1er piso + tanque', loteB.firstFloorPlusTank, 36.07);
// 500 W/dia durante los 29 dias del periodo.
check('tanque estimado en kWh', loteB.tank.consumption, 14.5);
check('1er piso deducido', loteB.floors[4].consumption, 21.57);
check('cargo fijo por piso', loteB.fixedShare, 0);
check('total repartido', loteB.total, 106.2);

if (validateLoteB(loteB, loteBInfo, loteBAmounts).length > 0) {
    failures++;
    console.log('  FALLA el caso normal no deberia tener observaciones');
}

if (!isLoteBInputComplete(loteBInfo, loteBAmounts)) {
    failures++;
    console.log('  FALLA el caso normal deberia considerarse completo');
}

if (isLoteBInputComplete(loteBInfo, { ...loteBAmounts, totalBill: undefined })) {
    failures++;
    console.log('  FALLA faltando el total del recibo no deberia considerarse completo');
}

// El reparto debe cuadrar con el recibo para cualquier combinacion.
let loteBSwept = 0;
let loteBMismatched = 0;
for (let billInCents = 5000; billInCents <= 60000; billInCents += 13) {
    for (let energyPercent = 40; energyPercent <= 95; energyPercent += 5) {
        for (const tankWattsPerDay of [300, 500, 800]) {
            const totalBill = billInCents / 100;
            const result = calculateLoteB({
                info: loteBInfo,
                floorLabels: loteBFloorLabels,
                tankWattsPerDay,
                energyCharge: Math.round(totalBill * energyPercent) / 100,
                totalBill,
            });
            const paid = Number(result.floors.reduce((acc, f) => acc + f.total, 0).toFixed(2));
            loteBSwept++;
            if (Math.abs(paid - totalBill) > 0.0001) loteBMismatched++;
        }
    }
}
console.log(`\nlote B: recibos probados ${loteBSwept}, descuadrados ${loteBMismatched}`);
if (loteBMismatched > 0) failures++;

/** Cada entrada mal puesta debe salir como error visible, no pasar callada. */
function checkLoteBWarns(
    title: string,
    info: InfoData[],
    amounts: { tankWattsPerDay: number; energyCharge: number; totalBill: number }
) {
    const result = calculateLoteB({ info, floorLabels: loteBFloorLabels, ...amounts });
    const warned = validateLoteB(result, info, amounts).some((issue) => issue.level === 'error');

    console.log(`lote B avisa ${title}: ${warned ? 'OK' : 'FALLA'}`);
    if (!warned) failures++;
}

const swappedColumns: InfoData[] = [loteBInfo[1], loteBInfo[0]];
const excessiveFloor: InfoData[] = [
    { ...loteBInfo[0], floors: [1558.8, 2513.9, 1158.4, 9999] },
    loteBInfo[1],
];

checkLoteBWarns('cuando el tanque estimado es imposible', loteBInfo, {
    ...loteBAmounts,
    tankWattsPerDay: 2000,
});
checkLoteBWarns('cuando se intercambian las columnas', swappedColumns, loteBAmounts);
checkLoteBWarns('cuando un piso supera el medidor general', excessiveFloor, loteBAmounts);
checkLoteBWarns('cuando la energia supera el total del recibo', loteBInfo, {
    ...loteBAmounts,
    energyCharge: 300,
});

console.log(`\n${failures === 0 ? 'TODO CUADRA' : `${failures} problema(s) encontrado(s)`}`);
process.exit(failures === 0 ? 0 : 1);
