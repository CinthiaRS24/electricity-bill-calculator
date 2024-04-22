<script lang="ts">
import type { InfoData, TableRowItem } from "./model/Types";
import EnergyConsumptionForm from './components/EnergyConsumptionForm.vue';
import ConsumptionInfoTable from './components/ConsumptionInfoTable.vue';
import CentralTable from './components/CentralTable.vue';
// import { collection, getDocs } from 'firebase/firestore';
// import { db } from '@/firebase.js';

export default {
    components: {
        EnergyConsumptionForm,
        ConsumptionInfoTable,
        CentralTable
    },
    data() {
        return {
            tableItems: [] as any[],
            prevDate: "" as string,
            currentDate: "" as string,
            differenceDays: "0" as string,
            tank: 0 as number,
            totalPrice: 0 as number,
            floorLabels: [
                "5to piso",
                "4to piso",
                "3er piso",
                "2do piso"
            ] as string[]
        }
    },
    methods: {
        roundTo2Decimals(num: number) {
            return Math.round(num * 100) / 100;
        },
        /**
         * In order to generate a table item, we need the prev and current consumption.
         * It works for floors and the total building consumptions.
         */
        formatTableItem(
            label: string,
            currentConsumption: number,
            prevConsumption: number
        ): TableRowItem {
            const kwattsDifference = currentConsumption - prevConsumption;
            const kwattsPerDay = this.roundTo2Decimals(kwattsDifference / Number(this.differenceDays));
            const wattsPerDay = Math.round(kwattsPerDay * 1000);

            return {
                title: label,
                prev: prevConsumption.toFixed(2),
                current: currentConsumption.toFixed(2),
                kwattsDiff: kwattsDifference.toFixed(2),
                kwattsPerDay: String(kwattsPerDay),
                wattsPerDay: wattsPerDay,
            };
        },
        calcAndFillTable(info: InfoData[]) {
            this.currentDate = info[0].date;
            this.prevDate = info[1].date;
            this.differenceDays = String(this.getElapsedDays());

            const currentBuildingConsumption = info[0].buildingConsumption;
            const prevBuildingConsumption = info[1].buildingConsumption;

            const buildingConsumptionItem = this.formatTableItem(
                'Consumo total',
                currentBuildingConsumption,
                prevBuildingConsumption
            );

            const floorItems = this.floorLabels.map((floorLabel: string, index: number) => {
                const currentConsumption = info[0].floors[index];
                const prevConsumption = info[1].floors[index];

                // Calc
                return this.formatTableItem(
                    floorLabel,
                    currentConsumption,
                    prevConsumption
                );
            });

            const firstFloorPlusTank = this.calcFirstFloorPlusTankWatts(
                buildingConsumptionItem.wattsPerDay,
                floorItems.map((floorItem: TableRowItem) => floorItem.wattsPerDay)
            )

            const firstFloorPlusTankItem = {
                title: '1er piso + Tanque',
                prev: "",
                current: "",
                kwattsDiff: "",
                kwattsPerDay: "",
                wattsPerDay: firstFloorPlusTank,
            };

            floorItems.push(firstFloorPlusTankItem);

            this.tableItems = [buildingConsumptionItem].concat(floorItems);
        },
        calcFirstFloorPlusTankWatts(buildingwattsPerDay: number, floorsWattsPerDay: number[]) {
            // Sum from the second to the fifth floor
            const totalWattsFromSecondToFifthFloor = floorsWattsPerDay.reduce((acc, watts) => acc + watts, 0);

            return buildingwattsPerDay - totalWattsFromSecondToFifthFloor;
        },
        updateTankAndTotalPrice(payload: { tank: number, totalPrice: number }) {
            this.tank = payload.tank;
            this.totalPrice = payload.totalPrice;
        },
        getElapsedDays(): number {
            if (!this.currentDate || !this.prevDate) return 0;
            const differenceInMilliseconds = Number(new Date(this.currentDate)) - Number(new Date(this.prevDate));
            const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
            return differenceInDays;
        },
    },
}
</script>

<template>
    <!-- TODO: Rename updateStatus2 for a better name. Rename also the event names, to match the buttons. -->
    <v-container fluid>
        <v-row class="mb-4">
            <v-col offset-md="1" offset="0" md="4" cols="12">
                <EnergyConsumptionForm :floorLabels="floorLabels" @calculate="calcAndFillTable" />
            </v-col>
            <v-col md="6" cols="12">
                <ConsumptionInfoTable @changeValueOfTankAndTotalPrice="updateTankAndTotalPrice" :tableItems="tableItems"
                    :currentDate="currentDate" :prevDate="prevDate" :differenceDays="differenceDays" />
            </v-col>
        </v-row>

        <CentralTable v-if="tableItems.length > 0" :tank="tank" :totalPrice="totalPrice" :tableItems="tableItems" />
    </v-container>
</template>
