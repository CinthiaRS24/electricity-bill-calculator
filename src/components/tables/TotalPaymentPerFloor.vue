<script lang="ts">
import type { FinalArray } from '@/model/Types';

export default {
    props: {
        infoToTable: {
            type: Array<FinalArray>,
            required: true
        },
        tankPricePerFloor: {
            type: Number,
            required: true
        },
    },
    computed: {
        total() {
            return this.infoToTable.reduce((acc, element) => acc + Number(element.totalPrice), 0);
        },
    }
}
</script>

<template>
    <p>El costo del tanque se divide entre los 5 pisos: {{(Number(tankPricePerFloor) * 5).toFixed(2)}} / 5 = {{(Number(tankPricePerFloor)).toFixed(2)}}</p>
    <v-table>
        <tbody>
            <tr v-for="(element, index) in infoToTable" :key="index">
                <td>{{ (element.title) }}</td>
                <td>S/ {{ (element.price).toFixed(2) }}</td>
                <td>+ S/ {{ Number(tankPricePerFloor).toFixed(2) }} =</td>
                <td>S/ {{ (element.totalPrice).toFixed(2) }}</td>
            </tr>
            <tr>
                <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                <td>S/ {{ total.toFixed(2) }}</td>
            </tr>
        </tbody>
    </v-table>
</template>