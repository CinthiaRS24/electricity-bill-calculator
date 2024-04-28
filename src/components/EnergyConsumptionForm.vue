<script lang="ts">
import type { InfoData } from "../model/Types";
import '@mdi/font/css/materialdesignicons.css';
// @ts-ignore
import { db } from "@/firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

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
            const docRef = doc(db, this.selectedBuilding, this.convertDate(infoItem.date));
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
        async saveDataInFirebase() {
            this.savePrevAndCurrentDataToTable();
            this.saveDataBasedOnDays();
        },
        async savePrevAndCurrentDataToTable() {
            try {
                const docRef = doc(db, "LAST BILL", this.selectedBuilding);

                // Build the data object to save
                const data = {
                    currentDate: {
                        date: this.info[0].date,
                        buildingConsumption: this.info[0].buildingConsumption,
                        floors: this.info[0].floors
                    },
                    prevDate: {
                        date: this.info[1].date,
                        buildingConsumption: this.info[1].buildingConsumption,
                        floors: this.info[1].floors
                    }
                };

                await setDoc(docRef, data);

                console.log("Datos guardados correctamente en Firebase.");
            } catch (error) {
                console.error("Error al guardar datos en Firebase:", error);
            }
        },
        async saveDataBasedOnDays() {
            try {
                const collectionName = this.selectedBuilding;

                this.info.map(async (info: InfoData) => {
                    const documentId = this.convertDate(info.date);
                    const docRef = doc(db, collectionName, documentId);

                    // If the document already exists, we exit the function
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        this.text = "Ya existe información guardada en las fechas selecciondas"
                        this.snackbar = true;
                        console.log("El documento ya existe en la colección personalizada.");
                        return;
                    }

                    // If the document does not exist, we will save the data
                    const data = {
                        "consumo total": info.buildingConsumption,
                        "5to piso": info.floors[0],
                        "4to piso": info.floors[1],
                        "3er piso": info.floors[2],
                        "2do piso": info.floors[3],
                    };
                    await setDoc(docRef, data);

                    this.text = "Los datos han sido guardados exitosamente"
                    this.snackbar = true;
                    console.log("Datos guardados correctamente en la colección personalizada.");
                })
            } catch (error) {
                console.error("Error al guardar datos en la colección personalizada:", error);
            }
        },
        convertDate(originalDate: string) {
            const parsedDate = new Date(originalDate);
            const day = parsedDate.getUTCDate().toString().padStart(2, '0');
            const month = (parsedDate.getUTCMonth() + 1).toString().padStart(2, '0');
            const year = parsedDate.getFullYear().toString();
            return day + month + year;
        }
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
