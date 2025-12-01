<template>
    <section class="text-gray-600 min-h-screen">
        <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 id="render_title" class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">
                        {{ $t('documents') }}
                    </h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            </div>

            <div v-if="!loaded">
                <Loading />
            </div>

            <div v-else class="space-y-8">
                <div v-for="role in roles" :key="role.id" class="popups">
                    <h2 class="sm:text-2xl text-lg font-medium mb-3 text-gray-900 dark:text-white">
                        {{ role.role }}
                    </h2>

                    <v-data-table
                        height="400"
                        :headers="headers"
                        :items="role.workers"
                        :items-per-page="-1"
                    >
                        <template v-slot:item.date="{ item }">
                            {{ formatTime(item.date) }}
                        </template>

                        <template v-slot:item.open="{ item }">
                            <router-link :to="`/document/${item.doc_id}`">
                                <i class="pi pi-book icon_size text-blue-600 hover:text-blue-800 transition-colors"></i>
                            </router-link>
                        </template>

                        <template v-slot:item.edit="{ item }" v-if="admin">
                            <router-link :to="`/admin/document/${item.id}`">
                                <i class="pi pi-cloud-upload icon_size text-green-600 hover:text-green-800 transition-colors"></i>
                            </router-link>
                        </template>

                        <template #bottom></template>
                    </v-data-table>

                    <div v-if="admin" class="flex gap-3 mt-4 flex-wrap">
                        <v-btn @click="new_stuff(role.id)" color="primary" class="m-2">
                            {{ $t('add_new_document_in_that_category') }}
                        </v-btn>
                        <v-btn
                            v-if="!role.archived"
                            @click="archive_stuff(role.id)"
                            color="warning"
                            class="m-2"
                        >
                            {{ $t('archive_category') }}
                        </v-btn>
                        <v-btn
                            v-else
                            @click="restore_stuff(role.id)"
                            color="success"
                            class="m-2"
                        >
                            {{ $t('restore') }}
                        </v-btn>
                    </div>
                </div>

                <div v-if="loaded && !archived" class="mt-8">
                    <v-btn @click="open_archive" color="secondary" class="m-5">
                        {{ $t('show_archive') }}
                    </v-btn>
                </div>
            </div>
        </div>
    </section>
</template>

<script lang="ts">
import gsap from "gsap";
import { useLoadingStore } from "@/stores/loading";
import Loading from "@/components/Loading.vue";
import {
    formatTime,
    createNewDocument,
    archiveCategory,
    loadCategoriesWithDocuments,
    type CategoryItem
} from "@/utils/documentUtils";

export default {
    name: 'Documents',
    components: {
        Loading
    },

    data: () => ({
        roles: [] as CategoryItem[],
        loaded: false,
        headers: [] as any[],
        admin: false,
        archived: false
    }),

    async mounted() {
        const loadingStore = useLoadingStore();
        this.admin = loadingStore.userLoggedin;
        document.title = this.$t("documents");

        // Initialize headers
        this.headers = [
            { title: this.$t("name"), align: 'start', sortable: false, key: 'name', width: '300px' },
            { title: this.$t("date"), align: 'start', key: 'date', width: '200px' },
            { title: this.$t("open_document"), align: 'start', key: 'open', width: '100px' }
        ];

        if (this.admin) {
            this.headers.push({
                title: this.$t("edit_document"),
                align: 'start',
                key: 'edit',
                width: '100px'
            });
        }

        // Title animation
        gsap.fromTo("#render_title", {
            opacity: 0,
            x: "50%",
        }, {
            duration: 1.5,
            opacity: 1,
            x: 0,
        });

        await this.load_workers_base();
    },

    methods: {
        formatTime,

        async new_stuff(categoryId: string): Promise<void> {
            try {
                const newDoc = await createNewDocument(categoryId);
                this.$router.push(`/admin/document/${newDoc.$id}`);
            } catch (error) {
                console.error('Error creating new document:', error);
            }
        },

        async archive_stuff(categoryId: string): Promise<void> {
            try {
                await archiveCategory(categoryId, true);
                await this.load_workers_base();
            } catch (error) {
                console.error('Error archiving category:', error);
            }
        },

        async restore_stuff(categoryId: string): Promise<void> {
            try {
                await archiveCategory(categoryId, false);
                await this.load_workers_base();
            } catch (error) {
                console.error('Error restoring category:', error);
            }
        },

        async open_archive(): Promise<void> {
            this.archived = true;
            await this.load_workers_base();
        },

        async load_workers_base(): Promise<void> {
            try {
                this.loaded = false;
                this.roles = await loadCategoriesWithDocuments(this.archived);
                this.loaded = true;

                // Animate elements after loading
                this.$nextTick(() => {
                    gsap.fromTo(".popups", {
                        opacity: 0,
                        y: "50%",
                    }, {
                        duration: 1.2,
                        opacity: 1,
                        y: 0,
                        stagger: 0.1
                    });
                });

            } catch (error) {
                console.error('Error loading categories and documents:', error);
                this.loaded = true;
            }
        }
    }
}
</script>

<style scoped>
.popups {
    transition: all 0.4s ease;
}

.icon_size {
    font-size: 1.5rem;
}

.pi:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease;
}
</style>