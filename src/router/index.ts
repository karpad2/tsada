import { createRouter as createVueRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useLoadingStore } from "@/stores/loading";
import { trackPageView, trackNavigation, setUserProperties } from '@/utils/analytics';
import { seoGuard } from './seoGuard';
import HomeView from '../views/HomeView.vue'

export function createRouter() {
  const router = createVueRouter({
    history: typeof window !== 'undefined' ? createWebHistory() : createMemoryHistory(),
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
      path: '/about/parentscouncil',
      name: 'parentscouncil',
     
      component: () => import('../views/Abouts/ParentsCouncil.vue')
    },
    {
      path: '/about/pepsi',
      name: 'pepsi',
     
      component: () => import('../views/Abouts/Pepsi.vue')
    },
    {
      path: '/about/schoolboard',
      name: 'SchoolBoard',
     
      component: () => import('../views/Abouts/SchoolBoard.vue')
    },
    {
      path: '/about/studentcouncil',
      name: 'studentcouncil',
     
      component: () => import('../views/Abouts/StudentCouncil.vue')
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

  const fullPath = to.fullPath;

  // Track navigation
  if (from.fullPath && from.fullPath !== to.fullPath) {
    trackNavigation(from.fullPath, to.fullPath, 'router');
  }
  if(fullPath.indexOf("erasmus") !== -1)
  {
    loadingStore.setErasmus(true);
    
  }
  else
  {
    loadingStore.setErasmus(false);
    loadingStore.setCurrentPageEuFunding(false);
  }
  let k=false;
  if(fullPath.indexOf("admin") !== -1)
    {
      k=true;
    }
    else
    {
      k=false;
    }
    if(fullPath.indexOf("/moodle") !== -1)
      {
        window.location.replace("https://moodle.tsada.edu.rs");
      }

    if(fullPath.indexOf("/about/birthday") !== -1)
      {
        loadingStore.setfireworkSetting(true);
      }
      else
      {
        loadingStore.setfireworkSetting(false);
      }
      if(fullPath.indexOf("/tvview") !== -1)
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



  // Apply SEO guard
  seoGuard(to);

  next();
});

router.afterEach((to, from) => {
  const loadingStore = useLoadingStore();

  // Set page title
  const getPageTitle = (routeName: string): string => {
    const titleMap: { [key: string]: string } = {
      'home': 'Početna ~ TSADA',
      'about': 'O nama ~ TSADA',
      'workers': 'Zaposleni ~ TSADA',
      'workerstimetable': 'Raspored zaposlenih ~ TSADA',
      'classlist': 'Lista učenika ~ TSADA',
      'parentvisiting': 'Roditeljski sastanak ~ TSADA',
      'birthday': 'Rođendani ~ TSADA',
      'timetable': 'Raspored časova ~ TSADA',
      'parentscouncil': 'Savet roditelja ~ TSADA',
      'pepsi': 'PEPSI ~ TSADA',
      'SchoolBoard': 'Školski odbor ~ TSADA',
      'studentcouncil': 'Učenički parlament ~ TSADA',
      'documents': 'Dokumenti ~ TSADA',
      'studentdocuments': 'Studentski dokumenti ~ TSADA',
      'gallery': 'Galerija ~ TSADA',
      'contact': 'Kontakt ~ TSADA',
      'login': 'Prijava ~ TSADA',
      'erasmus_apply': 'Erasmus prijava ~ TSADA',
      'erasmus_results': 'Erasmus rezultati ~ TSADA',
      'presentation': 'Prezentacija ~ TSADA',
      'tvpresentation': 'TV prikaz ~ TSADA',
      'messages': 'Poruke ~ TSADA',
      'content_editor': 'Uređivanje sadržaja ~ TSADA',
      'worker_editor': 'Uređivanje zaposlenih ~ TSADA',
      'document_editor': 'Uređivanje dokumenata ~ TSADA',
      'text_document_editor': 'Uređivanje tekstualnih dokumenata ~ TSADA',
      'student_document_editor': 'Uređivanje studentskih dokumenata ~ TSADA',
      'gallery_editor': 'Uređivanje galerije ~ TSADA',
      'class_editor': 'Uređivanje klasa ~ TSADA',
      'slide_editor': 'Uređivanje slajdova ~ TSADA',
      'missingpage': 'Stranica nije pronađena ~ TSADA'
    };

    return titleMap[routeName] || `${routeName} ~ TSADA`;
  };

  const pageTitle = getPageTitle(to.name as string);
  document.title = pageTitle;

  // Track page view
  trackPageView(to.fullPath, pageTitle);

  // Update user properties
  setUserProperties({
    language: loadingStore.language,
    user_type: loadingStore.userLoggedin ? 'admin' : 'visitor',
    device_type: window.innerWidth <= 768 ? 'mobile' : window.innerWidth <= 1024 ? 'tablet' : 'desktop'
  });

  // Hide loading screen
  loadingStore.setLoading(false);
});
  return router
}

export default createRouter
