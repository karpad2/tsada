<template>
    <section class="text-gray-600 min-h-screen">
        <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
                <div class="flex flex-wrap w-full mb-20">
                    <div class=" w-full mb-6 lg:mb-0">
                        <h1 id="render_title" class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ $t('erasmus_applies_result') }}</h1>
                        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                    </div>
                
                </div>
                <div v-if="loaded"  v-for="role in roles" class="m-auto w-full popups" :key="role.role">
                <h1 class="sm:text-2xl text-sm font-medium   mb-3 text-gray-900  dark:text-white">{{ role.role }}</h1>
                <v-data-table  height="400" :headers="headers" :items="role.workers" :items-per-page="-1">
                    
    
      

      <template #bottom></template>
                    </v-data-table>
                    
                </div>
    </div>
    </section>
    
    
    </template>
    <script lang="ts">
    
    import { Client, Databases, ID,Storage,Query } from "appwrite";
    import {appw,config} from "@/appwrite";
    import { convertifserbian } from "@/lang";
    import {useLoadingStore} from "@/stores/loading";
    import {reactive,ref} from "vue";
    import gsap from "gsap";
    import moment from 'moment/min/moment-with-locales';
    
    export default {
        name: 'Workers',
        components: {
            
        },
        setup()
        {
    
        },
        mounted()
        {
            const loadingStore = useLoadingStore();
            this.admin=loadingStore.userLoggedin;
            document.title=this.$t("erasmus_applies_result");
    
            gsap.fromTo(
        "#render_title",
        {
          opacity: 0,
          x: "50%",
        },
        {
          duration: 1.5,
          opacity: 1,
          x: 0,
        }
      );
    
     
    
    
            //loadingStore.setLoading(true);
            
            this.load_workers_base();
            
            this.headers= [
                    { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                    { title: this.$t("class"), align: 'start', key: '_class',width: '300px' },
                    { title: this.$t("score"), align: 'start', key: 'score',width: '300px' },
                    
                    
                    ];
        

        
    
    
                        gsap.fromTo(
                        ".popups",
                        {
                        opacity: 0,
                        y: "50%",
                        },
                        {
                        duration: 1.5,
                        opacity: 1,
                        y: 0,
                        }
                    );                
        },
        data: () => ({
            workers: [
                {
                    img: 'https://dummyimage.com/720x400',
                    name: 'SUBTITLE',
                    role: 'First',
                    contact: 'Lorem ipsum dolor sit'}],
                    roles:[],
                    colDefs:[],
                    loaded:false,
                    headers:[],
                    admin:false
                    
                }),
        methods:{
            rt_time(a)
                {   const loadingStore = useLoadingStore();
                    let local=loadingStore.language;
                    if(local=="rs"||local=="sr")
                    {
                        moment.locale('sr');
                    }
                    else if(local=="hu")
                    {
                        moment.locale('hu');
                    }
                    else if(local=="en")
                    {
                        moment.locale('en');
                    }
                    else {

                    }
                    return moment(a).format("LLL");
                },
           
            async load_workers_base(){
            const loadingStore = useLoadingStore();
            //loadingStore.setLoading(true);
            this.workers=[];
            this.roles=[];
            //yapping();
            const database = new Databases(appw);
            const storage = new Storage(appw);
    
            let local=loadingStore.language;
    
            //let missing_picture=storage.getFileView(config.website_images,config.missing_worker_picture).href;
            
            //this is f voodoo, and sucks, but it works
            
            let k= await database.listDocuments(config.website_db, config.erasmus_location,[Query.orderDesc("location_hu")]);
    
            for (let i=0;i<k.documents.length;i++)
            {
    
            let el1=k.documents[i];
          //   k.documents.forEach(async (el1) => {
                let _works=[];
                //yapping(el1);
                let l= await database.listDocuments(config.website_db, config.erasmus_applies,[
                    Query.equal("erasmusLocation",[el1.$id])
            ]);
            //yapping(l);
                let name="";
                if(local=="en")
                {
                    name=el1.location_hu;
                }
                else if(local=="hu")
                {
                    name=el1.location_hu;
                }
                else if(local=="rs"||local=="sr")
                {
                    name=el1.location_rs;
                }
                //yapping(l);
                await l.documents.forEach(async el2 => {
                let a={name:"",score:"",_class:""};
                a.id=el2.$id;
                a.name=el2.name;
                a._class=el2.class;
                a.score=el2.score;
                a.id=el2.$id;
                //a.doc_id=el2.document_id;
                a.date=el2.$createdAt;    
                _works.push(a);
            });
            let b={role:"",workers:[],id:""};
            b.id=el1.$id;
            b.role=name;
            b.workers=_works;
            this.roles.push(b);
    //        });
          }
            yapping(this.roles);
            //loadingStore.setLoading(false);
            this.loaded=true;
            },
            onReady(params) {
                    yapping('onReady');
    
                    //this.api = params.api;
                    //this.calculateRowCount();
                    //this.load_workers_base();
                    //this.api.sizeColumnsToFit();
                }
           
        },
        
        
    }
    </script>
    <style>
    .popups{
    
    }
    </style>