<script lang="ts">
export default {
    data() {
        return {
            hola: 25/11/2023,
            number: 0
        }
    },
    methods: {

    },
}

</script>

<template>
    <div class="text-center">
        <select v-model="selected">
            <option disabled value="">Please select one</option>
            <option>LOTE B</option>
            <option>LOTE C</option>
        </select>
    </div>
    <div class="info">
        <div class="info-current">
            <div class="date">
                <p>Date:</p>
                <input type="date" v-model="hola" />
            </div>
            <div class="date">
                <p>Suma:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>5to piso:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>4to piso:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>3er piso:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>2do piso:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>1er piso:</p>
                <input v-model="number" />
            </div>
        </div>
        <div class="info-last">
            <div class="date">
                <p>Date:</p>
                <input type="date" v-model="hola" />
            </div>
            <div class="date">
                <p>Suma:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>5to piso:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>4to piso:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>3er piso:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>2do piso:</p>
                <input v-model="number" />
            </div>
            <div class="date">
                <p>1er piso:</p>
                <input v-model="number" />
            </div>
        </div>
    </div>
    <div class="div-final">
        <div>
            Monto a pagar: <input v-model="number" />
        </div>
        <button>Calcular</button>
    </div>
</template>

<style scoped>
.text-center {
  text-align: center;
  margin: auto;
}

.info {
    display: flex;
    flex-direction: row;
}

.info-current {
    width: 50%;
    text-align: center;
}

.info-last {
    width: 50%;
    text-align: center;
}

.date {
   display: flex;
   justify-content: center;
}

.div-final {
    text-align: center;
}
</style>