import { createRouter, createWebHistory } from 'vue-router'
import {useLoadingStore} from "@/stores/loading";
import HomeView from '../views/HomeView.vue'
import {check} from "@/appwrite";
const router = createRouter({
  history: createWebHistory(),
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
      path: '/about/timetable',
      name: 'timetable',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Abouts/Timetable.vue')
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
      path:'/admin/edit/:mode/:id',
      name:'content_editor',
      component: () => import('../views/admin/editor/ContentEditor.vue')      
    },
    {
      path:'/admin/worker/:id',
      name:'worker_editor',
      component: () => import('../views/admin/editor/WorkerEditor.vue')      
    },
    {
      path:'/admin/document/:id',
      name:'document_editor',
      component: () => import('../views/admin/editor/DocumentEditor.vue')      
    },
    {
      path:'/admin/gallery-edit/:id',
      name:'gallery_editor',
      component: () => import('../views/admin/editor/GalleryEditor.vue')      
    },
    {
      path:'/admin/messages',
      name:'messages',
      component: () => import('../views/admin/messages/Messages.vue')      
    },
    {
      path:'/admin/message/:id',
      name:'message',
      component: () => import('../views/admin/messages/Message.vue')      
    },
    {
      path:'/contact',
      name:'contact',
      component: () => import('../views/Contact.vue')      
    },
    {
      path:'/gallery',
      name:'gallery',
      component: () => import('../views/Abouts/Gallery.vue')      
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
    },
    {
      path:'/presentation',
      name:'presentation',
      component: () => import('../views/Presentation.vue')      
    },
    {
      path:'/:pathMatch(.*)*',
      name:'missingpage',
      component: () => import('../views/MissingPage.vue')      
    }
  ]
})
router.beforeEach((to, from, next) => {
  // Show loading screen
  const loadingStore = useLoadingStore();
  loadingStore.setLoading(true);
  //console.log();
  let b=to.fullPath;
  try{
  //check();
  }
  catch (e){console.warn(e);}
  if(b.indexOf("erasmus") !== -1)
  {
    loadingStore.setErasmus(true);
  }
  else
  {
    loadingStore.setErasmus(false);
  }

  // Wait for 1 second (for demonstration purposes)
  setTimeout(() => {
    // Hide loading screen
    loadingStore.setLoading(false);
    // Continue with navigation
    next()
  }, 600)
})
export default router
