<template>
    <div class="page-shell">
    <div class="page-panel container">
    <v-container fluid class="gallery-editor pa-0">
        <!-- Page Header -->
        <v-row>
            <v-col>
                <div class="page-header mb-2">
                    <div class="d-flex align-center flex-wrap gap-3">
                        <h1 class="section-title !text-2xl sm:!text-3xl !mb-0">{{ $t('gallery_editor') }}</h1>
                        <v-chip
                            v-if="!isPhotographer"
                            :color="visible ? 'success' : 'warning'"
                            :prepend-icon="visible ? 'mdi-eye' : 'mdi-eye-off'"
                            variant="elevated"
                            size="small"
                        >
                            {{ visible ? $t('visible') : $t('hidden') }}
                        </v-chip>
                    </div>
                    <div class="section-accent !w-20"></div>
                </div>

                <div class="editor-toolbar mb-6">
                    <div class="editor-toolbar-switches">
                        <v-switch
                            v-if="!isPhotographer"
                            v-model="visible"
                            :label="$t('make_visible')"
                            color="success"
                            inset
                            density="compact"
                            hide-details
                            @change="save"
                        />
                        <v-chip color="info" prepend-icon="mdi-image" size="small" variant="tonal">
                            {{ images.length }} {{ $t('images') }}
                        </v-chip>
                        <v-chip
                            v-if="default_image"
                            color="success"
                            prepend-icon="mdi-star"
                            size="small"
                            variant="tonal"
                        >
                            {{ $t('has_default') }}
                        </v-chip>
                    </div>
                    <div class="editor-toolbar-actions">
                        <v-btn
                            @click="save"
                            color="success"
                            prepend-icon="mdi-content-save"
                        >
                            {{ $t('save_changes') }}
                        </v-btn>
                        <v-btn
                            v-if="!isPhotographer"
                            @click="delete_content"
                            color="error"
                            prepend-icon="mdi-delete"
                            variant="outlined"
                        >
                            {{ $t('delete_gallery') }}
                        </v-btn>
                    </div>
                </div>
            </v-col>
        </v-row>

        <!-- Main Content -->
        <v-row>
            <!-- File Upload Section -->
            <v-col cols="12" lg="6">
                <v-card elevation="0" rounded="lg">
                    <v-card-title class="editor-card-header">
                        <v-icon left>mdi-cloud-upload</v-icon>
                        {{ $t('file_upload') }}
                    </v-card-title>

                    <v-card-text class="pa-6">
                        <v-alert
                            v-if="isPhotographer"
                            type="info"
                            variant="tonal"
                            class="mb-4"
                        >
                            {{ $t('gal_photographer_upload_info') }}
                        </v-alert>
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
            <v-col cols="12" lg="6">
                <v-card elevation="0" rounded="lg" class="language-card">
                    <v-card-title class="editor-card-header">
                        <v-icon left>mdi-translate</v-icon>
                        {{ $t('multilanguage_content') }}
                    </v-card-title>

                    <v-card-text class="pa-6">
                        <!-- Serbian Fields -->
                        <div class="mb-4 editor-section !p-0 !mb-4 overflow-hidden">
                            <div class="editor-lang-header lang-srb pa-3">{{ $t('serbian') }}</div>
                            <div class="pa-3">
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
                        </div>

                        <!-- Hungarian Fields -->
                        <div class="mb-4 editor-section !p-0 !mb-4 overflow-hidden">
                            <div class="editor-lang-header lang-hu pa-3">{{ $t('hungarian') }}</div>
                            <div class="pa-3">
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
                        </div>

                        <!-- English Fields -->
                        <div class="editor-section !p-0 !mb-0 overflow-hidden">
                            <div class="editor-lang-header lang-en pa-3">{{ $t('english') }}</div>
                            <div class="pa-3">
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
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <!-- Pending Images Section (Admin/Editor only) -->
        <v-row v-if="!isPhotographer && pendingImages.length > 0">
            <v-col>
                <div class="editor-section !p-0 overflow-hidden">
                    <div class="ge-section-header ge-section-header--warning">
                        <div class="d-flex align-center gap-2">
                            <v-icon>mdi-clock-outline</v-icon>
                            <span class="font-weight-bold">{{ $t('pending_approval') }}</span>
                            <v-chip color="white" variant="elevated" text-color="warning" size="small">
                                {{ pendingImages.length }} {{ $t('images') }}
                            </v-chip>
                        </div>
                        <v-btn
                            @click="approve_all"
                            color="success"
                            size="small"
                            prepend-icon="mdi-check-all"
                        >
                            {{ $t('approve_all') }}
                        </v-btn>
                    </div>
                    <div class="pa-4">
                        <div class="ge-image-grid">
                            <div
                                v-for="image in pendingImages"
                                :key="image.img_id"
                                class="ge-image-card border-amber"
                            >
                                <figure class="relative">
                                    <img :src="image.img" alt="Pending image" class="ge-thumb" />
                                    <div class="ge-badge ge-badge--amber">{{ $t("pending") }}</div>
                                </figure>
                                <div class="ge-card-actions">
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
                </div>
            </v-col>
        </v-row>

        <!-- Delete Requested Images Section (Admin/Editor only) -->
        <v-row v-if="!isPhotographer && deleteRequestedImages.length > 0">
            <v-col>
                <div class="editor-section !p-0 overflow-hidden">
                    <div class="ge-section-header ge-section-header--error">
                        <div class="d-flex align-center gap-2">
                            <v-icon>mdi-delete-clock</v-icon>
                            <span class="font-weight-bold">{{ $t('delete_requested') }}</span>
                            <v-chip color="white" variant="elevated" text-color="error" size="small">
                                {{ deleteRequestedImages.length }} {{ $t('images') }}
                            </v-chip>
                        </div>
                    </div>
                    <div class="pa-4">
                        <div class="ge-image-grid">
                            <div
                                v-for="image in deleteRequestedImages"
                                :key="image.img_id"
                                class="ge-image-card border-red"
                            >
                                <figure class="relative">
                                    <img :src="image.img" alt="Delete requested image" class="ge-thumb opacity-70" />
                                    <div class="ge-badge ge-badge--red">{{ $t("delete_requested") }}</div>
                                </figure>
                                <div class="ge-card-actions">
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
                </div>
            </v-col>
        </v-row>

        <!-- Approved Images Section -->
        <v-row v-if="approvedImages.length > 0">
            <v-col>
                <div class="editor-section !p-0 overflow-hidden">
                    <div class="ge-section-header ge-section-header--sky">
                        <div class="d-flex align-center gap-2">
                            <v-icon>mdi-eye</v-icon>
                            <span class="font-weight-bold">{{ $t('approved_images') }}</span>
                            <v-chip color="white" variant="elevated" text-color="primary" size="small">
                                {{ approvedImages.length }} {{ $t('images') }}
                            </v-chip>
                        </div>
                    </div>
                    <div class="pa-4">
                        <div class="ge-image-grid">
                            <div
                                v-for="image in approvedImages"
                                :key="image.img_id"
                                class="ge-image-card"
                            >
                                <figure class="relative">
                                    <img :src="image.img" alt="Gallery image" class="ge-thumb" />
                                    <div
                                        v-if="default_image === image.img_id"
                                        class="ge-badge ge-badge--yellow"
                                    >
                                        {{ $t("default_picture") }}
                                    </div>
                                    <div
                                        v-if="!isPhotographer"
                                        class="ge-badge ge-badge--green ge-badge-right"
                                    >
                                        {{ $t("approved") }}
                                    </div>
                                </figure>
                                <div class="px-2 pb-2 space-y-1">
                                    <input v-model="image.caption_hu" type="text" class="w-full text-xs px-2 py-1 rounded border" :placeholder="$t('caption_hu')" @change="saveCaptionFor(image)" />
                                    <input v-model="image.caption_rs" type="text" class="w-full text-xs px-2 py-1 rounded border" :placeholder="$t('caption_rs')" @change="saveCaptionFor(image)" />
                                    <input v-model="image.caption_en" type="text" class="w-full text-xs px-2 py-1 rounded border" :placeholder="$t('caption_en')" @change="saveCaptionFor(image)" />
                                </div>
                                <div class="ge-card-actions">
                                    <v-btn
                                        v-if="!isPhotographer && default_image !== image.img_id"
                                        @click="set_as_default(image.img_id)"
                                        size="small"
                                        color="primary"
                                        variant="tonal"
                                    >
                                        {{ $t("set_as_default") }}
                                    </v-btn>
                                    <v-btn
                                        v-if="!isPhotographer"
                                        @click="delete_picture(image.img_id, image.doc_id)"
                                        size="small"
                                        color="error"
                                        variant="tonal"
                                    >
                                        {{ $t("delete") }}
                                    </v-btn>
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
                </div>
            </v-col>
        </v-row>

        <!-- Photographer's Pending Images (Photographer sees their pending uploads) -->
        <v-row v-if="isPhotographer && pendingImages.length > 0">
            <v-col>
                <div class="editor-section !p-0 overflow-hidden">
                    <div class="ge-section-header ge-section-header--warning">
                        <div class="d-flex align-center gap-2">
                            <v-icon>mdi-clock-outline</v-icon>
                            <span class="font-weight-bold">{{ $t('pending_approval') }}</span>
                            <v-chip color="white" variant="elevated" text-color="warning" size="small">
                                {{ pendingImages.length }} {{ $t('images') }}
                            </v-chip>
                        </div>
                    </div>
                    <div class="pa-4">
                        <v-alert type="info" variant="tonal" class="mb-4">
                            {{ $t('pending_images_info') }}
                        </v-alert>
                        <div class="ge-image-grid">
                            <div
                                v-for="image in pendingImages"
                                :key="image.img_id"
                                class="ge-image-card border-amber opacity-90"
                            >
                                <figure class="relative">
                                    <img :src="image.img" alt="Pending image" class="ge-thumb" />
                                    <div class="ge-badge ge-badge--amber">{{ $t("pending") }}</div>
                                </figure>
                                <div class="ge-card-actions">
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
                </div>
            </v-col>
        </v-row>
    </v-container>
    </div>
    </div>
