<script lang="ts">
import type { TableWithConstant } from "../../model/Types";

export default {
    props: {
        infoToTable: {
            type: Array<TableWithConstant>,
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
    <p>Multiplicamos por la constante</p>
    <v-table>
        <tbody>
            <tr v-for="(element, index) in infoToTable" :key="index">
                <td>{{ element.title }}</td>
                <td>{{ element.watts }} watts</td>
                <td>x {{ constant }} =</td>
                <td>S/ {{ (element.price).toFixed(2) }}</td>
            </tr>
        </tbody>
    </v-table>
</template>