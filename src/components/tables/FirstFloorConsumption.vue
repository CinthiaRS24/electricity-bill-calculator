<script lang="ts">
export default {
    props: {
        firstFloorPlusTank: {
            type: Number,
            required: true
        },
        tank: {
            type: Number,
            required: true
        },
        firstFloor: {
            type: Number,
            required: true
        }
    },
}
</script>

<template>
    <v-col cols="10">
        <p>Calculando el consumo dle primer piso</p>
        <v-table>
            <tbody>
                <tr>
                    <td>Tanque</td>
                    <td>{{ tank }} watts x día</td>
                </tr>
                <tr>
                    <td>1er piso + tanque</td>
                    <td>{{ firstFloorPlusTank }}</td>
                </tr>
                <tr>
                    <td>1er piso + tanque</td>
                    <td>{{ firstFloorPlusTank }}</td>
                </tr>
                <tr>
                    <td>1er piso</td>
                    <td>{{ firstFloorPlusTank }} - {{ tank }}</td>
                </tr>
                <tr>
                    <td>1er piso</td>
                    <td>{{ firstFloor }}</td>
                </tr>
            </tbody>
        </v-table>
    </v-col>
</template>