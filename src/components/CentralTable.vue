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
    data() {
        return {
            totalWatts: this.wattsPerDayData[0].watts,
            firstFloorPlusTank: this.wattsPerDayData[this.wattsPerDayData.length - 1].watts,
        }
    },
    computed: {
        constant(): number {
            return Number((this.totalPrice / this.totalWatts).toFixed(6));
        },
        firstFloor(): number {
            return this.firstFloorPlusTank - this.tank;
        },
        dataArray() {
            let newArr = this.wattsPerDayData.slice(1, -1);
            const firstFloor = { title: "1er piso", watts: this.firstFloor };
            const tank = { title: "Tanque", watts: this.tank };
            newArr = newArr.concat([firstFloor, tank])
            console.log('newArr', newArr);
            console.log('tfirstFloorPlusTankcompuuu', this.firstFloorPlusTank);
            return newArr;
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
            const onlyNecessaryData = this.getPricePerFloorAndTank.map((element) => ({
                title: element.title,
                price: element.price,
                totalPrice: element.price + tankPricePerFloor
            }))
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
                <ConstantCalculation :totalWatts="totalWatts" :totalPrice="totalPrice" :constant="constant"
                    :firstFloor="firstFloor" />
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