<template>
    <section class="text-gray-600 min-h-screen">
        <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 id="render_title" class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">
                        {{ $t('studentdocuments') }}
                    </h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            </div>

            <div v-if="!loaded">
                <Loading />
            </div>

            <div v-else class="space-y-8">
                <!-- Admin Category Management (csak main studentdocuments-nél) -->
                <div v-if="showCategoryManagement && admin" class="mb-6">
                    <v-btn @click="showNewCategoryDialog = true" color="success" class="m-2">
                        <i class="pi pi-plus mr-2"></i>
                        {{ $t('add_new_category') }}
                    </v-btn>
                </div>

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
                            {{ rt_time(item.date) }}
                        </template>

                        <template v-slot:item.open="{ item }">
                            <router-link :to="`/document/${item.doc_id}`">
                                <i class="pi pi-book icon_size"></i>
                            </router-link>
                        </template>

                        <template v-slot:item.edit="{ item }" v-if="admin">
                            <router-link :to="`/admin/studentdocument/${item.id}`">
                                <i class="pi pi-cloud-upload icon_size"></i>
                            </router-link>
                        </template>

                        <template #bottom></template>
                    </v-data-table>

                    <div v-if="admin" class="flex gap-3 mt-4 flex-wrap">
                        <!-- Category Order Controls (csak main studentdocuments-nél) -->
                        <div v-if="showCategoryManagement" class="flex gap-2">
                            <v-btn
                                @click="moveCategoryUp(role)"
                                color="secondary"
                                size="small"
                                :disabled="!canMoveUp(role)"
                                :title="$t('move_up')"
                            >
                                <i class="pi pi-chevron-up"></i>
                            </v-btn>
                            <v-btn
                                @click="moveCategoryDown(role)"
                                color="secondary"
                                size="small"
                                :disabled="!canMoveDown(role)"
                                :title="$t('move_down')"
                            >
                                <i class="pi pi-chevron-down"></i>
                            </v-btn>
                        </div>

                        <v-btn @click="new_stuff(role.id)" color="primary" class="m-2">
                            {{ $t('add_new_document_in_that_category') }}
                        </v-btn>

                        <!-- Full Category Management (csak main studentdocuments-nél) -->
                        <template v-if="showCategoryManagement">
                            <v-btn @click="editCategory(role)" color="info" class="m-2">
                                <i class="pi pi-pencil mr-2"></i>
                                {{ $t('edit_category') }}
                            </v-btn>
                            <v-btn
                                @click="confirmDeleteCategory(role)"
                                color="error"
                                class="m-2"
                            >
                                <i class="pi pi-trash mr-2"></i>
                                {{ $t('delete_category') }}
                            </v-btn>
                        </template>

                        <!-- Archive/Restore (minden típusnál) -->
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

            <!-- Category Management Dialogs (csak main studentdocuments-nél) -->
            <template v-if="showCategoryManagement">
                <!-- New Category Dialog -->
                <v-dialog v-model="showNewCategoryDialog" max-width="600px" persistent>
                    <v-card>
                        <v-card-title>
                            <span class="text-h5">{{ $t('add_new_category') }}</span>
                        </v-card-title>
                        <v-card-text>
                            <v-container>
                                <v-row>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="newCategory.category_name_rs"
                                            :label="$t('category_name_serbian')"
                                            required
                                            variant="outlined"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="newCategory.category_name_en"
                                            :label="$t('category_name_english')"
                                            variant="outlined"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="newCategory.category_name_hu"
                                            :label="$t('category_name_hungarian')"
                                            variant="outlined"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="newCategory.listasorrend"
                                            :label="$t('sort_order')"
                                            type="number"
                                            variant="outlined"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="blue-darken-1" variant="text" @click="closeNewCategoryDialog">
                                {{ $t('cancel') }}
                            </v-btn>
                            <v-btn color="blue-darken-1" variant="text" @click="createNewCategory" :disabled="!newCategory.category_name_rs">
                                {{ $t('save') }}
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>

                <!-- Edit Category Dialog -->
                <v-dialog v-model="showEditCategoryDialog" max-width="600px" persistent>
                    <v-card>
                        <v-card-title>
                            <span class="text-h5">{{ $t('edit_category') }}</span>
                        </v-card-title>
                        <v-card-text>
                            <v-container>
                                <v-row>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="editingCategory.category_name_rs"
                                            :label="$t('category_name_serbian')"
                                            required
                                            variant="outlined"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="editingCategory.category_name_en"
                                            :label="$t('category_name_english')"
                                            variant="outlined"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="editingCategory.category_name_hu"
                                            :label="$t('category_name_hungarian')"
                                            variant="outlined"
                                        ></v-text-field>
                                    </v-col>
                                    <v-col cols="12">
                                        <v-text-field
                                            v-model="editingCategory.listasorrend"
                                            :label="$t('sort_order')"
                                            type="number"
                                            variant="outlined"
                                        ></v-text-field>
                                    </v-col>
                                </v-row>
                            </v-container>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="blue-darken-1" variant="text" @click="closeEditCategoryDialog">
                                {{ $t('cancel') }}
                            </v-btn>
                            <v-btn color="blue-darken-1" variant="text" @click="updateCategory" :disabled="!editingCategory.category_name_rs">
                                {{ $t('save') }}
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>

                <!-- Delete Confirmation Dialog -->
                <v-dialog v-model="showDeleteConfirmDialog" max-width="500px" persistent>
                    <v-card>
                        <v-card-title class="text-h5">
                            {{ $t('confirm_delete') }}
                        </v-card-title>
                        <v-card-text>
                            <p>{{ $t('delete_category_warning') }}</p>
                            <p class="font-bold mt-2">{{ categoryToDelete?.role }}</p>
                            <p class="text-red-600 mt-2">{{ $t('delete_permanent_warning') }}</p>
                        </v-card-text>
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn color="blue-darken-1" variant="text" @click="closeDeleteConfirmDialog">
                                {{ $t('cancel') }}
                            </v-btn>
                            <v-btn color="red-darken-1" variant="text" @click="deleteCategory">
                                {{ $t('delete') }}
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>
            </template>
        </div>
    </section>
