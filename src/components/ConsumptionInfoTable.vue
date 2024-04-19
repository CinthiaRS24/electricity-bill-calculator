<script lang="ts">
import type { HeaderItem } from '../model/Types';

export default {
  props: {
    calculatedData: {
      type: Array, // Tipo de datos esperados
      required: true // Si es obligatorio o no
    },
    startDate: {
      type: String, // Tipo de datos esperados
      required: true // Si es obligatorio o no
    },
    endDate: {
      type: String, // Tipo de datos esperados
      required: true // Si es obligatorio o no
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
            { title: String(this.daysUsed()), value: 'difference', align: 'center', },
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
    }
  },
  methods: {
    daysUsed() {
      const differenceInMilliseconds = Number(new Date(this.endDate)) - Number(new Date(this.startDate));
      const differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
      return differenceInDays;
    },
  },
  // data: () => ({
  //   headers: [
  //     {
  //       title: 'Detalle', align: 'center',
  //       children: [
  //         { title: 'corresponde a', value: 'title', align: 'center', },
  //       ],
  //     },
  //     {
  //       title: 'Fecha',
  //       align: 'center',
  //       children: [
  //         { title: this.startDate, value: 'start' },
  //         { title: 'fin', value: 'end' },
  //       ],
  //     },
  //     {
  //       title: 'Días', align: 'center',
  //       children: [
  //         { title: '30', value: 'difference', align: 'center', },
  //       ],
  //     },
  //     {
  //       title: 'Kwats x días', align: 'center',
  //       children: [
  //         { title: '(entre 30)', value: 'kwats', align: 'center' },
  //       ],
  //     },
  //     {
  //       title: 'Wats x días', align: 'center',
  //       children: [
  //         { title: 'x 1000', value: 'wats', align: 'center' },
  //       ],
  //     },
  //   ],
  // }),
}
</script>

<template>
  <v-data-table :headers="headers" :items="calculatedData" item-key="name" items-per-page="10" />
</template>