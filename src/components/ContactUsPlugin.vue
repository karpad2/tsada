<template>
    <div  class="p-3  dark:bg-slate-500 flex flex-col md:ml-auto w-full md:py-8 flex-wrap  md:mt-0 rounded-lg">
       
                <h2 class=" text-lg mb-1 font-medium title-font text-gray-700 dark:text-white">{{ $t('feedback') }}</h2>
                <p class="leading-relaxed mb-5 text-gray-700 dark:text-white">{{ $t('contactustext')  }}</p>
                <div class="relative mb-4">
                    
                <v-text-field
                 class=" text-gray-700 dark:text-white"
                  v-model="name"
                  :label="$t('name')"
                ></v-text-field>
                </div>
                <div class="relative mb-4">
                    
                <v-text-field
                class=" text-gray-700 dark:text-white"
                  v-model="email"
                  :label="$t('email')"
                ></v-text-field>
                    
                </div>
                <div class="relative mb-4">
                    <QuillEditor  content-type="html" :placeholder="$t('message')" v-model:content="message" toolbar="minimal" theme="snow" />    
                </div>
                
                <div class="relative mt-10 w-full">
                    <v-btn  @click="aaa"> {{ $t('submit') }}</v-btn>
                </div>
                <p class="text-xs text-gray-500 mt-3">{{ $t('tyforsendingmessage') }}</p>
                
            </div>
</template>
<script>




import { Client, Databases, ID } from "appwrite";
import {appw,config} from "@/appwrite";
import { Form, Field, ErrorMessage } from 'vee-validate';
export default {
    name: 'ContactUsPlugin2',
    components: {
        
    },
    data() {
        return {
            toast: null,
            
                email: '',
                name: '',
                message: ''
        
        }
    },
    setup() {
        
    },
    methods: {
        async aaa(){
            const databases= new Databases(appw);
            databases.createDocument(config.website_db,config.mess_coll,ID.unique(),
            {
                email: this.email,
                name: this.name,
                message: this.message
            }).then(response => {
                console.log(response);
            }).catch(error => {
                console.log(error);
            
            });

            this.$notify(this.$t('thankyouforsendingmessage'));
            this.email='';
            this.name= '';
            this.message= '';
             }
    }
}
</script>