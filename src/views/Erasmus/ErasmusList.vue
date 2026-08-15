<template>
    <section class="page-shell">
        <div class="page-panel container">
                <div class="page-header">
                    <h1 id="render_title" class="section-title !text-2xl sm:!text-3xl">{{ $t('erasmus_applies_result') }}</h1>
                    <div class="section-accent !w-20"></div>
                </div>
                <div v-if="!moduleOpen && !admin" class="page-state">
                    <h3 class="page-state-title">{{ $t('applies_are_closed') }}</h3>
                </div>
                <div v-else-if="loaded" v-for="role in roles" class="m-auto w-full popups mb-8" :key="role.role">
                <h2 class="page-section-title">{{ role.role }}</h2>
                <div class="page-table-wrap overflow-hidden">
                <v-data-table height="400" :headers="headers" :items="role.workers" :items-per-page="-1">
      <template #bottom></template>
                    </v-data-table>
                </div>
                </div>
    </div>
    </section>
    
    
    </template>
    <script lang="ts">
    
    import { Databases, ID,Storage,Query } from "appwrite";
    import {appw,config} from "@/appwrite";
    import { convertifserbian } from "@/lang";
    import {useLoadingStore} from "@/stores/loading";
    import { isPublicModuleOpen } from '@/services/modules/windows';
    import {reactive,ref} from "vue";
    import dayjs from '@/utils/dayjs';

    const database = new Databases(appw);
    const storage = new Storage(appw);

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
            this.admin = loadingStore.userLoggedin && (loadingStore.userRole === 'admin' || loadingStore.userRole === 'editor');
            document.title=this.$t("erasmus_applies_result");
            isPublicModuleOpen('erasmus_list').then((open) => {
              this.moduleOpen = open;
              if (!open && !this.admin) this.loaded = true;
            });
    
            import('gsap').then(({ default: gsap }) => {
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
            });




            //loadingStore.setLoading(true);

            this.load_workers_base();

            this.headers= [
                    { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                    { title: this.$t("class"), align: 'start', key: '_class',width: '300px' },
                    { title: this.$t("score"), align: 'start', key: 'score',width: '300px' },


                    ];                
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
                    admin:false,
                    moduleOpen:true
                    
                }),
        methods:{
            rt_time(a)
                {   const loadingStore = useLoadingStore();
                    let local=loadingStore.language;
                    if(local=="rs"||local=="sr")
                    {
                        dayjs.locale('sr');
                    }
                    else if(local=="hu")
                    {
                        dayjs.locale('hu');
                    }
                    else if(local=="en")
                    {
                        dayjs.locale('en');
                    }
                    else {

                    }
                    return dayjs(a).format("LLL");
                },
           
            async load_workers_base(){
            const loadingStore = useLoadingStore();
            //loadingStore.setLoading(true);
            this.workers=[];
            this.roles=[];
            //console.log();
            let local=loadingStore.language;
    
            //let missing_picture=storage.getFileView(config.website_images,config.missing_worker_picture).href;
            
            //this is f voodoo, and sucks, but it works
            
            let k= await database.listDocuments(config.website_db, config.erasmus_location,[Query.orderDesc("location_hu"), Query.limit(100)]);
    
            for (let i=0;i<k.documents.length;i++)
            {
    
            let el1=k.documents[i];
          //   k.documents.forEach(async (el1) => {
                let _works=[];
                //console.log(el1);
                let l= await database.listDocuments(config.website_db, config.erasmus_applies,[
                    Query.equal("erasmusLocation",[el1.$id])
            ]);
            //console.log(l);
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
                //console.log(l);
                for (const el2 of l.documents) {
                let a={name:"",score:"",_class:""};
                a.id=el2.$id;
                a.name=el2.name;
                a._class=el2.class;
                a.score=el2.score;
                a.id=el2.$id;
                //a.doc_id=el2.document_id;
                a.date=el2.$createdAt;
                _works.push(a);
            }
            let b={role:"",workers:[],id:""};
            b.id=el1.$id;
            b.role=name;
            b.workers=_works;
            this.roles.push(b);
    //        });
          }
            //loadingStore.setLoading(false);
            this.loaded=true;
            },
            onReady(params) {
    
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