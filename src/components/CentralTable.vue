<script lang="ts">
import type { PropType } from 'vue';
import type { LoteBResult } from "../utils/loteB";
import FirstFloorConsumption from "./tables/FirstFloorConsumption.vue";
import ConstantCalculation from "./tables/ConstantCalculation.vue";
import FloorAndTankConsumption from "./tables/FloorAndTankConsumption.vue";

/** The steps behind lote B's split, for whoever wants to check the numbers. */
export default {
    props: {
        result: {
            type: Object as PropType<LoteBResult>,
            required: true
        },
    },
    components: {
        FirstFloorConsumption,
        ConstantCalculation,
        FloorAndTankConsumption
    },
}
</script>

<template>
    <v-row>
        <v-col md="6" cols="12">
            <FirstFloorConsumption :result="result" />
        </v-col>
        <v-col md="6" cols="12">
            <ConstantCalculation :result="result" />
        </v-col>
    </v-row>

    <FloorAndTankConsumption :result="result" />
</template>
