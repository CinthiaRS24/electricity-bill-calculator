<script lang="ts">
import type { HeaderItem, TableRowItem } from '../model/Types';

export default {
  props: {
    tableItems: {
      type: Array<TableRowItem>,
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
    differenceDays: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      tank: 500 as Number,
      totalPrice: 0 as Number
    }
  },
  emits: ["changeValueOfTankAndTotalPrice"],
  computed: {
    headers(): HeaderItem[] {
      return [
        {
          title: 'Detalle',
          align: 'center',
          children: [
            { title: 'corresponde a', value: 'title', align: 'center' },
          ],
        },
        {
          title: 'Fecha',
          align: 'center',
          children: [
            { title: this.currentDate, value: 'current', align: 'center' },
            { title: this.prevDate, value: 'prev', align: 'center' },
          ],
        },
        {
          title: 'Diferencia',
          align: 'center',
          children: [
            { title: `Días: ${this.differenceDays}`, value: 'kwattsDiff', align: 'center', },
          ],
        },
        {
          title: 'Kwatts x día',
          align: 'center',
          children: [
            { title: `(entre ${this.differenceDays})`, value: 'kwattsPerDay', align: 'center' },
          ],
        },
        {
          title: 'Watts x día',
          align: 'center',
          children: [
            { title: 'x 1000', value: 'wattsPerDay', align: 'center' },
          ],
        },
      ];
    },
    hasEmptyFields() {
      return this.tableItems.length < 1 || this.tank === 0 || String(this.tank) === '' || this.totalPrice === 0 || String(this.totalPrice) === ''
    }
  },
  methods: {
    getElapsedDays(): number {
      if (!this.currentDate || !this.prevDate) return 0;
      const differenceInMilliseconds = Number(new Date(this.currentDate)) - Number(new Date(this.prevDate));
      const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
      return differenceInDays;
    },
    onCalculateButtonClick() {
      this.$emit('changeValueOfTankAndTotalPrice', { tank: this.tank, totalPrice: this.totalPrice });
    },
  },
}
</script>

<template>
  <v-data-table :headers="headers" :items="tableItems" item-key="name">
    <template #bottom></template>
  </v-data-table>

  <div>
    <v-row class="container-inputs">
      <v-col offset-lg="2" lg="4" md="6" cols="12">
        <v-text-field v-model.number="tank" type="number" label="Tanque (Watts por día)" />
      </v-col>
      <v-col lg="4" md="6" cols="12">
        <v-text-field v-model.number="totalPrice" type="number" label="Monto S/" />
      </v-col>
    </v-row>
    <v-btn @click="onCalculateButtonClick" :disabled="hasEmptyFields" variant="tonal" class="btn-calcular">
      Calcular total a pagar por piso
    </v-btn>
  </div>
</template>

<style scoped>
.container-inputs {
  justify-content: space-around;
  display: flex;
  margin-top: 5%;
}

.btn-calcular {
  margin: auto;
  display: flex;
}
</style>