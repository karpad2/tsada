import { createRouter as createVueRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import { useLoadingStore } from "@/stores/loading";
import { trackPageView, trackNavigation, setUserProperties } from '@/utils/analytics';
import { seoGuard } from './seoGuard';
import { appwriteService } from '@/appwrite'
import { messages } from '@/lang'
import { normalizeLang } from '@/utils/localizedText'
import HomeView from '../views/HomeView.vue'

let lastAuthCheck = 0
const AUTH_CHECK_TTL = 15_000

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
      path: '/about/class-schedule',
      name: 'class_schedule',
      component: () => import('../views/Abouts/ClassSchedule.vue')
    },
    {
      path: '/about/today',
      redirect: '/admin/today'
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
        path:'/documents/search',
        name:'document_search',
        component: () => import('../views/documents/DocumentSearch.vue')
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
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/ContentEditor.vue')
    },
    {
      path:'/admin/worker/:id',
      name:'worker_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/WorkerEditor.vue')
    },
    {
      path:'/admin/document/:id',
      name:'document_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/DocumentEditor.vue'),
      props:{modded:"documents_db"}
    },
    {
      path:'/admin/text-document-editor/:id',
      name:'text_document_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/DocumentEditor.vue'),
      props:{modded:"text_documents"}
    },
    {
      path:'/admin/studentdocument/:id',
      name:'student_document_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/DocumentEditor.vue'),
      props:{modded:"st_documents"}
    },
    {
      path:'/admin/gallery-edit/:id',
      name:'gallery_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor', 'photographer'] },
      component: () => import('../views/admin/editor/GalleryEditor.vue')
    },
    {
      path:'/admin/gallery-approval',
      name:'gallery_approval',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/GalleryApproval.vue')
    },
    {
      path:'/admin/class-edit/:id',
      name:'class_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/ClassEditor.vue')
    },
    {
      path:'/admin/slide-editor',
      name:'slide_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/SlideEditor.vue')
    },
    {
      path:'/admin/messages',
      name:'messages',
      meta: { requiresAuth: true, roles: ['admin', 'editor', 'secretary'] },
      component: () => import('../views/admin/messages/Messages.vue')
    },
    {
      path:'/admin/message/:id',
      name:'message',
      meta: { requiresAuth: true, roles: ['admin', 'editor', 'secretary'] },
      component: () => import('../views/admin/messages/Message.vue')
    },
    {
      path:'/admin/erasmus/docviewer/:id',
      name:'ErDocViewer',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
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
      meta: { requiresAuth: true, roles: ['admin'] },
      component: () => import('../components/mrrp.vue')
    },
    {
      path:'/admin/erasmus/applies',
      name:'ErAdApplies',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/erasmus/ErasmusApplies.vue')
    },
    {
      path:'/admin/erasmus/editapply/:id',
      name:'ErasmusApplyEdit',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/erasmus/ErasmusApplyEdit.vue')
    },
    {
      path:'/admin/notifications/send',
      name:'send_notification',
      meta: { requiresAuth: true, roles: ['admin'] },
      component: () => import('../views/admin/notifications/SendNotification.vue')
    },
    {
      path:'/admin/messaging',
      name:'messaging_center',
      meta: { requiresAuth: true, roles: ['admin'] },
      component: () => import('../views/admin/notifications/MessagingCenter.vue')
    },
    // Forms Admin Routes
    {
      path:'/admin/forms',
      name:'forms_admin',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/forms/FormsAdmin.vue')
    },
    {
      path:'/admin/forms/edit/:id',
      name:'form_builder',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/forms/FormBuilder.vue')
    },
    {
      path:'/admin/forms/responses/:id',
      name:'form_responses',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/forms/FormResponses.vue')
    },
    // Public Form View
    {
      path:'/forms/:id',
      name:'form_view',
      component: () => import('../views/forms/FormView.vue')
    },
    // ERP Admin Routes
    {
      path:'/admin/erp/subjects',
      name:'erp_subjects_admin',
      meta: { requiresAuth: true, roles: ['admin', 'teacher'] },
      component: () => import('../views/admin/erp/SubjectsAdmin.vue')
    },
    {
      path:'/admin/erp/study-programs',
      name:'erp_study_programs_admin',
      meta: { requiresAuth: true, roles: ['admin', 'teacher'] },
      component: () => import('../views/admin/erp/StudyProgramsAdmin.vue')
    },
    {
      path:'/admin/erp/class',
      name:'erp_class_teacher',
      meta: { requiresAuth: true, roles: ['admin', 'teacher'] },
      component: () => import('../views/admin/erp/ClassTeacherDashboard.vue')
    },
    {
      path:'/admin/erp/print',
      name:'erp_print_manager',
      meta: { requiresAuth: true, roles: ['admin', 'teacher'] },
      component: () => import('../views/admin/erp/PrintManager.vue')
    },
    {
      path:'/admin/erp/template-editor',
      name:'erp_template_editor',
      meta: { requiresAuth: true, roles: ['admin', 'teacher'] },
      component: () => import('../views/admin/erp/TemplateEditor.vue')
    },
    // News Order Manager
    {
      path:'/admin/news-order',
      name:'news_order_manager',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/NewsOrderManager.vue')
    },
    // Timetable Editor
    {
      path:'/admin/timetable-editor',
      name:'timetable_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/TimetableEditor.vue')
    },
    {
      path:'/admin/today',
      name:'today_schedule',
      meta: { requiresAuth: true, roles: ['admin', 'editor', 'teacher', 'secretary'] },
      component: () => import('../views/Abouts/TodaySchedule.vue')
    },
    {
      path:'/admin/substitutions',
      name:'substitutions_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor', 'teacher', 'secretary'] },
      component: () => import('../views/admin/editor/SubstitutionEditor.vue')
    },
    {
      path:'/admin/content-audit',
      name:'content_audit',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/ContentAudit.vue')
    },
    // Sponsors Editor
    {
      path:'/admin/sponsors',
      name:'sponsors_editor',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/editor/SponsorsEditor.vue')
    },
    // Role Manager (Admin only)
    {
      path:'/admin/roles',
      name:'role_manager',
      meta: { requiresAuth: true, roles: ['admin'] },
      component: () => import('../views/admin/RoleManager.vue')
    },
    {
      path:'/admin',
      name:'admin_dashboard',
      meta: { requiresAuth: true, roles: ['admin', 'editor', 'teacher', 'photographer', 'secretary'] },
      component: () => import('../views/admin/Dashboard.vue')
    },
    {
      path:'/admin/menu-editor',
      name:'menu_editor',
      meta: { requiresAuth: true, roles: ['admin'] },
      component: () => import('../views/admin/MenuEditor.vue')
    },
    {
      path:'/admin/modules',
      name:'module_switches',
      meta: { requiresAuth: true, roles: ['admin', 'editor'] },
      component: () => import('../views/admin/ModuleSwitches.vue')
    },
    {
      path:'/dc',
      name:'dc_chat',
      component: () => import('../views/DcChat.vue')
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
      path:'/heist',
      name:'heist_game',
      component: () => import('../views/HeistGame.vue')
    },
    {
      path:'/:pathMatch(.*)*',
      name:'missingpage',
      component: () => import('../views/MissingPage.vue')
    }
  ]
})
router.beforeEach(async (to, from) => {
  const loadingStore = useLoadingStore();
  loadingStore.setLoading(true);

  const fullPath = to.fullPath;
  const isBrowser = typeof window !== 'undefined';

  try {
    if (isBrowser && from.fullPath && from.fullPath !== to.fullPath) {
      trackNavigation(from.fullPath, to.fullPath, 'router');
    }
  } catch { /* analytics must not block routing */ }

  const isErasmus = fullPath.includes('erasmus');
  loadingStore.setErasmus(isErasmus);
  if (!isErasmus) loadingStore.setCurrentPageEuFunding(false);

  if (isBrowser && fullPath.includes('/moodle')) {
    window.location.replace('https://moodle.tsada.edu.rs');
    return false;
  }

  loadingStore.setfireworkSetting(fullPath.includes('/about/birthday'));
  loadingStore.sethideheaders(fullPath.includes('/tvview') || fullPath.includes('/dc') || fullPath.includes('/heist'));

  if (isBrowser) {
    const requiresAuth = Boolean(to.meta?.requiresAuth) || to.path.startsWith('/admin');

    if (requiresAuth && (Date.now() - lastAuthCheck > AUTH_CHECK_TTL || !loadingStore.userLoggedin)) {
      try {
        await appwriteService.checkAuth();
      } catch { /* guest */ }
      lastAuthCheck = Date.now();
    }

    if (requiresAuth && !loadingStore.userLoggedin) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }

    if (to.meta?.roles && loadingStore.userLoggedin) {
      const allowedRoles = to.meta.roles as string[];
      const userRole = loadingStore.userRole;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return '/home';
      }
    }
  }

  try {
    seoGuard(to);
  } catch { /* SEO must not block routing */ }
});

