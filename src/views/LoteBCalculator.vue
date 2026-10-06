<script lang="ts">
import type { InfoData, SplitIssue } from "../model/Types";
import EnergyConsumptionForm from '../components/EnergyConsumptionForm.vue';
import ConsumptionInfoTable from '../components/ConsumptionInfoTable.vue';
import CentralTable from '../components/CentralTable.vue';
import LoteSheet from '../components/lote/LoteSheet.vue';
import {
    calculateLoteB,
    isLoteBInputComplete,
    loteBConsumptions,
    validateLoteB,
    type LoteBAmounts,
    type LoteBConsumptions,
    type LoteBResult
} from '../utils/loteB';
import {
    DEFAULT_TANK_WATTS_PER_DAY,
    emptyBill,
    fetchLastLoteBBill,
    fetchLoteBReadings,
    saveLoteBBill
} from '../utils/loteBRepository';
import { formatDate } from '../utils/billSplit';

/** The floors of lote B that have their own meter, from the fifth down to the second. */
const FLOOR_LABELS = ['5to piso', '4to piso', '3er piso', '2do piso'];

export default {
    components: {
        EnergyConsumptionForm,
        ConsumptionInfoTable,
        CentralTable,
        LoteSheet
    },
    data() {
        return {
            floorLabels: FLOOR_LABELS,
            info: [emptyBill(), emptyBill()] as InfoData[],
            amounts: { tankWattsPerDay: DEFAULT_TANK_WATTS_PER_DAY } as Partial<LoteBAmounts>,
            syncToken: 0,
            loading: true,
            saving: false,
            /** Date of the month already stored, shown so it is clear what was pre-filled. */
            lastSavedDate: '' as string,
            showDetail: false,
            snackbar: false,
            snackbarText: '',
            snackbarColor: 'deep-purple-accent-4',
        }
    },
    computed: {
        consumptions(): LoteBConsumptions | null {
            if (!this.hasAllReadings) return null;

            return loteBConsumptions(this.info, this.floorLabels);
        },
        hasAllReadings(): boolean {
            return this.info.every(
                (bill: InfoData) =>
                    bill.date !== '' &&
                    bill.buildingConsumption > 0 &&
                    this.floorLabels.every((_label: string, index: number) => bill.floors[index] > 0)
            );
        },
        result(): LoteBResult | null {
            if (!isLoteBInputComplete(this.info, this.amounts)) return null;

            return calculateLoteB({
                info: this.info,
                floorLabels: this.floorLabels,
                ...(this.amounts as LoteBAmounts),
            });
        },
        issues(): SplitIssue[] {
            return this.result ? validateLoteB(this.result, this.info, this.amounts) : [];
        },
        hasErrors(): boolean {
            return this.issues.some((issue: SplitIssue) => issue.level === 'error');
        },
        lastSavedLabel(): string {
            return this.lastSavedDate ? formatDate(this.lastSavedDate) : '';
        },
    },
    methods: {
        formatDate,
        notify(text: string, color = 'deep-purple-accent-4') {
            this.snackbarText = text;
            this.snackbarColor = color;
            this.snackbar = true;
        },
        async loadLastSavedBill() {
            this.loading = true;
            try {
                const saved = await fetchLastLoteBBill(this.floorLabels);

                if (saved) {
                    this.info = saved.info;
                    this.amounts = saved.amounts;
                    this.lastSavedDate = saved.info[0].date;
                } else {
                    this.notify('Aún no hay meses guardados. Llena las lecturas para empezar.');
                }

                this.syncToken++;
            } catch (error) {
                console.error('Error al leer el último mes del lote B:', error);
                this.notify(
                    'No se pudo leer el último mes guardado. Puedes llenar los datos a mano.',
                    'error'
                );
            } finally {
                this.loading = false;
            }
        },
        /**
         * Does by hand what used to be done by copying cells: the readings of the month
         * just closed become the previous ones, and the current column is cleared.
         */
        startNewMonth() {
            this.info = [
                emptyBill(),
                { ...this.info[0], floors: [...this.info[0].floors] },
            ];
            this.amounts = { tankWattsPerDay: this.amounts.tankWattsPerDay };
            this.syncToken++;
            this.notify('Listo: las lecturas del mes anterior quedaron como referencia.');
        },
        clearAll() {
            this.info = [emptyBill(), emptyBill()];
            this.amounts = { tankWattsPerDay: DEFAULT_TANK_WATTS_PER_DAY };
            this.syncToken++;
        },
        /**
         * A date that was billed before already has its readings stored, so they are
         * brought back instead of having to be looked up on the old bill.
         */
        async onPickDate(index: number) {
            const date = this.info[index].date;
            if (!date) return;

            try {
                const saved = await fetchLoteBReadings(date, this.floorLabels);
                if (!saved) return;

                this.info[index] = saved;
                this.syncToken++;
            } catch (error) {
                console.error('Error al buscar las lecturas de esa fecha:', error);
            }
        },
        async saveMonth() {
            this.saving = true;
            try {
                await saveLoteBBill(this.info, this.amounts as LoteBAmounts, this.floorLabels);
                this.lastSavedDate = this.info[0].date;
                this.notify('Mes guardado. El próximo mes ya tendrá estas lecturas como anteriores.');
            } catch (error) {
                console.error('Error al guardar el mes del lote B:', error);
                this.notify('No se pudo guardar en la nube. Revisa tu conexión.', 'error');
            } finally {
                this.saving = false;
            }
        },
    },
    mounted() {
        this.loadLastSavedBill();
    },
}
</script>

