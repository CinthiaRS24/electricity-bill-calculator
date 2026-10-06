<script lang="ts">
import type { PropType } from 'vue';
import type { InfoData } from "../model/Types";
import '@mdi/font/css/materialdesignicons.css';
import { parseDecimalInput } from '../utils/utilityMethods';

export default {
    props: {
        floorLabels: {
            type: Array as PropType<string[]>,
            required: true
        },
        /**
         * Owned by the parent view: [current bill, previous bill]. Nested properties are
         * written in place, which is what keeps the calculation reacting while typing.
         */
        info: {
            type: Array as PropType<InfoData[]>,
            required: true
        },
        /**
         * The parent bumps this after loading or clearing data so the text shown in the
         * fields is rebuilt from `info` instead of from what was typed.
         */
        syncToken: {
            type: Number,
            default: 0
        }
    },
    emits: ['pickDate'],
    data() {
        return {
            // What the user literally typed, so a half written "1558." is not rewritten.
            raw: {} as Record<string, string>,
        }
    },
    methods: {
        rawKey(index: number, field: string): string {
            return `${index}|${field}`;
        },
        syncRawFromInfo() {
            const raw: Record<string, string> = {};
            const asText = (value: number) => (value === 0 ? '' : String(value));

            this.info.forEach((bill: InfoData, index: number) => {
                raw[this.rawKey(index, 'buildingConsumption')] = asText(bill.buildingConsumption);
                this.floorLabels.forEach((label: string, floorIndex: number) => {
                    raw[this.rawKey(index, label)] = asText(bill.floors[floorIndex] ?? 0);
                });
            });

            this.raw = raw;
        },
        onBuildingInput(index: number, value: string) {
            this.raw[this.rawKey(index, 'buildingConsumption')] = value;
            this.info[index].buildingConsumption = parseDecimalInput(value) ?? 0;
        },
        onFloorInput(index: number, floorIndex: number, value: string) {
            this.raw[this.rawKey(index, this.floorLabels[floorIndex])] = value;
            this.info[index].floors[floorIndex] = parseDecimalInput(value) ?? 0;
        },
        consumptionText(label: string, floorIndex: number): string {
            const [current, previous] = this.info;
            if (!current || !previous) return '—';

            const read = (bill: InfoData) =>
                label === 'buildingConsumption' ? bill.buildingConsumption : bill.floors[floorIndex];

            return `${(read(current) - read(previous)).toFixed(2)} kWh`;
        },
        hasConsumptionError(label: string, floorIndex: number): boolean {
            const [current, previous] = this.info;
            if (!current || !previous) return false;

            const read = (bill: InfoData) =>
                label === 'buildingConsumption' ? bill.buildingConsumption : bill.floors[floorIndex];

            return read(current) > 0 && read(previous) > 0 && read(current) < read(previous);
        },
    },
    watch: {
        syncToken: {
            handler: 'syncRawFromInfo',
            immediate: true,
        },
    },
}
</script>

<template>
    <v-card class="pa-4 pa-sm-6 mb-4">
        <div class="section-title">
            <v-icon size="small" class="mr-2">mdi-counter</v-icon>
            Lecturas del medidor
        </div>
        <p class="section-hint">
            La lectura anterior se completa sola con el mes que guardaste la última vez.
            Solo llena la columna "Actual". Si escribes una fecha que ya calculaste antes,
            sus lecturas vuelven solas.
        </p>

        <v-row dense>
            <v-col v-for="(bill, index) in info" :key="index" cols="12" sm="6">
                <v-text-field
                    v-model="bill.date"
                    @update:model-value="$emit('pickDate', index)"
                    type="date"
                    :label="index === 0 ? 'Fecha actual' : 'Fecha anterior'"
                    density="comfortable"
                    variant="outlined"
                    :prepend-inner-icon="index === 0 ? 'mdi-calendar-end' : 'mdi-calendar-start'"
                    hide-details="auto" />
            </v-col>
        </v-row>

        <v-divider class="my-4" />

        <v-row align="center" dense class="meter-row">
            <v-col cols="12" sm="3">
                <div class="meter-label">
                    Consumo total
                    <span class="meter-label__note">medidor general del edificio</span>
                </div>
            </v-col>
            <v-col cols="6" sm="3">
                <v-text-field
                    :model-value="raw[rawKey(1, 'buildingConsumption')]"
                    @update:model-value="onBuildingInput(1, $event)"
                    label="Anterior"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    hide-details />
            </v-col>
            <v-col cols="6" sm="3">
                <v-text-field
                    :model-value="raw[rawKey(0, 'buildingConsumption')]"
                    @update:model-value="onBuildingInput(0, $event)"
                    label="Actual"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    :error="hasConsumptionError('buildingConsumption', 0)"
                    hide-details />
            </v-col>
            <v-col cols="12" sm="3">
                <div
                    class="meter-consumption"
                    :class="{ 'meter-consumption--error': hasConsumptionError('buildingConsumption', 0) }">
                    {{ consumptionText('buildingConsumption', 0) }}
                </div>
            </v-col>
        </v-row>

        <v-row
            v-for="(label, floorIndex) in floorLabels"
            :key="label"
            align="center"
            dense
            class="meter-row">
            <v-col cols="12" sm="3">
                <div class="meter-label">{{ label }}</div>
            </v-col>
            <v-col cols="6" sm="3">
                <v-text-field
                    :model-value="raw[rawKey(1, label)]"
                    @update:model-value="onFloorInput(1, floorIndex, $event)"
                    label="Anterior"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    hide-details />
            </v-col>
            <v-col cols="6" sm="3">
                <v-text-field
                    :model-value="raw[rawKey(0, label)]"
                    @update:model-value="onFloorInput(0, floorIndex, $event)"
                    label="Actual"
                    inputmode="decimal"
                    density="compact"
                    variant="outlined"
                    :error="hasConsumptionError(label, floorIndex)"
                    hide-details />
            </v-col>
            <v-col cols="12" sm="3">
                <div
                    class="meter-consumption"
                    :class="{ 'meter-consumption--error': hasConsumptionError(label, floorIndex) }">
                    {{ consumptionText(label, floorIndex) }}
                </div>
            </v-col>
        </v-row>

        <p class="section-hint mt-4 mb-0">
            El 1er piso y el tanque no tienen medidor, así que no se escriben: lo que
            consumen juntos es lo que sobra del medidor general.
        </p>
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
