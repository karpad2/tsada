import { createRouter, createWebHistory } from 'vue-router'
import {useLoadingStore} from "@/stores/loading";
import HomeView from '../views/HomeView.vue'

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
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/about/workers',
      name: 'workers',
      component: () => import('../views/Abouts/Workers.vue')
    },
    {
      path: '/about/workerstimetable',
      name: 'workerstimetable',
      component: () => import('../views/Abouts/WorkersTimetable.vue')
    },
    {
      path: '/about/classlist',
      name: 'classlist',
      component: () => import('../views/Abouts/ClassList.vue')
    },
    {
      path: '/about/parentvisiting',
      name: 'parentvisiting',
      component: () => import('../views/Abouts/ParentVisiting.vue')
    },
    {
      path: '/about/birthday',
      name: 'birthday',
     
      component: () => import('../views/Abouts/Birthday.vue')
    },
    {
      path: '/about/timetable',
      name: 'timetable',
     
      component: () => import('../views/Abouts/Timetable.vue')
    },
    {
      path:'/document/:id',
      name:'document',
      component: () => import('../views/documents/DocViewer.vue')      
    },
    
  {  
        path:'/documents',
        name:'documents',
        component: () => import('../views/documents/Documents.vue')      
      },
      {  
        path:'/docs/:id',
        name:'documentLister',
        component: () => import('../views/documents/DocumentLister.vue')      
      },

      {  
        path:'/studentdocuments',
        name:'studentdocuments',
        component: () => import('../views/documents/StudentDocuments.vue')      
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
      component: () => import('../views/admin/editor/DocumentEditor.vue'),
      props:{modded:"documents_db"}       
    },
    {
      path:'/admin/text-document-editor/:id',
      name:'text_document_editor',
      component: () => import('../views/admin/editor/DocumentEditor.vue'),
      props:{modded:"text_documents"}      
    },
    {
      path:'/admin/studentdocument/:id',
      name:'student_document_editor',
      component: () => import('../views/admin/editor/DocumentEditor.vue'),
      props:{modded:"st_documents"}       
    },
    {
      path:'/admin/gallery-edit/:id',
      name:'gallery_editor',
      component: () => import('../views/admin/editor/GalleryEditor.vue')      
    },
    {
      path:'/admin/class-edit/:id',
      name:'class_editor',
      component: () => import('../views/admin/editor/ClassEditor.vue')      
    },
    {
      path:'/admin/slide-editor',
      name:'slide_editor',
      component: () => import('../views/admin/editor/SlideEditor.vue')      
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
      path:'/admin/erasmus/docviewer/:id',
      name:'ErDocViewer',
      component: () => import('../views/admin/erasmus/ErDocViewer.vue')      
    },
    {
      path:'/sterasmus/docviewer/:id',
      name:'STErDocViewer',
      component: () => import('../views/admin/erasmus/ErDocViewer.vue')      
    },

    {
      path:'/admin/mrow',
      name:'mrrp',
      component: () => import('../components/mrrp.vue')      
    },
    {
      path:'/admin/erasmus/applies',
      name:'ErAdApplies',
      component: () => import('../views/admin/erasmus/ErasmusApplies.vue')      
    },
    {
      path:'/admin/erasmus/editapply/:id',
      name:'ErasmusApplyEdit',
      component: () => import('../views/admin/erasmus/ErasmusApplyEdit.vue')      
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
      path:'/erasmus/apply',
      name:'erasmus_apply',
      component: () => import('../views/Erasmus/ErasmusApply.vue')      
    },
    {
      path:'/erasmus/results',
      name:'erasmus_results',
      component: () => import('../views/Erasmus/ErasmusList.vue')      
    },
  
    {
      path:'/presentation',
      name:'presentation',
      component: () => import('../views/Presentation.vue')      
    },
    {
      path:'/tv',
      name:'tvpresentation',
      component: () => import('../views/TV/TVView.vue')      
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
  let k=false;
  if(b.indexOf("admin") !== -1)
    {
      k=true;
    }
    else 
    {
      k=false;
    }
    if(b.indexOf("/moodle") !== -1)
      {
        window.location.replace("https://moodle.tsada.edu.rs");
      }

    if(b.indexOf("/about/birthday") !== -1)
      {
        loadingStore.setfireworkSetting(true);
      }
      else 
      {
        loadingStore.setfireworkSetting(false);
      }
      if(b.indexOf("/tvview") !== -1)
        {
          loadingStore.sethideheaders(true);
        }
        else 
        {
          loadingStore.sethideheaders(false);
        }
  

  if(!loadingStore.userLoggedin&&k)
    {
    router.push("/home");   
    }



  // Wait for 1 second (for demonstration purposes)
 /* setTimeout(() => {
    // Hide loading screen
    loadingStore.setLoading(false);
    // Continue with navigation
    next()
  }, 1000)*/
  next()
})
export default router
