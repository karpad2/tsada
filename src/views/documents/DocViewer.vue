<template>
<div class="w-3/4 p-y-2 m-auto pb-8"  style="height: 80vh;">
    <vue-pdf-app v-if="!loading" class="h-full w-auto" :pdf="pdf_file.href" />
</div>
</template>
<script>
import  VuePdfApp  from "vue3-pdf-app";
import "vue3-pdf-app/dist/icons/main.css";
import { Client, Databases, ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";
export default {
    components: {
        VuePdfApp
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
        }
      },
        }
    },
    mounted() {
        this.loadpdf();
    },
    methods: {
        async loadpdf()
        {   
            const storage = new Storage(appw);
            this.pdf_file=await storage.getFileView(config.documents_storage,this.$route.params.id);
            console.log(this.pdf_file);
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