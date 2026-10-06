<script lang="ts">
import type { PropType } from 'vue';
import type { SplitResult } from '../../model/Types';
import LoteResultCard from './LoteResultCard.vue';
import { formatDate, formatSoles } from '../../utils/billSplit';
import { canSharePng, downloadBlob, nodeToPngBlob, sharePng } from '../../utils/exportImage';

/**
 * The result of any lote, ready to be sent to the tenants: the printable sheet plus the
 * buttons that get it out of the app. Extra buttons can be added through the `actions`
 * slot so every lote keeps its own, like "Guardar mes".
 */
export default {
    components: {
        LoteResultCard,
    },
    props: {
        result: {
            type: Object as PropType<SplitResult>,
            required: true,
        },
        title: {
            type: String,
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
        /** Used to name the downloaded file, usually the lote id. */
        slug: {
            type: String,
            required: true,
        },
    },
    emits: ['notify'],
    data() {
        return {
            exporting: false,
        };
    },
    computed: {
        canShare(): boolean {
            return canSharePng();
        },
        fileName(): string {
            return `luz-${this.slug}-${this.currentDate || 'mes'}.png`;
        },
    },
    methods: {
        async exportImage(mode: 'download' | 'share') {
            this.exporting = true;
            try {
                const card = this.$refs.resultCard as InstanceType<typeof LoteResultCard>;
                const blob = await nodeToPngBlob(card.getExportNode());

                if (mode === 'share' && (await sharePng(blob, this.fileName, 'Reparto de luz'))) {
                    return;
                }

                downloadBlob(blob, this.fileName);
                this.$emit('notify', 'Imagen descargada.');
            } catch (error) {
                console.error('Error al generar la imagen:', error);
                this.$emit('notify', 'No se pudo generar la imagen.', 'error');
            } finally {
                this.exporting = false;
            }
        },
        async copySummary() {
            const lines = [
                this.title,
                `Luz del ${formatDate(this.previousDate)} al ${formatDate(this.currentDate)}`,
                '',
                ...this.result.floors.map((floor) => `${floor.label}: ${formatSoles(floor.total)}`),
                '',
                `Total: ${formatSoles(this.result.total)}`,
            ];

            try {
                await navigator.clipboard.writeText(lines.join('\n'));
                this.$emit('notify', 'Resumen copiado, ya lo puedes pegar en WhatsApp.');
            } catch (error) {
                console.error('Error al copiar el resumen:', error);
                this.$emit('notify', 'No se pudo copiar el resumen.', 'error');
            }
        },
    },
};
</script>

<template>
    <v-card class="pa-4 pa-sm-6">
        <LoteResultCard
            ref="resultCard"
            :result="result"
            :title="title"
            :current-date="currentDate"
            :previous-date="previousDate" />

        <div class="actions mt-5">
            <v-btn
                v-if="canShare"
                variant="flat"
                color="primary"
                prepend-icon="mdi-share-variant"
                :loading="exporting"
                @click="exportImage('share')">
                Compartir imagen
            </v-btn>
            <v-btn
                variant="tonal"
                prepend-icon="mdi-image-outline"
                :loading="exporting"
                @click="exportImage('download')">
                Descargar PNG
            </v-btn>
            <v-btn variant="tonal" prepend-icon="mdi-content-copy" @click="copySummary">
                Copiar resumen
            </v-btn>
            <slot name="actions" />
        </div>
    </v-card>
</template>

<style scoped>
.actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
</style>
