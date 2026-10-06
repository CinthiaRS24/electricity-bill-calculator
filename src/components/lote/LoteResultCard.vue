<script lang="ts">
import type { PropType } from 'vue';
import type { SplitResult } from '../../model/Types';
import { FLOOR_LABELS } from '../../model/lotes';
import { formatDate, formatKwh, formatSoles } from '../../utils/billSplit';

export default {
    props: {
        result: {
            type: Object as PropType<SplitResult>,
            required: true,
        },
        currentDate: {
            type: String,
            default: '',
        },
        previousDate: {
            type: String,
            default: '',
        },
        title: {
            type: String,
            required: true,
        },
    },
    computed: {
        period(): string {
            const from = formatDate(this.previousDate);
            const to = formatDate(this.currentDate);
            const days = this.result.elapsedDays;

            return days > 0 ? `${from} al ${to} · ${days} días` : `${from} al ${to}`;
        },
        tankLabel(): string {
            if (this.result.tank.source === 'shared') return 'Tanque compartido';
            if (this.result.tank.source === 'estimated') return 'Tanque (estimado)';

            return 'Tanque';
        },
        tankNote(): string {
            const { source, sharedTotal, shareCount } = this.result.tank;
            const splitNote = `se reparte entre los ${this.floorCount} pisos`;

            if (source === 'shared' && sharedTotal !== null) {
                return `${formatKwh(sharedTotal)} kWh ÷ ${shareCount} · ${splitNote}`;
            }

            return splitNote;
        },
        /** Explains where the tank kWh came from, which differs between lotes. */
        tankExplanation(): string {
            const { source, sharedTotal } = this.result.tank;
            const consumption = formatKwh(this.result.tank.consumption);
            const cost = formatSoles(this.result.tank.energyCost);
            const share = formatSoles(this.result.tankShare);
            const tail = `que se divide entre los ${this.floorCount} pisos: ${share} cada uno.`;

            if (source === 'shared') {
                return (
                    `El tanque compartido consumió ${formatKwh(sharedTotal ?? 0)} kWh y a este ` +
                    `lote le corresponde ${consumption} kWh (${cost}), ${tail}`
                );
            }

            if (source === 'estimated') {
                return (
                    `El tanque no tiene medidor: se estimó en ${consumption} kWh para este ` +
                    `periodo (${cost}), ${tail}`
                );
            }

            return `El tanque consumió ${consumption} kWh (${cost}), ${tail}`;
        },
        hasRoundingAdjustment(): boolean {
            return this.result.floors.some((floor) => floor.roundingAdjustment !== 0);
        },
        adjustedFloorNames(): string {
            return this.result.floors
                .filter((floor) => floor.roundingAdjustment !== 0)
                .map((floor) => floor.label)
                .join(', ');
        },
        floorCount(): number {
            return FLOOR_LABELS.length;
        },
    },
    methods: {
        formatSoles,
        formatKwh,
        /** The node captured when exporting the PNG. */
        getExportNode(): HTMLElement {
            return this.$refs.sheet as HTMLElement;
        },
    },
};
</script>

