<script lang="ts">
import type { PropType } from 'vue';
import type { LoteConfig, SplitInput, SplitIssue, SplitResult } from '../model/Types';
import LoteForm from '../components/lote/LoteForm.vue';
import LoteSheet from '../components/lote/LoteSheet.vue';
import { otherLotesSharingTank, tankShareCountFor } from '../model/lotes';
import {
    calculateSplit,
    createEmptyInput,
    createEmptyReadings,
    formatDate,
    isSplitInputComplete,
    validateSplit,
} from '../utils/billSplit';
import { fetchLastMonths, saveMonth } from '../utils/billSplitRepository';

export default {
    components: {
        LoteForm,
        LoteSheet,
    },
    props: {
        config: {
            type: Object as PropType<LoteConfig>,
            required: true,
        },
    },
    data() {
        return {
            input: createEmptyInput(this.config) as SplitInput,
            syncToken: 0,
            loading: true,
            saving: false,
            /** Date of the month already stored, shown so it is clear what was pre-filled. */
            lastSavedDate: '' as string,
            snackbar: false,
            snackbarText: '',
            snackbarColor: 'deep-purple-accent-4',
        };
    },
    computed: {
        result(): SplitResult {
            return calculateSplit(this.input);
        },
        issues(): SplitIssue[] {
            return validateSplit(this.input, this.config);
        },
        hasBlockingIssue(): boolean {
            return this.issues.some((issue: SplitIssue) => issue.level === 'error');
        },
        canShowResult(): boolean {
            return isSplitInputComplete(this.input, this.config) && !this.hasBlockingIssue;
        },
        lastSavedLabel(): string {
            return this.lastSavedDate ? formatDate(this.lastSavedDate) : '';
        },
        sharedWithLabel(): string {
            return otherLotesSharingTank(this.config).join(' y ');
        },
    },
    methods: {
        buildInput(overrides: Partial<SplitInput> = {}): SplitInput {
            return Object.assign(createEmptyInput(this.config), overrides);
        },
        tankFromSaved(
            currentReading: number | null,
            previousReading: number | null
        ): SplitInput['sharedTank'] | undefined {
            if (!this.config.tankGroupId) return undefined;

            return {
                previousReading,
                currentReading,
                shareCount: tankShareCountFor(this.config),
            };
        },
        notify(text: string, color = 'deep-purple-accent-4') {
            this.snackbarText = text;
            this.snackbarColor = color;
            this.snackbar = true;
        },
        reload() {
            this.loadLastSavedMonth();
        },
        async loadLastSavedMonth() {
            this.loading = true;
            try {
                const saved = await fetchLastMonths(this.config);

                if (saved) {
                    this.input = this.buildInput({
                        currentDate: saved.current.date,
                        previousDate: saved.previous.date,
                        currentReadings: saved.current.readings,
                        previousReadings: saved.previous.readings,
                        energyCharge: saved.current.energyCharge,
                        totalBill: saved.current.totalBill,
                        sharedTank: this.tankFromSaved(
                            saved.current.tankReading,
                            saved.previous.tankReading
                        ),
                    });
                    this.lastSavedDate = saved.current.date;
                }

                this.syncToken++;

                if (!saved) {
                    this.notify('Aún no hay meses guardados. Llena las lecturas para empezar.');
                }
            } catch (error) {
                console.error(`Error al leer el último mes de ${this.config.label}:`, error);
                this.notify(
                    'No se pudo leer el último mes guardado. Puedes llenar los datos a mano.',
                    'error'
                );
            } finally {
                this.loading = false;
            }
        },
        /**
         * Does by hand what used to be done on the spreadsheet: the readings of the
         * month just closed become the previous ones, and the current column is cleared.
         * Only this lote moves; the other one that shares the tank keeps its own month.
         */
        startNewMonth() {
            const previousDate = this.input.currentDate;
            const previousReadings = { ...this.input.currentReadings };
            const tank = this.input.sharedTank;

            this.input = this.buildInput({
                previousDate,
                previousReadings,
                currentReadings: createEmptyReadings(this.config),
                sharedTank: this.tankFromSaved(null, tank?.currentReading ?? null),
            });
            this.syncToken++;
            this.notify('Listo: las lecturas del mes anterior quedaron como referencia.');
        },
        clearAll() {
            this.input = this.buildInput();
            this.syncToken++;
        },
        async saveMonth() {
            this.saving = true;
            try {
                await saveMonth(this.config, this.input);
                this.lastSavedDate = this.input.currentDate;
                this.notify('Mes guardado. El próximo mes ya tendrá estas lecturas como anteriores.');
            } catch (error) {
                console.error(`Error al guardar el mes de ${this.config.label}:`, error);
                this.notify('No se pudo guardar en la nube. Revisa tu conexión.', 'error');
            } finally {
                this.saving = false;
            }
        },
    },
    mounted() {
        this.loadLastSavedMonth();
    },
};
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

        <v-alert
            v-if="sharedWithLabel"
            density="compact"
            variant="tonal"
            type="warning"
            class="mb-4">
            Este lote comparte el medidor del tanque con el {{ sharedWithLabel }}: a cada
            uno le toca la mitad. Escríbelo en este lote; no se copia solo al otro, para
            no mezclar meses distintos.
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
                @click="reload">
                Recargar guardado
            </v-btn>
            <v-btn variant="text" prepend-icon="mdi-eraser" @click="clearAll">
                Limpiar
            </v-btn>
        </div>

        <LoteForm
            :config="config"
            :input="input"
            :issues="issues"
            :sync-token="syncToken" />

        <LoteSheet
            v-if="canShowResult"
            :result="result"
            :title="config.sheetTitle"
            :slug="config.id"
            :current-date="input.currentDate"
            :previous-date="input.previousDate"
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

        <v-alert v-else density="compact" variant="tonal" class="empty-state">
            <template v-if="hasBlockingIssue">
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
