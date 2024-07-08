<template>
    <section class="text-gray-600 ">
        <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
                <div class="flex flex-wrap w-full mb-20">
                    <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                        <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ $t('documents') }}</h1>
                        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                    </div>
                
                </div>
    <div v-if="loaded"   class="m-auto w-full">
   
      
      <v-data-table  height="400" :headers="headers" :items="documents">
        <template v-slot:item.date="{ item }">
        {{ rt_time(item.date) }}
        </template>
    
      <template v-slot:item.open="{ item }">
        <router-link :to="'/document/'+item.doc_id"><i class="pi pi-book text-5xl"></i></router-link>
       
      </template>

      <template v-slot:item.edit="{ item }">
        <router-link :to="'/admin/document/'+item.id"><i class="pi pi-cloud-upload text-5xl"></i></router-link>
       
      </template>

      <template #bottom></template>
        </v-data-table>
        <v-btn v-if="admin" @click="new_stuff()" class="m-5">{{ $t('add_new_document_in_that_category') }}</v-btn>
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
            //loadingStore.setLoading(true);
            
            this.headers= [
                    { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                    { title: this.$t("date"), align: 'start', key: 'date',width: '300px' },
                    
                    { title: this.$t("open_document"), align: 'start', key: 'open',width: '300px' },
                    
                    ];
            this.load_documents_base();
           
        this.colDefs= [
                        { field: 'name', headerName:this.$t("name"), sortable: true, filter: true },
                        { field: 'contact', headerName:this.$t("date"), sortable: true, filter: true },
                        { field: 'open', headerName:this.$t("open_message"), sortable: true, filter: true },
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
                    documents:[],
                    colDefs:[],
                    loaded:false,
                    headers:[],
                    admin:false
                    
                }),
        methods:{
            async new_stuff()
        {
            const database = new Databases(appw);
            const l= await database.createDocument(config.website_db, config.documents_db,ID.unique(),{"documentCategories":this.$route.params.category});
            this.$router.push("/admin/document/"+l.$id);
        },
            async load_documents_base(){
                const loadingStore = useLoadingStore();
                let local=loadingStore.language;
                //loadingStore.setLoading(true);
                this.workers=[];
                this.roles=[];
                //console.log();
                const database = new Databases(appw);
                const storage = new Storage(appw);
                
                let n= await database.listDocuments(config.website_db, config.documents_db,[Query.equal("documentCategories",this.$route.params.category),Query.orderDesc("$createdAt")]);
                await n.documents.forEach(async el2 => {
                    let a={name:"",date:"",id:"",doc_id:""};

                    if(local=="rs"||local=="sr")
                    {
                        a.name=el2.document_title_rs
                    }
                    else if(local=="hu")
                    {
                        a.name=el2.document_title_hu
                    }
                    else if(local=="en")
                    {
                        a.name=el2.document_title_en
                    }
                    else {

                    }
                        a.id=el2.$id;
                        a.doc_id=el2.document_id;
                        a.date=el2.$createdAt;
                        //a.name=el2.name;
                        //a.email=el2.email;
                    this.documents.push(a);
                    });
                console.log(this.messages)
                //n.documents.forEach()
                
            
                this.loaded=true;
                },
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
                } 
            
           
        },
        calculated:{
          
        }
        
    }
    </script>