<template>
    <section class="page-shell">
        <div class="page-panel container">
                <div class="page-header">
                    <h1 class="section-title !text-2xl sm:!text-3xl">{{ $t('erasmus_applies') }}</h1>
                    <div class="section-accent !w-20"></div>
                </div>
    <div v-if="loaded" class="m-auto w-full page-table-wrap overflow-hidden">
   
      
      <v-data-table  height="400" :headers="headers" :items="messages">
        <template v-slot:item.date="{ item }">
        {{ rt_time(item.date) }}
        </template>
    
      <template v-slot:item.edit1="{ item }">
        <router-link
          v-if="item.motivation_letter"
          :to="'/admin/erasmus/docviewer/'+item.motivation_letter"
        >
          <i class="pi pi-envelope text-5xl"></i>
        </router-link>
        <span v-else class="text-gray-400">—</span>
      </template>
      <template v-slot:item.edit2="{ item }">
        <router-link
          v-if="item.other_document"
          :to="'/admin/erasmus/docviewer/'+item.other_document"
        >
          <i class="pi pi-envelope text-5xl"></i>
        </router-link>
        <span v-else class="text-gray-400">—</span>
      </template>
      
      <template v-slot:item.edit4="{ item }">
        <router-link v-if="false" :to="'/admin/erasmus/editapply/'+item.other_document"><i class="pi pi-envelope text-5xl"></i></router-link> 
        <v-btn @click="edit_content(item.id,item.other_document)">{{ $t("edit") }}</v-btn>
      </template>


      <template v-slot:item.edit3="{ item }">
        <router-link v-if="false" :to="'/admin/erasmus/docviewer/'+item.other_document"><i class="pi pi-envelope text-5xl"></i></router-link> 
        <v-btn @click="delete_content(item)">{{ $t("delete") }}</v-btn>
      </template>
      
        </v-data-table>
        
    </div>
    </div>
    </section>
    
    
    </template>
    <script lang="ts">
    
    import { Databases, ID,Storage,Query } from "appwrite";
    import {appw,config} from "@/appwrite";
    import { convertifserbian } from "@/lang";

    const database = new Databases(appw);
    const storage = new Storage(appw);
    import {useLoadingStore} from "@/stores/loading";
    import {reactive,ref} from "vue";
    import dayjs from '@/utils/dayjs';
    
    
    
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
                    { title: this.$t("phone"), align: 'start', key: 'phone',width: '300px' },
                    { title: this.$t("class"), align: 'start', key: 'class',width: '300px' },
                    { title: this.$t("location"), align: 'start', key: 'location',width: '300px' },
                    { title: this.$t("score"), align: 'start', key: 'score',width: '300px' },
                    { title: this.$t("mark"), align: 'start', key: 'mark',width: '300px' },
                    { title: this.$t("motivation_letter"), align: 'start', key: 'edit1',width: '300px' },
                    { title: this.$t("other_positive_documents"), align: 'start', key: 'edit2',width: '300px' },
                    { title: this.$t("edit"), align: 'start', key: 'edit4',width: '300px' },
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
                
                //loadingStore.setLoading(true);
                this.workers=[];
                this.roles=[];
                //console.log();
                this.messages = [];
                let n= await database.listDocuments(config.website_db, config.erasmus_applies,[Query.orderDesc("$createdAt"),Query.limit(100)]);
                for (const el2 of n.documents) {
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
                    }
                //n.documents.forEach()


                this.loaded=true;
                },
                async delete_content(item)
                {
                    const files = [item?.motivation_letter, item?.other_document].filter(Boolean);
                    for (const fileId of files) {
                      try {
                        await storage.deleteFile(config.fs_erasmus, fileId);
                      } catch (ex) {
                        console.warn(ex);
                      }
                    }
                    try {
                      await database.deleteDocument(config.website_db, config.erasmus_applies, item.id);
                    } catch (ex) {
                      console.warn(ex);
                    }
                    this.$notify({ type: 'success', text: this.$t('deleted') });
                    this.load_messages_base();
                },
                rt_time(a)
                {   dayjs.locale('hu');
                    return dayjs(a).format("LLL");
                },
                edit_content(id)
                {
                    this.$router.push(`/admin/erasmus/editapply/${id}`);   
                } 
            
           
        },
        calculated:{
          
        }
        
    }
    </script>