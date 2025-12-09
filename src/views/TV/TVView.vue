<template>
  <div class="relative h-screen w-full overflow-hidden bg-gray-900 text-white">
    <!-- Slide Background Presentation -->
    <div class="absolute inset-0 flex justify-center items-center" ref="slides">
      <transition name="fade-slide" mode="out-in">
        <div 
          v-if="slides.length > 0" 
          :key="currentSlide" 
          class="flex justify-center items-center w-full h-full px-12"
          :style="{ backgroundColor: slideBackgrounds[currentSlide % slideBackgrounds.length] }"
        >
          <!-- Slide Content with Image and Text -->
          <div class="flex flex-wrap items-center justify-center w-full max-w-5xl">
            <div v-if="slides[currentSlide].image" class="w-full md:w-1/2 p-4">
              <img
                :src="slides[currentSlide].image"
                alt="Slide Image"
                class="object-cover w-full h-96 rounded-lg shadow-lg"
                loading="lazy"
              />
            </div>
            <div :class="[slides[currentSlide].image ? 'w-full md:w-1/2' : 'w-full']" class="p-4">
              <h2 class="text-5xl font-extrabold mb-4 animate-fade-in-down text-center" v-html="slides[currentSlide].title"></h2>
              <p class="text-2xl max-w-3xl animate-fade-in-up text-center" v-html="slides[currentSlide].text"></p>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- News Ticker -->
    <div class="absolute bottom-0 w-full bg-gray-800 text-white flex items-center py-6 px-8">
      <img src="@/assets/tsada_logo.png" alt="School Logo" class="h-16 w-auto mr-6" loading="lazy" width="64" height="64" />
      <div class="flex overflow-hidden whitespace-nowrap animate-marquee space-x-12">
        <div v-for="(news, index) in newsItems" :key="index" class="flex-shrink-0 text-3xl">
          {{ news }}
        </div>
      </div>
      <div class="ml-auto pr-8 text-3xl">
        {{ currentTemperature ? `${currentTemperature}°C` : $t("loading") }}
      </div>
    </div>

    <!-- Current Date and Time -->
    <div class="absolute bottom-16 right-8 text-4xl font-bold">
      {{ currentDate }} - {{ currentTime }}
    </div>

    <!-- Recent Events Section -->
    <div class="absolute top-0 right-0 mt-16 mr-8 w-1/4 bg-gray-800 bg-opacity-70 p-4 rounded-lg shadow-lg">
      <h3 class="text-4xl font-bold mb-4 text-white">{{ $t("events") }}</h3>
      <div v-if="events.length === 0" class="text-lg text-gray-300">{{ $t("noevents") }}</div>
      <div v-for="(event, index) in events" :key="index" class="mb-4 border-b border-gray-700 pb-4">
        <!-- Event Image or Placeholder -->
        <img 
          v-if="event.image" 
          v-lazy="event.image" 
          alt="Event Image" 
          class="w-full h-32 object-cover rounded-lg mb-2" 
        />
        <div v-else class="w-full h-32 bg-gray-600 flex items-center justify-center text-gray-300 rounded-lg mb-2">
          <span>{{ $t("noimage") }}</span>
        </div>
        <h4 class="text-2xl font-semibold" v-html="event.title"></h4>
        <p class="text-gray-400 text-sm">{{ event.date }}</p>
        <p class="text-lg" v-html="event.description"></p>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import moment from 'moment';
import { Databases, Query, Storage } from 'appwrite';
import { config, appw } from "@/appwrite"; 

export default {
  data() {
    return {
      currentTime: '',
      currentDate: '',
      currentTemperature: null,
      currentSlide: 0,
      slides: [],
      newsItems: [],
      events: [], 
      slideBackgrounds: ['#f87171', '#60a5fa', '#34d399', '#a78bfa', '#fbbf24'],
      storage: null
    }
  },
  created() {
    this.storage = new Storage(appw);  // Initialize the Storage instance here
  },
  methods: {
    async updateTime() {
      try {
        const response = await fetch('https://share.tsada.edu.rs/__time__');
        if (!response.ok) {
          throw new Error('Failed to fetch time');
        }
        const data = await response.json();
        this.currentTime = moment(data.date).format('HH:mm:ss');
        this.currentDate = moment(data.date).format('YYYY-MM-DD');
      } catch (error) {
        console.warn("Falling back to local time due to error:", error);
        this.currentTime = moment().format('HH:mm:ss');
        this.currentDate = moment().format('YYYY-MM-DD');
      }
    },
    async fetchContent() {
      const database = new Databases(appw);
      try {
        const contentData = await database.listDocuments(config.website_db, config.tv_slides, [
          Query.orderAsc("sorrend")
        ]);
        
        this.slides = [];
        this.events = [];
        
        contentData.documents.forEach(doc => {
          const imageUrl = doc.image ? this.getImageUrl(doc.image) : null;
          if (doc.type === 'slide') {
            this.slides.push({
              title: doc.title,
              text: doc.text,
              image: imageUrl,
              order: doc.sorrend
            });
          } else if (doc.type === 'event') {
            this.events.push({
              title: doc.title,
              date: moment(doc.event_date).format('YYYY-MM-DD'),
              description: doc.description,
              image: imageUrl
            });
          }
        });

      } catch (error) {
        console.error("Error fetching content:", error);
      }
    },
    async fetchNewsItems() {
      const database = new Databases(appw);
      try {
        const newsData = await database.listDocuments(config.website_db, config.tv_slides);
        this.newsItems = newsData.documents.map(doc => doc.news_text);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    },
    async fetchTemperature() {
      const database = new Databases(appw);
      try {
        let k = await database.getDocument(config.website_db, config.general_settings, "temperature");
        this.currentTemperature = k.setting_data;
      } catch (error) {
        console.error("Error fetching temperature:", error);
        this.currentTemperature = "N/A"; // Fallback value
      }
    },
    getImageUrl(fileId) {
      return this.storage.getFileView(config.website_images, fileId).toString();
    }
  },
  mounted() {
    this.fetchContent();
    this.fetchNewsItems();
    this.fetchTemperature();

    this.updateTime();
    setInterval(this.updateTime, 1000);
    
    setInterval(() => {
      if (this.slides.length > 0) {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      }
    }, 15000);

    setInterval(this.fetchContent, 30000);
  }
}
</script>

<style scoped>
/* Slide Animation */
@keyframes slide-in {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.slide-animation {
  animation: slide-in 1s ease-out;
}

/* Title Animation */
@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-down {
  animation: fade-in-down 1s ease-out;
}

/* Text Animation */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fade-in-up 1s ease-out;
}

/* Marquee Animation */
@keyframes marquee {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}

.animate-marquee {
  animation: marquee 30s linear infinite;
}
</style>
