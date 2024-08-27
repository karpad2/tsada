<template>
    <section class="text-gray-600 ">
        <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
                <div class="flex flex-wrap w-full mb-20">
                    <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                        <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ $t('erasmus_applies') }}</h1>
                        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                    </div>
                
                </div>
    <div v-if="loaded"   class="m-auto w-full">
   
      
      <v-data-table  height="400" :headers="headers" :items="messages">
        <template v-slot:item.date="{ item }">
        {{ rt_time(item.date) }}
        </template>
    
      <template v-slot:item.edit1="{ item }">
        <router-link :to="'/admin/erasmus/docviewer/'+item.motivation_letter"><i class="pi pi-envelope text-5xl"></i></router-link> 
      </template>
      <template v-slot:item.edit2="{ item }">
        <router-link v-if="item.other_document!=null" :to="'/admin/erasmus/docviewer/'+item.other_document"><i class="pi pi-envelope text-5xl"></i></router-link> 
      </template>

      <template v-slot:item.edit3="{ item }">
        <router-link v-if="false" :to="'/admin/erasmus/docviewer/'+item.other_document"><i class="pi pi-envelope text-5xl"></i></router-link> 
        <v-btn @click="delete_content(item.id,item.other_document)">{{ $t("delete") }}</v-btn>
      </template>
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
                    { title: this.$t("email"), align: 'start', key: 'email',width: '300px' },
                    { title: this.$t("phone"), align: 'start', key: 'phone',width: '300px' },
                    { title: this.$t("class"), align: 'start', key: 'class',width: '300px' },
                    { title: this.$t("mark_avg"), align: 'start', key: 'mark',width: '300px' },
                    { title: this.$t("motivation_letter"), align: 'start', key: 'edit1',width: '300px' },
                    { title: this.$t("other_positive_documents"), align: 'start', key: 'edit2',width: '300px' },
                    { title: this.$t("delete"), align: 'start', key: 'edit3',width: '300px' },
                    ];
            this.load_messages_base();
           
        this.colDefs= [
                        { field: 'name', headerName:this.$t("name"), sortable: true, filter: true },
                        { field: 'contact', headerName:this.$t("date"), sortable: true, filter: true },
                        { field: 'email', headerName:this.$t("email"), sortable: true, filter: true },
                        { field: 'phone', headerName:this.$t("phone"), sortable: true, filter: true },
                        { field: 'class', headerName:this.$t("class"), sortable: true, filter: true },
                        { field: 'mark', headerName:this.$t("mark"), sortable: true, filter: true },
                        { field: 'edit1', headerName:this.$t("motivation_letter"), sortable: true, filter: true },
                        { field: 'edit2', headerName:this.$t("other_positive_documents"), sortable: true, filter: true },
                          
                        
                        ];
        },
        data: () => ({
            workers: [
                {
                    img: 'https://dummyimage.com/720x400',
                    name: 'SUBTITLE',
                    role: 'First',
                    contact: 'Lorem ipsum dolor sit'}],
                    messages:[],
                    colDefs:[],
                    loaded:false,
                    headers:[],
                    admin:false
                    
                }),
        methods:{
            async load_messages_base(){
                const loadingStore = useLoadingStore();
                //loadingStore.setLoading(true);
                this.workers=[];
                this.roles=[];
                //console.log();
                const database = new Databases(appw);
                const storage = new Storage(appw);
                let local=loadingStore.language;
                let n= await database.listDocuments(config.website_db, config.erasmus_applies,[Query.orderDesc("$createdAt")]);
                await n.documents.forEach(async el2 => {
                    let a={name:"",class:"",contact:"",email:"",date:"",id:"",phone:"",mark:"",motivation_letter:"",other_document:""};
                        a.id=el2.$id;
                        a.date=el2.$createdAt;
                        a.name=el2.name;
                        a.phone=el2.phone;
                        a.email=el2.email;
                        a.mark=el2.mark;
                        a.class=el2.class;
                        a.motivation_letter=el2.link_motivation_letter;
                        a.other_document=el2.link_other_document;
                    this.messages.push(a);
                    });
                console.log(this.messages)
                //n.documents.forEach()
                
            
                this.loaded=true;
                },
                async delete_content(aaa,bbb)
                {
                    const database = new Databases(appw);
                    const storage = new Storage(appw);
                    try{
                    let n=await storage.deleteFile(config.fs_erasmus,bbb);
                    }
                    catch (ex)
                    {
                        console.warn(ex)
                    }
                    try{
                    let k= await database.deleteDocument(config.website_db, config.erasmus_applies,aaa);  
                    }
                    catch(ex)
                    {
                        console.warn(ex)
                    }
                    this.$notify(this.$t('deleted'));
                    this.load_messages_base();
                    //this.router.push("/home");
                },
                rt_time(a)
                {   moment.locale('hu');
                    return moment(a).format("LLL");
                } 
            
           
        },
        calculated:{
          
        }
        
    }
    </script>