import type { LoteConfig, TankGroup } from './Types';

/** Floors that pay, from top to bottom, in the order they appear on the spreadsheet. */
export const FLOOR_LABELS = ['5to piso', '4to piso', '3er piso', '2do piso', '1er piso'];

export const TANK_LABEL = 'Tanque';

/** Lotes E and I are fed by one tank meter and take half of it each. */
export const TANK_GROUPS: TankGroup[] = [
    {
        id: 'villa-garcia',
        label: 'Tanque compartido Villa García',
        loteIds: ['lote-e', 'lote-i'],
    },
];

/**
 * Lote B is not here: it has a building meter and deduces the first floor by
 * subtraction, so it keeps its own screen and its own calculation.
 */
export const SPLIT_LOTES: LoteConfig[] = [
    {
        id: 'lote-c',
        label: 'Lote C',
        sheetTitle: 'MINIDEPAS C',
        collectionPrefix: 'LOTE C',
    },
    {
        id: 'lote-e',
        label: 'Lote E',
        sheetTitle: 'DEPAS VILLA GARCÍA - E',
        collectionPrefix: 'LOTE E',
        tankGroupId: 'villa-garcia',
    },
    {
        id: 'lote-i',
        label: 'Lote I',
        sheetTitle: 'CUARTOS VILLA GARCÍA - I',
        collectionPrefix: 'LOTE I',
        tankGroupId: 'villa-garcia',
    },
];

export function findTankGroup(groupId: string | undefined): TankGroup | undefined {
    return TANK_GROUPS.find((group) => group.id === groupId);
}

/** Meters typed into the form: the floors, plus the tank when the lote owns it. */
export function meterLabelsFor(config: LoteConfig): string[] {
    return config.tankGroupId ? [...FLOOR_LABELS] : [...FLOOR_LABELS, TANK_LABEL];
}

/** How many lotes split this lote's tank. 1 when the tank is its own. */
export function tankShareCountFor(config: LoteConfig): number {
    return findTankGroup(config.tankGroupId)?.loteIds.length ?? 1;
}

/** Labels of the other lotes that share the tank, to explain the split in the UI. */
export function otherLotesSharingTank(config: LoteConfig): string[] {
    const group = findTankGroup(config.tankGroupId);
    if (!group) return [];

    return group.loteIds
        .filter((loteId: string) => loteId !== config.id)
        .map((loteId: string) => SPLIT_LOTES.find((lote) => lote.id === loteId)?.label ?? loteId);
}
