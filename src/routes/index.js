import { createRouter, createWebHistory } from 'vue-router'
import HomeView from "@/Views/HomeView"
import LoginView from "@/Views/LoginView"
import Error404 from "@/Views/Error404"    
import {getAuth} from 'firebase/auth';


const routes=[
    {
        path: '/',
        name: 'home-view',
        component: HomeView
    },
    {
        path: '/login',
        name: 'login-View',
        component: LoginView
    },

    {
        path: '/:pathMatch(.*)*',
        name: 'error404',
        component: Error404,
    },

]
//history: createWebHistory(),

const router = createRouter({
    
    history: createWebHistory(),
    base:process.env.BASE_URL,
    routes:routes
  });
/*
  router.beforeEach( async(to, from, next) => {
	let currentUser =  await getAuth().currentUser;
	let requiresAuth = to.matched.some(record => record.meta.requiresAuth);
	if(!to.path.includes("/page/"))
	{
		localStorage.setItem("fullscreen",false);
	}
	//console.log(to.path);
	if(to.path=="/") 
	{
		if(!currentUser) next('/account/login');
		else next('/home');
	}
	if(requiresAuth && !currentUser) next('/account/login');
	else next();
})
*/

  export default router 