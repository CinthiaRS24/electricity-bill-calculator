<script lang="ts">
import FirstFloorConsumption from "./tables/FirstFloorConsumption.vue";
import ConstantCalculation from "./tables/ConstantCalculation.vue";
import FloorAndTankConsumption from "./tables/FloorAndTankConsumption.vue";
import TotalPaymentPerFloor from "./tables/TotalPaymentPerFloor.vue";
import type {TableRowItem} from "../model/Types"

export default {
    props: {
        tableItems: {
            type: Array <TableRowItem>,
            required: true
        },
        tank: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
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
            return this.tableItems[0].wattsPerDay;
        },
        firstFloorPlusTank(): number {
            return this.tableItems[this.tableItems.length - 1].wattsPerDay;
        },
        constant(): number {
            return Number((this.totalPrice / this.totalWatts).toFixed(6));
        },
        firstFloor(): number {
            return this.firstFloorPlusTank - this.tank;
        },
        pricePerFloorAndTank() {
            let dataByFloorAndTank = this.tableItems.slice(1, -1);
            const firstFloor = { 
                title: "1er piso", 
                watts: this.firstFloor,
                price: this.firstFloor * this.constant
            };
            const tank = { 
                title: "Tanque", 
                watts: this.tank,
                price: this.tank * this.constant
            };

            let onlyNecessaryData = dataByFloorAndTank.map((element) => ({
                title: element.title,
                watts: element.wattsPerDay,
                price: element.wattsPerDay * this.constant
            }));
            
            onlyNecessaryData = onlyNecessaryData.concat([firstFloor, tank]);

            return onlyNecessaryData;
        },
        tankPricePerFloor() {
            return this.pricePerFloorAndTank[this.pricePerFloorAndTank.length - 1].price / 5;
        },
        totalPricePerFloor() {
            let onlyNecessaryData = this.pricePerFloorAndTank.map((element) => ({
                title: element.title,
                price: element.price,
                totalPrice: element.price + (this.tankPricePerFloor)
            }))
            onlyNecessaryData = onlyNecessaryData.slice(0, -1)
            return onlyNecessaryData;
        }
    }
}
</script>

<template>
    <v-container fluid>
        <v-row>
            <v-col md="6" cols="12">
                <FirstFloorConsumption
                    :firstFloorPlusTank="firstFloorPlusTank"
                    :tank="tank"
                    :firstFloor="firstFloor" />
            </v-col>
            <v-col md="6" cols="12">
                <ConstantCalculation
                    :totalWatts="totalWatts"
                    :totalPrice="totalPrice"
                    :constant="constant" />
            </v-col>
        </v-row>
    </v-container>

    <FloorAndTankConsumption
        :infoToTable="pricePerFloorAndTank"
        :constant="constant" />
        
    <TotalPaymentPerFloor
        :infoToTable="totalPricePerFloor"
        :tankPricePerFloor="tankPricePerFloor" />
</template>