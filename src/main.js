import { createApp } from 'vue'
import App from './App.vue'
import './style/app.css';
import router from "@/routes"
import {gettext} from "@/locales";
import CountryFlag from 'vue-country-flag-next'

let app= createApp(App);
app.use(router);
app.mixin(
    {
        methods:{
            gt(a)
            {
                return gettext(a);
            }
        }
    });
app.mixin({
    components:{
        CountryFlag
    }
})
app.mount('#app');
