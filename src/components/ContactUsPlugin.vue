<template>
    <div class="p-3 lg:w-1/3 md:w-1/2 bg-white flex flex-col md:ml-auto w-full md:py-8 mt-8 md:mt-0 rounded-lg">
       
                <h2 class="text-gray-900 text-lg mb-1 font-medium title-font">{{ $t('feedback') }}</h2>
                <p class="leading-relaxed mb-5 text-gray-600">{{ $t('contactustext')  }}</p>
                <div class="relative mb-4">
                    <InputText class="w-full bg-white rounded border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out" v-model="name" :placeholder="$t('name')"/>
                </div>
                <div class="relative mb-4">
                    
                   
                    <Field class="w-full bg-white rounded border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"  :placeholder="$t('email')" v-model="email"  name="email" type="email" />
                    <ErrorMessage name="email" />
                </div>
                <div class="relative mb-4">
                    
                    <Editor :placeholder="$t('message')" v-model="message" style="height: 250px">
                        <template v-slot:toolbar>
                            <span class="ql-formats">
                                <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
                                <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
                                <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
                            </span>
                        </template>
                    </Editor>
                </div>
                

                    <Button class="text-white bg-sky-500/100 border-0 py-2 px-6 focus:outline-none hover:bg-sky-600 rounded text-lg " @click="aaa"> {{ $t('submit') }}</Button>
                <p class="text-xs text-gray-500 mt-3">{{ $t('tyforsendingmessage') }}</p>
                
            </div>
</template>
<script>
import Button from "primevue/button";
import InputText from 'primevue/inputtext';
import Editor from 'primevue/editor';
import { useToast } from "primevue/usetoast";
import { Client, Databases, ID } from "appwrite";
import {appw,config} from "@/appwrite";
import { Form, Field, ErrorMessage } from 'vee-validate';
export default {
    name: 'ContactUsPlugin',
    components: {
        Button,
        InputText,
        Editor,
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

            this.$notify($t('fb.thankyouforsendingmessage'));
            this.email='';
            this.name= '';
            this.message= '';
             }
    }
}
</script>