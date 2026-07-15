<template>
    <section class="page-shell">
        <div class="page-panel container">
            <div class="page-header">
                <h1 class="section-title !text-2xl sm:!text-3xl">
                    {{ title }}
                </h1>
                <div class="section-accent !w-20"></div>
            </div>

            <div v-if="loaded" class="m-auto w-full">
                <div class="page-table-wrap overflow-hidden">
                <v-data-table
                    height="400"
                    :headers="headers"
                    :items="documents"
                    :items-per-page="-1"
                >
                    <template v-slot:item.date="{ item }">
                        {{ formatTime(item.date) }}
                    </template>

                    <template v-slot:item.open="{ item }">
                        <router-link :to="`/document/${item.doc_id}`">
                            <i class="pi pi-book icon_size"></i>
                        </router-link>
                    </template>

                    <template v-slot:item.edit="{ item }" v-if="admin">
                        <router-link :to="`/admin/document/${item.id}`">
                            <i class="pi pi-cloud-upload icon_size"></i>
                        </router-link>
                    </template>

                    <template #bottom />
                </v-data-table>
                </div>

                <button v-if="admin" @click="handleCreateDocument" class="glass-btn mt-5 px-6 py-2.5 text-white font-medium rounded-full">
                    {{ $t("add_new_document_in_that_category") }}
                </button>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useLoadingStore } from "@/stores/loading";
import { Databases } from "appwrite";
import { appw, config } from "@/appwrite";
import {
    formatTime,
    getLocalizedCategoryName,
    loadDocumentsForCategory,
    createNewDocument,
    type DocumentItem
} from "@/utils/documentUtils";

const db = new Databases(appw);

export default defineComponent({
    name: "DocumentLister",
    setup() {
        const route = useRoute();
        const router = useRouter();
        const { t } = useI18n();
        const loadingStore = useLoadingStore();

        const title = ref("");
        const documents = ref<DocumentItem[]>([]);
        const headers = ref<any[]>([]);
        const admin = ref(loadingStore.userLoggedin && (loadingStore.userRole === 'admin' || loadingStore.userRole === 'editor'));
        const loaded = ref(false);

        const loadDocuments = async () => {
            try {
                documents.value = [];

                const categoryId = route.params.id as string || route.params.category as string;
                const category = await db.getDocument(
                    config.website_db,
                    config.document_categories_db,
                    categoryId
                );

                title.value = getLocalizedCategoryName(category);
                documents.value = await loadDocumentsForCategory(categoryId);
                loaded.value = true;
            } catch (error) {
                console.error('Error loading documents:', error);
                loaded.value = true;
            }
        };

        const handleCreateDocument = async () => {
            try {
                const categoryId = route.params.id as string || route.params.category as string;
                const newDoc = await createNewDocument(categoryId);
                router.push(`/admin/document/${newDoc.$id}`);
            } catch (error) {
                console.error('Error creating document:', error);
            }
        };

        onMounted(() => {
            headers.value = [
                { title: t("name"), align: "start", sortable: false, key: "name", width: "200px" },
                { title: t("date"), align: "start", key: "date", width: "300px" },
                { title: t("open_document"), align: "start", key: "open", width: "100px" },
            ];

            if (admin.value) {
                headers.value.push({
                    title: t("edit_document"),
                    align: "start",
                    key: "edit",
                    width: "100px"
                });
            }

            loadDocuments();
        });

        // Újratöltés ha a route paraméter változik (pl. /docs/leases -> /docs/public_procurements)
        watch(
            () => route.params.id,
            (newId, oldId) => {
                if (newId !== oldId) {
                    loaded.value = false;
                    loadDocuments();
                }
            }
        );

        return {
            title,
            documents,
            headers,
            loaded,
            admin,
            formatTime,
            handleCreateDocument,
        };
    },
});
</script>

<style scoped>
.icon_size {
    font-size: 1.8rem;
}
</style>