const ROUTE_TITLE_KEYS: Record<string, string> = {
  home: 'home',
  home2: 'home',
  about: 'aboutus',
  workers: 'workers',
  workerstimetable: 'teachers_receiving_hour',
  classlist: 'classlist',
  parentvisiting: 'parentsvisiting',
  birthday: 'birthday',
  timetable: 'timetable',
  class_schedule: 'class_schedule',
  today_schedule: 'today_schedule',
  timetable_editor: 'tt_editor',
  substitutions_editor: 'sub_editor',
  content_audit: 'audit_title',
  parentscouncil: 'parents_council',
  pepsi: 'services',
  SchoolBoard: 'school_board',
  studentcouncil: 'student_parliament',
  documents: 'documents',
  document_search: 'docsearch_title',
  studentdocuments: 'studentdocuments',
  gallery: 'gallery',
  album: 'gallery',
  contact: 'contactus',
  login: 'login',
  erasmus_apply: 'erasmus_apply',
  erasmus_results: 'erasmus_applies_result',
  presentation: 'presentation_editor',
  tvpresentation: 'gallery',
  messages: 'messages',
  content_editor: 'Edit',
  worker_editor: 'Edit',
  document_editor: 'document_editor',
  text_document_editor: 'document_editor',
  student_document_editor: 'document_editor',
  gallery_editor: 'gallery_editor',
  gallery_approval: 'gal_approval_title',
  class_editor: 'Edit',
  slide_editor: 'presentation_editor',
  send_notification: 'push_notifications',
  messaging_center: 'messaging_center',
  forms_admin: 'forms_management',
  form_builder: 'forms_management',
  form_responses: 'forms_management',
  form_view: 'forms_management',
  erp_subjects_admin: 'erp_subjects',
  erp_study_programs_admin: 'erp_study_programs',
  erp_class_teacher: 'erp_class_teacher',
  erp_print_manager: 'erp_print_manager',
  erp_template_editor: 'erp_template_editor',
  news_order_manager: 'manage_news_order',
  sponsors_editor: 'sponsors_editor',
  menu_editor: 'menu_editor',
  module_switches: 'modules_title',
  admin_dashboard: 'dashboard',
  heist_game: 'home',
  missingpage: 'home',
  renderer: 'news',
  document: 'documents',
  documentLister: 'documents'
}

function localizedRouteTitle(routeName: string, language: string): string {
  const lang = normalizeLang(language)
  const pack = (messages as any)[lang] || (messages as any).hu || {}
  const key = ROUTE_TITLE_KEYS[routeName]
  const school = pack.school_name || 'TSADA'
  const label = (key && pack[key]) || school
  return `${label} ~ ${school}`
}

router.afterEach((to) => {
  const loadingStore = useLoadingStore();
  try {
    const pageTitle = localizedRouteTitle(String(to.name || ''), loadingStore.language);

    if (typeof document !== 'undefined') {
      document.title = pageTitle;
    }

    if (typeof window !== 'undefined') {
      try {
        trackPageView(to.fullPath, pageTitle);
        const width = window.innerWidth;
        setUserProperties({
          language: loadingStore.language,
          user_type: loadingStore.userLoggedin ? 'admin' : 'visitor',
          device_type: width <= 768 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop'
        });
      } catch { /* ignore analytics */ }
    }
  } catch {
    /* never block navigation */
  } finally {
    loadingStore.setLoading(false);
  }
});

  return router
}

export default createRouter
