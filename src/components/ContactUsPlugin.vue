<template>
    <div  class="p-3  dark:bg-slate-500 flex flex-col md:ml-auto w-full md:py-8 flex-wrap  md:mt-0 rounded-lg">
       
                <h2 class=" text-lg mb-1 font-medium title-font text-gray-700 dark:text-white">{{ $t('feedback') }}</h2>
                <p class="leading-relaxed mb-5 text-gray-700 dark:text-white">{{ $t('contactustext')  }}</p>
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
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        {{ $t('message') }}
                    </label>
                    <ckeditor
                        v-model="message"
                        :config="editorConfig"
                        :placeholder="$t('message')"
                    />
                </div>
                
                <div class="relative mt-10 w-full">
                    <v-btn  @click="aaa"> {{ $t('submit') }}</v-btn>
                </div>
                <p class="text-xs text-gray-500 mt-3">{{ $t('tyforsendingmessage') }}</p>
                
            </div>
</template>

<style scoped>
/* CKEditor dark mode support */
.dark :deep(.ck-editor) {
    background-color: rgb(71 85 105) !important;
    border-color: rgb(100 116 139) !important;
}

.dark :deep(.ck-toolbar) {
    background-color: rgb(51 65 85) !important;
    border-color: rgb(100 116 139) !important;
}

.dark :deep(.ck-content) {
    background-color: rgb(71 85 105) !important;
    color: rgb(31 41 55) !important;
    border-color: rgb(100 116 139) !important;
}

.dark :deep(.ck-content p) {
    color: rgb(31 41 55) !important;
}

/* Hide CKEditor bottom panel */
:deep(.cke_1_bottom) {
    display: none !important;
}

.dark :deep(.ck-button) {
    color: rgb(203 213 225) !important;
}

.dark :deep(.ck-button:hover) {
    background-color: rgb(100 116 139) !important;
}

.dark :deep(.ck-button.ck-on) {
    background-color: rgb(59 130 246) !important;
    color: white !important;
}

.dark :deep(.ck-dropdown__button) {
    color: rgb(203 213 225) !important;
}

.dark :deep(.ck-dropdown__panel) {
    background-color: rgb(71 85 105) !important;
    border-color: rgb(100 116 139) !important;
}

.dark :deep(.ck-list__item) {
    color: rgb(248 250 252) !important;
}

.dark :deep(.ck-list__item:hover) {
    background-color: rgb(100 116 139) !important;
}

.dark :deep(.ck-balloon-panel) {
    background-color: rgb(71 85 105) !important;
    border-color: rgb(100 116 139) !important;
}

.dark :deep(.ck-input) {
    background-color: rgb(71 85 105) !important;
    color: rgb(248 250 252) !important;
    border-color: rgb(100 116 139) !important;
}

/* Light mode enhancements */
:deep(.ck-editor) {
    border-radius: 8px;
    overflow: hidden;
}

:deep(.ck-toolbar) {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
}

:deep(.ck-content) {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    min-height: 120px;
}
</style>

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
                message: '',
                editorConfig: {
                    toolbar: {
                        items: [
                            'bold', 'italic', 'underline', '|',
                            'bulletedList', 'numberedList', '|',
                            'link', 'undo', 'redo'
                        ],
                        shouldNotGroupWhenFull: false
                    },
                    language: 'en',
                    removePlugins: [
                        'CKFinderUploadAdapter',
                        'CKFinder',
                        'EasyImage',
                        'Image',
                        'ImageCaption',
                        'ImageStyle',
                        'ImageToolbar',
                        'ImageUpload',
                        'MediaEmbed'
                    ],
                    link: {
                        decorators: {
                            openInNewTab: {
                                mode: 'manual',
                                label: 'Open in a new tab',
                                attributes: {
                                    target: '_blank',
                                    rel: 'noopener noreferrer'
                                }
                            }
                        }
                    },
                    typing: {
                        transformations: {
                            remove: [
                                'enDash',
                                'emDash'
                            ]
                        }
                    }
                }

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