<script lang="ts">
import type { PropType } from 'vue';
import type { LoteBAmounts, LoteBConsumptions } from '../utils/loteB';
import { LOTE_B_FIRST_FLOOR_LABEL, LOTE_B_TANK_LABEL, tankConsumptionFrom } from '../utils/loteB';
import { formatKwh, formatSoles } from '../utils/billSplit';
import { parseDecimalInput } from '../utils/utilityMethods';

type AmountField = keyof LoteBAmounts;

interface TableRow {
  title: string;
  previousReading: string;
  currentReading: string;
  consumption: string;
  deduced: boolean;
}

export default {
  props: {
    consumptions: {
      type: Object as PropType<LoteBConsumptions | null>,
      default: null
    },
    /** Owned by the parent view; written in place so the result follows the typing. */
    amounts: {
      type: Object as PropType<Partial<LoteBAmounts>>,
      required: true
    },
    prevDate: {
      type: String,
      required: true
    },
    currentDate: {
      type: String,
      required: true
    },
    /** Bumped by the parent after loading or clearing, to rebuild the shown text. */
    syncToken: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      // What the user literally typed, so a half written "127." is not rewritten.
      raw: {} as Record<string, string>
    }
  },
  computed: {
    elapsedDays(): number {
      return this.consumptions?.elapsedDays ?? 0;
    },
    rows(): TableRow[] {
      if (!this.consumptions) return [];

      const { building, meteredFloors, firstFloorPlusTank } = this.consumptions;
      const asRow = (
        title: string,
        consumption: number,
        readings?: { previousReading: number; currentReading: number }
      ): TableRow => ({
        title,
        previousReading: readings ? readings.previousReading.toFixed(2) : '',
        currentReading: readings ? readings.currentReading.toFixed(2) : '',
        consumption: formatKwh(consumption),
        deduced: !readings
      });

      return [
        asRow(building.label, building.consumption, building),
        ...meteredFloors.map((floor) => asRow(floor.label, floor.consumption, floor)),
        asRow(`${LOTE_B_FIRST_FLOOR_LABEL} + ${LOTE_B_TANK_LABEL}`, firstFloorPlusTank)
      ];
    },
    /** kWh the typed estimate adds up to over the period, shown as a sanity check. */
    tankHint(): string {
      const watts = this.amounts.tankWattsPerDay;
      if (typeof watts !== 'number' || this.elapsedDays <= 0) return '';

      return `= ${formatKwh(tankConsumptionFrom(watts, this.elapsedDays))} kWh en ${this.elapsedDays} días`;
    },
    fixedChargesHint(): string {
      const { energyCharge, totalBill } = this.amounts;
      if (typeof energyCharge !== 'number' || typeof totalBill !== 'number') return '';

      return `Cargo fijo y otros: ${formatSoles(totalBill - energyCharge)}`;
    }
  },
  methods: {
    syncRawFromAmounts() {
      const asText = (value: number | undefined) =>
        typeof value === 'number' && value !== 0 ? String(value) : '';

      this.raw = {
        tankWattsPerDay: asText(this.amounts.tankWattsPerDay),
        energyCharge: asText(this.amounts.energyCharge),
        totalBill: asText(this.amounts.totalBill)
      };
    },
    onAmountInput(field: AmountField, value: string) {
      this.raw[field] = value;
      const parsed = parseDecimalInput(value);

      if (parsed === null) {
        delete this.amounts[field];
      } else {
        this.amounts[field] = parsed;
      }
    }
  },
  watch: {
    syncToken: {
      handler: 'syncRawFromAmounts',
      immediate: true
    }
  }
}
</script>

<template>
  <v-card class="pa-4 pa-sm-6 mb-4">
    <div class="section-title">
      <v-icon size="small" class="mr-2">mdi-counter</v-icon>
      Consumo del periodo
    </div>

    <v-table v-if="rows.length > 0" density="comfortable" class="mt-2">
      <thead>
        <tr>
          <th>Corresponde a</th>
          <th class="text-right">{{ prevDate }}</th>
          <th class="text-right">{{ currentDate }}</th>
          <th class="text-right">Consumo ({{ elapsedDays }} días)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.title" :class="{ 'row--deduced': row.deduced }">
          <td>{{ row.title }}</td>
          <td class="text-right">{{ row.previousReading }}</td>
          <td class="text-right">{{ row.currentReading }}</td>
          <td class="text-right font-weight-bold">{{ row.consumption }} kWh</td>
        </tr>
      </tbody>
    </v-table>

    <v-alert v-else density="compact" variant="tonal" class="text-center mt-2">
      Llena las fechas y las lecturas de los dos recibos para continuar.
    </v-alert>

    <v-divider class="my-4" />

    <div class="section-title">
      <v-icon size="small" class="mr-2">mdi-receipt-text-outline</v-icon>
      Datos del recibo
    </div>
    <p class="section-hint">
      Para separar el 1er piso del tanque hace falta estimar cuánto consume la bomba.
    </p>

    <v-row dense>
      <v-col cols="12" md="4">
        <v-text-field
          :model-value="raw.tankWattsPerDay"
          @update:model-value="onAmountInput('tankWattsPerDay', $event)"
          label="Tanque (watts por día)"
          inputmode="decimal"
          density="comfortable"
          variant="outlined"
          :hint="tankHint"
          persistent-hint
          hide-details="auto" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          :model-value="raw.energyCharge"
          @update:model-value="onAmountInput('energyCharge', $event)"
          label="Consumo de energía"
          prefix="S/"
          inputmode="decimal"
          density="comfortable"
          variant="outlined"
          hide-details="auto" />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          :model-value="raw.totalBill"
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

.row--deduced {
  font-style: italic;
  opacity: 0.85;
}
</style>
