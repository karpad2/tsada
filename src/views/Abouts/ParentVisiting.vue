
<template>
    <section class="text-gray-600 body-font mt-5 mb-5 min-h-screen" id="courses">
        <div class="container px-5 mx-auto ">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/2 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ $t("parentsvisiting") }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            </div>
           
            <v-data-table  height="400" :headers="headers" :items="classes" :items-per-page="-1">
                    
    
      

                <template #bottom></template>
            </v-data-table>


                
           
               
            
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
    name: 'PClassList',
    components: {
       
    },
    mounted()
    {
        this.headers= [
                    { title: this.$t("name"), align: 'start', sortable: false, key: 'chief',width: '200px' },
                    { title: this.$t("class"), align: 'start', key: '_class',width: '300px' },
                    { title: this.$t("classroom_chief_receiving_hour"), align: 'start', key: 'receiving_hour',width: '300px' },
                    
                    
                    
                    ];

        document.title=this.$t("parentsvisiting");
        const cc=useLoadingStore();
        this.load_courses_base();
        this.admin=cc.userLoggedin;

       
    },
    data: () => ({
        admin:false,
        classes: [],
        headers:[]
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
            let a={year:1,designation:"",role:"",chief:"",imga:"",language:"",id:"",receiving_hour:"",_class:""};
            console.log(l.documents[kk]);
            a.id=l.documents[kk].$id;
            //a.role=l[kk].role;
            a.designation=l.documents[kk].designation;
            a.language=l.documents[kk].language;
            a.year=l.documents[kk].year;
            a.receiving_hour=l.documents[kk].receiving_hour;
            //let b= await database.getDocument(config.website_db, config.workers,l[kk].worker);
             let b=null;
             a._class=this.class_designation(a.year,a.designation);
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
               //a.role=convertifserbian(c.title_rs);
               a.chief=convertifserbian(b.worker_name_rs);
            }
            else if(local=="hu")
            {   //a.role=c.title_hu;
                a.chief=b.worker_name_hu;
            }
            else if(local=="en")
            {
                //a.role=c.title_en;
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
        class_designation(a,b)
        {
            return  `${this.roman_number(a)}-${b}`;
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