<template>
    <section class="text-gray-600 body-font" id="courses">
        <div class="container px-5 py-24 mx-auto">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900">{{ $t('courses') }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            
            </div>
            <div class="flex flex-wrap -m-4">
                <div v-for="course in courses" class="xl:w-1/4 md:w-1/2 p-4">
                    <div  class="bg-gray-100 p-6 rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:bg-neutral-700 hover:scale-125">
                        <img class="h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out hover:scale-110"
                            :src="course.img" alt="content">
                       
                        <h3 class="tracking-widest text-sky-500 text-s font-medium title-font">{{ course.subtitle }}</h3>
                        <h2 class="text-lg text-gray-900 font-medium title-font mb-4">{{ course.title }}</h2>
                        <p class="leading-relaxed text-base" :v-html="course.text"></p>
                    </div>
                </div>
               
            </div>
        </div>
    </section>
</template>
<script >


import { Client, Databases, ID,Storage } from "appwrite";
import {appw,config} from "@/appwrite";
import {convertifserbian} from "@/lang";

export default {
    name: 'Courses',
    components: {
       
    },
    mounted()
    {
        this.load_courses_base();
    },
    data: () => ({
        courses: [
            {
                img: 'https://dummyimage.com/720x400',
                imga:"",
                subtitle: 'SUBTITLE',
                title: 'First',
                text: 'Lorem ipsum dolor sit'}]}),
    
    methods:{
        async load_courses_base()
        {
        this.courses=[];
            console.log();
        const database = new Databases(appw);
        const storage = new Storage(appw);
        let l= await database.listDocuments(config.website_db, config.courses_short);
        let local=localStorage.getItem("lang");
        l.documents.forEach(element => {
            let a={title:"",subtitle:"",text:"",img:""};
            if(local=="en")
            {
                a.title=element.course_en;
                a.subtitle=element.course_en_st;
                a.text=element.course_en_detail;
            }
            else if(local=="hu")
            {
                a.title=element.course_hu;
                a.subtitle=element.course_hu_st;
                a.text=element.course_hu_detail;
            }
            else if(local=="rs"||local=="sr")
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
            a.img=storage.getFileView(config.website_images,element.course_img);
            a.imga=element.course_img;
            this.courses.push(a);
        });
        },
    }
    
}

</script>