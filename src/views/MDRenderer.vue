<template>

<section class="text-gray-600 min-h-screen">
    <div  class="container  px-5  mx-auto backdrop-filter bg-opacity-50  dark:bg-slate-500/50  bg-gray-100  backdrop-blur-lg" style="min-height: 70vh;">
            <div v-if="video_id==''" class="flex flex-wrap w-full mb-20 p-2 rounded">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 id="render_title" class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ title }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
                <p v-if="newsmode" class="mb-8 leading-relaxed">
                    {{ $t("date") }}:{{ date }}
                    {{ $t("author") }}:{{ author }}
                </p>
                
            </div>
            <video-background v-else :src="video_link" style="min-height: 200px;" class="flex flex-wrap w-full mb-20 p-2 rounded"
            overlay="linear-gradient(45deg,#2a4ae430,#0EA5E950)"  >
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100">{{ title }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
                <p v-if="newsmode" class="mb-8 leading-relaxed dark:text-slate-400">
                    {{ $t("date") }}:{{ date }}
                    {{ $t("author") }}:{{ author }}
                </p>
            </video-background>

            <p v-if="admin">
                    <VBtn  @click="editmode">{{ $t("edit") }}</VBtn>
            </p>

<div class="w-3/4 pb-2" >
    
</div>

<div class="w-3/4 pb-2 dark:text-white" v-html="chtml">
</div>


</div>
</section>
</template>
<script lang="ts">

import {Client,Databases,ID,Storage,Query } from "appwrite";
import {useLoadingStore} from "@/stores/loading";
import {appw,config} from "@/appwrite";
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectFade, Navigation, Pagination } from 'swiper/modules';
import {convertifserbian} from "@/lang";
import moment from "moment";
import gsap from "gsap";

export default {
    components: {
        Swiper,SwiperSlide
    },
    data() {
        return {
            
            chtml:'',
            gallery:[],
            title:'',
            img_cnt:3,
            loaded:false,
            author:"Admin",
            date:"",
            newsmode:false,
            video_id:"",
            video_link:"",
            edumode:false,
            admin:false
        }
    },
    mounted()
    {
        this.getMD();
        const cc=useLoadingStore();
        this.admin=cc.userLoggedin;

        gsap.fromTo(
    "#render_title",
    {
      opacity: 0,
      x: "150%",
    },
    {
      duration: 1.5,
      opacity: 1,
      x: 0,
    }
  );
        
    },
    methods:{
        async getMD()
        {
            
            const database = new Databases(appw);
            const storage = new Storage(appw);
            const cc=useLoadingStore();
            //just fucking kill me
            let mode="";
            /*
            switch(this.$route.params.mode)
            {
                case "about":
                    mode=config.about_us_db;
                 break;
                case "erasmus":
                    mode=config.about_us_db;
                 break;
                 case "education":
                    mode=config.about_us_db;
                 break;
                case "news":
                    mode=config.about_us_db; break;
                
            }*/
            
            let k= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("$id",this.$route.params.id)]);
            
                if(cc.language=="sr"||cc.language=="rs")
                {
                    this.title=convertifserbian(k.documents[0].title_rs);
                    this.chtml=k.documents[0].text_rs;
                    document.title=convertifserbian(k.documents[0].title_rs);
                    
                }
                else if(cc.language=="hu")
                {
                    this.title=k.documents[0].title_hu;
                    this.chtml=k.documents[0].text_hu;
                    document.title=k.documents[0].title_hu;
                    //this.$router.push("/home");
                    
                }
                else if(cc.language=="en")
                {
                    this.title=k.documents[0].title_en;
                    this.chtml=k.documents[0].text_en;
                    document.title=k.documents[0].title_en;
                }

                else 
            {
                console.warn("reading error");
            }
           /* if(this.chtml=="---")
            {
                this.$router.push("/home");
            }*/

            /*if(this.$route.params.node=="news")
            {
                this.newsmode=true;
                if(k.documents[0].author!="")
                this.author= convertifserbian(k.documents[0].author);
                this.date= moment(k.documents[0].$createdAt).locale(cc.language).format('LL');
            }

            if(this.$route.params.node=="education")
            {
                this.edumode=true;
            }*/

            //this.title=convertifserbian(k.documents[0].title);
            let gal=k.documents[0].gallery;
            console.log(k.documents[0].gallery);
            /*let m= await database.listDocuments(config.website_db, config.album_images,[Query.equal("gallery",gal.$id)]);
            
            
            console.log(m);
            m.documents.forEach(element=>
            {
                let af={img:""};
                af.img=storage.getFilePreview(config.gallery_pictures_storage,element.image_id).toString();
                this.gallery.push(af);
                this.image_cnt++;
            });
            //console.log(k.documents[0]);
            */

            this.video_id=k.documents[0].video;
            let v2="659d5e6949ae7294f9f1";
            this.video_id=v2;
            this.video_link=storage.getFileView(config.website_images,this.video_id).href;
            console.log(this.video_link);
            this.video_link=config.default_video;
            this.loaded=true;
        },
        editmode()
        {
            this.$router.push("/admin/edit/"+this.$route.params.mode+"/"+this.$route.params.id);   
        }   
    }
}   
</script>