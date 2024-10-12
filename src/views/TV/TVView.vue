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
  
      <!-- Current Time -->
      <div class="absolute bottom-16 right-8 text-4xl font-bold animate-pulse">
        {{ currentTime }}
      </div>
    </div>
  </template>
  
  <script>
  import { onMounted } from 'vue';
  import { Databases, Query } from 'appwrite';
  import { config, appw } from "@/appwrite"; 
  
  export default {
    data() {
      return {
        currentTime: '',
        currentTemperature: null,
        currentSlide: 0,
        slides: [],
        newsItems: [],
        // Array of Tailwind CSS color and gradient classes for slide backgrounds
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
      updateTime() {
        const now = new Date();
        this.currentTime = now.toLocaleTimeString();
      },
      async fetchSlides() {
        const database = new Databases(appw);
        try {
          const slideData = await database.listDocuments(config.website_db, config.tv_slides, [
            Query.orderAsc("sorrend")
          ]);
          this.slides = slideData.documents.map(doc => ({
            title: doc.title,
            text: doc.text,
            order: doc.sorrend
          }));
        } catch (error) {
          console.error("Error fetching slides:", error);
        }
      },
      async fetchNewsItems() {
        const database = new Databases(appw);
        try {
          const newsData = await database.listDocuments(config.website_db, config.tv_slides); // Adjust collection ID if needed
          this.newsItems = newsData.documents.map(doc => doc.news_text);
        } catch (error) {
          console.error("Error fetching news:", error);
        }
      },
      async fetchTemperature() {
        const apiKey = 'your_openweathermap_api_key';
        const city = 'your_city_name';
        try {
          const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
          const data = await response.json();
          this.currentTemperature = data.main.temp.toFixed(1);
        } catch (error) {
          console.error("Error fetching temperature:", error);
        }
      }
    },
    mounted() {
      this.fetchSlides();
      this.fetchNewsItems();
      // Uncomment the line below to enable temperature fetching
      // this.fetchTemperature();
      
      this.updateTime();
      setInterval(this.updateTime, 1000);
      
      setInterval(() => {
        if (this.slides.length > 0) {
          this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        }
      }, 15000); // Change slide every 15 seconds
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
  