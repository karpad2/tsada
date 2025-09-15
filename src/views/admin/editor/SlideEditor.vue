<template>
  <div class="slide-editor container px-5 mx-auto bg-white">
    <!-- Header Controls -->
    <section class="header-section mb-6">
      <div class="action-buttons flex gap-2 mb-4">
        <v-btn
          @click="saveCurrentSlide"
          :disabled="isLoading('save')"
          :loading="isLoading('save')"
          color="success"
        >
          {{ currentSlideId ? $t('save_changes') : $t('add_slide') }}
        </v-btn>
        <v-btn
          @click="resetSlideForm"
          :disabled="isAnyLoading()"
          color="secondary"
        >
          {{ $t('reset_form') }}
        </v-btn>
      </div>
    </section>

    <!-- Slide Management Section -->
    <section class="slide-form-section mb-6">
      <v-card class="pa-6" elevation="2">
        <v-card-title class="text-h6 mb-4">
          <v-icon left>mdi-monitor-screenshot</v-icon>
          {{ $t("edit_slide") }}
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="slideForm.title"
            :label="$t('title')"
            counter="100"
            outlined
            dense
            class="mb-4"
            @input="handleFieldChange"
          />

          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">{{ $t('content') }}</label>
            <ckeditor v-model="slideForm.content" @input="handleFieldChange" />
          </div>

          <!-- File Upload Section -->
          <FileUploadSection
            upload-type="image"
            :multiple="false"
            :preview-urls="slideImageUrl ? [slideImageUrl] : []"
            :uploaded-file-ids="slideForm.image ? [slideForm.image] : []"
            :storage-id="config.website_images"
            :show-actions="false"
            @files-uploaded="handleSlideImageUploaded"
          />
        </v-card-text>
      </v-card>
    </section>

    <!-- Slides List Section -->
    <section class="slides-list-section mb-12">
      <v-card elevation="2">
        <v-card-title class="text-h6">
          <v-icon left>mdi-view-list</v-icon>
          {{ $t('slides_list') }}
        </v-card-title>

        <v-card-text>
          <v-data-table
            :items="slides"
            :headers="slideHeaders"
            :loading="isLoading('fetch')"
            class="elevation-1"
          >
            <template v-slot:item.actions="{ item, index }">
              <div class="d-flex gap-2">
                <v-tooltip bottom>
                  <template v-activator="{ on, attrs }">
                    <v-btn
                      @click="editSlide(item.id)"
                      icon
                      small
                      color="primary"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('edit') }}</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template v-activator="{ on, attrs }">
                    <v-btn
                      @click="removeSlide(item.id)"
                      icon
                      small
                      color="error"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('delete') }}</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template v-activator="{ on, attrs }">
                    <v-btn
                      @click="moveSlideUp(index)"
                      icon
                      small
                      :disabled="index === 0"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-arrow-up</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('move_up') }}</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template v-activator="{ on, attrs }">
                    <v-btn
                      @click="moveSlideDown(index)"
                      icon
                      small
                      :disabled="index === slides.length - 1"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-arrow-down</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('move_down') }}</span>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </section>

    <!-- Event Management Section -->
    <section class="event-form-section mb-6">
      <v-card class="pa-6" elevation="2">
        <v-card-title class="text-h6 mb-4">
          <v-icon left>mdi-calendar-edit</v-icon>
          {{ $t("edit_events") }}
        </v-card-title>

        <v-card-text>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <v-text-field
              v-model="eventForm.title"
              :label="$t('event_title')"
              counter="100"
              outlined
              dense
              @input="handleFieldChange"
            />

            <v-text-field
              v-model="eventForm.date"
              :label="$t('event_date')"
              type="date"
              outlined
              dense
              @input="handleFieldChange"
            />
          </div>

          <div class="mb-4">
            <label class="text-subtitle-2 mb-2 d-block">{{ $t('event_description') }}</label>
            <ckeditor v-model="eventForm.description" @input="handleFieldChange" />
          </div>

          <!-- Event Image Upload -->
          <FileUploadSection
            upload-type="image"
            :multiple="false"
            :preview-urls="eventImageUrl ? [eventImageUrl] : []"
            :uploaded-file-ids="eventForm.image ? [eventForm.image] : []"
            :storage-id="config.website_images"
            :show-actions="false"
            @files-uploaded="handleEventImageUploaded"
          />

          <div class="mt-4">
            <v-btn
              @click="saveCurrentEvent"
              :disabled="isLoading('save')"
              :loading="isLoading('save')"
              color="success"
              class="mr-2"
            >
              {{ currentEventId ? $t('save_changes') : $t('add_event') }}
            </v-btn>

            <v-btn
              @click="resetEventForm"
              :disabled="isAnyLoading()"
              color="secondary"
            >
              {{ $t('reset_form') }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </section>

    <!-- Events List Section -->
    <section class="events-list-section">
      <v-card elevation="2">
        <v-card-title class="text-h6">
          <v-icon left>mdi-calendar-multiple</v-icon>
          {{ $t('events_list') }}
        </v-card-title>

        <v-card-text>
          <v-data-table
            :items="events"
            :headers="eventHeaders"
            :loading="isLoading('fetch')"
            class="elevation-1"
          >
            <template v-slot:item.actions="{ item, index }">
              <div class="d-flex gap-2">
                <v-tooltip bottom>
                  <template v-activator="{ on, attrs }">
                    <v-btn
                      @click="editEvent(item.id)"
                      icon
                      small
                      color="primary"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('edit') }}</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template v-activator="{ on, attrs }">
                    <v-btn
                      @click="removeEvent(item.id)"
                      icon
                      small
                      color="error"
                      v-bind="attrs"
                      v-on="on"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('delete') }}</span>
                </v-tooltip>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, reactive } from 'vue';
