<template>
<main>
    
    <section class="text-gray-600 body-font" id="gallery">
        <div class="container px-5 py-24 mx-auto">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ $t('gallery') }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            </div>
            <div class="flex flex-wrap -m-4">
                <div v-for="album in gallery" class="xl:w-1/4 md:w-1/2 p-4">
                    <div  class="bg-gray-100 p-6 rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:bg-neutral-700 hover:scale-125">
                        <img class="h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out hover:scale-110"
                            :src="album.img" alt="content">
                       
                        <h3 class="tracking-widest text-sky-500 text-s font-medium title-font dark:text-white">{{ album.subtitle }}</h3>
                        <h2 class="text-lg text-gray-900 font-medium title-font mb-4 dark:text-slate-400">{{ album.title }}</h2>
                        <p class="leading-relaxed text-base dark:text-slate-400" :v-html="album.text"></p>
                    </div>
                </div>
               
            </div>
        </div>
    </section>
</main>

</template>
<script >
import { Client, Databases, ID,Storage } from "appwrite";
import {appw,config} from "@/appwrite";
import {convertifserbian} from "@/lang";

export default {
    name: 'Gallery',
    components: {
       
    },
    mounted()
    {
        this.load_gallery_base();
    },
    data: () => ({
        gallery: [
            {
                img: 'https://dummyimage.com/720x400',
                imga:"",
                subtitle: 'SUBTITLE',
                title: 'First',
                text: 'Lorem ipsum dolor sit'}]}),
    
    methods:{
        async load_gallery_base()
        {
        this.gallery=[];
            console.log();
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l= await database.listDocuments(config.website_db, config.courses_short);
        
        l.documents.forEach(element => {
            let a={title:"",subtitle:"",text:"",img:""};
            if(this.$i18n.locale=="en")
            {
                a.title=element.course_en;
                a.subtitle=element.course_en_st;
                a.text=element.course_en_detail;
            }
            else if(this.$i18n.locale=="hu")
            {
                a.title=element.course_hu;
                a.subtitle=element.course_hu_st;
                a.text=element.course_hu_detail;
            }
            else if(this.$i18n.locale=="rs"||this.$i18n.locale=="sr")
            {
                a.title=convertifserbian(element.course_rs);
                a.subtitle=convertifserbian(element.course_rs_st);
                a.text=convertifserbian(element.course_rs_detail);
            }
            console.log(element.course_img);
            if(element.course_img==null||element.course_img=='')
            {
                a.img="https://dummyimage.com/720x400";
            }
            else
            a.img=storage.getFileView(config.gallery_pictures_storage,element.course_img);
            //a.imga=element.course_img;
            this.courses.push(a);
        });
        },
    }
    
}

</script>