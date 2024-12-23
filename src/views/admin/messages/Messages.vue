<template>
    <section class="text-gray-600 ">
        <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
                <div class="flex flex-wrap w-full mb-20">
                    <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                        <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ $t('messages') }}</h1>
                        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                    </div>
                
                </div>
    <div v-if="loaded"   class="m-auto w-full">
   
      
      <v-data-table  height="400" :headers="headers" :items="messages" :items-per-page="-1"> 
        <template v-slot:item.date="{ item }">
        {{ rt_time(item.date) }}
        </template>
    
      <template v-slot:item.edit="{ item }">
        <router-link :to="'/admin/message/'+item.id"><i class="pi pi-envelope text-5xl"></i></router-link>
       
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
                    { title: this.$t("open_message"), align: 'start', key: 'edit',width: '300px' },
                    ];
            this.load_messages_base();
           
        this.colDefs= [
                        { field: 'name', headerName:this.$t("name"), sortable: true, filter: true },
                        { field: 'contact', headerName:this.$t("date"), sortable: true, filter: true },
                        { field: 'email', headerName:this.$t("email"), sortable: true, filter: true },
                        { field: 'edit', headerName:this.$t("open_message"), sortable: true, filter: true },
                          
                        
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
                //yapping();
                const database = new Databases(appw);
                const storage = new Storage(appw);
                let local=loadingStore.language;
                let n= await database.listDocuments(config.website_db, config.mess_coll,[Query.orderDesc("$createdAt")]);
                await n.documents.forEach(async el2 => {
                    let a={name:"",contact:"",email:"",date:"",id:""};
                        a.id=el2.$id;
                        a.date=el2.$createdAt;
                        a.name=el2.name;
                        a.email=el2.email;
                    this.messages.push(a);
                    });
                yapping(this.messages)
                //n.documents.forEach()
                
            
                this.loaded=true;
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