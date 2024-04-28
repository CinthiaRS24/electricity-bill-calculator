<script lang="ts">
import type { InfoData } from "../model/Types";
import '@mdi/font/css/materialdesignicons.css';
// @ts-ignore
import { db } from "@/firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { convertDate, savePrevAndCurrentDataToTable, saveDataBasedOnDays } from '../utils/utilityMethods';

export default {
    data() {
        return {
            info: [] as InfoData[],
            buildingOptions: [
                "LOTE B",
                "LOTE C"
            ],
            selectedBuilding: "LOTE B" as string,
            snackbar: false,
            text: '',
            timeout: 5000,
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
        async fetchInitialData() {
            this.info = [];
            try {
                const documentId = this.selectedBuilding;
                const docRef = doc(db, "LAST BILL", documentId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    // If the document exists, you can access its data using docSnap.data()
                    const data = docSnap.data();
                    this.info.push(data.currentDate);
                    this.info.push(data.prevDate);
                } else {
                    console.log('El documento no existe.');
                }
            } catch (error) {
                console.error("Error al obtener datos iniciales:", error);
            }
        },
        async onDateChange(index: number) {
            const infoItem = this.info[index];
            if (!infoItem.date) return;

            // Get Firebase document based on date
            const docRef = doc(db, this.selectedBuilding, convertDate(infoItem.date));
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // If the document exists, update the data in the info
                const data = docSnap.data();
                const sortedValues = this.floorLabels.map((label: string) => data[label]);
                this.info[index].buildingConsumption = data["consumo total"];
                this.info[index].floors = sortedValues;
            } else {
                // If the document does not exist, reset the data
                this.info[index].buildingConsumption = 0;
                this.info[index].floors = [0, 0, 0, 0];
            }
        },
        onCalculateButtonClick() {
            this.$emit('calculate', this.info);
        },
        setSnackbar(value: boolean) {
            this.snackbar = value;
        },
        setText(value: string) {
            this.text = value;
        },
        async saveDataInFirebase() {
            savePrevAndCurrentDataToTable(this.selectedBuilding, this.info);
            saveDataBasedOnDays(this.selectedBuilding, this.info, this.setSnackbar, this.setText);
        },
    },
    watch: {
        selectedBuilding: {
            handler: 'fetchInitialData',
            immediate: true, // Llama a la función fetchInitialData inmediatamente después de que el componente se monta
        },
    },
}
</script>

<template>
    <v-card>
        <v-form>
            <v-row class="mt-1" align="center">
                <v-col cols="9">
                    <v-select label="Selecciona" :items="buildingOptions" variant="outlined"
                        v-model="selectedBuilding" />
                </v-col>
                <v-col cols="3">
                    <v-btn
                        variant="tonal"
                        @click="saveDataInFirebase">
                        Guardar
                    </v-btn>
                </v-col>
            </v-row>
            <v-row>
                <v-col v-for="(d, index) in info" :key="index">
                    <p>Factura {{ index === 0 ? "actual" : "anterior" }}:</p>
                    <input type="date" v-model="d.date" @change="onDateChange(index)" />

                    <v-text-field v-model.number="d.buildingConsumption" type="number" label="Consumo total" />

                    <template v-for="(floorLabel, index) in floorLabels" :key="index">
                        <v-text-field v-model.number="d.floors[index]" type="number" :label="floorLabel" />
                    </template>
                </v-col>
            </v-row>
            <v-btn
                @click="onCalculateButtonClick"
                :disabled="!hasAllFieldsFilled"
                variant="tonal">
                Calcular watts por día
            </v-btn>
        </v-form>
    </v-card>
    
    <v-snackbar
        v-model="snackbar"
        :timeout="timeout"
        color="deep-purple-accent-4"
        location="top">
        {{ text }}
        <template v-slot:actions>
            <v-btn
                color="white"
                variant="text"
                @click="snackbar = false">
                <v-icon dark large>mdi-close</v-icon>
            </v-btn>
        </template>
    </v-snackbar>
</template>
