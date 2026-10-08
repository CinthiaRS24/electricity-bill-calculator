<script lang="ts">
import type { PropType } from 'vue';
import type { LoteConfig, SplitInput, SplitIssue } from '../../model/Types';
import {
    FLOOR_LABELS,
    meterLabelsFor,
    otherLotesSharingTank,
    tankShareCountFor,
} from '../../model/lotes';
import { formatKwh, formatSoles } from '../../utils/billSplit';
import { parseDecimalInput } from '../../utils/utilityMethods';

type ReadingColumn = 'previousReadings' | 'currentReadings';
type SharedTankField = 'previousReading' | 'currentReading';

const READING_COLUMNS: ReadingColumn[] = ['previousReadings', 'currentReadings'];

export default {
    props: {
        config: {
            type: Object as PropType<LoteConfig>,
            required: true,
        },
        /**
         * Owned by the parent view. Nested properties are written in place, which is
         * what keeps the calculation reacting as the fields are typed.
         */
        input: {
            type: Object as PropType<SplitInput>,
            required: true,
        },
        issues: {
            type: Array as PropType<SplitIssue[]>,
            default: () => [],
        },
        /**
         * The parent bumps this after loading or clearing data so the text shown in
         * the fields is rebuilt from the input instead of from what was typed.
         */
        syncToken: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            // What the user literally typed, so a half written "2136." is not rewritten.
            raw: {} as Record<string, string>,
        };
    },
    computed: {
        meterLabels(): string[] {
            return meterLabelsFor(this.config);
        },
        hasSharedTank(): boolean {
            return Boolean(this.input.sharedTank);
        },
        shareCount(): number {
            return tankShareCountFor(this.config);
        },
        sharedWithLabel(): string {
            return otherLotesSharingTank(this.config).join(' y ');
        },
        floorCount(): number {
            return FLOOR_LABELS.length;
        },
        /** kWh of the whole shared meter, before splitting it between the lotes. */
        sharedTankTotal(): number | null {
            const tank = this.input.sharedTank;
            if (!tank) return null;
            if (typeof tank.currentReading !== 'number' || typeof tank.previousReading !== 'number') {
                return null;
            }

            return tank.currentReading - tank.previousReading;
        },
        sharedTankText(): string {
            const total = this.sharedTankTotal;
            if (total === null) return '—';

            return `${formatKwh(total)} kWh ÷ ${this.shareCount} = ${formatKwh(total / this.shareCount)} kWh`;
        },
        hasSharedTankError(): boolean {
            const total = this.sharedTankTotal;
            return total !== null && total < 0;
        },
        fixedChargesHint(): string {
            const { energyCharge, totalBill } = this.input;
            if (typeof energyCharge !== 'number' || typeof totalBill !== 'number') return '';

            return `Cargo fijo y otros: ${formatSoles(totalBill - energyCharge)}`;
        },
    },
    methods: {
        rawKey(group: string, field = ''): string {
            return field ? `${group}|${field}` : group;
        },
        syncRawFromInput() {
            const raw: Record<string, string> = {};
            const asText = (value: number | null | undefined) =>
                typeof value === 'number' ? String(value) : '';

            READING_COLUMNS.forEach((column: ReadingColumn) => {
                this.meterLabels.forEach((label: string) => {
                    raw[this.rawKey(column, label)] = asText(this.input[column][label]);
                });
            });

            if (this.input.sharedTank) {
                raw[this.rawKey('sharedTank', 'previousReading')] = asText(
                    this.input.sharedTank.previousReading
                );
                raw[this.rawKey('sharedTank', 'currentReading')] = asText(
                    this.input.sharedTank.currentReading
                );
            }

            raw[this.rawKey('energyCharge')] = asText(this.input.energyCharge);
            raw[this.rawKey('totalBill')] = asText(this.input.totalBill);

            this.raw = raw;
        },
        onReadingInput(column: ReadingColumn, label: string, value: string) {
            this.raw[this.rawKey(column, label)] = value;
            this.input[column][label] = parseDecimalInput(value);
        },
        onSharedTankInput(field: SharedTankField, value: string) {
            this.raw[this.rawKey('sharedTank', field)] = value;
            if (this.input.sharedTank) {
                this.input.sharedTank[field] = parseDecimalInput(value);
            }
        },
        onAmountInput(field: 'energyCharge' | 'totalBill', value: string) {
            this.raw[this.rawKey(field)] = value;
            this.input[field] = parseDecimalInput(value);
        },
        consumptionText(label: string): string {
            const current = this.input.currentReadings[label];
            const previous = this.input.previousReadings[label];
            if (typeof current !== 'number' || typeof previous !== 'number') return '—';

            return `${formatKwh(current - previous)} kWh`;
        },
        hasConsumptionError(label: string): boolean {
            const current = this.input.currentReadings[label];
            const previous = this.input.previousReadings[label];

            return typeof current === 'number' && typeof previous === 'number' && current < previous;
        },
    },
    watch: {
        syncToken: {
            handler: 'syncRawFromInput',
            immediate: true,
        },
    },
};
</script>

