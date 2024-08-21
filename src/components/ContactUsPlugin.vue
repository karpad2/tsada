<template>
    <div  class="p-3 bg-slate-100 dark:bg-slate-500 flex flex-col md:ml-auto w-full md:py-8 flex-wrap  md:mt-0 rounded-lg">
       
                <h2 class="text-gray-900 dark:text-white text-lg mb-1 font-medium title-font">{{ $t('feedback') }}</h2>
                <p class="leading-relaxed mb-5 dark:text-white text-gray-600">{{ $t('contactustext')  }}</p>
                <div class="relative mb-4">
                    <InputText v-if="false" class="w-full bg-slate-100/30 dark:bg-slate-300/30 rounded border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" v-model="name" :placeholder="$t('name')"/>
                    <v-text-field
                  
                  v-model="name"
                  :label="$t('name')"
                ></v-text-field>
                </div>
                <div class="relative mb-4">
                    <InputText v-if="false" class="w-full bg-slate-100/30 dark:bg-slate-300/30 rounded border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"  :placeholder="$t('email')" v-model="email"  name="email" type="email" />
                    
                <v-text-field
                  v-model="email"
                  :label="$t('email')"
                ></v-text-field>
                    <ErrorMessage name="email" />
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

import InputText from 'primevue/inputtext';

import { useToast } from "primevue/usetoast";
import { Client, Databases, ID } from "appwrite";
import {appw,config} from "@/appwrite";
import { Form, Field, ErrorMessage } from 'vee-validate';
export default {
    name: 'ContactUsPlugin',
    components: {
        
        InputText,
        
        Field, ErrorMessage,
        
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