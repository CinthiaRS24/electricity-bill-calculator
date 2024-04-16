<script>
export default {
  props: {
    desserts: {
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
    headers() {
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
            { title: this.endDate, value: 'start' },
            { title: this.startDate, value: 'end' },
          ],
        },
        {
          title: 'Días', align: 'center',
          children: [
            { title: this.daysUsed(), value: 'difference', align: 'center', },
          ],
        },
        {
          title: 'Kwats x días', align: 'center',
          children: [
            { title: '(entre 30)', value: 'kwats', align: 'center' },
          ],
        },
        {
          title: 'Wats x días', align: 'center',
          children: [
            { title: 'x 1000', value: 'wats', align: 'center' },
          ],
        },
      ];
    }
  },
  methods: {
    daysUsed() {
      const diferenciaEnMilisegundos = new Date(this.endDate) - new Date(this.startDate);
      const diferenciaEnDías = diferenciaEnMilisegundos / (1000 * 60 * 60 * 24);
      console.log('diferenciaEnDías', diferenciaEnDías);
      return diferenciaEnDías;
    }
  }
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
  <v-data-table :headers="headers" :items="desserts" item-key="name" items-per-page="10"></v-data-table>
</template>