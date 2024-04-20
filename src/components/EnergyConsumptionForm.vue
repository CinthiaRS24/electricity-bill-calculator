<script lang="ts">
import type { InfoData } from "../model/Types"

export default {
    data() {
        return {
            info: [
                { date: "", floors: [0, 0, 0, 0, 0, 0] },
                { date: "", floors: [0, 0, 0, 0, 0, 0] }
            ] as InfoData[],
            buildingOptions: [
                "Lote B",
                "Lote C"
            ],
            floorOptions: [
                "suma",
                "5to piso",
                "4to piso",
                "3er piso",
                "2do piso",
                "1er piso + tanque",
            ]
        }
    },
    computed: {
        // Returns true if all fields are filled to enable the calculate button
        hasAllFieldsFilled(): boolean {
            // The last element of floors will not go through the conditions since its value will be filled automatically
            return this.info.every((item: InfoData) =>
                item.floors.every((value: number, index: number) => {
                    const indexLastElement = item.floors.length - 1;
                    return index === indexLastElement || (value !== 0 && item.date !== "")
                })
            );
        }
    },
    methods: {
        onCalculateButtonClick() {
            const wattsPerDayPerFloor = this.calculateWattsPerDay(this.floorOptions);
            const completeWattsPerDayData = this.calculateWatsToFirstFloor(wattsPerDayPerFloor);

            this.$emit('calculated', { tableData: completeWattsPerDayData, startDate: this.info[1].date, endDate: this.info[0].date });
        },
        calculateWattsPerDay(floorOptions: string[]) {
            // Calculate watts consumed per day per floor, that will be shown in the first table, without taking into account the first floor plus tank
            return floorOptions.map((floor: string, index: number) => {
                const lastIndex = floorOptions.length - 1;
                const lastElement = index === lastIndex;

                const previousBillConsumption = Number(this.info[0].floors[index]);
                const currentBillConsumption = Number(this.info[1].floors[index]);
                const billDifference = previousBillConsumption - currentBillConsumption;

                return {
                    title: floor,
                    start: previousBillConsumption.toFixed(2),
                    end: currentBillConsumption.toFixed(2),
                    difference: billDifference.toFixed(2),
                    kwatts: (billDifference / 30).toFixed(2),
                    watts: lastElement ? 0 : Math.round(((Number(billDifference / 30).toFixed(2)) * 1000)),
                };
            });
        },
        calculateWatsToFirstFloor(value: { watts: number }[]) {
            // First we will make a sum of the watts from the second to the fifth floor
            // Then we will subtract the total watts minus the sum calculated in the previous step
            // Finally, that difference will be the watts value of the first floor plus the tank
            const totalWattsFromSecondToFifthFloor = value.slice(1, -1).reduce((acc, obj) => acc + obj.watts, 0);
            const totalWatts = value[0].watts;
            const totalWattsFirstFloorPlusTank = totalWatts - totalWattsFromSecondToFifthFloor;
            value[value.length - 1].watts = Math.round(totalWattsFirstFloorPlusTank);
            return value;
        },
    },
}

</script>

<template>
    <v-container style="display: flex; flex-direction: row;">
        <v-form style="margin: initial;">
            <v-container>
                <v-select label="Selecciona" :items="buildingOptions" variant="outlined" />
                <div class="info-container">
                    <v-row>
                        <v-col v-for="(d, index) in info" :key="index">
                            <div>
                                <div>
                                    <p>Factura {{ index === 0 ? "anterior" : "actual" }}:</p>
                                    <input type="date" v-model="d.date" />
                                </div>

                                <v-col v-for="(floor, index) in floorOptions" :key="index" cols="9">
                                    <v-text-field v-model.number="d.floors[index]" type="number" :label="floor"
                                        :disabled="index === floorOptions.length - 1" />
                                </v-col>
                            </div>
                        </v-col>
                    </v-row>
                </div>
                <div>
                    <v-btn @click="onCalculateButtonClick" :disabled="!hasAllFieldsFilled" variant="tonal">
                        Calcular
                    </v-btn>
                </div>
            </v-container>
        </v-form>
    </v-container>

</template>

<style scoped>
.info-container {
    margin: auto
}
</style>