</template>

<script lang="ts">
import { Databases, ID, Storage, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import { useLoadingStore } from "@/stores/loading";
import { useConfirmDialog } from '@/composables/ui/useConfirmDialog';
import { loadCaptions, saveCaption } from '@/services/gallery/captions';
import { galleryThumbUrl } from '@/services/gallery/imageUrl';

const db = new Databases(appw);
const storage = new Storage(appw);

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
        pendingImages(): Array<any> {
            return this.images.filter(img => img.status === 'pending');
        },
        approvedImages(): Array<any> {
            return this.images.filter(img => img.status === 'approved');
        },
        deleteRequestedImages(): Array<any> {
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
            images: [] as Array<{ img: string; img_id: string; doc_id: string; status: string; caption_hu: string; caption_rs: string; caption_en: string }>,
            uploading: false
        }
    },
    mounted() {
        this.getMD();
        this.gallery_id = this.$route.params.id as string;
        window.addEventListener('beforeunload', this.handleBeforeUnload);
    },
    beforeUnmount() {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    },
    methods: {
        async getMD() {
            try {
                const galleryId = this.$route.params.id as string;
                const k = await db.listDocuments(config.website_db, config.gallery, [Query.equal("$id", galleryId)]);

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

                    const l = await db.listDocuments(config.website_db, config.album_images, [Query.equal("gallery", galleryId)]);
                    const captions = await loadCaptions();
                    this.images = l.documents.map(element => ({
                        img: galleryThumbUrl(element.image_id, 400),
                        img_id: element.image_id,
                        doc_id: element.$id,
                        status: element.status || "approved",
                        caption_hu: captions[element.$id]?.hu || '',
                        caption_rs: captions[element.$id]?.rs || '',
                        caption_en: captions[element.$id]?.en || ''
                    }));
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

                await db.updateDocument(
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

            try {
                await db.deleteDocument(config.website_db, config.gallery, this.$route.params.id as string);
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
            if (!this.file_link) {
                console.warn("no file");
                return;
            }

            this.uploading = true;

            try {
                await Promise.all(this.file_link.map(async (element: File) => {
                    this.$notify({
                        type: 'info',
                        text: this.$t('file_upload_started')
                    });

                    const result = await storage.createFile(
                        config.gallery_pictures_storage,
                        ID.unique(),
                        element
                    );

                    await db.createDocument(
                        config.website_db,
                        config.album_images,
                        ID.unique(),
                        {
                            "image_id": result.$id,
                            "gallery": this.gallery_id,
                            "status": this.isPhotographer ? "pending" : "approved"
                        }
                    );

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
            try {
                await db.updateDocument(config.website_db, config.album_images, docId, {
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
            try {
                await Promise.all(
                    this.pendingImages.map(img =>
                        db.updateDocument(config.website_db, config.album_images, img.doc_id, {
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
            try {
                await db.updateDocument(config.website_db, config.album_images, docId, {
                    "status": "delete_requested"
                });
                this.$notify({ type: 'info', text: this.$t('delete_requested_notify') });
                await this.getMD();
            } catch (error) {
                console.error('Error requesting deletion:', error);
                this.$notify({ type: 'error', text: this.$t('error_requesting_delete') });
            }
        },

        async saveCaptionFor(image: any) {
            try {
                await saveCaption(image.doc_id, {
                    hu: image.caption_hu,
                    rs: image.caption_rs,
                    en: image.caption_en
                });
            } catch (error) {
                console.error('Failed to save caption:', error);
            }
        },

        set_as_default(aa: string) {
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

            try {
                await storage.deleteFile(config.gallery_pictures_storage, aa);
            } catch (ex) {
                console.error("Error deleting from storage:", ex);
            }

            try {
                await db.deleteDocument(config.website_db, config.album_images, bb);
            } catch (ex) {
                console.error("Error deleting from database:", ex);
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

.language-card {
    border-radius: 1rem !important;
    overflow: hidden;
}

.ge-section-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.9rem 1.15rem;
    color: white;
    font-weight: 600;
}

.ge-section-header--sky {
    background: linear-gradient(90deg, #0ea5e9, #38bdf8);
}

.ge-section-header--warning {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.ge-section-header--error {
    background: linear-gradient(90deg, #ef4444, #f87171);
}

.ge-image-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1rem;
}

@media (min-width: 640px) {
    .ge-image-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 768px) {
    .ge-image-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
    .ge-image-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.ge-image-card {
    border-radius: 1rem;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(14, 165, 233, 0.18);
    box-shadow: 0 4px 16px rgba(14, 165, 233, 0.08);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.dark .ge-image-card {
    background: rgba(30, 41, 59, 0.55);
    border-color: rgba(148, 163, 184, 0.16);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    color: #e2e8f0;
}

.ge-image-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(14, 165, 233, 0.15);
}

.ge-image-card.border-amber {
    border-color: rgba(245, 158, 11, 0.45);
}

.ge-image-card.border-red {
    border-color: rgba(239, 68, 68, 0.45);
}

.ge-thumb {
    width: 100%;
    height: 12rem;
    object-fit: cover;
    display: block;
}

.ge-badge {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.25rem 0.55rem;
    border-radius: 9999px;
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.ge-badge-right {
    left: auto;
    right: 0.5rem;
}

.ge-badge--amber { background: rgba(245, 158, 11, 0.9); }
.ge-badge--red { background: rgba(239, 68, 68, 0.9); }
.ge-badge--yellow { background: rgba(234, 179, 8, 0.9); }
.ge-badge--green { background: rgba(34, 197, 94, 0.9); }

.ge-card-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: flex-end;
    padding: 0.85rem;
}
</style>