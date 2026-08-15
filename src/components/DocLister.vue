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
import { Databases, ID, Query } from "appwrite";
import { appw, config } from "@/appwrite";
import dayjs from '@/utils/dayjs';
import { useLoadingStore } from "@/stores/loading";
import { pickLocalized } from "@/utils/localizedText";

const database = new Databases(appw);

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
        // Set admin FIRST, then setup headers (which depends on admin value)
        this.admin = this.loadingStore.userLoggedin && (this.loadingStore.userRole === 'admin' || this.loadingStore.userRole === 'editor');
        this.setupHeaders();
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
                this.documents=[];
                const local = this.loadingStore.language;
                const { documents: docs } = await database.listDocuments(config.website_db, config.text_documents,[
                    Query.equal("texts",this._id)
                ]);

                this.documents = docs.map(el2 => {
                    return {
                        name: pickLocalized(el2, ['document_title', 'title'], local),
                        contact: el2.contact || "",
                        img: "",
                        id: el2.$id,
                        doc_id: el2.document_id,
                        date: el2.$createdAt,
                    };
                });
        },
        async new_stuff()
        {
            const l = await database.createDocument(config.website_db, config.text_documents,ID.unique(),{"texts":this._id});
            this.$router.push("/admin/text-document-editor/"+l.$id);
        },
        rt_time(a)
                {
                    const local = this.loadingStore.language;
                    dayjs.locale(local === "rs" || local === "sr" ? 'sr' : local);
                    return dayjs(a).format("LLL");
                },

    }
}
</script>