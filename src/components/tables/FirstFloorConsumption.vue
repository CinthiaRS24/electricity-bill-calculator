<script lang="ts">
import type { PropType } from 'vue';
import type { LoteBResult } from '../../utils/loteB';
import { LOTE_B_FIRST_FLOOR_LABEL } from '../../utils/loteB';
import { formatKwh } from '../../utils/billSplit';

export default {
    props: {
        result: {
            type: Object as PropType<LoteBResult>,
            required: true
        },
    },
    computed: {
        firstFloorConsumption(): number {
            const firstFloor = this.result.floors.find(
                (floor) => floor.label === LOTE_B_FIRST_FLOOR_LABEL
            );

            return firstFloor?.consumption ?? 0;
        },
    },
    methods: {
        formatKwh,
    },
}
</script>

<template>
    <v-alert>
        <v-alert-title>Consumo del primer piso</v-alert-title>
        El <i>1er piso y el tanque</i> juntos consumieron
        {{ formatKwh(result.firstFloorPlusTank) }} kWh. Con el tanque estimado en
        {{ formatKwh(result.tank.consumption) }} kWh, al 1er piso le quedan
        <strong>{{ formatKwh(firstFloorConsumption) }} kWh</strong>.
    </v-alert>
</template>
