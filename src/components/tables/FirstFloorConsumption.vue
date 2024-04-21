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
    }
}
</script>

<template>
    <v-alert>
        <v-alert-title>Calculando el consumo del primer piso</v-alert-title>
        Como el <i>primer piso y tanque</i> consumen {{ firstFloorPlusTank }},
        y se está considerando {{ tank }} Watts por día para el tanque,
        el primer piso está consumiendo {{ firstFloor }} Watts.
    </v-alert>
</template>
