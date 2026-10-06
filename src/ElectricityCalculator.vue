<script lang="ts">
import type { LoteConfig } from './model/Types';
import LoteBCalculator from './views/LoteBCalculator.vue';
import LoteCalculator from './views/LoteCalculator.vue';
import { SPLIT_LOTES } from './model/lotes';

const LOTE_B_ID = 'lote-b';

export default {
    components: {
        LoteBCalculator,
        LoteCalculator,
    },
    data() {
        return {
            loteBId: LOTE_B_ID,
            splitLotes: SPLIT_LOTES as LoteConfig[],
            // Kept in the URL hash so a link can point straight at one lote.
            selectedLote: 'lote-c' as string,
        };
    },
    computed: {
        tabs(): { id: string; label: string }[] {
            return [
                { id: LOTE_B_ID, label: 'Lote B' },
                ...this.splitLotes.map((lote: LoteConfig) => ({ id: lote.id, label: lote.label })),
            ];
        },
    },
    methods: {
        readLoteFromHash() {
            const fromHash = window.location.hash.replace('#', '');
            if (this.tabs.some((tab) => tab.id === fromHash)) {
                this.selectedLote = fromHash;
            }
        },
    },
    watch: {
        selectedLote(lote: string) {
            window.history.replaceState(null, '', `#${lote}`);
        },
    },
    created() {
        this.readLoteFromHash();
    },
    mounted() {
        // Keeps the tab in sync when the link is edited or the back button is used.
        window.addEventListener('hashchange', this.readLoteFromHash);
    },
    unmounted() {
        window.removeEventListener('hashchange', this.readLoteFromHash);
    },
};
</script>

<template>
    <v-app>
        <v-app-bar flat density="comfortable" color="surface">
            <v-app-bar-title class="app-title">
                <v-icon size="small" class="mr-2">mdi-lightning-bolt</v-icon>
                Reparto de luz
            </v-app-bar-title>
        </v-app-bar>

        <v-main>
            <v-container class="pt-4">
                <v-tabs v-model="selectedLote" density="comfortable" class="mb-5" grow>
                    <v-tab v-for="tab in tabs" :key="tab.id" :value="tab.id">
                        {{ tab.label }}
                    </v-tab>
                </v-tabs>

                <!-- v-window, not v-tabs-window: this project is on Vuetify 3.4. -->
                <v-window v-model="selectedLote" :touch="false">
                    <v-window-item :value="loteBId" class="lote-pane">
                        <LoteBCalculator />
                    </v-window-item>
                    <v-window-item
                        v-for="lote in splitLotes"
                        :key="lote.id"
                        :value="lote.id"
                        class="lote-pane">
                        <LoteCalculator :config="lote" />
                    </v-window-item>
                </v-window>
            </v-container>
        </v-main>
    </v-app>
</template>

<style scoped>
.app-title {
    display: flex;
    align-items: center;
    font-weight: 600;
}

/* v-window clips its content by default, which would cut off the longer pane. */
.lote-pane,
:deep(.v-window__container) {
    overflow: visible;
}
</style>
