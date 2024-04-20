<script lang="ts">

export default {
    props: {
        infoToTable: {
            type: Array,
            required: true
        }
    },
    computed: {
        total(): number {
            return this.infoToTable[1].reduce((acc, element) => acc + Number(element.totalPrice), 0);
        },
    }
}
</script>

<template>
    <v-col cols="10">
        <p>El costo del tanque se divide entre los 5 pisos: {{(Number(infoToTable[0]) * 5).toFixed(2)}} / 5 = {{(Number(infoToTable[0])).toFixed(2)}}</p>
        <v-table>
            <tbody>
                <tr v-for="(element, index) in infoToTable[1]" :key="index">
                    <td>{{ (element.title) }}</td>
                    <td>{{ (element.price).toFixed(2) }}</td>
                    <td>+ {{ Number(infoToTable[0]).toFixed(2) }} =</td>
                    <td>{{ (element.totalPrice).toFixed(2) }}</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                    <td>{{ total.toFixed(2) }}</td>
                </tr>
            </tbody>
        </v-table>
    </v-col>
</template>