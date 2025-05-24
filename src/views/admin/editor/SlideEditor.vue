<template>
  <div class="container mx-auto py-8">
    <!-- Slide Management Section -->
    <section class="mb-12 p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-4">{{ $t("edit_slide") }}</h2>
      
      <v-text-field v-model="title" :label="$t('title')" counter="100" hide-details></v-text-field>
      <ckeditor v-model="content"></ckeditor>
      
      <v-file-input @change="fileUpload" v-model="fileLink" accept="image/*" label="Slide Image Upload"></v-file-input>
      <div v-if="img" class="my-4">
        <span>{{ $t("preview") }}:</span>
        <img class="h-40 w-auto rounded" v-lazy="img" alt="Slide Image">
      </div>

      <v-btn @click="saveSlide" class="mt-5">{{ currentSlideId ? 'Save Changes' : 'Add Slide' }}</v-btn>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">Slides</h2>
      <v-data-table :items="slides" :headers="slideHeaders">
        <template v-slot:item.actions="{ item, index }">
          <div class="flex space-x-2">
            <v-btn @click="editSlide(item.id)" icon>
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn @click="removeSlide(item.id)" icon>
              <v-icon>mdi-delete</v-icon>
            </v-btn>
            <v-btn @click="moveSlideUp(index)" icon :disabled="index === 0">
              <v-icon>mdi-arrow-up</v-icon>
            </v-btn>
            <v-btn @click="moveSlideDown(index)" icon :disabled="index === slides.length - 1">
              <v-icon>mdi-arrow-down</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </section>

    <!-- Event Management Section -->
    <section class="mt-12 p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-4">{{$t("edit_events")}}</h2>
      
      <v-text-field v-model="eventTitle" label="Event Title" counter="100" hide-details></v-text-field>
      <v-text-field v-model="eventDate" label="Event Date" type="date" hide-details></v-text-field>
      <ckeditor v-model="eventDescription"></ckeditor>

      <v-file-input @change="eventFileUpload" v-model="eventFileLink" accept="image/*" label="Event Image Upload"></v-file-input>
      <div v-if="eventImg" class="my-4">
        <span>Preview:</span>
        <img class="h-40 w-auto rounded" :src="eventImg" alt="Event Image">
      </div>

      <v-btn @click="saveEvent" class="mt-5">{{ currentEventId ? $t("save") : 'Add Event' }}</v-btn>
    </section>

    <section>
      <h2 class="text-2xl font-bold mb-4">{{ $t("events") }}</h2>
      <v-data-table :items="events" :headers="eventHeaders">
        <template v-slot:item.actions="{ item, index }">
          <div class="flex space-x-2">
            <v-btn @click="editEvent(item.id)" icon>
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn @click="removeEvent(item.id)" icon>
              <v-icon>mdi-delete</v-icon>
            </v-btn>
            <v-btn @click="moveEventUp(index)" icon :disabled="index === 0">
              <v-icon>mdi-arrow-up</v-icon>
            </v-btn>
            <v-btn @click="moveEventDown(index)" icon :disabled="index === events.length - 1">
              <v-icon>mdi-arrow-down</v-icon>
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </section>
  </div>
</template>

