<template>
<img v-if="!load" :src="image" alt="Content" class="transition duration-300 ease-in-out " />
<img v-else src="https://dummyimage.com/720x400" alt="Content" class="transition duration-300 ease-in-out " />
</template>
<script>
import { Client, Databases, ID,Storage } from "appwrite";
import {appw,config} from "@/appwrite";

export default {
    name: 'Image',
    props: {
        img: {
            type: String,
            required: true
        },
    },
    data: () => ({
        image: '',
        load:true
    }),
    mounted() {
        this.load_image_from_base();
    },
    methods:{
        async load_image_from_base() {
        const storage = new Storage(appw);
        try {
            const fileInfo = await storage.getFileInfo(this.img);
            this.image = await storage.getFileView(config.website_images, this.img);
            console.log(this.image);
            this.load = false;
        } catch (error) {
            console.log('File does not exist', error);
            this.load = true;
        }
    }
    }
}
</script>