<template>
    <div>
        <!--
          On a phone the detailed sheet has to be scrolled sideways, so the amount
          each floor owes is repeated here, where it can be read right away.
        -->
        <div class="quick-totals d-sm-none">
            <div v-for="floor in result.floors" :key="floor.label" class="quick-totals__row">
                <span>{{ floor.label }}</span>
                <strong>{{ formatSoles(floor.total) }}</strong>
            </div>
            <div class="quick-totals__row quick-totals__row--total">
                <span>Total del recibo</span>
                <strong>{{ formatSoles(result.total) }}</strong>
            </div>
        </div>

        <p class="scroll-hint d-sm-none">Desliza la tabla para ver el detalle →</p>

        <div class="sheet-scroller">
            <div ref="sheet" class="sheet">
                <header class="sheet__header">
                    <div>
                        <h2 class="sheet__title">{{ title }}</h2>
                        <p class="sheet__subtitle">Reparto del recibo de luz</p>
                    </div>
                    <div class="sheet__period">
                        <span class="sheet__period-label">Periodo</span>
                        <strong>{{ period }}</strong>
                    </div>
                </header>

                <section class="summary">
                    <div class="summary__item">
                        <span>Consumo total</span>
                        <strong>{{ formatKwh(result.totalConsumption) }} kWh</strong>
                    </div>
                    <div class="summary__item">
                        <span>Consumo de energía</span>
                        <strong>{{ formatSoles(result.totalConsumption * result.constant) }}</strong>
                    </div>
                    <div class="summary__item">
                        <span>Precio del kWh (k)</span>
                        <strong>{{ result.constant.toFixed(6) }}</strong>
                    </div>
                    <div class="summary__item">
                        <span>Cargo fijo y otros</span>
                        <strong>{{ formatSoles(result.fixedCharges) }}</strong>
                    </div>
                </section>

                <table class="detail">
                    <thead>
                        <tr>
                            <th class="detail__floor">Piso</th>
                            <th>Consumo<br />(kWh)</th>
                            <th>Consumo<br />de luz</th>
                            <th>Reparto<br />del tanque</th>
                            <th>Cargo fijo<br />y otros</th>
                            <th class="detail__total">Total de luz</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="floor in result.floors" :key="floor.label">
                            <td class="detail__floor">{{ floor.label }}</td>
                            <td>{{ formatKwh(floor.consumption) }}</td>
                            <td>{{ formatSoles(floor.energyCost) }}</td>
                            <td>{{ formatSoles(floor.tankShare) }}</td>
                            <td>{{ formatSoles(floor.fixedShare) }}</td>
                            <td class="detail__total">{{ formatSoles(floor.total) }}</td>
                        </tr>
                        <tr class="detail__tank">
                            <td class="detail__floor">{{ tankLabel }}</td>
                            <td>{{ formatKwh(result.tank.consumption) }}</td>
                            <td>{{ formatSoles(result.tank.energyCost) }}</td>
                            <td colspan="3">{{ tankNote }}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5">Total del recibo</td>
                            <td class="detail__total">{{ formatSoles(result.total) }}</td>
                        </tr>
                    </tfoot>
                </table>

                <footer class="notes">
                    <p>{{ tankExplanation }}</p>
                    <p>
                        El cargo fijo y otros conceptos del recibo
                        ({{ formatSoles(result.fixedCharges) }}) se divide entre los
                        {{ floorCount }} pisos: {{ formatSoles(result.fixedShare) }} cada uno.
                    </p>
                    <p v-if="hasRoundingAdjustment">
                        Se ajustó un céntimo en {{ adjustedFloorNames }} para que la suma de
                        los pisos coincida exactamente con el total del recibo.
                    </p>
                </footer>
            </div>
        </div>
    </div>
</template>

<style scoped>
.quick-totals {
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 0.75rem;
}

.quick-totals__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.55rem 0.85rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.quick-totals__row:last-child {
    border-bottom: none;
}

.quick-totals__row strong {
    font-size: 1.05rem;
    font-variant-numeric: tabular-nums;
}

.quick-totals__row--total {
    background: rgba(76, 175, 80, 0.16);
}

.scroll-hint {
    font-size: 0.72rem;
    opacity: 0.6;
    margin: 0 0 0.4rem;
}

/*
 * The sheet keeps a fixed minimum width and light "paper" colours so the exported
 * PNG always looks the same no matter the device it was generated from.
 */
.sheet-scroller {
    overflow-x: auto;
}

.sheet {
    min-width: 660px;
    background: #ffffff;
    color: #1f2430;
    padding: 24px;
    border-radius: 12px;
    font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
}

.sheet__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 16px;
    border-bottom: 3px solid #f0a30a;
    padding-bottom: 12px;
}

.sheet__title {
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    margin: 0;
}

.sheet__subtitle {
    font-size: 0.85rem;
    color: #6b7280;
    margin: 2px 0 0;
}

.sheet__period {
    text-align: right;
    font-size: 0.85rem;
}

.sheet__period-label {
    display: block;
    color: #6b7280;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.summary {
    display: flex;
    gap: 10px;
    margin: 16px 0;
}

.summary__item {
    flex: 1;
    background: #fdf6e3;
    border: 1px solid #f3dfae;
    border-radius: 8px;
    padding: 8px 10px;
}

.summary__item span {
    display: block;
    font-size: 0.7rem;
    color: #8a6d1f;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.summary__item strong {
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
}

.detail {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
}

.detail th,
.detail td {
    border: 1px solid #e2e5ea;
    padding: 7px 9px;
    text-align: right;
}

.detail thead th {
    background: #ffc000;
    color: #4a3700;
    font-size: 0.72rem;
    line-height: 1.25;
    text-align: center;
    font-weight: 700;
}

.detail__floor {
    text-align: left !important;
    font-weight: 600;
}

.detail thead .detail__total {
    background: #f0a30a;
}

.detail tbody .detail__total {
    background: #e7f3e0;
    font-weight: 700;
    color: #1f4312;
}

.detail__tank {
    background: #f4f5f7;
    color: #6b7280;
}

.detail__tank td[colspan] {
    text-align: center;
    font-style: italic;
    font-size: 0.78rem;
}

.detail tfoot td {
    background: #1f2430;
    color: #ffffff;
    font-weight: 700;
    text-align: right;
}

.detail tfoot .detail__total {
    background: #16301a;
    color: #b7e4a0;
    font-size: 0.95rem;
}

.notes {
    margin-top: 14px;
    font-size: 0.74rem;
    color: #6b7280;
    line-height: 1.5;
}

.notes p {
    margin: 0 0 4px;
}
</style>
