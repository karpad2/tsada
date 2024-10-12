<template>
  <div class="relative h-screen w-full overflow-hidden bg-gray-900 text-white">
    <!-- Background Presentation -->
    <div class="absolute inset-0" ref="slides">
      <transition name="fade-slide" mode="out-in">
        <div 
          v-if="slides.length > 0" 
          :key="currentSlide" 
          :class="['absolute inset-0 flex flex-col justify-center items-center text-center px-12', slideBackgrounds[currentSlide % slideBackgrounds.length], 'slide-animation']"
        >
          <img v-if="slides[currentSlide].image" :src="slides[currentSlide].image" alt="Slide Image" class="w-full h-64 object-cover mb-4 rounded-lg" />
          <h2 class="text-6xl font-extrabold mb-8 animate-fade-in-down">{{ slides[currentSlide].title }}</h2>
          <p class="text-3xl animate-fade-in-up max-w-4xl">{{ slides[currentSlide].text }}</p>
        </div>
      </transition>
    </div>

    <!-- News Ticker -->
    <div class="absolute bottom-0 w-full bg-gray-800 text-white flex items-center py-6 px-8">
      <img src="@/assets/tsada_logo.png" alt="School Logo" class="h-16 w-auto mr-6 animate-bounce" />
      <div class="flex overflow-hidden whitespace-nowrap animate-marquee space-x-12">
        <div v-for="(news, index) in newsItems" :key="index" class="flex-shrink-0 text-3xl">
          {{ news }}
        </div>
      </div>
      <div class="ml-auto pr-8 text-3xl animate-pulse">
        {{ currentTemperature ? `${currentTemperature}°C` : 'Loading...' }}
      </div>
    </div>

    <!-- Current Date and Time -->
    <div class="absolute bottom-16 right-8 text-4xl font-bold animate-pulse">
      {{ currentDate }} - {{ currentTime }}
    </div>

    <!-- Recent Events Section -->
    <div class="absolute top-0 right-0 mt-16 mr-8 w-1/4 bg-gray-800 bg-opacity-70 p-4 rounded-lg shadow-lg">
      <h3 class="text-4xl font-bold mb-4 text-white">Recent Events</h3>
      <div v-if="events.length === 0" class="text-lg text-gray-300">No recent events available.</div>
      <div v-for="(event, index) in events" :key="index" class="mb-4 border-b border-gray-700 pb-4">
        <img :src="event.image" alt="Event Image" class="w-full h-32 object-cover rounded-lg mb-2" />
        <h4 class="text-2xl font-semibold">{{ event.title }}</h4>
        <p class="text-gray-400 text-sm">{{ event.date }}</p>
        <p class="text-lg">{{ event.description }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import moment from 'moment';
import { Databases, Query } from 'appwrite';
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
      events: [], // Data property for recent events
      slideBackgrounds: [
        'bg-red-500', 
        'bg-blue-500', 
        'bg-gradient-to-r from-green-400 to-blue-600', 
        'bg-purple-500', 
        'bg-gradient-to-r from-yellow-400 to-red-500'
      ]
    }
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
    async fetchSlides() {
      const database = new Databases(appw);
      try {
        const slideData = await database.listDocuments(config.website_db, config.tv_slides, [
          Query.orderAsc("sorrend")
        ]);
        const newSlides = slideData.documents.map(doc => ({
          title: doc.title,
          text: doc.text,
          image: doc.image, // Assuming the image field contains the URL of the slide image
          order: doc.sorrend
        }));

        // Update only if the slides have changed
        if (JSON.stringify(newSlides) !== JSON.stringify(this.slides)) {
          this.slides = newSlides;
          console.log("Slides updated with new content.");
        }
      } catch (error) {
        console.error("Error fetching slides:", error);
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
    async fetchEvents() {
      const database = new Databases(appw);
      try {
        const eventsData = await database.listDocuments(config.website_db, config.events_collection, [
          Query.orderDesc("event_date"),
          Query.limit(5) // Limit to 5 recent events
        ]);
        this.events = eventsData.documents.map(doc => ({
          title: doc.title,
          date: moment(doc.event_date).format('YYYY-MM-DD'),
          description: doc.description,
          image: doc.image // Assuming each document has an `image` field with the URL
        }));
      } catch (error) {
        console.error("Error fetching recent events:", error);
      }
    }
  },
  mounted() {
    this.fetchSlides();
    this.fetchNewsItems();
    this.fetchTemperature();
    this.fetchEvents();

    this.updateTime();
    setInterval(this.updateTime, 1000); // Update time every second
    
    setInterval(() => {
      if (this.slides.length > 0) {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      }
    }, 15000); // Change slide every 15 seconds

    // Polling for new slides every 30 seconds
    setInterval(this.fetchSlides, 30000); // Adjust interval time as needed
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

/* Bounce Animation */
.animate-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Pulse Animation */
.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Fade Slide Animation */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 1s, transform 1s;
}
.fade-slide-enter, .fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
