# Reparto de luz (electricity-bill-calculator)

Reparte el recibo de luz entre los pisos de los minidepas. Hay una pestaña por lote
(B, C, E e I) porque los medidores están instalados de forma distinta en cada uno.

## El reparto, que es igual en los cuatro lotes

Los cuatro lotes reparten la plata exactamente igual, con la misma función
(`splitBill` en `src/utils/billSplit.ts`). Una vez que se sabe cuántos kWh usó cada
piso y el tanque:

1. **Constante `k`** = consumo de energía del recibo (S/) ÷ suma de los kWh de los cinco
   pisos más el tanque. Es el precio del kWh en ese periodo.
2. **Consumo de luz de cada piso** = sus kWh × `k`.
3. **Reparto del tanque** = (kWh del tanque × `k`) ÷ 5, igual para cada piso.
4. **Cargo fijo y otros** = (total del recibo − consumo de energía) ÷ 5, igual para cada piso.
5. **Total de cada piso** = los tres conceptos sumados.

O sea: la energía se cobra según lo que cada uno gastó, mientras que el tanque y el
cargo fijo del recibo se dividen en cinco partes iguales.

Los importes se calculan con todos los decimales y se cobran con dos, así que el
redondeo puede dejar uno o dos céntimos sueltos. Esos céntimos se asignan a los pisos
que más perdieron al redondear, de modo que lo que pagan los cinco pisos **siempre suma
exactamente el total del recibo**. Cuando pasa, el cuadro lo indica en una nota.

## En qué se diferencia cada lote

Lo único que cambia entre lotes es de dónde salen esos kWh:

| Lote | Pisos | Tanque |
| --- | --- | --- |
| B | Medidor en los pisos 2 al 5; el 1ro se deduce por resta | Sin medidor: se estima en watts por día |
| C — Minidepas | Medidor en los cinco | Medidor propio |
| E — Depas Villa García | Medidor en los cinco | Mitad del medidor compartido con el lote I |
| I — Cuartos Villa García | Medidor en los cinco | Mitad del mismo medidor compartido |

### Lotes C, E e I

Cada piso tiene su propio medidor, así que nada se deduce por resta y el consumo es
simplemente lectura actual − lectura anterior. En E e I el tanque es la mitad de lo que
marcó el medidor compartido. Las fechas son solo una referencia del periodo: **no entran
en el cálculo**.

### Lote B

Hay un medidor general del edificio y medidores en los pisos 2 al 5. Ni el primer piso ni
el tanque tienen medidor, así que:

- **1er piso + tanque** = medidor del edificio − los cuatro pisos medidos.
- **Tanque** = los watts por día que se estiman a mano, multiplicados por los días del
  periodo. Se estima como tasa diaria porque una bomba consume más o menos lo mismo cada
  día, independientemente de lo que dure el recibo.
- **1er piso** = lo que queda después de restarle el tanque.

Las fechas se usan **solo** para esa conversión del tanque; no influyen en el reparto.
Como el primer piso se obtiene por resta, absorbe todo lo que no está medido: zonas
comunes, imprecisiones de los medidores y cualquier error en la estimación del tanque. Si
el tanque estimado sale mayor que lo disponible, la app avisa en vez de mostrar un
consumo negativo.

### Lo que hace la app por ti

Los cuatro lotes funcionan igual:

- Las lecturas anteriores se completan solas con el último mes guardado, y **Nuevo mes**
  pasa la columna "Actual" a "Anterior" dejando la actual en blanco, que es lo que antes
  se hacía copiando celdas a mano.
- **Guardar mes** deja el mes en Firestore, con las lecturas y los montos del recibo,
  para que el siguiente arranque precargado. **Recargar guardado** y **Limpiar**
  deshacen lo que estés escribiendo.
- El cuadro se recalcula mientras escribes, sin botón de calcular.
- Avisa si una lectura actual es menor que la anterior, si el consumo de energía supera
  el total del recibo o si las fechas están al revés. Mientras haya un error el cuadro
  no se muestra, para no mandar un reparto equivocado.