<script>
import { Databases, ID, Storage, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import moment from 'moment';

export default {
  data() {
    return {
      slides: [],
      currentSlideId: null,
      title: "",
      content: "",
      fileLink: null,
      img: "",
      imageId: "",
      slideHeaders: [
        { text: "Title", align: 'start', value: 'title' },
        { text: "Created At", align: 'start', value: 'createdAt' },
        { text: "Actions", align: 'end', value: 'actions', sortable: false }
      ],

      events: [],
      currentEventId: null,
      eventTitle: "",
      eventDescription: "",
      eventDate: "",
      eventFileLink: null,
      eventImg: "",
      eventImageId: "",
      eventHeaders: [
        { text: "Title", align: 'start', value: 'title' },
        { text: "Date", align: 'start', value: 'date' },
        { text: "Actions", align: 'end', value: 'actions', sortable: false }
      ]
    };
  },
  mounted() {
    this.fetchContent();
  },
  methods: {
    async fetchContent() {
      const database = new Databases(appw);
      const storage = new Storage(appw);
      try {
        const contentData = await database.listDocuments(config.website_db, config.tv_slides);
        this.slides = [];
        this.events = [];

        for (const doc of contentData.documents) {
          const imageUrl = doc.image ? storage.getFileView(config.website_images, doc.image).toString() : null;
          if (doc.type === 'slide') {
            this.slides.push({
              id: doc.$id,
              title: doc.title,
              createdAt: moment(doc.$createdAt).format('YYYY-MM-DD'),
              sorrend: parseInt(doc.sorrend),
              image: imageUrl
            });
          } else if (doc.type === 'event') {
            this.events.push({
              id: doc.$id,
              title: doc.title,
              date: moment(doc.event_date).format('YYYY-MM-DD'),
              description: doc.description,
              image: imageUrl
            });
          }
        }

        this.slides.sort((a, b) => a.sorrend - b.sorrend);
      } catch (error) {
        console.error("Error fetching content:", error);
      }
    },
    editSlide(id) {
      const slide = this.slides.find(s => s.id === id);
      if (slide) {
        this.currentSlideId = id;
        this.title = slide.title;
        this.content = slide.text;
        this.img = slide.image;
        this.imageId = slide.imageId;
      }
    },
    async saveSlide() {
      const database = new Databases(appw);
      const slideData = {
        type: 'slide',
        title: this.title,
        text: this.content,
        image: this.imageId,
        sorrend: this.slides.length.toString()
      };

      try {
        let slideId;
        if (this.currentSlideId === null) {
          const result = await database.createDocument(config.website_db, config.tv_slides, ID.unique(), slideData);
          slideId = result.$id;
        } else {
          await database.updateDocument(config.website_db, config.tv_slides, this.currentSlideId, slideData);
          slideId = this.currentSlideId;
        }
        this.currentSlideId = slideId;
        this.fetchContent();
        this.resetSlideForm();
      } catch (error) {
        console.error("Error saving slide:", error);
      }
    },
    resetSlideForm() {
      this.currentSlideId = null;
      this.title = "";
      this.content = "";
      this.fileLink = null;
      this.img = "";
      this.imageId = "";
    },
    async removeSlide(id) {
      const database = new Databases(appw);
      try {
        await database.deleteDocument(config.website_db, config.tv_slides, id);
        this.fetchContent();
      } catch (error) {
        console.error("Error deleting slide:", error);
      }
    },
    moveSlideUp(index) {
      if (index > 0) {
        const temp = this.slides[index - 1];
        this.slides[index - 1] = this.slides[index];
        this.slides[index] = temp;
        this.updateSlideOrder();
      }
    },
    moveSlideDown(index) {
      if (index < this.slides.length - 1) {
        const temp = this.slides[index + 1];
        this.slides[index + 1] = this.slides[index];
        this.slides[index] = temp;
        this.updateSlideOrder();
      }
    },
    async updateSlideOrder() {
      const database = new Databases(appw);
      this.slides.forEach(async (slide, index) => {
        slide.sorrend = index.toString();
        await database.updateDocument(config.website_db, config.tv_slides, slide.id, { sorrend: slide.sorrend });
      });
    },

    /* Event Management Functions */
    editEvent(id) {
      const event = this.events.find(e => e.id === id);
      if (event) {
        this.currentEventId = id;
        this.eventTitle = event.title;
        this.eventDescription = event.description;
        this.eventDate = event.date;
        this.eventImg = event.image;
        this.eventImageId = event.imageId;
      }
    },
    async saveEvent() {
      const database = new Databases(appw);
      const eventData = {
        type: 'event',
        title: this.eventTitle,
        description: this.eventDescription,
        event_date: this.eventDate,
        image: this.eventImageId
      };

      try {
        let eventId;
        if (this.currentEventId === null) {
          const result = await database.createDocument(config.website_db, config.tv_slides, ID.unique(), eventData);
          eventId = result.$id;
        } else {
          await database.updateDocument(config.website_db, config.tv_slides, this.currentEventId, eventData);
          eventId = this.currentEventId;
        }
        this.currentEventId = eventId;
        this.fetchContent();
        this.resetEventForm();
      } catch (error) {
        console.error("Error saving event:", error);
      }
    },
    resetEventForm() {
      this.currentEventId = null;
      this.eventTitle = "";
      this.eventDescription = "";
      this.eventDate = "";
      this.eventFileLink = null;
      this.eventImg = "";
      this.eventImageId = "";
    },
    async removeEvent(id) {
      const database = new Databases(appw);
      try {
        await database.deleteDocument(config.website_db, config.tv_slides, id);
        this.fetchContent();
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    },
    moveEventUp(index) {
      if (index > 0) {
        const temp = this.events[index - 1];
        this.events[index - 1] = this.events[index];
        this.events[index] = temp;
        this.updateEventOrder();
      }
    },
    moveEventDown(index) {
      if (index < this.events.length - 1) {
        const temp = this.events[index + 1];
        this.events[index + 1] = this.events[index];
        this.events[index] = temp;
        this.updateEventOrder();
      }
    },
    async updateEventOrder() {
      const database = new Databases(appw);
      this.events.forEach(async (event, index) => {
        event.sorrend = index.toString();
        await database.updateDocument(config.website_db, config.tv_slides, event.id, { sorrend: event.sorrend });
      });
    }
  }
};
</script>

<style scoped>
/* Styling adjustments */
</style>
