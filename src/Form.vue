<script lang="ts">
import InfoTable from './components/InfoTable.vue'

export default {
    components: {
        InfoTable
    },
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
                    primero: "",
                },
                {
                    date: "",
                    suma: 0,
                    quinto: 0,
                    cuarto: 0,
                    tercero: 0,
                    segundo: 0,
                    primero: "",
                }
            ],
            data: [
                {
                    title: "",
                    start: "",
                    end: "",
                    difference: "",
                    kwats: "",
                    wats: 0,
                },
            ]
        }
    },
    computed: {
        fullFields() {
        return this.info.every(item => 
            Object.keys(item).every(key => 
                key === "primero" || (item[key] !== 0 && item.date !== "")
            )
        );
    }
    },
    methods: {
        onClicker() {
            const keys = Object.keys(this.info[0]).slice(1);
            const newValues = this.assignValuesByFloor(keys);
            this.calculateWats(newValues);
            this.updateData(newValues);
        },
        assignValuesByFloor(keys) {
            return keys.map((floor, index) => {
                const isFirstKey = index === 0;
                const lastIndex = keys.length - 1;

                return {
                    title: isFirstKey ? floor + " + tanque" : floor,
                    start: Number(this.info[0][floor]).toFixed(2),
                    end: Number(this.info[1][floor]).toFixed(2),
                    difference: (this.info[0][floor] - this.info[1][floor]).toFixed(2),
                    kwats: ((this.info[0][floor] - this.info[1][floor]) / 30).toFixed(2),
                    wats: index === lastIndex ? 0 : Math.round(((this.info[0][floor] - this.info[1][floor]) / 30 * 1000)),
                };
            });
        },
        calculateWats(value) {
            const sumaWats = value.slice(1, -1).reduce((acc, obj) => acc + obj.wats, 0);
            const primerElementoWats = value[0].wats;
            const diferencia = primerElementoWats - sumaWats;
            value[value.length - 1].wats = Math.round(diferencia);
        },
        updateData(value) {
            this.data = value;
        }
    },
}

</script>

<template>
    <v-container style="display: flex; flex-direction: row;">
        <v-form style="width: 30%; margin: initial;">
            <v-container>
                <v-select label="Select" :items="['Lote B', 'Lote C']" variant="outlined"></v-select>
                <div class="info-container">
                    <v-row>
                        <v-col v-for="(d, index) in info" :key="index" class="info-current">
                            <div class="info">
                                <div class="date">
                                    <p>Date:</p>
                                    <input type="date" v-model="d.date" />
                                </div>

                                <v-responsive max-width="80%">
                                    <v-text-field v-model.number="d.suma" type="number" label="Suma" />
                                </v-responsive>

                                <v-responsive max-width="80%">
                                    <v-text-field v-model.number="d.quinto" type="number" label="5to piso" />
                                </v-responsive>

                                <v-responsive max-width="80%">
                                    <v-text-field v-model.number="d.cuarto" type="number" label="4to piso" />
                                </v-responsive>

                                <v-responsive max-width="80%">
                                    <v-text-field v-model.number="d.tercero" type="number" label="3er piso" />
                                </v-responsive>

                                <v-responsive max-width="80%">
                                    <v-text-field v-model.number="d.segundo" type="number" label="2do piso" />
                                </v-responsive>

                                <v-responsive max-width="80%">
                                    <v-text-field v-model.number="d.primero" type="number" label="1er piso + tanque"
                                        disabled />
                                </v-responsive>

                            </div>
                        </v-col>
                    </v-row>
                </div>
            </v-container>
        </v-form>

        <v-container style="width: 50%; margin-right: auto;">
            <InfoTable :desserts="data" :endDate="info[0].date" :startDate="info[1].date" />
        </v-container>
    </v-container>

    <div class="div-final">
        <div>
            Monto a pagar: <input v-model="number" />
        </div>
        <v-btn @click="onClicker" :disabled="!fullFields" variant="tonal">
            Calcular
        </v-btn>
    </div>
</template>

<style scoped>
.info-container {
    margin: auto
}
</style>