- El resultado se puede **descargar como PNG**, **compartir** directo al WhatsApp desde
  el celular, o **copiar como texto**. Es el mismo cuadro para todos
  (`src/components/lote/LoteSheet.vue`).
- En el celular los totales de cada piso salen arriba del cuadro, para no tener que
  desplazarse de lado.
- Acepta coma o punto como separador decimal.

Lo propio de cada lote:

- En **E e I** el tanque compartido se escribe una sola vez: aparece al instante en la
  otra pestaña, sin necesidad de guardar.
- En **B**, escribir una fecha que ya se calculó antes trae sus lecturas de vuelta (hay
  meses guardados desde 2024). Y debajo del cuadro está **Ver el detalle del cálculo**
  con los pasos intermedios: la deducción del primer piso y la constante.

### Dónde se guarda

Todo en Firestore. Los lotes C, E e I usan colecciones propias, para no mezclarse con
los datos antiguos del lote C que tenían la forma del lote B
(`src/utils/billSplitRepository.ts`):

- `{LOTE} RECIBOS/{DDMMYYYY}` — un documento por mes calculado.
- `{LOTE} STATE/ultimo` — el último par de meses, que es lo que precarga el formulario.
- `TANQUE COMPARTIDO/villa-garcia` — las lecturas del tanque que dividen E e I.

El lote B conserva las colecciones que viene usando desde 2024, para no perder su
historia ni la búsqueda por fecha (`src/utils/loteBRepository.ts`):

- `LOTE B/{DDMMYYYY}` — un documento por mes, con las lecturas de los cuatro pisos
  medidos y el medidor general. Al mes actual se le guardan además los montos del
  recibo, que antes había que escribir cada vez.
- `LAST BILL/LOTE B` — el último par de meses más sus montos.

Los meses guardados antes de este cambio solo tienen lecturas; al abrirlos, los montos
salen vacíos y el tanque vuelve a su valor por defecto de 500 W/día.

### Agregar otro lote

En `src/model/lotes.ts` se añade una entrada a `SPLIT_LOTES` con su nombre, el título
que saldrá en la imagen y el prefijo de sus colecciones. Si comparte el tanque con
otro lote, se agrega también el grupo en `TANK_GROUPS` y se apunta a él con
`tankGroupId`; el consumo se divide entre la cantidad de lotes del grupo. No hace falta
tocar el cálculo ni las pantallas.

## Comandos

```sh
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo
npm run build      # compilar para producción
npm run lint       # revisar estilo de código
npm run verify     # comprobar los cálculos contra los meses hechos a mano
```

`verify` compara el motor con los meses que se calcularon en los sheets (20/07/2026 al
22/08/2026) de los lotes C, E e I celda por celda, comprueba las deducciones del lote B,
y además prueba cientos de miles de recibos inventados en los cuatro lotes para
confirmar que el reparto nunca descuadra con el total.

## Abrirlo desde el celular

La app está en [electricity-bill-calculator-pi.vercel.app](https://electricity-bill-calculator-pi.vercel.app).
Se abre desde la PC y el celular, sin dejar el servidor encendido. El enlace acepta
`#lote-b`, `#lote-c`, `#lote-e` o `#lote-i` al final para entrar directo a una pestaña.

Al subir cambios a `master` en GitHub, Vercel vuelve a publicar solo.

Para desarrollarla en local, `npm run dev -- --host` la expone en la red y muestra
una dirección tipo `http://192.168.x.x:5173`.

## Notas de desarrollo

El proyecto usa Vue 3 con la Options API, Vuetify 3.4 y TypeScript. Ojo que en Vuetify
3.4 todavía no existe `v-tabs-window`; para las pestañas se usa `v-window`.

Editor recomendado: [VSCode](https://code.visualstudio.com/) con
[Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (desactivando Vetur)
y el [TypeScript Vue Plugin](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).
