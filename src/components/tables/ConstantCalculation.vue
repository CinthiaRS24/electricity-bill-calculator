<script lang="ts">

export default {
    props: {
        totalWatts: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        },
        constant: {
            type: Number,
            required: true
        },
    }
}
</script>

<template>
    <p>Calculando el valor de la constante</p>
    <v-table>
        <tbody>
            <tr>
                <td>{{ totalWatts }}K = </td>
                <td>{{ totalPrice }}</td>
            </tr>
            <tr>
                <td>K =</td>
                <td>{{ constant }}</td>
            </tr>
        </tbody>
    </v-table>
</template>