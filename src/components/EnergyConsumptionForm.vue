<script lang="ts">
import type { InfoItem } from "../model/Types"

export default {
    data() {
        return {
            info: [
                {
                    date: "",
                    suma: 0,
                    quinto: 0,
                    cuarto: 0,
                    tercero: 0,
                    segundo: 0,
                    primero: 0,
                },
                {
                    date: "",
                    suma: 0,
                    quinto: 0,
                    cuarto: 0,
                    tercero: 0,
                    segundo: 0,
                    primero: 0,
                }
            ] as InfoItem[],
            data: [
                {
                    title: "",
                    start: "",
                    end: "",
                    difference: "",
                    kwatts: "",
                    watts: 0,
                },
            ],
            building: [
                "Lote B",
                "Lote C"
            ],
            floors: [
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
            return this.info.every((item: InfoItem) =>
                Object.keys(item).every((key: string) =>
                    key === "primero" || (item[key] !== 0 && item.date !== "")
                )
            );
        }
    },
    methods: {
        onCalculateButtonClick() {
            const keys: string[] = Object.keys(this.info[0]).slice(1);
            const newValues = this.assignValuesByFloor(keys);
            this.calculateWatsToFirstFloor(newValues);
            this.updateData(newValues);
            this.$emit('calculated', { tableData: this.data, startDate: this.info[1].date, endDate: this.info[0].date });
        },
        assignValuesByFloor(keys: string[]) {
            return keys.map((floor: string, index: number) => {
                const lastIndex = keys.length - 1;
                const lastElement = index === lastIndex;

                const previousBillConsumption = Number(this.info[0][floor]);
                const currentBillConsumption = Number(this.info[1][floor]);
                const billDifference = previousBillConsumption - currentBillConsumption;

                return {
                    title: lastElement ? floor + " + tanque" : floor,
                    start: previousBillConsumption.toFixed(2),
                    end: currentBillConsumption.toFixed(2),
                    difference: billDifference.toFixed(2),
                    kwatts: (billDifference / 30).toFixed(2),
                    watts: lastElement ? 0 : Math.round((billDifference / 30 * 1000)),
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
        },
        updateData(value: any[]) {
            this.data = value;
        }
    },
}

</script>

<template>
    <v-container style="display: flex; flex-direction: row;">
        <v-form style="margin: initial;">
            <v-container>
                <v-select label="Selecciona" :items="building" variant="outlined"></v-select>
                <div class="info-container">
                    <v-row>
                        <v-col v-for="(d, index) in info" :key="index">
                            <div>
                                <div>
                                    <p>Factura {{ index === 0 ? "anterior" : "actual" }}:</p>
                                    <input type="date" v-model="d.date" />
                                </div>

                                <v-col v-for="(floor, index) in floors" :key="index" cols="9">
                                    <v-text-field v-model.number="d.suma" type="number" :label="floor"
                                        :disabled="index === floors.length - 1" />
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