<template>
    <v-card class="pa-4 pa-sm-6 mb-4">
        <div class="section-title">
            <v-icon size="small" class="mr-2">mdi-counter</v-icon>
            Lecturas del medidor
        </div>
        <p class="section-hint">
            La lectura anterior se completa sola con el mes que guardaste la última vez.
            Solo llena la columna "Actual".
        </p>

        <v-row dense>
            <v-col cols="12" sm="6">
                <v-text-field
                    v-model="input.previousDate"
                    type="date"
                    label="Fecha anterior"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar-start"
                    hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field
                    v-model="input.currentDate"
                    type="date"
                    label="Fecha actual"
                    density="comfortable"
                    variant="outlined"
                    prepend-inner-icon="mdi-calendar-end"
                    hide-details="auto" />
            </v-col>
        </v-row>

        <v-divider class="my-4" />

        <v-row
            v-for="label in meterLabels"
            :key="label"
            align="center"
            dense
            class="meter-row"
            :class="{ 'meter-row--tank': label === 'Tanque' }">
            <v-col cols="12" sm="3">
                <div class="meter-label">
                    {{ label }}
                    <span v-if="label === 'Tanque'" class="meter-label__note">
                        se reparte entre los {{ floorCount }} pisos
                    </span>
                </div>
            </v-col>
            <v-col cols="6" sm="3">
                <v-text-field
                    :model-value="raw[rawKey('previousReadings', label)]"
                    @update:model-value="onReadingInput('previousReadings', label, $event)"
                    label="Anterior"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    hide-details />
            </v-col>
            <v-col cols="6" sm="3">
                <v-text-field
                    :model-value="raw[rawKey('currentReadings', label)]"
                    @update:model-value="onReadingInput('currentReadings', label, $event)"
                    label="Actual"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    :error="hasConsumptionError(label)"
                    hide-details />
            </v-col>
            <v-col cols="12" sm="3">
                <div
                    class="meter-consumption"
                    :class="{ 'meter-consumption--error': hasConsumptionError(label) }">
                    {{ consumptionText(label) }}
                </div>
            </v-col>
        </v-row>

        <!-- Same meter as another lote, split in half, but typed on this lote's month. -->
        <v-row v-if="hasSharedTank" align="center" dense class="meter-row meter-row--tank">
            <v-col cols="12" sm="3">
                <div class="meter-label">
                    Tanque compartido
                    <span class="meter-label__note">
                        el mismo medidor que el {{ sharedWithLabel }}; escríbelo aquí. A este
                        lote le toca la mitad, que luego se divide entre los {{ floorCount }} pisos
                    </span>
                </div>
            </v-col>
            <v-col cols="6" sm="3">
                <v-text-field
                    :model-value="raw[rawKey('sharedTank', 'previousReading')]"
                    @update:model-value="onSharedTankInput('previousReading', $event)"
                    label="Anterior"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    hide-details />
            </v-col>
            <v-col cols="6" sm="3">
                <v-text-field
                    :model-value="raw[rawKey('sharedTank', 'currentReading')]"
                    @update:model-value="onSharedTankInput('currentReading', $event)"
                    label="Actual"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    :error="hasSharedTankError"
                    hide-details />
            </v-col>
            <v-col cols="12" sm="3">
                <div
                    class="meter-consumption"
                    :class="{ 'meter-consumption--error': hasSharedTankError }">
                    {{ sharedTankText }}
                </div>
            </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div class="section-title">
            <v-icon size="small" class="mr-2">mdi-receipt-text-outline</v-icon>
            Datos del recibo
        </div>

        <v-row dense>
            <v-col cols="12" sm="6">
                <v-text-field
                    :model-value="raw[rawKey('energyCharge')]"
                    @update:model-value="onAmountInput('energyCharge', $event)"
                    label="Consumo de energía"
                    prefix="S/"
                    inputmode="decimal"
                    density="comfortable"
                    variant="outlined"
                    hide-details="auto" />
            </v-col>
            <v-col cols="12" sm="6">
                <v-text-field
                    :model-value="raw[rawKey('totalBill')]"
                    @update:model-value="onAmountInput('totalBill', $event)"
                    label="Total del recibo"
                    prefix="S/"
                    inputmode="decimal"
                    density="comfortable"
                    variant="outlined"
                    :hint="fixedChargesHint"
                    persistent-hint
                    hide-details="auto" />
            </v-col>
        </v-row>

        <v-alert
            v-for="(issue, index) in issues"
            :key="index"
            :type="issue.level === 'error' ? 'error' : 'warning'"
            density="compact"
            variant="tonal"
            class="mt-4">
            {{ issue.message }}
        </v-alert>
    </v-card>
</template>

<style scoped>
.section-title {
    display: flex;
    align-items: center;
    font-size: 1.05rem;
    font-weight: 600;
}

.section-hint {
    font-size: 0.8rem;
    opacity: 0.7;
    margin: 0.25rem 0 1rem;
}

.meter-row {
    padding: 0.35rem 0;
}

.meter-row--tank {
    border-top: 1px dashed rgba(255, 255, 255, 0.2);
    margin-top: 0.5rem;
    padding-top: 0.75rem;
}

.meter-label {
    font-weight: 600;
}

.meter-label__note {
    display: block;
    font-size: 0.72rem;
    font-weight: 400;
    opacity: 0.65;
}

.meter-consumption {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    opacity: 0.85;
}

.meter-consumption--error {
    color: rgb(var(--v-theme-error));
}

@media (max-width: 599px) {
    .meter-consumption {
        text-align: left;
        font-size: 0.85rem;
        padding-top: 0.25rem;
    }
}
</style>
