<template>
    <div class="container mx-auto">
        <img id="promo-img" class="m-auto" :src="img" alt="promo_image"/>
    </div>
</template>
<script lang="ts">
import { Client, Databases, ID,Storage, Query} from "appwrite";
import {appw,config} from "@/appwrite";
import { data } from "autoprefixer";
import gsap from "gsap";
export default
{
name: 'PromoImage',
mounted()
{
    
    this.getPromo();
    gsap.fromTo(
    "#promo-img",
    {
      opacity: 0,
      y: "150%",
    },
    {
      duration: 1.5,
      opacity: 1,
      y: 0,
    }
  );

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

        this.img=storage.getFilePreview(
                config.website_images,           // bucket ID
                res.setting_data,       // file ID
                700,               // width, will be resized using this value.
                0,                  // height, ignored when 0
                'center',           // crop center
                90,               // slight compression
                5,                  // border width
                'FFFFFF',           // border color
                15,                 // border radius
                1,                  // full opacity
                0,                  // no rotation
                'FFFFFF',           // background color
                'webp'               // output webp format
                ).href;
        //storage.getFileView(config.website_images,res.setting_data).href;
    }

}
}
</script>