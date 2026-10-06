import { reactive } from 'vue';
import type { SharedTankInput } from '../model/Types';

export interface SharedTankState extends SharedTankInput {
    /** True once the readings were read from Firestore in this session. */
    loaded: boolean;
}

const states = reactive<Record<string, SharedTankState>>({});

/**
 * Readings of a tank meter shared by several lotes. Every lote that splits the same
 * meter gets the same object, so typing the reading on one tab shows it on the other
 * without having to save first.
 */
export function useSharedTank(groupId: string, shareCount: number): SharedTankState {
    if (!states[groupId]) {
        states[groupId] = {
            previousReading: null,
            currentReading: null,
            shareCount,
            loaded: false,
        };
    }

    return states[groupId];
}