</template>

<script lang="ts">
import { Databases, ID, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { convertifserbian } from "@/lang";
import { useLoadingStore } from "@/stores/loading";
import gsap from "gsap";
import moment from 'moment/min/moment-with-locales';
import Loading from "@/components/Loading.vue";

interface DocumentItem {
    id: string;
    doc_id: string;
    name: string;
    date: string;
    contact?: string;
}

interface CategoryItem {
    id: string;
    role: string;
    archived: boolean;
    workers: DocumentItem[];
    originalData?: any;
}

interface CategoryData {
    category_name_rs: string;
    category_name_en: string;
    category_name_hu: string;
    listasorrend: number;
}

export default {
    name: 'BaseStudentDocuments',
    components: {
        Loading
    },

    props: {
        showCategoryManagement: {
            type: Boolean,
            default: true
        },
        collectionType: {
            type: String,
            default: 'default'
        }
    },

    data: () => ({
        roles: [] as CategoryItem[],
        loaded: false,
        headers: [] as any[],
        admin: false,
        archived: false,
        showNewCategoryDialog: false,
        showEditCategoryDialog: false,
        showDeleteConfirmDialog: false,
        newCategory: {
            category_name_rs: '',
            category_name_en: '',
            category_name_hu: '',
            listasorrend: 1
        } as CategoryData,
        editingCategory: {
            category_name_rs: '',
            category_name_en: '',
            category_name_hu: '',
            listasorrend: 1
        } as CategoryData,
        editingCategoryId: '',
        categoryToDelete: null as CategoryItem | null
    }),

    computed: {
        loadingStore() {
            return useLoadingStore();
        },
        currentLanguage() {
            return this.loadingStore.language;
        }
    },

    watch: {
        async currentLanguage() {
            await this.reloadDocuments();
        }
    },

    async mounted() {
        this.admin = this.loadingStore.userLoggedin;
        document.title = this.$t("studentdocuments");
        this.setupHeaders();

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
        rt_time(dateString: string): string {
            const loadingStore = useLoadingStore();
            let local = loadingStore.language;

            if (local === "rs" || local === "sr") {
                moment.locale('sr');
            } else if (local === "hu") {
                moment.locale('hu');
            } else if (local === "en") {
                moment.locale('en');
            }

            return moment(dateString).format("LLL");
        },

        setupHeaders() {
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
        },

        async reloadDocuments() {
            document.title = this.$t("studentdocuments");
            this.setupHeaders();
            await this.load_workers_base();
        },

        async new_stuff(categoryId: string): Promise<void> {
            try {
                const database = new Databases(appw);
                const newDoc = await database.createDocument(
                    config.website_db,
                    config.st_documents,
                    ID.unique(),
                    { "stDocumentCategories": categoryId }
                );
                this.$router.push(`/admin/studentdocument/${newDoc.$id}`);
            } catch (error) {
                console.error('Error creating new document:', error);
            }
        },

        async archive_stuff(categoryId: string): Promise<void> {
            try {
                const database = new Databases(appw);
                await database.updateDocument(
                    config.website_db,
                    config.st_document_categories,
                    categoryId,
                    { "archived": true }
                );
                await this.load_workers_base();
            } catch (error) {
                console.error('Error archiving category:', error);
            }
        },

        async restore_stuff(categoryId: string): Promise<void> {
            try {
                const database = new Databases(appw);
                await database.updateDocument(
                    config.website_db,
                    config.st_document_categories,
                    categoryId,
                    { "archived": false }
                );
                await this.load_workers_base();
            } catch (error) {
                console.error('Error restoring category:', error);
            }
        },

        async open_archive(): Promise<void> {
            this.archived = true;
            await this.load_workers_base();
        },

        // Category Management Methods (csak ha showCategoryManagement = true)
        closeNewCategoryDialog(): void {
            this.showNewCategoryDialog = false;
            this.newCategory = {
                category_name_rs: '',
                category_name_en: '',
                category_name_hu: '',
                listasorrend: 1
            };
        },

        async createNewCategory(): Promise<void> {
            if (!this.showCategoryManagement) return;

            try {
                const database = new Databases(appw);
                await database.createDocument(
                    config.website_db,
                    config.st_document_categories,
                    ID.unique(),
                    {
                        category_name_rs: this.newCategory.category_name_rs,
                        category_name_en: this.newCategory.category_name_en,
                        category_name_hu: this.newCategory.category_name_hu,
                        listasorrend: this.newCategory.listasorrend,
                        archived: false
                    }
                );

                this.closeNewCategoryDialog();
                await this.load_workers_base();
                console.log('Category created successfully');

            } catch (error) {
                console.error('Error creating new category:', error);
            }
        },

        editCategory(role: CategoryItem): void {
            if (!this.showCategoryManagement) return;

            this.editingCategoryId = role.id;
            this.editingCategory = {
                category_name_rs: role.originalData?.category_name_rs || '',
                category_name_en: role.originalData?.category_name_en || '',
                category_name_hu: role.originalData?.category_name_hu || '',
                listasorrend: role.originalData?.listasorrend || 1
            };
            this.showEditCategoryDialog = true;
        },

        closeEditCategoryDialog(): void {
            this.showEditCategoryDialog = false;
            this.editingCategoryId = '';
            this.editingCategory = {
                category_name_rs: '',
                category_name_en: '',
                category_name_hu: '',
                listasorrend: 1
            };
        },

        async updateCategory(): Promise<void> {
            if (!this.showCategoryManagement) return;

            try {
                const database = new Databases(appw);
                await database.updateDocument(
                    config.website_db,
                    config.st_document_categories,
                    this.editingCategoryId,
                    {
                        category_name_rs: this.editingCategory.category_name_rs,
                        category_name_en: this.editingCategory.category_name_en,
                        category_name_hu: this.editingCategory.category_name_hu,
                        listasorrend: this.editingCategory.listasorrend
                    }
                );

                this.closeEditCategoryDialog();
                await this.load_workers_base();
                console.log('Category updated successfully');

            } catch (error) {
                console.error('Error updating category:', error);
            }
        },

        confirmDeleteCategory(role: CategoryItem): void {
            if (!this.showCategoryManagement) return;

            this.categoryToDelete = role;
            this.showDeleteConfirmDialog = true;
        },

        closeDeleteConfirmDialog(): void {
            this.showDeleteConfirmDialog = false;
            this.categoryToDelete = null;
        },

        async deleteCategory(): Promise<void> {
            if (!this.showCategoryManagement || !this.categoryToDelete) return;

            try {
                const database = new Databases(appw);

                const documentsResponse = await database.listDocuments(
                    config.website_db,
                    config.st_documents,
                    [Query.equal("stDocumentCategories", [this.categoryToDelete.id])]
                );

                if (documentsResponse.documents.length > 0) {
                    for (const doc of documentsResponse.documents) {
                        await database.deleteDocument(
                            config.website_db,
                            config.st_documents,
                            doc.$id
                        );
                    }
                }

                await database.deleteDocument(
                    config.website_db,
                    config.st_document_categories,
                    this.categoryToDelete.id
                );

                this.closeDeleteConfirmDialog();
                await this.load_workers_base();
                console.log('Category deleted successfully');

            } catch (error) {
                console.error('Error deleting category:', error);
            }
        },

        getLocalizedCategoryName(category: any): string {
            const loadingStore = useLoadingStore();
            let local = loadingStore.language;

            if (local === "en") {
                return category.category_name_en || '';
            } else if (local === "hu") {
                return category.category_name_hu || '';
            } else if (local === "rs" || local === "sr") {
                return convertifserbian(category.category_name_rs || '');
            }
            return category.category_name_rs || '';
        },

        getLocalizedDocumentTitle(document: any): string {
            const loadingStore = useLoadingStore();
            let local = loadingStore.language;

            if (local === "en" || local === "hu") {
                return document.document_title_hu || '';
            } else if (local === "rs" || local === "sr") {
                return convertifserbian(document.document_title_rs || '');
            }
            return document.document_title_rs || '';
        },

        async processDocuments(categoryId: string): Promise<DocumentItem[]> {
            try {
                const database = new Databases(appw);
                const documentsResponse = await database.listDocuments(
                    config.website_db,
                    config.st_documents,
                    [
                        Query.equal("stDocumentCategories", [categoryId]),
                        Query.orderDesc("$createdAt")
                    ]
                );

                return documentsResponse.documents.map(doc => ({
                    id: doc.$id,
                    doc_id: doc.document_id || '',
                    name: this.getLocalizedDocumentTitle(doc),
                    date: doc.$createdAt,
                    contact: doc.contact || ''
                }));
            } catch (error) {
                console.error('Error loading documents for category:', categoryId, error);
                return [];
            }
        },

        async load_workers_base(): Promise<void> {
            try {
                this.loaded = false;
                this.roles = [];

                const database = new Databases(appw);

                // Load active categories
                const activeCategories = await database.listDocuments(
                    config.website_db,
                    config.st_document_categories,
                    [Query.orderAsc("listasorrend"), Query.equal("archived", false)]
                );

                // Process active categories
                for (const category of activeCategories.documents) {
                    const documents = await this.processDocuments(category.$id);
                    const categoryName = this.getLocalizedCategoryName(category);

                    this.roles.push({
                        id: category.$id,
                        role: categoryName,
                        archived: false,
                        workers: documents,
                        originalData: category
                    });
                }

                // Load archived categories if needed
                if (this.archived) {
                    const archivedCategories = await database.listDocuments(
                        config.website_db,
                        config.st_document_categories,
                        [Query.orderAsc("listasorrend"), Query.equal("archived", true)]
                    );

                    for (const category of archivedCategories.documents) {
                        const documents = await this.processDocuments(category.$id);
                        let categoryName = this.getLocalizedCategoryName(category);
                        categoryName += ` ~ ${this.$t("archived")}`;

                        this.roles.push({
                            id: category.$id,
                            role: categoryName,
                            archived: true,
                            workers: documents,
                            originalData: category
                        });
                    }
                }

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
        },

        // Category Order Methods (csak ha showCategoryManagement = true)
        canMoveUp(category: CategoryItem): boolean {
            if (!this.showCategoryManagement) return false;
            const currentIndex = this.roles.findIndex(role => role.id === category.id);
            return currentIndex > 0;
        },

        canMoveDown(category: CategoryItem): boolean {
            if (!this.showCategoryManagement) return false;
            const currentIndex = this.roles.findIndex(role => role.id === category.id);
            return currentIndex < this.roles.length - 1;
        },

        async moveCategoryUp(category: CategoryItem): Promise<void> {
            if (!this.showCategoryManagement) return;

            try {
                const currentIndex = this.roles.findIndex(role => role.id === category.id);
                if (currentIndex <= 0) return;

                const previousCategory = this.roles[currentIndex - 1];
                const database = new Databases(appw);

                await Promise.all([
                    database.updateDocument(
                        config.website_db,
                        config.st_document_categories,
                        category.id,
                        { listasorrend: previousCategory.originalData?.listasorrend || currentIndex }
                    ),
                    database.updateDocument(
                        config.website_db,
                        config.st_document_categories,
                        previousCategory.id,
                        { listasorrend: category.originalData?.listasorrend || (currentIndex + 1) }
                    )
                ]);

                await this.load_workers_base();

            } catch (error) {
                console.error('Error moving category up:', error);
            }
        },

        async moveCategoryDown(category: CategoryItem): Promise<void> {
            if (!this.showCategoryManagement) return;

            try {
                const currentIndex = this.roles.findIndex(role => role.id === category.id);
                if (currentIndex >= this.roles.length - 1) return;

                const nextCategory = this.roles[currentIndex + 1];
                const database = new Databases(appw);

                await Promise.all([
                    database.updateDocument(
                        config.website_db,
                        config.st_document_categories,
                        category.id,
                        { listasorrend: nextCategory.originalData?.listasorrend || (currentIndex + 2) }
                    ),
                    database.updateDocument(
                        config.website_db,
                        config.st_document_categories,
                        nextCategory.id,
                        { listasorrend: category.originalData?.listasorrend || (currentIndex + 1) }
                    )
                ]);

                await this.load_workers_base();

            } catch (error) {
                console.error('Error moving category down:', error);
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
    font-size: 1.8rem;
}

.pi:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease;
}

.v-dialog .v-card {
    overflow: visible;
}

.v-text-field {
    margin-bottom: 8px;
}
</style>