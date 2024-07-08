<template>
    <section class="text-gray-600 body-font mt-5 mb-5" id="courses" style="min-height: 70vh;">
        <div class="container px-5 mx-auto ">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1  class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ title }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
                
            </div>
            <p v-if="admin">
                    <VBtn  @click="editmode">{{ $t("edit") }}</VBtn>
                </p>
            <div class="flex flex-wrap -m-4">
                
                    
                
                </div>
            <viewer :images="images"
            @inited="inited"
            class="flex flex-wrap flex-row"
            ref="viewer"
            :options="options_for_image_viewer"
            >
            <template #default="scope">
            <div v-for="src in scope.images"  :key="src" class="xl:w-1/5 md:w-1/2 sm:w-full p-4 cursor-pointer  becsuszo_kep">
                <div style="min-width: 273px;"  class="align-middle transition items-center delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60  dark:bg-slate-300/30 p-6 rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                <img style="height: 272px;" class="object-contain " :src="src" />
               
                </div>
                </div>
            </template>
            </viewer>

               
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
        images:[],
        title:"",
        options_for_image_viewer:{"title":false},
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
        this.images=[];
           // console.log();
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const cc=useLoadingStore();
        let k;
        k=await database.getDocument(config.website_db,config.gallery,this.$route.params.id,[Query.select(["title_hu","title_en","title_rs"])]);
        let local=cc.language;
        if(local=="en")
            {
                this.title=k.title_en;
                //a.subtitle=element.short_en;
                //a.text=element.course_en_detail;
            }
            else if(local=="hu")
            {
                this.title=k.title_hu;
                //a.subtitle=element.short_hu;
                //a.text=element.course_hu_detail;
            }
            else if(local=="rs"||local=="sr")
            {
                this.title=convertifserbian(k.title_rs);
                //a.subtitle=convertifserbian(element.short_rs);
                //a.text=convertifserbian(element.course_rs_detail);
            }
        
        document.title=this.title;
        let l= await database.listDocuments(config.website_db, config.album_images,[Query.equal("gallery",this.$route.params.id)]);
         
        l.documents.forEach(async element => {
            let a={img:""};
            let b={src:""};
            
            a.img= await storage.getFilePreview(
                config.gallery_pictures_storage,           // bucket ID
                element.image_id,       // file ID
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
            b.src=await storage.getFilePreview(
                config.gallery_pictures_storage,           // bucket ID
                element.image_id,       // file ID
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
            this.images.push(a.img);
        });
        
        },
        isHidden(a)
        {
            //console.log(a);
            return !a;
        },
        editmode()
        {
            this.$router.push("/admin/gallery-edit/"+this.$route.params.id);  
        }
        
       
    }
    
}

</script>
<style>
.becsuszo_kep
{

}
</style>