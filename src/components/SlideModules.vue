<template>
    <section class="text-gray-600 body-font mt-5 mb-5" id="courses">
        <div class="container px-5 mx-auto ">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ $t(mode) }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            
            </div>
            <div class="flex flex-wrap -m-4">
               
                    <div   v-if="admin" @click="new_stuff" class="card card-compact cursor-pointer glass m-3 w-full  sm:w-1/5 md:w-1/5 lg:w-1/5  transition delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60  dark:bg-slate-300/30 shadow-xl">
                        <figure class="h-40">
                        <img  class="size-16 m-auto rounded center object-cover object-center mb-6 transition duration-300 ease-in-out "
                            src="@/assets/add-plus-new.svg" alt="content">
                        </figure>
                        <div class="card-body">
                       <h2 class="text-lg text-gray-900 font-medium title-font mb-4 dark:text-white card-title">{{ $t("add_new_content") }}</h2>
                        </div>
                    </div>
                

               
                    
                    <div v-for="course in courses"  @click="courseopen(course.id)" class="card card-compact cursor-pointer glass m-3  w-full  sm:w-1/5 md:w-1/5 lg:w-1/5  transition delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60  dark:bg-slate-300/30 shadow-xl">
                        <figure>
                        <img class="h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out "
                            v-lazy="{ src: course.img, loading:'@/assets/Loading.gif' }" alt="content">
                        </figure>
                        <div class="card-body">

                        <h3 class="tracking-widest  text-s font-medium title-font ">{{ course.subtitle }} <span v-if="isHidden(course.visible)">{{ $t('invisible') }}</span></h3>
                        <h2 class="text-lg text-gray-900 font-medium title-font mb-4 dark:text-white card-title">{{ course.title }}</h2>
                        <p class="leading-relaxed text-base" :v-html="course.text"></p>
                    </div>
                    </div>
                
                
               
            </div>
        </div>
    </section>
</template>
<script lang="ts">


import { Client, Databases, ID,Storage, Query} from "appwrite";
import {appw,config} from "@/appwrite";
import {convertifserbian,getStatus} from "@/lang";
import {useLoadingStore} from "@/stores/loading";

import gsap from "gsap";
export default {
    name: 'SlideModules',
    components: {
       
    },
    mounted()
    {
        
        const cc=useLoadingStore();
        this.load_courses_base();
        this.admin=cc.userLoggedin;

        gsap.fromTo(
    ".becsuszo_kep",
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
    data: () => ({
        admin:false,
        courses: [
            {
                img: 'https://dummyimage.com/720x400',
                imga:"",
                subtitle: 'SUBTITLE',
                title: 'First',
                text: 'Lorem ipsum dolor sit'}]}),
    props:{
        mode:String
    },
    
    methods:{
        async load_courses_base()
        {
        this.courses=[];
           // console.log();
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const cc=useLoadingStore();
        let l;
        if(this.mode=="news"&&cc.userLoggedin)
        {
            l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("type",this.mode),Query.or([Query.isNull("notNews"),Query.equal("notNews",false)]),Query.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible","$createdAt","notNews"]),Query.limit(50),Query.orderDesc("$createdAt")]);
         
        }
        else if(this.mode=="news"&&!cc.userLoggedin)
        {
            l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("type",this.mode),Query.or([Query.isNull("notNews"),Query.equal("notNews",false)]),Query.equal(getStatus(),true),Query.equal("visible",true),Query.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible","notNews"]),Query.limit(50),Query.orderDesc("$createdAt")]);

        }
        else if(!cc.userLoggedin)
        {
            l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("type",this.mode),Query.equal(getStatus(),true),Query.equal("visible",true),Query.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible","$createdAt","notNews"]),Query.limit(50),Query.orderDesc("$createdAt")]);
        }
        else
        {
            l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("type",this.mode),Query.select(["$createdAt","title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible","$createdAt","notNews"]),Query.limit(50),Query.orderDesc("$createdAt")]);
         
        }
        let local=cc.language;
        l.documents.forEach(element => {
            let a={title:"",subtitle:"",text:"",img:"",imga:"",en:"",id:"",visible:false};
            //console.log(element);
            a.id=element.$id;
            
            a.visible=element.visible;
            if(local=="en")
            {
                a.title=element.title_en;
                a.subtitle=element.short_en;
                //a.text=element.course_en_detail;
            }
            else if(local=="hu")
            {
                a.title=element.title_hu;
                a.subtitle=element.short_hu;
                //a.text=element.course_hu_detail;
            }
            else if(local=="rs"||local=="sr")
            {
                a.title=convertifserbian(element.title_rs);
                a.subtitle=convertifserbian(element.short_rs);
                //a.text=convertifserbian(element.course_rs_detail);
            }
            if(element.code==""||element.code==null)
            a.en=element.title_en;
            else a.en=element.code;
            //console.log(element.course_img);
            if(element.default_image==null||element.default_image=='')
            {
                a.img="https://dummyimage.com/720x400";
            }
            else
            a.img= storage.getFilePreview(
                config.website_images,           // bucket ID
                element.default_image,       // file ID
                700,               // width, will be resized using this value.
                0,                  // height, ignored when 0
                'center',           // crop center
                90,               // slight compression
                5,                  // border width
                'FFFFFF',           // border color
                15,                 // border radius
                1,                  // full opacity
                0,                  // no rotation
                'FFFFFF',           // background color
                'webp'               // output webp format
                ).href;
            
            //a.img=storage.getFileView(config.website_images,element.default_image).toString();
            //a.imga=element.default_image.toString();
            this.courses.push(a);
        });
        
        },
        isHidden(a)
        {
            //console.log(a);
            return !a;
        },
        courseopen(a)
        {
            console.log(a);
            let b=a.toLowerCase();
            b=b.replaceAll(" ","");
            console.log(b);
            this.$router.push("/renderer/"+this.mode+"/"+b);
        },
        async new_stuff()
        {
            const database = new Databases(appw);
            const l= await database.createDocument(config.website_db, config.about_us_db,ID.unique(),{"type":this.mode,"aboutCategories":config.news_category_in_text,"notNews":false});
            this.$router.push("/admin/edit/"+this.mode+"/"+l.$id);
        }
    }
    
}

</script>
<style>
.becsuszo_kep
{

}
</style>