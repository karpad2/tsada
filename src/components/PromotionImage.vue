<template>
    <div class="container mx-auto">
        <img class="m-auto" :src="img" alt="promo_image"/>
    </div>
</template>
<script lang="ts">
import { Client, Databases, ID,Storage, Query} from "appwrite";
import {appw,config} from "@/appwrite";
import { data } from "autoprefixer";

export default
{
name: 'PromoImage',
mounted()
{
    
    this.getPromo();

},
data()
{
return{
img:""
}
},
methods:{
    async getPromo()
    {
        const database= new Databases(appw);
        const storage = new Storage(appw);
        const res= await database.getDocument(config.website_db,config.general_settings,"668533c5a2c3747d18f6");
        //console.log(res);

        this.img=storage.getFileView(config.website_images,res.setting_data).href;
    }

}
}
</script>