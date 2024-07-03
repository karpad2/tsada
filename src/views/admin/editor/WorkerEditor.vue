<template>
    <div class="relative mb-4 container  px-5  mx-auto bg-white" >
        <div>
            <v-btn @click="delete_content" class="m-5">{{ $t('delete') }}</v-btn>
            <VBtn @click="$router.go(-1)" class="m-5">{{ $t("goback") }}</VBtn>
        </div>

    <div>
            <v-file-input @change="file_upload" v-model="file_link"  accept="image/*" :label="$t('fileupload')"></v-file-input>
            {{ $t("preview") }}
<div class="flex flex-wrap -m-4">

<div  class="xl:w-1/5 md:w-1/2 p-4 cursor-pointer">
    <div   class="bg-slate-100/30 hover:bg-sky-600/30  dark:bg-slate-300/30 p-6 rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        
        
            <img class="h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out "
                            :src="img" alt="content">
        </div>
    </div>
</div>

            
            <div >
            <v-text-field
            @change="save"
            v-model="worker_name_hu"
            :counter="100"
            :label="$t('worker_name_hu')"
            hide-details
            
          ></v-text-field>
        </div>
        <div >
          <v-text-field
            @change="save"
            v-model="worker_name_rs"
            :counter="100"
            :label="$t('worker_name_rs')"
            hide-details
            
          ></v-text-field>
        </div>
        <div >
          <v-text-field
            @change="save"
            v-model="contact"
            :counter="100"
            :label="$t('contact')"
            hide-details
            
          ></v-text-field>
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
        worker_name_hu:"",
        worker_name_rs:"",
        contact:"",
        
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
           
            
            let k= await database.listDocuments(config.website_db, config.workers,[Query.equal("$id",this.$route.params.id)]);
            
                
                    this.worker_name_hu=k.documents[0].worker_name_hu;
                    this.worker_name_rs=k.documents[0].worker_name_rs;
                
                    this.contact=k.documents[0].contact;
                  

                    //this.visible=k.documents[0].visible;


                    if(k.documents[0].worker_img==null||k.documents[0].worker_img=='')
                    {
                        this.img=storage.getFileView(config.website_images,config.missing_worker_picture).href;
                    }
                    else
                    this.img=storage.getFileView(config.website_images,k.documents[0].worker_img).toString();
                

               
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
            let gal=k.documents[0].gallery;
            console.log(k.documents[0].gallery);
            /*let m= await database.listDocuments(config.website_db, config.album_images,[Query.equal("gallery",gal.$id)]);
            
            
            console.log(m);
            m.documents.forEach(element=>
            {
                let af={img:""};
                af.img=storage.getFilePreview(config.gallery_pictures_storage,element.image_id).toString();
                this.gallery.push(af);
                this.image_cnt++;
            });
            //console.log(k.documents[0]);
            */
/*
            this.video_id=k.documents[0].video;
            let v2="659d5e6949ae7294f9f1";
            this.video_id=v2;
            this.video_link=storage.getFileView(config.website_images,this.video_id).href;
            console.log(this.video_link);
            this.video_link=config.default_video;
            this.loaded=true;*/
        },

    async save()
    {   
        const database = new Databases(appw);
        //const storage = new Storage(appw);
        let k= await database.listDocuments(config.website_db, config.workers,[Query.equal("$id",this.$route.params.id)]);  

        
        const result = await database.updateDocument(
        config.website_db, // databaseId
        config.workers, // collectionId
        this.$route.params.id, // documentId
        {
            "worker_name_hu":this.worker_name_hu,
            "worker_name_rs":this.worker_name_rs,
            "worker_img":this.worker_img,
            "contact":this.contact

        }, // data (optional)
    //["read("any)"] // permissions (optional)
    );
    this.$notify(this.$t('saved'));
    //this.getMD();

    },
    async delete_content()
    {
        const database = new Databases(appw);
        //const storage = new Storage(appw);
        let k= await database.deleteDocument(config.website_db, config.workers,this.$route.params.id);  
        this.$notify(this.$t('deleted'));
        this.router.push("/about/workers");
    },
    async file_upload()
    {
        if (!this.file_link)
        {
            console.warn("no file");
            return;
        } 
    console.log("file_upload");
    //console.log(this.file_link[0]);

    const storage = new Storage(appw);
    const result = await storage.createFile(
    config.website_images, // bucketId
    ID.unique(), // fileId
    this.file_link[0] // file
    // permissions (optional)
    );
    this.default_image=result.$id;
    this.save();
    
    this.getMD();


    this.$notify(this.$t('file_uploaded'));

    }
}

    
}


</script>