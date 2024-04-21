<script lang="ts">
import type { InfoData } from "../model/Types";

export default {
    data() {
        return {
            info: [
                { date: "", floors: [251.90, 841.90, 811.40, 2187.81], buildingConsumption: 7371.60 },
                { date: "", floors: [239, 802.20, 796.60, 2172.04], buildingConsumption: 7251.30 }
            ] as InfoData[],
            buildingOptions: [
                "Lote B",
                "Lote C"
            ]
        }
    },
    props: {
        floorLabels: {
            type: Array<string>,
            required: true
        }
    },
    computed: {
        // If all fields are filled -> enable the calculate button
        hasAllFieldsFilled(): boolean {
            return this.info.every((item: InfoData) =>
                item.date !== "" && item.buildingConsumption !== 0 && item.floors.every((value: number) => {
                    return value !== 0
                })
            );
        }
    },
    methods: {
        onCalculateButtonClick() {
            this.$emit('calculate', this.info);
        },
        
        /**
         * All values are expressed by day.
         * @param value 
         */
    },
}
</script>

<template>
    <v-card>
        <v-form>
            <v-select label="Selecciona" :items="buildingOptions" variant="outlined" />
            <v-row>
                <v-col v-for="(d, index) in info" :key="index">
                    <p>Factura {{ index === 0 ? "actual" : "anterior" }}:</p>
                    <input type="date" v-model="d.date" />

                    <v-text-field
                        v-model.number="d.buildingConsumption" 
                        type="number" 
                        label="Consumo total" />

                    <template v-for="(floorLabel, index) in floorLabels" :key="index">
                        <v-text-field 
                            v-model.number="d.floors[index]" 
                            type="number" 
                            :label="floorLabel" />
                    </template>
                </v-col>
            </v-row>
            <v-btn @click="onCalculateButtonClick" :disabled="!hasAllFieldsFilled" variant="tonal">
                Calcular watts por día
            </v-btn>
        </v-form>
    </v-card>
</template>
