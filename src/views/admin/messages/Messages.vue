<template>
    <section class="page-shell">
        <div class="page-panel container">
                <div class="page-header">
                    <h1 class="section-title !text-2xl sm:!text-3xl">{{ $t('messages') }}</h1>
                    <div class="section-accent !w-20"></div>
                </div>
    <div v-if="loaded" class="m-auto w-full page-table-wrap overflow-hidden">
      <v-data-table  height="400" :headers="headers" :items="messages" :items-per-page="-1"> 
        <template v-slot:item.date="{ item }">
        {{ rt_time(item.date) }}
        </template>
    
      <template v-slot:item.edit="{ item }">
        <router-link :to="'/admin/message/'+item.id"><i class="pi pi-envelope text-3xl text-sky-500"></i></router-link>
       
      </template>
      <template #bottom></template>
        </v-data-table>
        
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
                //console.log();
                let local=loadingStore.language;
                let n= await database.listDocuments(config.website_db, config.mess_coll,[Query.orderDesc("$createdAt"), Query.limit(100)]);
                for (const el2 of n.documents) {
                    let a={name:"",contact:"",email:"",date:"",id:""};
                        a.id=el2.$id;
                        a.date=el2.$createdAt;
                        a.name=el2.name;
                        a.email=el2.email;
                    this.messages.push(a);
                    }
                //n.documents.forEach()
                
            
                this.loaded=true;
                },
                rt_time(a)
                {   dayjs.locale('hu');
                    return dayjs(a).format("LLL");
                }
            
           
        },
        calculated:{
          
        }
        
    }
    </script>