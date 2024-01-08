<template>

<section class="text-gray-600 ">
    <div class="container  px-5 py-20 mx-auto backdrop-filter bg-opacity-50 bg-gray-100  backdrop-blur-lg">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900">{{ title }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
                <p v-if="newsmode" class="mb-8 leading-relaxed">
                    {{ $t("date") }}:{{ date }}
                    {{ $t("author") }}:{{ author }}
                </p>
            </div>
<div class="w-3/4 pb-2">
<vue-markdown-it :source="chtml1" preset="commonmark" />
</div>
<div class="w-3/4 pb-2">
    <swiper v-if="loaded"  class="object-cover object-center rounded"       
                    :slidesPerView="img_cnt"
                    :spaceBetween="30"
                    :modules="modules">
                    <swiper-slide  v-for="photo in gallery">
                        <div  class="bg-white rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] cursor-pointer">
                            <img class="object-scale-down  h-48 w-32" :src="photo.img" />
                        </div>
                    </swiper-slide>
    </swiper>
</div>

<div class="w-3/4 pb-2">
    <vue-markdown-it :source="chtml2" preset="commonmark" />
</div>

<div class="w-3/4 pb-2">
    <vue-markdown-it :source="chtml3" preset="commonmark" />
</div>
</div>
</section>
</template>
<script>

import {Client,Databases,ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectFade, Navigation, Pagination } from 'swiper/modules';
import {convertifserbian} from "@/lang";
import { VueMarkdownIt } from '@f3ve/vue-markdown-it';


export default {
    components: {
        Swiper,SwiperSlide,VueMarkdownIt
    },
    data() {
        return {
            
            chtml1:'',
            chtml2:'',
            chtml3:'',
            gallery:[],
            title:'',
            img_cnt:3,
            loaded:false,
            author:"Admin",
            date:"",
            newsmode:false
        }
    },
    mounted()
    {
        this.getMD();
    },
    methods:{
        async getMD()
        {
            
            const database = new Databases(appw);
            const storage = new Storage(appw);
    
            let lang=localStorage.getItem("lang");
            
            //just fucking kill me
            let mode="";
            
            switch(this.$route.params.mode)
            {
                case "about":
                    mode=config.about_us_db;
                 break;
                case "erasmus":
                    mode=config.about_us_db;
                 break;
                case "news":
                    mode=config.news_db; break;
                
            }
            
            let k= await database.listDocuments(config.website_db, mode,[Query.equal("$id",this.$route.params.id)]);
            if(lang!=k.documents[0].lang)
            {
                if(lang=="sr"&&k.documents[0].lang=="rs")
                {

                }
                else 
                {
                    this.$router.push("/home");
                    
                }
            }
            if(this.$route.params.node=="news")
            {
                this.newsmode=true;
                if(k.documents[0].author!="")
                this.author= convertifserbian(k.documents[0].author);
                this.date= moment(k.documents[0].$createdAt).locale(lang).format('LL');
            }
            let gal=k.documents[0].gallery;
            console.log(k.documents[0].gallery);
            let m= await database.listDocuments(config.website_db, config.album_images,[Query.equal("gallery",gal.$id)]);
            
            this.title=convertifserbian(k.documents[0].title);
            console.log(m);
            m.documents.forEach(element=>
            {
                let af={img:""};
                af.img=storage.getFilePreview(config.gallery_pictures_storage,element.image_id)
                this.gallery.push(af);
                this.image_cnt++;
            });
            this.chtml1 = convertifserbian(k.documents[0].part1);
            this.chtml2 = convertifserbian(k.documents[0].part2);
            this.chtml3 = convertifserbian(k.documents[0].part3);
            this.loaded=true;
        }   
    }
}   
</script>