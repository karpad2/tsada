<template>
    <section class="text-gray-600 body-font mt-5 mb-5 min-h-screen" id="courses">
        <div class="container px-5 mx-auto ">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ $t("classlist") }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            </div>
            <div class="flex flex-wrap -m-4 grid-cols-3">
                <div v-if="admin" @click="new_stuff"  class="xl:w-1/5 md:w-96 sm:w-full p-4 cursor-pointer becsuszo_kep">
                    <div  style="min-width: 273px; min-height: 276px;"  class="transition delay-150 bg-slate-100/80 backdrop-filter hover:bg-sky-600/60  dark:bg-slate-300/30 p-6 rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                        
                        <img  class="size-16 m-auto rounded center object-cover object-center mb-6 transition duration-300 ease-in-out "
                            src="@/assets/add-plus-new.svg" alt="content">
                       <h2 class="text-lg text-gray-900 font-medium title-font mb-4 dark:text-white">{{ $t("add_new_class") }}</h2>
                    </div>
                </div>



                <div  v-for="_class in classes" :key="_class.id" class="card glass bg-primary text-primary-content w-96 m-2">
                    <div  class="card-body">
                        <h2 class="card-title"> {{ roman_number(_class.year) }}-{{ _class.designation  }} {{ $t("class") }}</h2>
                        <p>{{ _class.role }}</p>
                        <p>{{ $t("masterchief") }}: {{ _class.chief }}</p>
                        <p>{{ $t("teaching_language") }}:  <span v-if="_class.language=='class_hun'"> {{ $t("hun_teaching") }} </span> <span v-if="_class.language=='class_srb'"> {{ $t("srb_teaching") }} </span> </p>
                        <p>{{ $t("classroom_chief_receiving_hour") }}: {{ _class.receiving_hour }}</p>
                        <div v-if="admin" class="card-actions justify-end">
                        <button  class="btn" v-on:click="classopen(_class.id)">{{ $t("edit") }}</button>
                        </div>
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
    name: 'ClassList',
    components: {
       
    },
    mounted()
    {
        document.title=this.$t("classlist");
        const cc=useLoadingStore();
        this.load_courses_base();
        this.admin=cc.userLoggedin;

       
    },
    data: () => ({
        admin:false,
        classes: []
    }),
    props:{
        mode:String
    },
    
    methods:{
        async load_courses_base()
        {
            
        this.classes=[];
           // console.log();
        const database = new Databases(appw);
        const storage = new Storage(appw);
        const cc=useLoadingStore();
        let l;
        l= await database.listDocuments(config.website_db, config.classlist,[Query.orderAsc("year"),Query.orderAsc("designation")]);
     
        let local=cc.language;
        //console.log(l);
        for (let kk=0;kk<l.total;kk++)
        {
            let a={year:1,designation:"",role:"",chief:"",imga:"",language:"",id:"",receiving_hour:""};
            console.log(l.documents[kk]);
            a.id=l.documents[kk].$id;
            //a.role=l[kk].role;
            a.designation=l.documents[kk].designation;
            a.language=l.documents[kk].language;
            a.year=l.documents[kk].year;
            a.receiving_hour=l.documents[kk].receiving_hour;
            //let b= await database.getDocument(config.website_db, config.workers,l[kk].worker);
             let b=null;
             try{ 
             b=l.documents[kk].workers;
             }
             catch(ex)
             {
                console.log(ex);
             }
             let c=null;            
             try{
             c =l.documents[kk].courses;
             }
             catch(ex){
                console.log(ex);
             }
             try{
             if(local=="rs"||local=="sr")
            {
               a.role=c.title_rs;
               a.chief=convertifserbian(b.worker_name_rs);
            }
            else if(local=="hu")
            {   a.role=c.title_hu;
                a.chief=b.worker_name_hu;
            }
            else if(local=="en")
            {
                a.role=c.title_en;
                a.chief=b.worker_name_hu;
            }
        }
        catch (ex)
        {
            console.log(ex);
        }
            

            //a.imga=element.default_image.toString();
            this.classes.push(a);
        }
        console.log(this.classes);
        
        },
        isHidden(a)
        {
            //console.log(a);
            return !a;
        },
        classopen(a)
        {
            if(this.admin)
            {
                this.$router.push("/admin/class-edit/"+a);
            }
        },
        async new_stuff()
        {
            const database = new Databases(appw);
            const l= await database.createDocument(config.website_db, config.classlist,ID.unique(),{"year":1});
            this.$router.push("/admin/class-edit/"+l.$id);
        },
        roman_number(n:number)
        {
            let k="Hiba";
            if(n==1)
            {
                k="I";
            }
            else if(n==2)
            {
                k="II";
            }
            else if(n==3)
            {
                k="III";
            }
            else if(n==4)
            {
                k="IV";
            }
            return k;
        }
    }
    
}

</script>
<style>
.becsuszo_kep
{

}
</style>