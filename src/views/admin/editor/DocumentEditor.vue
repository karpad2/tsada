<template>
    <div class="document-editor">
      <!-- Loading overlay -->
      <v-overlay :value="isLoading" absolute>
        <v-progress-circular indeterminate size="64"></v-progress-circular>
      </v-overlay>
  
      <!-- Header with actions -->
      <v-card class="mb-4 header-card" elevation="2">
        <v-card-title class="pb-2 header-gradient white--text">
          <v-icon left color="white">mdi-file-document-edit</v-icon>
          {{ $t('document_editor') }}
          
          <v-spacer></v-spacer>
          
          <!-- Action buttons -->
          <div class="action-buttons">
            <v-btn 
              color="success" 
              :disabled="!hasChanges || isUploading"
              :loading="isSaving"
              @click="saveDocument"
              class="mr-2"
              :class="{ pulse: hasChanges && !isSaving }"
            >
              <v-icon left>mdi-content-save</v-icon>
              {{ $t('save') }}
            </v-btn>
            
            <v-btn 
              color="error" 
              @click="confirmDelete"
              :disabled="isUploading || isSaving"
            >
              <v-icon left>mdi-delete</v-icon>
              {{ $t('delete') }}
            </v-btn>
          </div>
        </v-card-title>
      </v-card>
  
      <!-- File upload section -->
      <v-card class="mb-4 upload-card" elevation="1">
        <v-card-title class="subtitle-1 card-header">
          <v-icon left>mdi-upload</v-icon>
          {{ $t('file_management') }}
        </v-card-title>
        
        <v-card-text>
          <div class="upload-area" :class="{ 'has-file': currentDocumentId, 'drag-over': isDragOver }">
            <v-file-input
              v-model="fileToUpload"
              @change="handleFileChange"
              @dragover="isDragOver = true"
              @dragleave="isDragOver = false"
              @drop="isDragOver = false"
              accept="document/*"
              :label="$t('fileupload')"
              :loading="isUploading"
              :disabled="isUploading"
              prepend-icon="mdi-paperclip"
              show-size
              clearable
              class="file-input-custom"
            >
              <template #selection="{ text }">
                <v-chip small color="primary" class="ma-1">
                  <v-icon left small>mdi-file</v-icon>
                  {{ text }}
                </v-chip>
              </template>
            </v-file-input>
  
            <!-- Upload progress -->
            <div v-if="isUploading" class="upload-progress mt-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="caption">{{ $t('uploading') }}...</span>
                <span class="caption">{{ uploadProgress }}%</span>
              </div>
              <v-progress-linear
                :value="uploadProgress"
                color="primary"
                height="8"
                rounded
              ></v-progress-linear>
            </div>
            
            <!-- Current file info -->
            <v-alert
              v-if="currentDocumentId && !isUploading"
              type="info"
              dense
              text
              class="mt-3"
            >
              <v-icon left small>mdi-file-check</v-icon>
              {{ $t('file_attached') }}: {{ currentDocumentId }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
  
      <!-- Multi-language titles -->
      <v-card class="titles-card" elevation="1">
        <v-card-title class="subtitle-1 card-header">
          <v-icon left>mdi-translate</v-icon>
          {{ $t('multilingual_titles') }}
          
          <v-spacer></v-spacer>
          
          <!-- Progress indicator -->
          <v-chip small :color="completedTitles === languages.length ? 'success' : 'warning'">
            {{ completedTitles }}/{{ languages.length }}
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <v-row class="language-inputs">
            <v-col 
              v-for="lang in languages" 
              :key="lang.code"
              cols="12" 
              md="4"
            >
              <v-text-field
                v-model="titles[lang.code]"
                :label="`${$t('title')} (${lang.name})`"
                :counter="titleMaxLength"
                :rules="titleRules"
                @input="onTitleChange"
                :prepend-inner-icon="lang.icon"
                dense
                outlined
                clearable
                class="language-field"
                :class="{ 
                  'filled': titles[lang.code],
                  'success--text': titles[lang.code] && titles[lang.code].length <= titleMaxLength
                }"
              >
                <template #append>
                  <v-tooltip bottom>
                    <template #activator="{ on, attrs }">
                      <v-icon 
                        v-bind="attrs" 
                        v-on="on" 
                        small 
                        :color="titles[lang.code] ? 'success' : 'grey'"
                      >
                        {{ titles[lang.code] ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                      </v-icon>
                    </template>
                    <span>{{ titles[lang.code] ? $t('title_filled') : $t('title_empty') }}</span>
                  </v-tooltip>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
  
          <!-- Language status overview -->
          <div class="language-status mt-4">
            <div class="language-progress mb-3">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="subtitle-2">{{ $t('completion_progress') }}</span>
                <span class="caption">{{ Math.round((completedTitles / languages.length) * 100) }}%</span>
              </div>
              <v-progress-linear
                :value="(completedTitles / languages.length) * 100"
                color="primary"
                height="6"
                rounded
              ></v-progress-linear>
            </div>
  
            <v-chip-group class="d-flex justify-center">
              <v-chip 
                v-for="lang in languages" 
                :key="lang.code"
                :color="titles[lang.code] ? 'success' : 'grey'"
                small
                class="language-chip"
                :text-color="titles[lang.code] ? 'white' : 'black'"
              >
                <v-icon left small>{{ lang.icon }}</v-icon>
                {{ lang.name }}
                <v-icon right small>
                  {{ titles[lang.code] ? 'mdi-check' : 'mdi-minus' }}
                </v-icon>
              </v-chip>
            </v-chip-group>
          </div>
        </v-card-text>
      </v-card>
  
      <!-- Debug Panel (csak development módban) -->
      <v-card v-if="$NODE_ENV === 'development'" class="mt-4" color="grey lighten-4">
        <v-card-title class="subtitle-2">Debug Information</v-card-title>
        <v-card-text>
          <pre>{{ debugInfo }}</pre>
        </v-card-text>
      </v-card>
  
      <!-- Delete confirmation dialog -->
      <v-dialog v-model="showDeleteDialog" max-width="400">
        <v-card>
          <v-card-title class="headline error--text">
            <v-icon left color="error">mdi-alert-circle</v-icon>
            {{ $t('confirm_delete') }}
          </v-card-title>
          
          <v-card-text>
            {{ $t('delete_confirmation_message') }}
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showDeleteDialog = false">
              {{ $t('cancel') }}
            </v-btn>
            <v-btn color="error" @click="deleteDocument" :loading="isDeleting">
              {{ $t('delete') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- Unsaved changes dialog -->
      <v-dialog v-model="showUnsavedDialog" max-width="400" persistent>
        <v-card>
          <v-card-title class="headline warning--text">
            <v-icon left color="warning">mdi-alert</v-icon>
            {{ $t('unsaved_changes') }}
          </v-card-title>
          
          <v-card-text>
            {{ $t('unsaved_changes_message') }}
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="discardChanges">
              {{ $t('discard') }}
            </v-btn>
            <v-btn color="primary" @click="saveAndProceed" :loading="isSaving">
              {{ $t('save_and_continue') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </template>
  
  <script lang="ts">
  import { Client, Databases, ID, Storage, Query, Functions } from "appwrite";
  import { appw, config } from "@/appwrite";
  import { useLoadingStore } from "@/stores/loading";
  
  interface Language {
    code: string;
    name: string;
    icon: string;
  }
  
  interface DocumentData {
    document_title_rs: string;
    document_title_hu: string;
    document_title_en: string;
    document_id: string;
  }
  
  interface TitleData {
    rs: string;
    hu: string;
    en: string;
  }
  
  export default {
    name: 'DocumentEditor',
    
    props: {
      modded: {
        type: String,
        required: true,
        validator: (value: string) => 
          ['documents_db', 'st_documents', 'text_documents'].includes(value)
      }
    },
  
    data() {
      return {
        // Document data
        titles: {
          rs: '',
          hu: '',
          en: ''
        } as TitleData,
        currentDocumentId: '',
        originalData: {} as DocumentData,
        
        // UI state
        isLoading: false,
        isUploading: false,
        isSaving: false,
        isDeleting: false,
        isDragOver: false,
        uploadProgress: 0,
        fileToUpload: null as File | null,
        showDeleteDialog: false,
        showUnsavedDialog: false,
        pendingNavigation: null as (() => void) | null,
  
        // Configuration
        titleMaxLength: 100,
        languages: [
          { code: 'rs', name: 'Српски', icon: 'mdi-flag' },
          { code: 'hu', name: 'Magyar', icon: 'mdi-flag-outline' },
          { code: 'en', name: 'English', icon: 'mdi-flag-variant' }
        ] as Language[],
        
        // Database clients
        database: new Databases(appw),
        storage: new Storage(appw),
        
        // Auto-save timer
        autoSaveTimer: null as NodeJS.Timeout | null
      };
    },
  
    computed: {
      titleRules() {
        return [
          (v: string) => !v || v.length <= this.titleMaxLength || 
            this.$t('title_too_long', { max: this.titleMaxLength })
        ];
      },
  
      hasChanges(): boolean {
        return (
          this.titles.rs !== this.originalData.document_title_rs ||
          this.titles.hu !== this.originalData.document_title_hu ||
          this.titles.en !== this.originalData.document_title_en ||
          this.currentDocumentId !== this.originalData.document_id
        );
      },
  
      completedTitles(): number {
        return Object.values(this.titles).filter(title => title.trim()).length;
      },
  
      documentId(): string {
        return this.$route.params.id as string;
      },
  
      debugInfo() {
        return {
          documentId: this.documentId,
          currentDocumentId: this.currentDocumentId,
          hasChanges: this.hasChanges,
          completedTitles: this.completedTitles,
          isLoading: this.isLoading,
          modded: this.modded,
          collectionId: this.getCollectionId()
        };
      }
    },
  
    watch: {
      // Auto-save amikor változik a cím
      titles: {
        handler() {
          this.scheduleAutoSave();
        },
        deep: true
      }
    },
  
    async mounted() {
      console.log('🚀 DocumentEditor mounted');
      console.log('Props:', { modded: this.modded });
      console.log('Route:', this.$route);
      
      // Validate configuration first
      if (!this.validateConfiguration()) {
        return; // Stop execution if config is invalid
      }
      
      await this.loadDocument();
      this.setupBeforeUnloadHandler();
    },
  
    beforeDestroy() {
      this.cleanupBeforeUnloadHandler();
      this.clearAutoSaveTimer();
    },
  
    methods: {
      validateConfiguration(): boolean {
        const collectionId = this.getCollectionId();
        if (!collectionId) {
          console.error('Invalid modded prop:', this.modded);
          this.$notify({
            type: 'error',
            text: this.$t('invalid_configuration')
          });
          this.$router.push('/home');
          return false;
        }
  
        if (!config.website_db || !config.documents_storage) {
          console.error('Missing configuration:', { 
            website_db: config.website_db, 
            documents_storage: config.documents_storage 
          });
          this.$notify({
            type: 'error',
            text: this.$t('configuration_error')
          });
          return false;
        }
  
        return true;
      },
  
      getCollectionId(): string {
        const collectionMap = {
          documents_db: config.documents_db,
          st_documents: config.st_documents,
          text_documents: config.text_documents
        };
        
        return collectionMap[this.modded as keyof typeof collectionMap] || '';
      },
  
      async loadDocument(): Promise<void> {
        this.isLoading = true;
        
        try {
          const document = await this.database.getDocument(
            config.website_db,
            this.getCollectionId(),
            this.documentId
          );
  
          // Set current data
          this.titles = {
            rs: document.document_title_rs || '',
            hu: document.document_title_hu || '',
            en: document.document_title_en || ''
          };
          this.currentDocumentId = document.document_id || '';
  
          // Store original data for change detection
          this.originalData = {
            document_title_rs: document.document_title_rs || '',
            document_title_hu: document.document_title_hu || '',
            document_title_en: document.document_title_en || '',
            document_id: document.document_id || ''
          };
  
          this.$notify({
            type: 'success',
            text: this.$t('document_loaded')
          });
  
        } catch (error) {
          console.error('Error loading document:', error);
          this.$notify({
            type: 'error',
            text: this.$t('error_loading_document')
          });
          this.$router.push('/home');
        } finally {
          this.isLoading = false;
        }
      },
  
      async saveDocument(): Promise<void> {
        if (!this.hasChanges) {
          this.$notify({
            type: 'info',
            text: this.$t('no_changes_to_save')
          });
          return;
        }
  
        this.isSaving = true;
  
        try {
          await this.database.updateDocument(
            config.website_db,
            this.getCollectionId(),
            this.documentId,
            {
              document_title_rs: this.titles.rs,
              document_title_hu: this.titles.hu,
              document_title_en: this.titles.en,
              document_id: this.currentDocumentId
            }
          );
  
          // Update original data
          this.originalData = {
            document_title_rs: this.titles.rs,
            document_title_hu: this.titles.hu,
            document_title_en: this.titles.en,
            document_id: this.currentDocumentId
          };
  
          this.$notify({
            type: 'success',
            text: this.$t('document_saved')
          });
  
        } catch (error) {
          console.error('Error saving document:', error);
          this.$notify({
            type: 'error',
            text: this.$t('error_saving_document')
          });
        } finally {
          this.isSaving = false;
        }
      },
  
      scheduleAutoSave(): void {
        this.clearAutoSaveTimer();
        
        if (this.hasChanges) {
          this.autoSaveTimer = setTimeout(() => {
            this.saveDocument();
          }, 5000); // Auto-save 5 másodperc után
        }
      },
  
      clearAutoSaveTimer(): void {
        if (this.autoSaveTimer) {
          clearTimeout(this.autoSaveTimer);
          this.autoSaveTimer = null;
        }
      },
  
      confirmDelete(): void {
        this.showDeleteDialog = true;
      },
  
      async deleteDocument(): Promise<void> {
        this.showDeleteDialog = false;
        this.isDeleting = true;
  
        try {
          // Delete file if exists
          if (this.currentDocumentId) {
            try {
              await this.storage.deleteFile(config.documents_storage, this.currentDocumentId);
            } catch (error) {
              console.warn('File deletion failed:', error);
            }
          }
  
          // Delete document
          await this.database.deleteDocument(
            config.website_db,
            this.getCollectionId(),
            this.documentId
          );
  
          this.$notify({
            type: 'success',
            text: this.$t('document_deleted')
          });
  
          this.$router.push('/home');
  
        } catch (error) {
          console.error('Error deleting document:', error);
          this.$notify({
            type: 'error',
            text: this.$t('error_deleting_document')
          });
        } finally {
          this.isDeleting = false;
        }
      },
  
      handleFileChange(): void {
        if (this.fileToUpload) {
          this.uploadFile();
        }
      },
  
      async uploadFile(): Promise<void> {
        if (!this.fileToUpload) return;
  
        // Fájl validáció
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (this.fileToUpload.size > maxSize) {
          this.$notify({
            type: 'error',
            text: this.$t('file_too_large')
          });
          this.fileToUpload = null;
          return;
        }
  
        this.isUploading = true;
        this.uploadProgress = 0;
  
        try {
          this.$notify({
            type: 'info',
            text: this.$t('file_upload_in_progress')
          });
  
          // Simulate progress with real intervals
          const progressInterval = setInterval(() => {
            if (this.uploadProgress < 90) {
              this.uploadProgress += Math.random() * 15;
            }
          }, 300);
  
          const result = await this.storage.createFile(
            config.documents_storage,
            ID.unique(),
            this.fileToUpload
          );
  
          clearInterval(progressInterval);
          this.uploadProgress = 100;
  
          // Update document ID and save
          this.currentDocumentId = result.$id;
          
          // Auto-save after successful upload
          await this.saveDocument();
  
          this.$notify({
            type: 'success',
            text: this.$t('file_uploaded')
          });
  
        } catch (error) {
          console.error('Error uploading file:', error);
          this.$notify({
            type: 'error',
            text: this.$t('error_uploading_file')
          });
        } finally {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.fileToUpload = null;
        }
      },
  
      onTitleChange(): void {
        // Ezt már a watcher kezeli az auto-save-vel
      },
  
      setupBeforeUnloadHandler(): void {
        window.addEventListener('beforeunload', this.handleBeforeUnload);
      },
  
      cleanupBeforeUnloadHandler(): void {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
      },
  
      handleBeforeUnload(event: BeforeUnloadEvent): string | void {
        if (this.isUploading) {
          const message = this.$t('file_still_uploading');
          event.preventDefault();
          event.returnValue = message;
          return message;
        }
  
        if (this.hasChanges) {
          const message = this.$t('unsaved_changes_warning');
          event.preventDefault();
          event.returnValue = message;
          return message;
        }
      },
  
      saveAndProceed(): void {
        this.saveDocument().then(() => {
          this.showUnsavedDialog = false;
          if (this.pendingNavigation) {
            this.pendingNavigation();
            this.pendingNavigation = null;
          }
        });
      },
  
      discardChanges(): void {
        this.showUnsavedDialog = false;
        if (this.pendingNavigation) {
          this.pendingNavigation();
          this.pendingNavigation = null;
        }
      }
    },
  
    // Navigation guard
    beforeRouteLeave(to, from, next) {
      if (this.hasChanges) {
        this.pendingNavigation = () => next();
        this.showUnsavedDialog = true;
      } else {
        next();
      }
    }
  };
  </script>
  
  <style scoped>
  .document-editor {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }
  
  /* Header styling */
  .header-card {
    border-radius: 20px !important;
    overflow: hidden;
    margin-bottom: 2rem;
  }
  
  .header-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;
  }
  
  .header-gradient::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.3;
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
  }
  
  .pulse {
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
    }
  }
  
  /* Loading overlay */
  .loading-overlay {
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(10px);
  }
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #333;
  }
  
  /* Card styling */
  .upload-card, .titles-card {
    border-radius: 16px !important;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }
  
  .upload-card:hover, .titles-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
  
  .card-header {
    border-bottom: 1px solid #f0f0f0;
  }
  
  /* Upload area styling */
  .upload-area {
    border: 2px dashed #e0e0e0;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    background: rgba(248, 250, 252, 0.8);
  }
  
  .upload-area.drag-over {
    border-color: #1976d2;
    background: rgba(25, 118, 210, 0.05);
    transform: scale(1.02);
  }
  
  .upload-area.has-file {
    border-color: #4caf50;
    background: rgba(76, 175, 80, 0.05);
  }
  
  .file-input-custom .v-input__slot {
    border-radius: 8px !important;
  }
  
  .upload-progress {
    background: rgba(255, 255, 255, 0.9);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #e3f2fd;
  }
  
  /* Language input styling */
  .language-inputs {
    gap: 16px;
  }
  
  .language-field {
    position: relative;
    transition: all 0.3s ease;
  }
  
  .language-field.filled {
    transform: scale(1.02);
  }
  
  .custom-input.success--text .v-input__slot {
    border-color: #4caf50 !important;
    background: rgba(76, 175, 80, 0.02);
  }
  
  .language-progress {
    background: rgba(255, 255, 255, 0.7);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(25, 118, 210, 0.1);
  }
  
  /* Language status - csak amikor van tartalom */
  .language-status {
    background: rgba(248, 250, 252, 0.8);
    padding: 16px;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .language-chip {
    margin: 4px !important;
    transition: all 0.3s ease;
  }
  
  .language-chip:hover {
    transform: translateY(-1px);
  }
  
  /* Empty state styling */
  .empty-state {
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
  
  .empty-state:hover {
    opacity: 1;
  }
  
  /* Optional field styling */
  .optional-field {
    border-left: 3px solid #e0e0e0 !important;
  }
  
  .optional-field.filled {
    border-left-color: #4caf50 !important;
  }
  
  /* Dialog enhancements */
  .v-dialog .v-card {
    border-radius: 20px !important;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2) !important;
  }
  
  /* Debug panel */
  .v-card.grey.lighten-4 {
    border-radius: 8px !important;
    background: rgba(245, 245, 245, 0.95) !important;
  }
  
  /* Responsive design */
  @media (max-width: 960px) {
    .document-editor {
      padding: 16px;
    }
    
    .header-card .v-card-title {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }
    
    .action-buttons {
      justify-content: center;
    }
    
    .language-inputs .v-col {
      margin-bottom: 8px;
    }
  }
  
  @media (max-width: 600px) {
    .document-editor {
      padding: 12px;
    }
    
    .upload-area {
      padding: 16px;
    }
    
    .language-status {
      padding: 16px;
    }
    
    .v-chip-group {
      justify-content: center !important;
    }
  }
  
  /* Smooth transitions */
  * {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  </style>