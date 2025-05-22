<template>
    <div class="container mx-auto md:flex lg:flex xs:block sm:block " style="min-height: 1020px;">
        <img id="promo-img1" class="m-auto p-5  md:w-1/2 lg:w-1/2 xs:w-full sm:w-full"   v-lazy="{ src: img1, loading:LoadingImage }" alt="promo_image"/>
        <img v-if="!promoimage2off" id="promo-img2" class="m-auto p-5 md:w-1/2 lg:w-1/2 xs:w-full sm:w-full" v-lazy="{ src: img2, loading:LoadingImage  }"  alt="promo_image"/>
    </div>
</template>
<script lang="ts">
import { Client, Databases, ID,Storage, Query} from "appwrite";
import {appw,config} from "@/appwrite";
import { data } from "autoprefixer";
import LoadingImage from "@/components/LoadingImage.vue";
import gsap from "gsap";
export default
{
components:{LoadingImage},
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
img1:"",

img2:"",
promoimage2off:false
}
},
methods:{
    async getPromo()
    {
        const database= new Databases(appw);
        const storage = new Storage(appw);
        const res= await database.getDocument(config.website_db,config.general_settings,"promoimage1");
        const res2= await database.getDocument(config.website_db,config.general_settings,"promoimage2");
        const res3= await database.getDocument(config.website_db,config.general_settings,"promoimage2_turn_off");
        
        this.promoimage2_turn_off=res3.setting_status;
        //console.log(res);

        this.img1=storage.getFilePreview(
                config.website_images,           // bucket ID
                res.setting_data,       // file ID
                550,               // width, will be resized using this value.
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
          
                this.img2=storage.getFilePreview(
                config.website_images,           // bucket ID
                res2.setting_data,       // file ID
                550,               // width, will be resized using this value.
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
<style>
.bg_image
{
  
}
</style>