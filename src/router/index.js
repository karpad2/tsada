import { createRouter, createWebHistory } from 'vue-router'
import useLoadingStore from '@/stores';
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/home',
      name: 'home2',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/about/workers',
      name: 'workers',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Abouts/Workers.vue')
    },
    {
      path:'/document/:id',
      name:'document',
      component: () => import('../views/documents/DocViewer.vue')      
    },
    
  {  
        path:'/documents/:category',
        name:'documents',
        component: () => import('../views/documents/DocumentLister.vue')      
      },  
    {
      path:'/renderer/:mode/:id',
      name:'renderer',
      component: () => import('../views/MDRenderer.vue')      
    },
    {
      path:'/contact',
      name:'contact',
      component: () => import('../views/Contact.vue')      
    },
    {
      path:'/gallery',
      name:'gallery',
      component: () => import('../views/Gallery.vue')      
    },
    {
      path:'/login',
      name:'login',
      component: () => import('../views/account/Login.vue')      
    },
    {
      path:'/album/:id',
      name:'album',
      component: () => import('../views/Album.vue')      
    },
    {
      path:'/education',
      name:'educationprofiles',
      component: () => import('../views/EducationProfiles.vue')      
    },
    {
      path:'/education/profiles/:id',
      name:'educationprofiles',
      component: () => import('../views/EducationProfile.vue')      
    }
  ]
})
router.beforeEach((to, from, next) => {
  // Show loading screen
  const loadingStore = useLoadingStore();
  loadingStore.setLoading(true);

  // Wait for 1 second (for demonstration purposes)
  setTimeout(() => {
    // Hide loading screen
    loadingStore.setLoading(false);
    // Continue with navigation
    next()
  }, 600)
})
export default router
