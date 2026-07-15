<template>
    <div class="p-6 md:p-8 glass flex flex-col md:ml-auto w-full md:py-8 flex-wrap md:mt-0 rounded-2xl">
       
                <h2 class="text-xl mb-1 font-semibold title-font text-gray-800 dark:text-white">{{ $t('feedback') }}</h2>
                <div class="section-accent !w-16 !mb-3"></div>
                <p class="leading-relaxed mb-5 text-gray-600 dark:text-gray-300">{{ $t('contactustext')  }}</p>
                <div class="relative mb-4">
                    
                <v-text-field
                 class="ctextfield"
                  v-model="name"
                  :label="$t('name')"
                ></v-text-field>
                </div>
                <div class="relative mb-4">
                    
                <v-text-field
                class="ctextfield"
                  v-model="email"
                  :label="$t('email')"
                ></v-text-field>
                    
                </div>
                <div class="relative mb-4">
                    <QuillEditor  content-type="html" :placeholder="$t('message')" v-model:content="message" toolbar="minimal" theme="snow" />    
                </div>
                
                <div class="relative mt-8 w-full">
                    <button
                      type="button"
                      @click="aaa"
                      class="glass-btn w-full sm:w-auto px-8 py-3 text-white font-semibold rounded-full"
                    >
                      {{ $t('submit') }}
                    </button>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">{{ $t('tyforsendingmessage') }}</p>
                
            </div>
</template>
<script>




import { Databases, ID } from "appwrite";
import {appw,config} from "@/appwrite";

const database = new Databases(appw);

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
            try {
                await database.createDocument(config.website_db, config.mess_coll, ID.unique(), {
                    email: this.email,
                    name: this.name,
                    message: this.message
                });
            } catch (error) {
                console.error('Error sending message:', error);
            }

            this.$notify(this.$t('thankyouforsendingmessage'));
            this.email = '';
            this.name = '';
            this.message = '';
        }
    }
}
</script>