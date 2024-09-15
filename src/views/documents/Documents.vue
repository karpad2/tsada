<template>
    <section class="text-gray-600 min-h-screen">
        <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
                <div class="flex flex-wrap w-full mb-20">
                    <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                        <h1 id="render_title" class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ $t('documents') }}</h1>
                        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                    </div>
                
                </div>
                <div v-if="loaded"  v-for="role in roles" class="m-auto w-full popups" :key="role.role">
                <h1 class="sm:text-2xl text-sm font-medium   mb-3 text-gray-900  dark:text-white">{{ role.role }}</h1>
                <v-data-table  height="400" :headers="headers" :items="role.workers" :items-per-page="-1">
                    <template v-slot:item.date="{ item }">
        {{ rt_time(item.date) }}
        </template>
    
      <template v-slot:item.open="{ item }">
        <router-link :to="'/document/'+item.doc_id"><i class="pi pi-book icon_size"></i></router-link>
       
      </template>

      <template v-slot:item.edit="{ item }">
        <router-link :to="'/admin/document/'+item.id"><i class="pi pi-cloud-upload icon_size"></i></router-link>
       
      </template>

      <template #bottom></template>
                    </v-data-table>
                    <v-btn v-if="admin" @click="new_stuff(role.id)" class="m-5">{{ $t('add_new_document_in_that_category') }}</v-btn>
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
            document.title=this.$t("documents");
    
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
                    { title: this.$t("date"), align: 'start', key: 'date',width: '300px' },
                    
                    { title: this.$t("open_document"), align: 'start', key: 'open',width: '300px' },
                    
                    ];
        

        if(this.admin)
        {
            this.headers.push({ title: this.$t("edit_document"), align: 'start', key: 'edit',width: '300px' });
            this.colDefs.push({ field: 'edit', headerName:this.$t("edit_message"), sortable: true, filter: true });
        }
    
    
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
            async new_stuff(aaa)
            {
                const database = new Databases(appw);
                const l= await database.createDocument(config.website_db, config.documents_db,ID.unique(),{"documentCategories":aaa});
                this.$router.push("/admin/document/"+l.$id);
            },
            async load_workers_base(){
            const loadingStore = useLoadingStore();
            //loadingStore.setLoading(true);
            this.workers=[];
            this.roles=[];
            //console.log();
            const database = new Databases(appw);
            const storage = new Storage(appw);
    
            let local=loadingStore.language;
    
            //let missing_picture=storage.getFileView(config.website_images,config.missing_worker_picture).href;
            
            //this is f voodoo, and sucks, but it works
            
            let k= await database.listDocuments(config.website_db, config.document_categories_db,[Query.orderAsc("listasorrend")]);
    
            for (let i=0;i<k.documents.length;i++)
            {
    
            let el1=k.documents[i];
          //   k.documents.forEach(async (el1) => {
                let _works=[];
                //console.log(el1);
                let l= await database.listDocuments(config.website_db, config.documents_db,[
                    Query.equal("documentCategories",[el1.$id])
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
                await l.documents.forEach(async el2 => {
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
            });
            let b={role:"",workers:[],id:""};
            b.id=el1.$id;
            b.role=name;
            b.workers=_works;
            this.roles.push(b);
    //        });
          }
            console.log(this.roles);
            //loadingStore.setLoading(false);
            this.loaded=true;
            },
            onReady(params) {
                    console.log('onReady');
    
                    //this.api = params.api;
                    //this.calculateRowCount();
                    //this.load_workers_base();
                    //this.api.sizeColumnsToFit();
                }
           
        },
        
        
    }
    </script>
    <style>
    .icon_size{
        /*font-size: 3em;;*/
    }
</style>