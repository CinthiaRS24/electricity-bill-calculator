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
    <v-container style="display: flex; flex-direction: row;">
        <v-container style="width: 40%">
            <ConsumptionForm @calculated="updateData" />
        </v-container>
        <v-container style="width: 60%">
            <InfoTable :desserts="tableData" :endDate="endDate" :startDate="startDate" />
        </v-container>
    </v-container>
</template>
