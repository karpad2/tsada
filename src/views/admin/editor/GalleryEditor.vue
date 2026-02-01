<template>
    <v-container fluid class="gallery-editor pa-6">
        <!-- Page Header -->
        <v-row>
            <v-col>
                <v-card elevation="2" class="header-card mb-6" rounded>
                    <v-card-title class="d-flex align-center bg-primary text-white pa-4">
                        <v-icon left size="large">mdi-image-multiple</v-icon>
                        <span class="text-h5">{{ $t('gallery_editor') }}</span>
                        <v-spacer />
                        <v-chip
                            v-if="!isPhotographer"
                            :color="visible ? 'success' : 'warning'"
                            :prepend-icon="visible ? 'mdi-eye' : 'mdi-eye-off'"
                            variant="elevated"
                        >
                            {{ visible ? $t('visible') : $t('hidden') }}
                        </v-chip>
                    </v-card-title>

                    <v-card-text class="pa-4">
                        <!-- Quick Actions -->
                        <div class="d-flex flex-wrap gap-3 align-center">
                            <v-switch
                                v-if="!isPhotographer"
                                v-model="visible"
                                :label="$t('make_visible')"
                                color="success"
                                inset
                                hide-details
                                @change="save"
                            />

                            <v-divider v-if="!isPhotographer" vertical class="mx-2" />

                            <v-btn
                                v-if="!isPhotographer"
                                @click="save"
                                color="success"
                                size="large"
                                prepend-icon="mdi-content-save"
                                variant="elevated"
                            >
                                {{ $t('save_changes') }}
                            </v-btn>

                            <v-btn
                                v-if="!isPhotographer"
                                @click="delete_content"
                                color="error"
                                size="large"
                                prepend-icon="mdi-delete"
                                variant="outlined"
                            >
                                {{ $t('delete_gallery') }}
                            </v-btn>

                            <v-spacer />

                            <!-- Gallery Statistics -->
                            <div class="d-flex gap-4">
                                <v-chip color="info" prepend-icon="mdi-image">
                                    {{ images.length }} {{ $t('images') }}
                                </v-chip>
                                <v-chip
                                    v-if="default_image"
                                    color="success"
                                    prepend-icon="mdi-star"
                                >
                                    {{ $t('has_default') }}
                                </v-chip>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Main Content -->
        <v-row>
            <!-- File Upload Section -->
            <v-col cols="12" lg="6">
                <v-card elevation="2" rounded>
                    <v-card-title class="bg-primary text-white">
                        <v-icon left>mdi-cloud-upload</v-icon>
                        {{ $t('file_upload') }}
                    </v-card-title>

                    <v-card-text class="pa-6">
                        <v-file-input
                            @change="file_upload"
                            multiple
                            v-model="file_link"
                            accept="image/*"
                            :label="$t('fileupload')"
                            variant="outlined"
                            prepend-icon="mdi-image-multiple"
                            show-size
                            clearable
                        />

                        <v-alert
                            v-if="uploading"
                            type="info"
                            variant="tonal"
                            class="mt-4"
                        >
                            <v-progress-linear indeterminate />
                            {{ $t('file_upload_started') }}
                        </v-alert>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Language Fields Section -->
            <v-col v-if="!isPhotographer" cols="12" lg="6">
                <v-card elevation="2" rounded class="language-card">
                    <v-card-title class="bg-secondary text-white">
                        <v-icon left>mdi-translate</v-icon>
                        {{ $t('multilanguage_content') }}
                    </v-card-title>

                    <v-card-text class="pa-6">
                        <!-- Serbian Fields -->
                        <div class="mb-4">
                            <h3 class="text-subtitle-1 mb-2">{{ $t('serbian') }}</h3>
                            <v-text-field
                                @change="save"
                                v-model="title_rs"
                                :counter="100"
                                :label="$t('srb_title')"
                                variant="outlined"
                                hide-details="auto"
                                class="mb-3"
                            />
                            <v-text-field
                                @change="save"
                                v-model="short_rs"
                                :counter="100"
                                :label="$t('srb_short')"
                                variant="outlined"
                                hide-details="auto"
                            />
                        </div>

                        <!-- Hungarian Fields -->
                        <div class="mb-4">
                            <h3 class="text-subtitle-1 mb-2">{{ $t('hungarian') }}</h3>
                            <v-text-field
                                v-model="title_hu"
                                :counter="100"
                                @change="save"
                                :label="$t('hu_title')"
                                variant="outlined"
                                hide-details="auto"
                                class="mb-3"
                            />
                            <v-text-field
                                @change="save"
                                v-model="short_hu"
                                :counter="100"
                                :label="$t('hu_short')"
                                variant="outlined"
                                hide-details="auto"
                            />
                        </div>

                        <!-- English Fields -->
                        <div>
                            <h3 class="text-subtitle-1 mb-2">{{ $t('english') }}</h3>
                            <v-text-field
                                v-model="title_en"
                                :counter="100"
                                @change="save"
                                :label="$t('en_title')"
                                variant="outlined"
                                hide-details="auto"
                                class="mb-3"
                            />
                            <v-text-field
                                @change="save"
                                v-model="short_en"
                                :counter="100"
                                :label="$t('en_short')"
                                variant="outlined"
                                hide-details="auto"
                            />
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Pending Images Section (Admin/Editor only) -->
        <v-row v-if="!isPhotographer && pendingImages.length > 0">
            <v-col>
                <v-card elevation="2" rounded>
                    <v-card-title class="bg-warning text-white d-flex align-center">
                        <v-icon left>mdi-clock-outline</v-icon>
                        {{ $t('pending_approval') }}
                        <v-spacer />
                        <v-chip color="white" variant="elevated" text-color="warning" class="mr-3">
                            {{ pendingImages.length }} {{ $t('images') }}
                        </v-chip>
                        <v-btn
                            @click="approve_all"
                            color="success"
                            size="small"
                            prepend-icon="mdi-check-all"
                            variant="elevated"
                        >
                            {{ $t('approve_all') }}
                        </v-btn>
                    </v-card-title>

                    <v-card-text class="pa-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div
                                v-for="image in pendingImages"
                                :key="image.img_id"
                                class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2 border-orange-300"
                            >
                                <figure class="relative">
                                    <img
                                        :src="image.img"
                                        alt="Pending image"
                                        class="w-full h-48 object-cover"
                                    />
                                    <div class="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                        {{ $t("pending") }}
                                    </div>
                                </figure>

                                <div class="p-4">
                                    <div class="flex gap-2 justify-end">
                                        <v-btn
                                            @click="approve_image(image.doc_id)"
                                            size="small"
                                            color="success"
                                            variant="tonal"
                                            prepend-icon="mdi-check"
                                        >
                                            {{ $t("approve") }}
                                        </v-btn>
                                        <v-btn
                                            @click="reject_image(image.img_id, image.doc_id)"
                                            size="small"
                                            color="error"
                                            variant="tonal"
                                            prepend-icon="mdi-close"
                                        >
                                            {{ $t("reject") }}
                                        </v-btn>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Delete Requested Images Section (Admin/Editor only) -->
        <v-row v-if="!isPhotographer && deleteRequestedImages.length > 0">
            <v-col>
                <v-card elevation="2" rounded>
                    <v-card-title class="bg-error text-white d-flex align-center">
                        <v-icon left>mdi-delete-clock</v-icon>
                        {{ $t('delete_requested') }}
                        <v-spacer />
                        <v-chip color="white" variant="elevated" text-color="error">
                            {{ deleteRequestedImages.length }} {{ $t('images') }}
                        </v-chip>
                    </v-card-title>

                    <v-card-text class="pa-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div
                                v-for="image in deleteRequestedImages"
                                :key="image.img_id"
                                class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2 border-red-300"
                            >
                                <figure class="relative">
                                    <img
                                        :src="image.img"
                                        alt="Delete requested image"
                                        class="w-full h-48 object-cover opacity-70"
                                    />
                                    <div class="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                        {{ $t("delete_requested") }}
                                    </div>
                                </figure>

                                <div class="p-4">
                                    <div class="flex gap-2 justify-end">
                                        <v-btn
                                            @click="approve_image(image.doc_id)"
                                            size="small"
                                            color="success"
                                            variant="tonal"
                                            prepend-icon="mdi-undo"
                                        >
                                            {{ $t("restore") }}
                                        </v-btn>
                                        <v-btn
                                            @click="delete_picture(image.img_id, image.doc_id)"
                                            size="small"
                                            color="error"
                                            variant="tonal"
                                            prepend-icon="mdi-delete"
                                        >
                                            {{ $t("delete") }}
                                        </v-btn>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Approved Images Section -->
        <v-row v-if="approvedImages.length > 0">
            <v-col>
                <v-card elevation="2" rounded>
                    <v-card-title class="bg-info text-white">
                        <v-icon left>mdi-eye</v-icon>
                        {{ $t('approved_images') }}
                        <v-spacer />
                        <v-chip color="white" variant="elevated" text-color="info">
                            {{ approvedImages.length }} {{ $t('images') }}
                        </v-chip>
                    </v-card-title>

                    <v-card-text class="pa-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div
                                v-for="image in approvedImages"
                                :key="image.img_id"
                                class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg"
                            >
                                <figure class="relative">
                                    <img
                                        :src="image.img"
                                        alt="Gallery image"
                                        class="w-full h-48 object-cover"
                                    />
                                    <div
                                        v-if="default_image === image.img_id"
                                        class="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium"
                                    >
                                        {{ $t("default_picture") }}
                                    </div>
                                    <div
                                        v-if="!isPhotographer"
                                        class="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium"
                                    >
                                        {{ $t("approved") }}
                                    </div>
                                </figure>

                                <div class="p-4">
                                    <div class="flex gap-2 justify-end">
                                        <v-btn
                                            v-if="!isPhotographer && default_image !== image.img_id"
                                            @click="set_as_default(image.img_id)"
                                            size="small"
                                            color="primary"
                                            variant="tonal"
                                        >
                                            {{ $t("set_as_default") }}
                                        </v-btn>
                                        <!-- Admin/Editor can delete directly -->
                                        <v-btn
                                            v-if="!isPhotographer"
                                            @click="delete_picture(image.img_id, image.doc_id)"
                                            size="small"
                                            color="error"
                                            variant="tonal"
                                        >
                                            {{ $t("delete") }}
                                        </v-btn>
                                        <!-- Photographer can only request deletion for approved images -->
                                        <v-btn
                                            v-if="isPhotographer"
                                            @click="request_delete(image.doc_id)"
                                            size="small"
                                            color="warning"
                                            variant="tonal"
                                            prepend-icon="mdi-delete-alert"
                                        >
                                            {{ $t("request_delete") }}
                                        </v-btn>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Photographer's Pending Images (Photographer sees their pending uploads) -->
        <v-row v-if="isPhotographer && pendingImages.length > 0">
            <v-col>
                <v-card elevation="2" rounded>
                    <v-card-title class="bg-warning text-white">
                        <v-icon left>mdi-clock-outline</v-icon>
                        {{ $t('pending_approval') }}
                        <v-spacer />
                        <v-chip color="white" variant="elevated" text-color="warning">
                            {{ pendingImages.length }} {{ $t('images') }}
                        </v-chip>
                    </v-card-title>

                    <v-card-text class="pa-6">
                        <v-alert type="info" variant="tonal" class="mb-4">
                            {{ $t('pending_images_info') }}
                        </v-alert>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <div
                                v-for="image in pendingImages"
                                :key="image.img_id"
                                class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2 border-orange-300 opacity-80"
                            >
                                <figure class="relative">
                                    <img
                                        :src="image.img"
                                        alt="Pending image"
                                        class="w-full h-48 object-cover"
                                    />
                                    <div class="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                        {{ $t("pending") }}
                                    </div>
                                </figure>

                                <div class="p-4">
                                    <div class="flex gap-2 justify-end">
                                        <v-btn
                                            @click="delete_picture(image.img_id, image.doc_id)"
                                            size="small"
                                            color="error"
                                            variant="tonal"
                                        >
                                            {{ $t("delete") }}
                                        </v-btn>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import { Client, Databases, ID, Storage, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";
import { RoleService } from "@/services/RoleService";
import { useConfirmDialog } from '@/composables/ui/useConfirmDialog';

export default {
    setup() {
        const { openDialog } = useConfirmDialog();
        return { openDialog };
    },
    computed: {
        isPhotographer(): boolean {
            const loadingStore = useLoadingStore();
            return loadingStore.userRole === 'photographer';
        },
        pendingImages(): Array<{ img: string; img_id: string; doc_id: string; status: string }> {
            return this.images.filter(img => img.status === 'pending');
        },
        approvedImages(): Array<{ img: string; img_id: string; doc_id: string; status: string }> {
            return this.images.filter(img => img.status === 'approved');
        },
        deleteRequestedImages(): Array<{ img: string; img_id: string; doc_id: string; status: string }> {
            return this.images.filter(img => img.status === 'delete_requested');
        }
    },
    data() {
        return {
            title_en: "",
            title_hu: "",
            title_rs: "",
            short_rs: "",
            short_hu: "",
            short_en: "",
            gallery_id: "",
            visible: false,
            default_image: "",
            file_link: null,
            images: [] as Array<{ img: string; img_id: string; doc_id: string; status: string }>,
            uploading: false
        }
    },
    mounted() {
        this.getMD();
        this.gallery_id = this.$route.params.id as string;
        console.log('Gallery ID from route:', this.gallery_id);
        window.addEventListener('beforeunload', this.handleBeforeUnload);
    },
    onBeforeUnmount() {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    },
    methods: {
        async getMD() {
            const database = new Databases(appw);
            const storage = new Storage(appw);

            try {
                console.log('Loading gallery data for ID:', this.$route.params.id);
                let k = await database.listDocuments(config.website_db, config.gallery, [Query.equal("$id", this.$route.params.id as string)]);
                console.log('Gallery documents found:', k.documents.length);

                if (k.documents.length > 0) {
                    const doc = k.documents[0];
                    this.title_rs = doc.title_rs || "";
                    this.title_hu = doc.title_hu || "";
                    this.title_en = doc.title_en || "";
                    this.short_rs = doc.short_rs || "";
                    this.short_hu = doc.short_hu || "";
                    this.short_en = doc.short_en || "";
                    this.visible = doc.visible || false;
                    this.default_image = doc.default_image || "";

                    console.log('Loading images for gallery:', this.$route.params.id);
                    let l = await database.listDocuments(config.website_db, config.album_images, [Query.equal("gallery", this.$route.params.id as string)]);
                    console.log('Images found:', l.documents.length, l.documents);
                    this.images = [];

                    l.documents.forEach(element => {
                        console.log('Processing image:', element.image_id);
                        let a = { img: "", img_id: "", doc_id: "", status: "approved" };
                        a.img_id = element.image_id;
                        a.doc_id = element.$id;
                        a.status = element.status || "approved";
                        a.img = storage.getFilePreview(
                            config.gallery_pictures_storage,
                            element.image_id,
                            300,
                            0,
                            'center',
                            90,
                            5,
                            'FFFFFF',
                            15,
                            1,
                            0,
                            'FFFFFF',
                            'webp'
                        );
                        console.log('Generated image URL:', a.img);
                        this.images.push(a);
                    });
                    console.log('Total images loaded:', this.images.length);
                }
            } catch (error) {
                console.error('Error loading gallery data:', error);
            }
        },

        handleBeforeUnload(event: any) {
            if (this.uploading) {
                event.preventDefault();
                this.$notify({
                    type: 'error',
                    text: this.$t('file_still_uploading')
                });
                event.returnValue = '';
                return '';
            }
        },

        async save() {
            const database = new Databases(appw);

            try {
                const updateData: any = {
                    "title_rs": this.title_rs,
                    "title_hu": this.title_hu,
                    "title_en": this.title_en,
                    "short_en": this.short_en,
                    "short_hu": this.short_hu,
                    "short_rs": this.short_rs,
                    "default_image": this.default_image
                };

                // Photographer cannot change visibility
                if (!this.isPhotographer) {
                    updateData.visible = this.visible;
                }

                const result = await database.updateDocument(
                    config.website_db,
                    config.gallery,
                    this.$route.params.id as string,
                    updateData
                );
                this.$notify(this.$t('saved'));
            } catch (error) {
                console.error('Error saving gallery:', error);
                this.$notify({
                    type: 'error',
                    text: this.$t('error_saving_gallery')
                });
            }
        },

        async delete_content() {
            // Photographer cannot delete galleries
            if (this.isPhotographer) return;

            const galleryConfirmed = await this.openDialog({
                title: this.$t('delete'),
                message: this.$t('confirm_delete_gallery'),
                confirmText: this.$t('delete'),
                color: 'error',
                icon: 'mdi-delete'
            });
            if (!galleryConfirmed) return;

            const database = new Databases(appw);

            try {
                await database.deleteDocument(config.website_db, config.gallery, this.$route.params.id as string);
                this.$notify(this.$t('deleted'));
                this.$router.push("/admin");
            } catch (error) {
                console.error('Error deleting gallery:', error);
                this.$notify({
                    type: 'error',
                    text: this.$t('error_deleting_gallery')
                });
            }
        },

        async file_upload() {
            const storage = new Storage(appw);
            const database = new Databases(appw);

            if (!this.file_link) {
                console.warn("no file");
                return;
            }

            console.log("file_upload started");
            this.uploading = true;

            try {
                await Promise.all(this.file_link.map(async (element: File) => {
                    this.$notify({
                        type: 'info',
                        text: this.$t('file_upload_started')
                    });

                    console.log('Uploading file:', element);

                    const result = await storage.createFile(
                        config.gallery_pictures_storage,
                        ID.unique(),
                        element
                    );

                    let add_file_to_album = await database.createDocument(
                        config.website_db,
                        config.album_images,
                        ID.unique(),
                        {
                            "image_id": result.$id,
                            "gallery": this.gallery_id,
                            "status": this.isPhotographer ? "pending" : "approved"
                        }
                    );

                    console.log('Added file to album:', add_file_to_album);

                    this.$notify({
                        type: 'success',
                        text: this.$t('file_uploaded')
                    });
                }));

                this.uploading = false;
                await this.getMD(); // Reload images
            } catch (error) {
                console.error('Error uploading files:', error);
                this.uploading = false;
                this.$notify({
                    type: 'error',
                    text: this.$t('error_uploading_files')
                });
            }
        },

        async approve_image(docId: string) {
            const database = new Databases(appw);
            try {
                await database.updateDocument(config.website_db, config.album_images, docId, {
                    "status": "approved"
                });
                this.$notify({ type: 'success', text: this.$t('image_approved') });
                await this.getMD();
            } catch (error) {
                console.error('Error approving image:', error);
                this.$notify({ type: 'error', text: this.$t('error_approving_image') });
            }
        },

        async approve_all() {
            const database = new Databases(appw);
            try {
                await Promise.all(
                    this.pendingImages.map(img =>
                        database.updateDocument(config.website_db, config.album_images, img.doc_id, {
                            "status": "approved"
                        })
                    )
                );
                this.$notify({ type: 'success', text: this.$t('all_images_approved') });
                await this.getMD();
            } catch (error) {
                console.error('Error approving all images:', error);
                this.$notify({ type: 'error', text: this.$t('error_approving_image') });
            }
        },

        async reject_image(imgId: string, docId: string) {
            const rejectConfirmed = await this.openDialog({
                title: this.$t('reject'),
                message: this.$t('confirm_reject_image'),
                confirmText: this.$t('reject'),
                color: 'error',
                icon: 'mdi-close-circle'
            });
            if (!rejectConfirmed) return;
            await this.delete_picture(imgId, docId);
        },

        async request_delete(docId: string) {
            const database = new Databases(appw);
            try {
                await database.updateDocument(config.website_db, config.album_images, docId, {
                    "status": "delete_requested"
                });
                this.$notify({ type: 'info', text: this.$t('delete_requested_notify') });
                await this.getMD();
            } catch (error) {
                console.error('Error requesting deletion:', error);
                this.$notify({ type: 'error', text: this.$t('error_requesting_delete') });
            }
        },

        set_as_default(aa: string) {
            console.log('Setting as default:', aa);
            this.default_image = aa;
            this.save();
        },

        async delete_picture(aa: string, bb: string) {
            const imgConfirmed = await this.openDialog({
                title: this.$t('delete'),
                message: this.$t('confirm_delete_image'),
                confirmText: this.$t('delete'),
                color: 'error',
                icon: 'mdi-delete'
            });
            if (!imgConfirmed) return;

            const storage = new Storage(appw);
            const database = new Databases(appw);

            try {
                await storage.deleteFile(config.gallery_pictures_storage, aa);
            } catch (ex) {
                console.log("Error deleting from storage:", ex);
            }

            try {
                await database.deleteDocument(config.website_db, config.album_images, bb);
            } catch (ex) {
                console.log("Error deleting from database:", ex);
            }

            await this.getMD(); // Reload images
        }
    }
}
</script>

<style scoped>
.gallery-editor {
    max-width: 1400px;
}

.header-card {
    border-radius: 16px !important;
}

.language-card {
    border-radius: 16px !important;
}

.grid {
    display: grid;
}

.grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) {
    .sm\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (min-width: 768px) {
    .md\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1024px) {
    .lg\:grid-cols-4 {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.gap-4 {
    gap: 1rem;
}
</style>