<script lang="ts">
import type { PropType } from "vue";
import type { LoteBResult } from "../../utils/loteB";
import { formatKwh, formatSoles } from "../../utils/billSplit";

export default {
    props: {
        result: {
            type: Object as PropType<LoteBResult>,
            required: true
        },
    },
    computed: {
        rows() {
            return [...this.result.floors, this.result.tank].map((meter) => ({
                title: meter.label,
                consumption: meter.consumption,
                energyCost: meter.energyCost,
            }));
        },
    },
    methods: {
        formatKwh,
        formatSoles,
    },
}
</script>

<template>
    <p class="mt-4">Multiplicamos el consumo de cada uno por la constante</p>
    <v-table density="comfortable">
        <tbody>
            <tr v-for="row in rows" :key="row.title">
                <td>{{ row.title }}</td>
                <td class="text-right">{{ formatKwh(row.consumption) }} kWh</td>
                <td class="text-right">x {{ result.constant.toFixed(6) }} =</td>
                <td class="text-right font-weight-bold">{{ formatSoles(row.energyCost) }}</td>
            </tr>
        </tbody>
    </v-table>
</template>
