<script lang="ts">
import type { PropType } from 'vue';
import type { LoteBResult } from '../../utils/loteB';
import { formatKwh, formatSoles } from '../../utils/billSplit';

export default {
    props: {
        result: {
            type: Object as PropType<LoteBResult>,
            required: true
        },
    },
    computed: {
        energyCharge(): number {
            return this.result.totalConsumption * this.result.constant;
        },
    },
    methods: {
        formatKwh,
        formatSoles,
    },
}
</script>

<template>
    <v-alert>
        <v-alert-title>Precio del kWh</v-alert-title>
        <v-table density="compact" class="mt-2">
            <tbody>
                <tr>
                    <td>Consumo total</td>
                    <td class="text-right">{{ formatKwh(result.totalConsumption) }} kWh</td>
                </tr>
                <tr>
                    <td>Consumo de energía del recibo</td>
                    <td class="text-right">{{ formatSoles(energyCharge) }}</td>
                </tr>
                <tr>
                    <td><strong>k</strong> = energía ÷ consumo</td>
                    <td class="text-right"><strong>{{ result.constant.toFixed(6) }}</strong></td>
                </tr>
                <tr>
                    <td>Cargo fijo y otros del recibo</td>
                    <td class="text-right">{{ formatSoles(result.fixedCharges) }}</td>
                </tr>
            </tbody>
        </v-table>
    </v-alert>
</template>
