<template>
<section class="text-gray-600 body-font" id="usefullinks">
        <div class="container px-5 py-20 mx-auto">
            <div class="w-full mb-20">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ _title }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            
            </div>
            <div class=" w-full ">
                <swiper
                    class=""
                    :slidesPerView="aaa()"
                    :spaceBetween="30"
                    :autoplay="true"
                    :loop="true"
                    
                    :modules="modules"
                >
                    <swiper-slide class="" v-for="link in links">
                        <div  @click="goto(link.link)" style="min-width: 100px; max-width: 200px;"  class="bg-slate-100/30 hover:bg-sky-400/30  dark:bg-slate-300/30 rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] cursor-pointer">
                            <img class="object-scale-down  h-48 w-32" :src="link.img" />
                        </div>
                    </swiper-slide>
                    
                </swiper>
            </div>
        </div>
    </section>


</template>
<script >


import { Client, Databases, ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";
import {convertifserbian} from "@/lang";
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectFade, Navigation, Pagination } from 'swiper/modules';

export default {
    name: 'UsefulLinks',
    components: {
        Swiper,SwiperSlide
    },
    mounted()
    {
        if(this.mode=="sponsors")
    {  this.load_links_base_sponsors();
        this._title=this.$t("sponsors");
     }
    else 
    {
        this.load_links_base_usefullinks();
        this._title=this.$t("usefullinks");
    }
        
        //this.l=aaa();
       
    },
    props:{
        mode:String
    },
    data: () => ({
        l:3,
        _title:"",
        links: [
            {
                img: 'https://dummyimage.com/720x400',
                subtitle: 'SUBTITLE',
                title: 'First',
                text: 'Lorem ipsum dolor sit'}],
                modules:[EffectFade, Navigation, Pagination],
        options: {
            mouseControls: true,
            touchControls: true,
            minHeight: 300.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00
        }}
        ),
    
    methods:{
        async load_links_base_sponsors()
        {
        this.links=[];
            //console.log();
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l= await database.listDocuments(config.website_db, config.sponsors_db,[Query.orderAsc("sorrend")]);
        
        l.documents.forEach(element => {
            let a={link:"",img:""};
            a.link=element.sponsor_url;
            a.img=storage.getFilePreview(
                config.website_images,           // bucket ID
                element.sponsor_img,       // file ID
                200,               // width, will be resized using this value.
                0,                  // height, ignored when 0
                'center',           // crop center
                90,               // slight compression
                0,                  // border width
                'FFFFFF',           // border color
                0,                 // border radius
                1,                  // full opacity
                0,                  // no rotation
                'FFFFFF',           // background color
                'webp'               // output webp format
                ).href;
           // =storage.getFileView(config.website_images,element.sponsor_img);
            this.links.push(a);
        });
        },
        async load_links_base_usefullinks()
        {
        this.links=[];
            //console.log();
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l= await database.listDocuments(config.website_db, config.usefullinks,[Query.orderAsc("sorrend")]);
        
        l.documents.forEach(element => {
            let a={link:"",img:""};
            a.link=element.link;
            a.img=storage.getFilePreview(
                config.website_images,           // bucket ID
                element.logo,       // file ID
                200,               // width, will be resized using this value.
                0,                  // height, ignored when 0
                'center',           // crop center
                90,               // slight compression
                0,                  // border width
                'FFFFFF',           // border color
                0,                 // border radius
                1,                  // full opacity
                0,                  // no rotation
                'FFFFFF',           // background color
                'webp'               // output webp format
                ).href;
            //a.img=storage.getFileView(config.website_images,element.logo);
            //a.img=storage.getFilePreview(config.website_images,element.logo,output="webp")
               
            this.links.push(a);
        });
        },
        goto(link)
        {
            window.open(link, '_blank');
        },
        aaa()
        {
            let l= window.innerWidth;
            let k=0;
            //console.log(l);
            if(l<=480)
            k=2;
            else if(l<=768)
            k=3;
            else if(l<=1024)
            k=4;
            else 
            k=5
            
            return k;
        }
    }
    
}

</script>