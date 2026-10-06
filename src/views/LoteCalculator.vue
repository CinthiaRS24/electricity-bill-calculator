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
import { fetchLastMonths, fetchSharedTank, saveMonth } from '../utils/billSplitRepository';
import { useSharedTank, type SharedTankState } from '../stores/sharedTanks';

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
        // Lotes that share a tank meter all point at the same readings, so typing it
        // on one tab is enough for the other one.
        const sharedTank: SharedTankState | null = this.config.tankGroupId
            ? useSharedTank(this.config.tankGroupId, tankShareCountFor(this.config))
            : null;

        // Built from the local `sharedTank` rather than through buildInput(), because
        // the data properties this method reads do not exist yet at this point.
        const input = createEmptyInput(this.config);
        if (sharedTank) input.sharedTank = sharedTank;

        return {
            sharedTank,
            input: input as SplitInput,
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
        /** A blank input wired to the shared tank readings when the lote has one. */
        buildInput(overrides: Partial<SplitInput> = {}): SplitInput {
            const input = createEmptyInput(this.config);
            Object.assign(input, overrides);

            if (this.sharedTank) input.sharedTank = this.sharedTank;

            return input;
        },
        notify(text: string, color = 'deep-purple-accent-4') {
            this.snackbarText = text;
            this.snackbarColor = color;
            this.snackbar = true;
        },
        reload() {
            this.loadLastSavedMonth(true);
        },
        async loadLastSavedMonth(forceSharedTank = false) {
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
                    });
                    this.lastSavedDate = saved.current.date;
                }

                await this.loadSharedTank(forceSharedTank);
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
         * Only read once per session unless it is asked for again: the other lote may
         * already have the reading typed in and it should not be thrown away.
         */
        async loadSharedTank(force: boolean) {
            const tank = this.sharedTank;
            if (!tank || !this.config.tankGroupId) return;
            if (tank.loaded && !force) return;

            const saved = await fetchSharedTank(this.config.tankGroupId);
            if (saved) {
                tank.previousReading = saved.previousReading;
                tank.currentReading = saved.currentReading;
            }
            tank.loaded = true;
        },
        /**
         * Does by hand what used to be done on the spreadsheet: the readings of the
         * month just closed become the previous ones, and the current column is cleared.
         */
        startNewMonth() {
            const previousDate = this.input.currentDate;
            const previousReadings = { ...this.input.currentReadings };

            // Guarded so pressing the button on both lotes does not roll the shared
            // tank over twice and lose the reading.
            if (this.sharedTank && this.sharedTank.currentReading !== null) {
                this.sharedTank.previousReading = this.sharedTank.currentReading;
                this.sharedTank.currentReading = null;
            }

            this.input = this.buildInput({
                previousDate,
                previousReadings,
                currentReadings: createEmptyReadings(this.config),
            });
            this.syncToken++;
            this.notify('Listo: las lecturas del mes anterior quedaron como referencia.');
        },
        clearAll() {
            if (this.sharedTank) {
                this.sharedTank.previousReading = null;
                this.sharedTank.currentReading = null;
            }

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
            Este lote comparte el tanque con el {{ sharedWithLabel }}: la lectura se escribe
            una sola vez y aparece en las dos pestañas.
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
