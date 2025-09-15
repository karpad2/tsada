<template>
    <section class="text-gray-600 min-h-screen">
        <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">
                        {{ title }}
                    </h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            </div>

            <div v-if="loaded" class="m-auto w-full">
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

                <v-btn v-if="admin" @click="handleCreateDocument" class="m-5">
                    {{ $t("add_new_document_in_that_category") }}
                </v-btn>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import { ref, onMounted, defineComponent } from "vue";
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
        const admin = ref(loadingStore.userLoggedin);
        const loaded = ref(false);

        const loadDocuments = async () => {
            try {
                const db = new Databases(appw);
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