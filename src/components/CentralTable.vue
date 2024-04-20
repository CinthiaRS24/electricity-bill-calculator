<script lang="ts">
import type { PropType } from 'vue';
import FirstFloorConsumption from "./tables/FirstFloorConsumption.vue";
import ConstantCalculation from "./tables/ConstantCalculation.vue";
import FloorAndTankConsumption from "./tables/FloorAndTankConsumption.vue";
import TotalPaymentPerFloor from "./tables/TotalPaymentPerFloor.vue";


export default {
    props: {
        wattsPerDayData: {
            type: Array as PropType<any[]>,
            required: true
        },
        tank: {
            type: Number as PropType<number>,
            required: true
        },
        totalPrice: {
            type: Number as PropType<number>,
            required: true
        },
    },
    components: {
        FirstFloorConsumption,
        ConstantCalculation,
        FloorAndTankConsumption,
        TotalPaymentPerFloor
    },
    computed: {
        totalWatts(): number {
            return this.wattsPerDayData[0].watts;
        },
        firstFloorPlusTank(): number {
            return this.wattsPerDayData[this.wattsPerDayData.length - 1].watts;
        },
        constant(): number {
            console.log('totalWatts', this.totalWatts);
            
            return Number((this.totalPrice / this.totalWatts).toFixed(6));
        },
        firstFloor(): number {
            return this.firstFloorPlusTank - this.tank;
        },
        getPricePerFloorAndTank() {
            let dataByFloorAndTank = this.wattsPerDayData.slice(1, -1);
            const firstFloor = { title: "1er piso", watts: this.firstFloor };
            const tank = { title: "Tanque", watts: this.tank };
            dataByFloorAndTank = dataByFloorAndTank.concat([firstFloor, tank])
            const onlyNecessaryData = dataByFloorAndTank.map((element) => ({
                title: element.title,
                watts: element.watts,
                price: element.watts * this.constant
            }))
            return onlyNecessaryData;
        },
        getTotalPricePerFloor() {
            const tankPricePerFloor = this.getPricePerFloorAndTank[this.getPricePerFloorAndTank.length - 1].price / 5;
            let onlyNecessaryData = this.getPricePerFloorAndTank.map((element) => ({
                title: element.title,
                price: element.price,
                totalPrice: element.price + (tankPricePerFloor)
            }))
            onlyNecessaryData = onlyNecessaryData.slice(0, -1)
            return [tankPricePerFloor, onlyNecessaryData];
        }
    }
}
</script>

<template>
    <v-container>
        <v-row>
            <v-col cols="6">
                <FirstFloorConsumption :firstFloorPlusTank="firstFloorPlusTank" :tank="tank" :firstFloor="firstFloor" />
            </v-col>
            <v-col cols="6">
                <ConstantCalculation :totalWatts="totalWatts" :totalPrice="totalPrice" :constant="constant" />
            </v-col>
            <v-col cols="12">
                <FloorAndTankConsumption :infoToTable="getPricePerFloorAndTank" :constant="constant" />
            </v-col>
            <v-col cols="12">
                <TotalPaymentPerFloor :infoToTable="getTotalPricePerFloor" />
            </v-col>
        </v-row>
    </v-container>
</template>