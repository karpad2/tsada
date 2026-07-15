<template>
<img v-if="!load" v-lazy="image" alt="Content" class="transition duration-300 ease-in-out " />
<img v-else src="https://dummyimage.com/720x400" alt="Content" class="transition duration-300 ease-in-out " />
</template>
<script>
import { Storage } from "appwrite";
import {appw,config} from "@/appwrite";

const storage = new Storage(appw);

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
            try {
                this.image = storage.getFileView(config.website_images, this.img);
                this.load = false;
            } catch (error) {
                console.error('File does not exist', error);
                this.load = true;
            }
        }
    }
}
</script>