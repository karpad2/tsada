<template>
    <div  class="m-auto w-full">
      <v-data-table  height="400" :headers="headers" :items="documents">
     <template v-slot:item.date="{ item }">
     {{ rt_time(item.date) }}
     </template>
 
   <template v-slot:item.open="{ item }">
     <router-link :to="'/document/'+item.doc_id"><i class="pi pi-book text-5xl"></i></router-link>
    
   </template>

   <template v-if="admin" v-slot:item.edit="{ item }">
     <router-link :to="'/admin/text-document-editor/'+item.id"><i class="pi pi-cloud-upload text-5xl"></i></router-link>
    
   </template>

   <template #bottom></template>
     </v-data-table>
     <v-btn v-if="admin" @click="new_stuff()" class="m-5">{{ $t('add_new_document_in_that_category') }}</v-btn>
 </div>

</template>
<script>
import {Client,Databases,ID,Storage,Query,Functions } from "appwrite";
import {appw,config} from "@/appwrite";
import moment from 'moment/min/moment-with-locales';
import {useLoadingStore} from "@/stores/loading";
import { convertifserbian } from "@/lang";

export default{
    data()
    {
        return {
        headers:[],
        colDefs:[],
        documents:[],
        admin:false
        }
    },
    computed: {
        loadingStore() {
            return useLoadingStore();
        },
        currentLanguage() {
            return this.loadingStore.language;
        }
    },
    watch: {
        // Watch for language changes and reload documents
        async currentLanguage() {
            await this.reloadDocuments();
        }
    },
    props:{
        _id:String
    },
    mounted()
    {
        this.setupHeaders();
        this.admin = this.loadingStore.userLoggedin;
        this.synchronize_documents();
    },
    methods:{
        setupHeaders() {
            this.headers = [
                { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                { title: this.$t("date"), align: 'start', key: 'date',width: '300px' },
                { title: this.$t("open_document"), align: 'start', key: 'open', width:'300px' },
            ];

            if(this.admin) {
                this.headers.push({ title: this.$t("edit_document"), align: 'start', key: 'edit',width: '300px' });
                this.colDefs.push({ field: 'edit', headerName:this.$t("edit_message"), sortable: true, filter: true });
            }
        },
        async reloadDocuments() {
            // Reload headers in case language changed the translations
            this.setupHeaders();
            await this.synchronize_documents();
        },
        async synchronize_documents()
        {
            const database = new Databases(appw);

                this.doc_loaded=false;
                this.documents=[];
                let local=this.loadingStore.language;
                let documents_cucc= await database.listDocuments(config.website_db, config.text_documents,[
                Query.equal("texts",this._id)]);

                await documents_cucc.documents.forEach(async el2 => {
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
                
                else
                {
    
                //a.img= await storage.getFileView(config.website_images,el2.worker_img).href;
                }
                a.id=el2.$id;
                a.doc_id=el2.document_id;
                a.date=el2.$createdAt;    
                this.documents.push(a);
               
                })
        },
        async new_stuff()
        {
            const database = new Databases(appw);
            const l= await database.createDocument(config.website_db, config.text_documents,ID.unique(),{"texts":this._id});
            this.$router.push("/admin/text-document-editor/"+l.$id);
        },
        rt_time(a)
                {   let local=this.loadingStore.language;
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

    }
}
</script>