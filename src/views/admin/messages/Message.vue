<template>
    <div class="relative mb-4 container  px-5  mx-auto bg-white" >
        <div>
            <v-btn @click="delete_content" class="m-5">{{ $t('delete') }}</v-btn>
            <VBtn @click="$router.go(-1)" class="m-5">{{ $t("goback") }}</VBtn>
            <VBtn v-if="false" @click="$router.go('mailto:'+email)" class="m-5">{{ $t("reply_back") }}</VBtn>
        </div>

    <div>
            
<div class="flex flex-wrap -m-4">


</div>
<div class="relative mb-4 container px-10">
            
            <div >
            <v-text-field
            disabled
            v-model="name"
            :counter="100"
            :label="$t('name')"
            hide-details
            
          ></v-text-field>
        </div>
        <div >
          <v-text-field
            disabled
            v-model="email"
            :counter="100"
            :label="$t('email')"
            hide-details
            
          ></v-text-field>
        </div>
        
        <div style="min-height: 300px;" class="bg-slate-100" v-html="message"></div>
    </div>
             
    </div>
</div>    
        
    
</template>
<script lang="ts">
import {Client,Databases,ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";

import {useLoadingStore} from "@/stores/loading";

export default{
data()
{
    return{
        name_hu:"",
        email:"",
        contact:"",
        message:"",
        default_img_link:"",
        file_link:null,
        img:""
    }
},
components:{
},
mounted()
{
    this.getMD();

},
methods:{
    async getMD()
        {
            
            const database = new Databases(appw);
            const storage = new Storage(appw);
            const cc=useLoadingStore();
            //just fucking kill me
            let mode="";
           
            
            let k= await database.listDocuments(config.website_db, config.mess_coll,[Query.equal("$id",this.$route.params.id)]);
            
                
                    this.name=k.documents[0].name;
                    this.email=k.documents[0].email;
                    this.message=k.documents[0].message;
                
                    //this.contact=k.documents[0].contact;
                  

                    //this.visible=k.documents[0].visible;

                    /*
                    if(k.documents[0].worker_img==null||k.documents[0].worker_img=='')
                    {
                        this.img=storage.getFileView(config.website_images,config.missing_worker_picture).href;
                    }
                    else
                    this.img=storage.getFileView(config.website_images,k.documents[0].worker_img).toString();
                
                    */
               
           /* if(this.chtml=="---")
            {
                this.$router.push("/home");
            }*/

            /*if(this.$route.params.node=="news")
            {
                this.newsmode=true;
                if(k.documents[0].author!="")
                this.author= convertifserbian(k.documents[0].author);
                this.date= moment(k.documents[0].$createdAt).locale(cc.language).format('LL');
            }

            if(this.$route.params.node=="education")
            {
                this.edumode=true;
            }*/

            //this.title=convertifserbian(k.documents[0].title);
            /*let gal=k.documents[0].gallery;
            yapping(k.documents[0].gallery);*/
            /*let m= await database.listDocuments(config.website_db, config.album_images,[Query.equal("gallery",gal.$id)]);
            
            
            yapping(m);
            m.documents.forEach(element=>
            {
                let af={img:""};
                af.img=storage.getFilePreview(config.gallery_pictures_storage,element.image_id).toString();
                this.gallery.push(af);
                this.image_cnt++;
            });
            //yapping(k.documents[0]);
            */
/*
            this.video_id=k.documents[0].video;
            let v2="659d5e6949ae7294f9f1";
            this.video_id=v2;
            this.video_link=storage.getFileView(config.website_images,this.video_id).href;
            yapping(this.video_link);
            this.video_link=config.default_video;
            this.loaded=true;*/
        },

    
    async delete_content()
    {
        const database = new Databases(appw);
        //const storage = new Storage(appw);
        let k= await database.deleteDocument(config.website_db, config.mess_coll,this.$route.params.id);  
        this.$notify(this.$t('deleted'));
        this.$router.push("/admin/messages");
    },
    
}

    
}


</script>