import moment from 'moment';
import { config } from '@/appwrite';
import {
  fetchTVContent,
  saveSlide,
  saveEvent,
  deleteTVContent,
  updateSlideOrder,
  moveArrayItem,
  LoadingManager,
  getFilePreview,
  SlideData,
  EventData
} from '@/utils/editorUtils';
import FileUploadSection from '@/components/shared/FileUploadSection.vue';

export default defineComponent({
  name: 'SlideEditor',
  components: {
    FileUploadSection
  },
  setup() {
    // Reactive data
    const slides = ref<SlideData[]>([]);
    const events = ref<EventData[]>([]);
    const currentSlideId = ref<string | null>(null);
    const currentEventId = ref<string | null>(null);
    const loadingManager = new LoadingManager();

    // Form data
    const slideForm = reactive({
      title: '',
      content: '',
      image: ''
    });

    const eventForm = reactive({
      title: '',
      description: '',
      date: '',
      image: ''
    });

    // Table headers
    const slideHeaders = [
      { text: 'Title', align: 'start', value: 'title' },
      { text: 'Created At', align: 'start', value: 'createdAt' },
      { text: 'Actions', align: 'end', value: 'actions', sortable: false }
    ];

    const eventHeaders = [
      { text: 'Title', align: 'start', value: 'title' },
      { text: 'Date', align: 'start', value: 'date' },
      { text: 'Actions', align: 'end', value: 'actions', sortable: false }
    ];

    // Computed properties for image previews
    const slideImageUrl = computed(() => {
      return slideForm.image ? getFilePreview(slideForm.image, config.website_images) : null;
    });

    const eventImageUrl = computed(() => {
      return eventForm.image ? getFilePreview(eventForm.image, config.website_images) : null;
    });

    // Loading state helpers
    const isLoading = (key: string) => loadingManager.isLoading(key);
    const isAnyLoading = () => loadingManager.isAnyLoading();

    // Fetch content from database
    const fetchContent = async () => {
      loadingManager.setLoading('fetch', true);
      try {
        const content = await fetchTVContent();
        slides.value = content.slides.map(slide => ({
          ...slide,
          createdAt: moment(slide.createdAt).format('YYYY-MM-DD')
        }));
        events.value = content.events.map(event => ({
          ...event,
          date: moment(event.date).format('YYYY-MM-DD')
        }));
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        loadingManager.setLoading('fetch', false);
      }
    };

    onMounted(() => {
      fetchContent();
    });
    // Slide management functions
    const editSlide = (id: string) => {
      const slide = slides.value.find(s => s.id === id);
      if (slide) {
        currentSlideId.value = id;
        slideForm.title = slide.title;
        slideForm.content = slide.text || '';
        slideForm.image = slide.image || '';
      }
    };

    const saveCurrentSlide = async () => {
      loadingManager.setLoading('save', true);
      try {
        const slideData = {
          title: slideForm.title,
          text: slideForm.content,
          image: slideForm.image,
          sorrend: slides.value.length
        };

        const savedId = await saveSlide(slideData, currentSlideId.value || undefined);
        currentSlideId.value = savedId;
        await fetchContent();
        resetSlideForm();
      } catch (error) {
        console.error('Error saving slide:', error);
      } finally {
        loadingManager.setLoading('save', false);
      }
    };

    const resetSlideForm = () => {
      currentSlideId.value = null;
      slideForm.title = '';
      slideForm.content = '';
      slideForm.image = '';
    };

    const removeSlide = async (id: string) => {
      if (!confirm('Are you sure you want to delete this slide?')) return;

      try {
        await deleteTVContent(id);
        await fetchContent();
      } catch (error) {
        console.error('Error deleting slide:', error);
      }
    };

    const moveSlideUp = (index: number) => {
      if (index > 0) {
        const newSlides = moveArrayItem(slides.value, index, index - 1);
        slides.value = newSlides;
        updateSlideOrder(newSlides);
      }
    };

    const moveSlideDown = (index: number) => {
      if (index < slides.value.length - 1) {
        const newSlides = moveArrayItem(slides.value, index, index + 1);
        slides.value = newSlides;
        updateSlideOrder(newSlides);
      }
    };
    // Event management functions
    const editEvent = (id: string) => {
      const event = events.value.find(e => e.id === id);
      if (event) {
        currentEventId.value = id;
        eventForm.title = event.title;
        eventForm.description = event.description;
        eventForm.date = event.date;
        eventForm.image = event.image || '';
      }
    };

    const saveCurrentEvent = async () => {
      loadingManager.setLoading('save', true);
      try {
        const eventData = {
          title: eventForm.title,
          description: eventForm.description,
          date: eventForm.date,
          image: eventForm.image
        };

        const savedId = await saveEvent(eventData, currentEventId.value || undefined);
        currentEventId.value = savedId;
        await fetchContent();
        resetEventForm();
      } catch (error) {
        console.error('Error saving event:', error);
      } finally {
        loadingManager.setLoading('save', false);
      }
    };

    const resetEventForm = () => {
      currentEventId.value = null;
      eventForm.title = '';
      eventForm.description = '';
      eventForm.date = '';
      eventForm.image = '';
    };

    const removeEvent = async (id: string) => {
      if (!confirm('Are you sure you want to delete this event?')) return;

      try {
        await deleteTVContent(id);
        await fetchContent();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    };
    // File upload handlers
    const handleSlideImageUploaded = async (uploadedFiles: any[]) => {
      if (uploadedFiles.length > 0) {
        slideForm.image = uploadedFiles[0].$id;
        handleFieldChange();
      }
    };

    const handleEventImageUploaded = async (uploadedFiles: any[]) => {
      if (uploadedFiles.length > 0) {
        eventForm.image = uploadedFiles[0].$id;
        handleFieldChange();
      }
    };

    const handleFieldChange = () => {
      // Trigger any change listeners or auto-save if needed
    };

    return {
      slides,
      events,
      slideForm,
      eventForm,
      currentSlideId,
      currentEventId,
      slideHeaders,
      eventHeaders,
      slideImageUrl,
      eventImageUrl,
      isLoading,
      isAnyLoading,
      fetchContent,
      editSlide,
      saveCurrentSlide,
      resetSlideForm,
      removeSlide,
      moveSlideUp,
      moveSlideDown,
      editEvent,
      saveCurrentEvent,
      resetEventForm,
      removeEvent,
      handleSlideImageUploaded,
      handleEventImageUploaded,
      handleFieldChange,
      config
    };
  }
});
</script>

<style scoped>
.slide-editor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.header-section {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.dark .header-section {
  background-color: #111827;
  border-color: #374151;
}

.slide-form-section,
.event-form-section {
  margin-bottom: 24px;
}

.slides-list-section,
.events-list-section {
  margin-bottom: 24px;
}

.action-buttons {
  gap: 12px;
}

.d-flex {
  display: flex;
}

.gap-2 {
  gap: 8px;
}

/* Card hover effects */
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* Button styles */
.v-btn {
  text-transform: none;
  font-weight: 500;
}

.v-btn.v-btn--icon {
  transition: all 0.2s ease;
}

.v-btn.v-btn--icon:hover {
  transform: scale(1.1);
}

/* Data table improvements */
.v-data-table {
  border-radius: 8px;
}

.v-data-table .v-data-table__wrapper {
  border-radius: 8px;
}

/* Grid utilities */
.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.gap-4 {
  gap: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mr-2 {
  margin-right: 8px;
}

/* Responsive design */
@media (max-width: 960px) {
  .slide-editor {
    padding: 16px;
  }

  .grid-cols-1 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .slide-editor {
    padding: 12px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .d-flex {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
