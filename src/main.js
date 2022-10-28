import { createApp } from 'vue'
import App from './App.vue'
import './style/app.css';
import router from "@/routes"
import {gettext} from "@/locales";
import CountryFlag from 'vue-country-flag-next'
import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'
import NavBar from "@/components/NavBar"
import Footer from "@/components/Footer"


let app= createApp(App);
app.use(router);
app.mixin(
    {
        computed:{
            gt(a)
            {
                return gettext(a);
            }
        }
    });
app.mixin({
    components:{
        CountryFlag,
        NavBar,
        Footer
    }
});


app.mount('#app');
