<script lang="ts">
import type { TableWithConstant } from "../../model/Types";

export default {
    props: {
        infoToTable: {
            type: Array as () => TableWithConstant[],
            required: true
        },
        constant: {
            type: Number,
            required: true
        },
    },
}
</script>

<template>
    <v-col cols="10">
        <p>Multiplicamos por la constante</p>
        <v-table>
            <tbody>
                <tr v-for="(element, index) in infoToTable" :key="index">
                    <td>{{ element.title }}</td>
                    <td>{{ element.watts }}</td>
                    <td>x {{ constant }} =</td>
                    <td>{{ (element.price).toFixed(2) }}</td>
                </tr>
            </tbody>
        </v-table>
    </v-col>
</template>