<template>
    <div class="page-shell">
    <div class="page-panel container">
        <div class="page-header-row">
            <div>
              <h1 class="section-title !text-2xl !mb-1">{{ $t('messages') }}</h1>
              <div class="section-accent !w-16"></div>
            </div>
            <div class="flex flex-wrap gap-2">
              <v-btn @click="delete_content" color="error">{{ $t('delete') }}</v-btn>
              <v-btn @click="$router.go(-1)" variant="outlined">{{ $t("goback") }}</v-btn>
              <v-btn v-if="false" @click="$router.go('mailto:'+email)">{{ $t("reply_back") }}</v-btn>
            </div>
        </div>

        <div class="space-y-4">
          <v-text-field
            disabled
            v-model="name"
            :counter="100"
            :label="$t('name')"
            hide-details
          ></v-text-field>
          <v-text-field
            disabled
            v-model="email"
            :counter="100"
            :label="$t('email')"
            hide-details
          ></v-text-field>
          <p v-if="missing" class="text-rose-600">{{ $t('contact_message_missing') }}</p>
          <div
            v-else
            class="rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-4 min-h-[12rem] whitespace-pre-wrap text-gray-900 dark:text-gray-100"
          >
            {{ bodyText || $t('contact_message_empty') }}
          </div>
        </div>
    </div>
    </div>    
        
    
</template>
<script lang="ts">
import { Databases } from "appwrite";
import { appw, config } from "@/appwrite";
import { extractMessageBody } from "@/utils/contactMessage";

const database = new Databases(appw);

export default{
data()
{
    return{
        name:"",
        email:"",
        bodyText:"",
        loading:true,
        missing:false
    }
},
components:{
},
mounted()
{
    this.getMD();

},
methods:{
    async getMD()
        {
            this.loading = true
            this.missing = false
            try {
              const doc = await database.getDocument(
                config.website_db,
                config.mess_coll,
                this.$route.params.id as string
              )
              this.name = doc.name || ''
              this.email = doc.email || ''
              this.bodyText = extractMessageBody(doc)
            } catch (error) {
              console.error('Failed to load message:', error)
              this.missing = true
            } finally {
              this.loading = false
            }
        },

    async delete_content()
    {
        let k= await database.deleteDocument(config.website_db, config.mess_coll,this.$route.params.id);  
        this.$notify(this.$t('deleted'));
        this.$router.push("/admin/messages");
    },
    
}

    
}


</script>