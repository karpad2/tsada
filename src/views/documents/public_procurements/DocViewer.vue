<template>
<div  class="w-3/4  m-auto pb-8"   style="height: 100vh;">
    <iframe class="h-full w-full"  :src="pdf_file" ></iframe>
</div>
</template>
<script>
//import  VuePdfApp  from "vue3-pdf-app";//
//import "vue3-pdf-app/dist/icons/main.css";
//import "vue3-pdf-app/dist/icons/main.css";
//import PDF from "pdf-vue3";
//import { VuePDF, usePDF } from '@tato30/vue-pdf'
//import '@tato30/vue-pdf/style.css'
//import {usePDF, VuePDF} from 'VuePDF';
//import { VuePdf, createLoadingTask } from 'vue3-pdfjs/esm';
//import { VuePdfPropsType } from 'vue3-pdfjs/components/vue-pdf/vue-pdf-props'; // Prop type definitions can also be imported
//import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

import { Client, Databases, ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";
import { ref } from 'vue';
export default {
    components: {
        
    },
    data() {
        return {
            pdf_file: 'https://example.com/sample.pdf',
            loading: true,
            config: {
        toolbar: {
          toolbarViewerLeft: {
            previous: false
          }
        },
        pdf_link:null,
        numOfPages: ref(0),
      },
        }
    },
    mounted() {
        console.log("started loading docviewer")
        console.log(this.$route.params.id);

        this.loadpdf();
    },
    methods: {
        async loadpdf()
        {   
            const storage = new Storage(appw);
            
            let tmp=await storage.getFileView(config.documents_storage,this.$route.params.id);
            this.pdf_file=tmp.href;
            console.log(this.pdf_file);
            //this.pdf_link=pdf;
           /* const loadingTask = createLoadingTask(this.pdf_file)
      loadingTask.promise.then((pdf) => {
        numOfPages.value = pdf.numPages
      });*/
            console.log(tmp);
            this.loading=false;
        
        }
    }
}
</script>
<style>
#openFile {
    display: none;
}
#secondaryToolbarToggle {
    display: none;
}
#viewBookmark {
    display: none;
}
#viewFind {
    display: none;
}
#toolbarViewer{
    z-index: 1;
}
</style>