<template>
<header v-if="reload" style="z-index: 200;"  class="navbar text-gray-600 backdrop-filter bg-opacity-50 bg-gray-300  backdrop-blur-lg body-font sticky top-0" id="home">
        <div class="container mx-auto flex flex-wrap p-4 flex-col md:flex-row items-center">
            <router-link to="/home" class="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0 ">
                <img src="@a/tsada_logo.png" class="w-20 h-20 text-white p-1 bg-sky-300/50 rounded-full hover:scale-110">
                <span class="ml-3 text-xl">{{ $t('school_name') }}</span>
                <img src="@a/certop_logo.png" class="w-36 h-12 text-white p-2 hover:scale-110">
            </router-link>
            <nav class="md:ml-auto flex flex-wrap items-center text-base justify-acenter">
                
                <router-link to="/home" class="mr-5 hover:text-sky-400 cursor-pointer">{{ $t('home') }}</router-link>
                <div class="dropdown">
                <div v-if="reload" tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer">{{ $t('aboutus') }}</div>
                <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li v-if="reload"  v-for="about in abouts"><router-link :to="'/renderer/about/'+about.id">{{ about.title }}</router-link></li>
                    <li ><router-link to="/about/workers">{{ $t("workers") }}</router-link></li>
                </ul>
                </div>

                <div class="dropdown">
                <div tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer">{{ $t('education') }}</div>
                <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li ><router-link to="/courses">{{ $t("education_profiles") }}</router-link></li>
                    <li ><router-link to="/courses">{{ $t("reports") }}</router-link></li>
                </ul>
                </div>

                
                <div class="dropdown">
                <div tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer">{{ $t('documents') }}</div>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li v-for="doccategory in doccategories" :key="doccategory.id"><router-link :to="'/documents/'+doccategory.id">{{ doccategory.name }}</router-link></li>
                </ul>
                </div>

                <div class="dropdown">
                <div tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer">{{ $t('language') }}</div>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li v-for="lang in languages "><a @click="changeLanguage(lang.code)">{{ lang.name }}</a></li>
                </ul>
                </div>

                <div class="dropdown">
                    <div @click="" tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer">{{ $t('Erasmus') }}</div>
                </div>
            </nav>
            <router-link to="contact" class="inline-flex items-center bg-sky-100 border-0 py-1 px-3 focus:outline-none hover:bg-sky-500/100 rounded text-base mt-4 md:mt-0 cursor-pointer">
                {{ $t('contactus') }}
                <i class="pi pi-right"></i>
            </router-link>
        </div>
    </header>
</template>
<script>
import { Client, Databases, ID,Storage,Query } from "appwrite";
import {convertifserbian} from "@/lang";
import {appw,config} from "@/appwrite";
import { ref,nextTick } from "vue";
import Button from 'primevue/button';
import  Menu  from "primevue/menu";
export default
{
    name: 'Header',
    data()
    {
        return {
            language: null,
            languages: [
                {name: 'Српски', code: 'sr'},
                {name: 'Srpski', code: 'rs'},
                {name: 'Magyar', code: 'hu'},
                {name: 'English', code: 'en'}
            ],
            doccategories:[],
            abouts:[],
            reload:ref(true)
        }
    },
    mounted()
    {
        

        this.language=localStorage.getItem('lang');
        
        if(this.language==null)
        {
            this.language='sr';
        }
        this.$i18n.locale=this.language;

        this.getDocumentsCategories();
        this.getAbouts();
    },
    methods:{
        async changeLanguage(code)
        {

            await localStorage.setItem('lang', code);
            this.$i18n.locale=code;
            //i am want to cry, but i cant

            /*await this.$router.push("/home");
            this.reload.value=false;
            await  nextTick()
            this.reload.value=true;
            this.getDocumentsCategories();
            this.getAbouts();*/
            window.location.reload();
            //this.language=lang;
        },
        async getDocumentsCategories()
        {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l= await database.listDocuments(config.website_db, config.document_categories_db);
        let local=localStorage.getItem("lang");
        l.documents.forEach(async element => {
            console.log(element);
            let a={name:"",id:""};
            if(local=="en")
            {
                a.name=element.category_name_en;
                
            }
            else if(local=="hu")
            {
                a.name=element.category_name_hu;
                
            }
            else if(local=="rs"||local=="sr")
            {
                a.name=convertifserbian(element.category_name_rs);
            }

            a.id=element.$id;
            this.doccategories.push(a);
        });

        },
        async getAbouts()
        {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l;
        console.log(this.language);
        if(this.language=="sr")
        {
            l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("lang","rs"),Query.select(["title","$id"])]);
        }
        else l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("lang",this.language),Query.select(["title","$id"])]);
        //let local=localStorage.getItem("lang");
        console.log(l);
        l.documents.forEach(async element => {
            
            let a={title:"",id:""};
            a.title=convertifserbian(element.title);

            a.id=element.$id;
            this.abouts.push(a);
        });

        }
        
    },
  
}
</script>