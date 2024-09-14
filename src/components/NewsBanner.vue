<template>
    <section class="text-gray-600 body-font" id="News">
        <div class="container px-5 py-24 mx-auto">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ $t('news') }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            
            </div>
            <div class="flex flex-wrap -m-4">
                
                    <div v-for="course in courses"  class="bg-slate-100/30 hover:bg-sky-400/30  xl:w-1/4 sm:w-full md:w-1/4 lg:w-1/4  dark:bg-slate-300/30 p-6 rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                        <img class="h-40 rounded w-full object-cover sm:w-full object-center mb-6"
                            :src="course.img" alt="content">
                        <h3 class="tracking-widest text-sky-500 text-s  font-medium title-font">{{ course.subtitle }}</h3>
                        <h2 class="text-lg text-gray-900 font-medium title-font mb-4 dark:text-white">{{ course.title }}</h2>
                        <p class="leading-relaxed text-base" :v-html="course.text"></p>
                    </div>
                
               
            </div>
        </div>
    </section>
</template>
<script lang="ts">


import { Client, Databases, ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";
import {convertifserbian} from "@/lang";
import {useLoadingStore} from "@/stores/loading";
export default {
    name: 'News',
    components: {
       
    },
    mounted()
    {
        this.load_news_base();
    },
    data: () => ({
        courses: [
            {
                img: 'https://dummyimage.com/720x400',
                subtitle: 'SUBTITLE',
                title: 'First',
                text: 'Lorem ipsum dolor sit'}]}),
    
    methods:{
        async load_news_base()
        {
        const cc=useLoadingStore();
        this.courses=[];
        let lang=localStorage.getItem("lang");
            
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l= await database.listDocuments(config.website_db, config.news_db,
        [
            Query.equal("lang", lang)
        ]);
        
        l.documents.forEach(async element => {
            let a={title:"",subtitle:"",text:"",img:""};
            if(lang=="en")
            {
                a.title=element.title;
               
            }
            else if(lang=="hu")
            {
                a.title=element.title;
              
            }
            else if(lang=="rs"||lang=="sr")
            {
                a.title=convertifserbian(element.title);
                
            }
            let b=null;
            
            let kepek= await database.listDocuments(config.website_db, config.album_images,
                [
                    Query.equal("gallery", element.$id)
                ]);
            if(kepek.documents.length>0)
            {
                b=kepek.documents[0].image;
            }
            
            //element.gallery
            /*
            console.log(element.course_img);
            if(==null||element.course_img=='')
            {
                a.img="https://dummyimage.com/720x400";
            }
            else
            
            */
            a.img=storage.getFileView(config.website_images,b);
           this.courses.push(a);
        });
        },
    }
    
}

</script>