<script lang="ts">

import EnergyConsumptionForm from './components/EnergyConsumptionForm.vue';
import ConsumptionInfoTable from './components/ConsumptionInfoTable.vue';
import CentralTable from './components/CentralTable.vue';


export default {
    components: {
        EnergyConsumptionForm,
        ConsumptionInfoTable,
        CentralTable
    },
    data() {
        return {
            tableData: [] as any[],
            startDate: "" as string,
            endDate: "" as string,
            tank: 0 as number,
            totalPrice: 0 as number,
        }
    },
    emits: ["calculated", "secondCalculated"],
    methods: {
        updateStatusData(payload: { tableData: any[], startDate: string, endDate: string }) {
            this.tableData = payload.tableData;
            this.startDate = payload.startDate;
            this.endDate = payload.endDate;
            console.log('this.tableData',this.tableData);
        },
        updateStatusData2(payload: { tank: number, totalPrice: number }) {
            this.tank = payload.tank;
            this.totalPrice = payload.totalPrice;
        }
    }
}

</script>

<template>
    <v-container fluid>
        <v-row>
            <v-col cols="4">
                <EnergyConsumptionForm @calculated="updateStatusData" />
            </v-col>
            <v-col cols="6">
                <ConsumptionInfoTable  @secondCalculated="updateStatusData2" :wattsPerDayData="tableData" :endDate="endDate" :startDate="startDate" />
            </v-col>
        </v-row>
        
        <CentralTable v-if="tableData.length > 0" :tank="tank" :totalPrice="totalPrice" :wattsPerDayData="tableData" />
    </v-container>
</template>