<template>
    <div>
        <v-alert
            v-if="lastSavedLabel"
            density="compact"
            variant="tonal"
            type="info"
            class="mb-4">
            Último mes guardado: <strong>{{ lastSavedLabel }}</strong>.
            Para calcular el mes siguiente usa "Nuevo mes".
        </v-alert>

        <div class="actions mb-4">
            <v-btn
                variant="flat"
                color="primary"
                prepend-icon="mdi-calendar-plus"
                @click="startNewMonth">
                Nuevo mes
            </v-btn>
            <v-btn
                variant="tonal"
                prepend-icon="mdi-cloud-download-outline"
                :loading="loading"
                @click="loadLastSavedBill">
                Recargar guardado
            </v-btn>
            <v-btn variant="text" prepend-icon="mdi-eraser" @click="clearAll">
                Limpiar
            </v-btn>
        </div>

        <v-row>
            <v-col md="5" cols="12">
                <EnergyConsumptionForm
                    :floor-labels="floorLabels"
                    :info="info"
                    :sync-token="syncToken"
                    @pick-date="onPickDate" />
            </v-col>
            <v-col md="7" cols="12">
                <ConsumptionInfoTable
                    :consumptions="consumptions"
                    :amounts="amounts"
                    :current-date="formatDate(info[0].date)"
                    :prev-date="formatDate(info[1].date)"
                    :sync-token="syncToken" />
            </v-col>
        </v-row>

        <v-alert
            v-for="(issue, index) in issues"
            :key="index"
            :type="issue.level === 'error' ? 'error' : 'warning'"
            density="compact"
            variant="tonal"
            class="mb-4">
            {{ issue.message }}
        </v-alert>

        <template v-if="result && !hasErrors">
            <LoteSheet
                :result="result"
                title="LOTE B"
                slug="lote-b"
                :current-date="info[0].date"
                :previous-date="info[1].date"
                @notify="notify">
                <template #actions>
                    <v-btn
                        variant="flat"
                        color="success"
                        prepend-icon="mdi-content-save-outline"
                        :loading="saving"
                        @click="saveMonth">
                        Guardar mes
                    </v-btn>
                </template>
            </LoteSheet>

            <v-btn
                variant="text"
                class="mt-4"
                :append-icon="showDetail ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                @click="showDetail = !showDetail">
                {{ showDetail ? 'Ocultar' : 'Ver' }} el detalle del cálculo
            </v-btn>

            <v-expand-transition>
                <div v-show="showDetail">
                    <CentralTable :result="result" />
                </div>
            </v-expand-transition>
        </template>

        <v-alert v-else density="compact" variant="tonal" class="empty-state">
            <template v-if="hasErrors">
                Corrige los datos marcados arriba para ver el reparto.
            </template>
            <template v-else>
                Completa las fechas, las lecturas y los dos montos del recibo para ver
                cuánto le toca a cada piso.
            </template>
        </v-alert>

        <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="5000" location="top">
            {{ snackbarText }}
            <template #actions>
                <v-btn variant="text" @click="snackbar = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<style scoped>
.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.empty-state {
    text-align: center;
}
</style>
