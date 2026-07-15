<template>
    <section class="page-shell">
        <div class="page-panel container">
                <div class="page-header">
                    <h1 id="render_title" class="section-title !text-2xl sm:!text-3xl">{{ $t('studentdocuments') }}</h1>
                    <div class="section-accent !w-20"></div>
                </div>
                <div v-if="loaded"  v-for="role in roles" class="m-auto w-full popups mb-8" :key="role.role">
                <h2 class="page-section-title">{{ role.role }}</h2>
                <div class="page-table-wrap overflow-hidden">
                <v-data-table  height="400" :headers="headers" :items="role.workers">
                    <template v-slot:item.date="{ item }">
        {{ rt_time(item.date) }}
        </template>
    
      <template v-slot:item.open="{ item }">
        <router-link :to="'/document/'+item.doc_id"><i class="pi pi-book icon_size text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"></i></router-link>
       
      </template>

      <template v-slot:item.edit="{ item }">
        <router-link :to="'/admin/studentdocument/'+item.id"><i class="pi pi-cloud-upload icon_size text-green-600 hover:text-green-800 transition-colors"></i></router-link>
       
      </template>

      <template #bottom></template>
                    </v-data-table>
                </div>
                    <v-btn v-if="admin" @click="new_stuff(role.id)" class="m-5" color="primary">{{ $t('add_new_document_in_that_category') }}</v-btn>
                </div>
    </div>
    </section>
    
    
    </template>
    <script lang="ts">
    
    import { Databases, ID,Storage,Query } from "appwrite";
    import {appw,config} from "@/appwrite";
    import { convertifserbian } from "@/lang";
    import {useLoadingStore} from "@/stores/loading";
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
            document.title=this.$t("studentdocuments");
    
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
                    { title: this.$t("date"), align: 'start', key: 'date',width: '300px' },

                    { title: this.$t("open_document"), align: 'start', key: 'open',width: '300px' },

                    ];


        if(this.admin)
        {
            this.headers.push({ title: this.$t("edit_document"), align: 'start', key: 'edit',width: '300px' });
            this.colDefs.push({ field: 'edit', headerName:this.$t("edit_message"), sortable: true, filter: true });
        }


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
            async new_stuff(aaa)
            {
                const l= await database.createDocument(config.website_db, config.st_documents,ID.unique(),{"stDocumentCategories":aaa});
                this.$router.push("/admin/studentdocument/"+l.$id);
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
            
            let k= await database.listDocuments(config.website_db, config.st_document_categories,[Query.orderAsc("listasorrend"), Query.limit(100)]);
    
            for (let i=0;i<k.documents.length;i++)
            {
    
            let el1=k.documents[i];
          //   k.documents.forEach(async (el1) => {
                let _works=[];
                //console.log(el1);
                let l= await database.listDocuments(config.website_db, config.st_documents,[
                    Query.equal("stDocumentCategories",[el1.$id])
            ]);
            //console.log(l);
                let name="";
                if(local=="en")
                {
                    name=el1.category_name_en;
                }
                else if(local=="hu")
                {
                    name=el1.category_name_hu;
                }
                else if(local=="rs"||local=="sr")
                {
                    name=convertifserbian(el1.category_name_rs);
                }
                //console.log(l);
                for (const el2 of l.documents) {
                let a={name:"",contact:"",img:"",id:"",doc_id:"",date:""};
                a.id=el2.$id;
                if(local=="en"||local=="hu")
                {
                    a.name=el2.document_title_hu;
                    //a.role=el2.role;
                    a.contact=el2.contact;
                }
                else if(local=="rs"||local=="sr")
                {
                    a.name=convertifserbian(el2.document_title_rs);
                    //a.role=convertifserbian(el2.role);
                    a.contact=el2.contact;
                }
                if(el2.worker_img==""||el2.worker_img==null)
                {
                //a.img=missing_picture;
                }
                else
                {
    
                //a.img= await storage.getFileView(config.website_images,el2.worker_img).href;
                }
                a.id=el2.$id;
                a.doc_id=el2.document_id;
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