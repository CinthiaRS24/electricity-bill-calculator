<script lang="ts">

import ConsumptionForm from './components/EnergyConsumptionForm.vue';
import InfoTable from './components/ConsumptionInfoTable.vue';


export default {
    components: {
        ConsumptionForm,
        InfoTable
    },
    data() {
        return {
            tableData: [] as any[],
            startDate: "" as string,
            endDate: "" as string,
        }
    },
    emits: ["calculated"],
    methods: {
        updateData(payload: { tableData: any[], startDate: string, endDate: string }) {
            this.tableData = payload.tableData;
            this.startDate = payload.startDate;
            this.endDate = payload.endDate;
        }
    }
}

</script>

<template>
    <v-container fluid>
        <v-row>
            <v-col cols="4">
                <ConsumptionForm @calculated="updateData" />
            </v-col>
            <v-col cols="6">
                <InfoTable :calculatedData="tableData" :endDate="endDate" :startDate="startDate" />
            </v-col>
        </v-row>
    </v-container>
</template>
