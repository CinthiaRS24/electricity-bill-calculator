<script lang="ts">
import type { HeaderItem } from '../model/Types';

export default {
  props: {
    wattsPerDayData: {
      type: Array,
      required: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      tank: 0 as Number,
      totalPrice: 0 as Number
    }
  },
  computed: {
    headers(): HeaderItem[] {
      return [
        {
          title: 'Detalle', align: 'center',
          children: [
            { title: 'corresponde a', value: 'title', align: 'center', },
          ],
        },
        {
          title: 'Fecha',
          align: 'center',
          children: [
            { title: this.endDate, value: 'start', align: 'center' },
            { title: this.startDate, value: 'end', align: 'center' },
          ],
        },
        {
          title: 'Días', align: 'center',
          children: [
            { title: String(this.getElapsedDays()), value: 'difference', align: 'center', },
          ],
        },
        {
          title: 'Kwatts x días', align: 'center',
          children: [
            { title: '(entre 30)', value: 'kwatts', align: 'center' },
          ],
        },
        {
          title: 'Watts x días', align: 'center',
          children: [
            { title: 'x 1000', value: 'watts', align: 'center' },
          ],
        },
      ];
    },
    hasEmptyFields() {
      return this.wattsPerDayData.length < 1 || this.tank === 0 || String(this.tank) === '' || this.totalPrice === 0 || String(this.totalPrice) === ''
    }
  },
  methods: {
    getElapsedDays() {
      const differenceInMilliseconds = Number(new Date(this.endDate)) - Number(new Date(this.startDate));
      const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
      return differenceInDays;
    },
    onCalculateButtonClick() {
      this.$emit('secondCalculated', { tank: this.tank, totalPrice: this.totalPrice });
    },
  },
}
</script>

<template>
  <v-data-table :headers="headers" :items="wattsPerDayData" item-key="name" items-per-page="10" />
  <div>
    <v-row class="container-inputs">
      <v-col cols="4">
        <v-text-field v-model.number="tank" type="number" label="Tanque (Watts por día)" />
      </v-col>
      <v-col cols="4">
        <v-text-field v-model.number="totalPrice" type="number" label="Monto S/" />
      </v-col>
    </v-row>
    <v-btn @click="onCalculateButtonClick" :disabled="hasEmptyFields" variant="tonal" class="btn-calcular">
      Calcular
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