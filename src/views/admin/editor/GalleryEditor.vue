<template>
    <div class="relative mb-4 container  px-5  mx-auto bg-white" >
        <div>
            <v-switch @change="save" v-model="visible" :label="$t('visible')"></v-switch>
            <v-btn @click="save" class="m-5">{{ $t('save') }}</v-btn>
            <v-btn @click="delete_content">{{ $t('delete') }}</v-btn>
        </div>

        <div>
        <v-file-input @change="file_upload" multiple v-model="file_link"  accept="image/*" :label="$t('fileupload')"></v-file-input>
                    {{ $t("preview") }}
                    <div class=" w-full grid sm:grid-cols-3">
        <div v-for="image in images" class="card card-compact bg-base-100 w-96 shadow-xl m-5 flex" style="max-width: 400px;">
        <figure>
            <img
            v-lazy="image.img"
            alt="mrow" />
        </figure>
        <div class="card-body">
            <p v-if="default_image==image.img_id" >
                {{ $t("default_picture") }}
            </p>

            <div class="card-actions justify-end">
                <v-btn v-if="default_image!=image.img_id" v-on:click="set_as_default(image.img_id)" >{{$t("set_as_default")}}</v-btn>
                <v-btn v-on:click="delete_picture(image.img_id,image.doc_id)">{{$t("delete")}}</v-btn>
            </div>
        </div>
        </div>
    </div>
        </div>
        
        <div >
        <v-text-field
        @change="save"
        v-model="title_rs"
        :counter="100"
        :label="$t('srb_title')"
        hide-details
        
        ></v-text-field>

        
        <v-text-field
        @change="save"
        v-model="short_rs"
        :counter="100"
        :label="$t('srb_short')"
        hide-details
        
        ></v-text-field>
    

        
        </div>
   
        <div>
            
        <div >
            <v-text-field
            v-model="title_hu"
            :counter="100"
            @change="save"
            :label="$t('hu_title')"
            hide-details
            
          ></v-text-field>

          <v-text-field
            @change="save"
            v-model="short_hu"
            :counter="100"
            :label="$t('hu_short')"
            hide-details
            
          ></v-text-field>
            
        </div>
    
        <div>
            
           
            <v-text-field
            v-model="title_en"
            :counter="100"
            @change="save"
            :label="$t('en_title')"
            hide-details
            
          ></v-text-field>
          <v-text-field
            @change="save"
            v-model="short_en"
            :counter="100"
            :label="$t('en_short')"
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
        title_en:"",
        title_hu:"",
        title_rs:"",
        short_rs:"",
        short_hu:"",
        short_en:"",
        gallery_id:"",
        visible:false,
        default_image:"",
        file_link:null,
        images:[""],
        uploading:false
    }
},
components:{
},
mounted()
{
    this.getMD();
    this.gallery_id=this.$route.params.id;
    window.addEventListener('beforeunload', this.handleBeforeUnload);
},
onBeforeUnmount()
{
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
},
methods:{
    async getMD()
        {
            
            const database = new Databases(appw);
            const storage = new Storage(appw);
            const cc=useLoadingStore();
            //just fucking kill me
            let mode="";
           
            
            let k= await database.listDocuments(config.website_db, config.gallery,[Query.equal("$id",this.$route.params.id)]);
            
                
                    this.title_rs=k.documents[0].title_rs;
                    this.content_rs=k.documents[0].text_rs;
                
                    this.title_hu=k.documents[0].title_hu;
                    this.content_hu=k.documents[0].text_hu;
                    //this.$router.push("/home");
                    
                
                    this.title_en=k.documents[0].title_en;
                    this.content_en=k.documents[0].text_en;

                    this.visible=k.documents[0].visible;

                    this.default_image=k.documents[0].default_image;

                    let l=await database.listDocuments(config.website_db, config.album_images,[Query.equal("gallery",this.$route.params.id)]);
                    this.images=[];
                    

                    l.documents.forEach(element => {
                        let a={img:"",img_id:"",doc_id:""};
                        a.img_id=element.image_id;
                        a.doc_id=element.$id;
                        a.img= storage.getFilePreview(
                        config.gallery_pictures_storage,           // bucket ID
                        element.image_id,       // file ID
                        300,               // width, will be resized using this value.
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
                this.images.push(a);
                    });


            let gal=k.documents[0].gallery;
            
        },
        handleBeforeUnload(event){
      if (this.uploading) {
        event.preventDefault();
        this.$notify({
                    type: 'error',
                    text: this.$t('file_still_uploading')
                });
        event.returnValue = '';
        return '';
      }
    
    },
    async save()
    {   
        const database = new Databases(appw);
        //const storage = new Storage(appw);
        let k= await database.listDocuments(config.website_db, config.gallery,[Query.equal("$id",this.$route.params.id)]);  

        
        const result = await database.updateDocument(
        config.website_db, // databaseId
        config.gallery, // collectionId
        this.$route.params.id, // documentId
        {
            "title_rs":this.title_rs,
            "title_hu":this.title_hu,
            "title_en":this.title_en,
            "short_en":this.short_en,
            "short_hu":this.short_hu,
            "short_rs":this.short_rs,
            "visible":this.visible,
            "default_image":this.default_image

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
        let k= await database.deleteDocument(config.website_db, config.gallery,this.$route.params.id);  
        this.$notify(this.$t('deleted'));
        this.router.push("/home");
    },
    async file_upload()
    {
    const storage = new Storage(appw);
    const database = new Databases(appw);
    if (!this.file_link)
        {
            console.warn("no file");
            return;
        } 
    console.log("file_upload");
    this.uploading=true;
    await this.file_link.forEach(async element => {
        this.$notify({
                    type: 'info',
                    text: this.$t('file_upload_started')
                });
        console.log(element);
        const result = await storage.createFile(
    config.gallery_pictures_storage, // bucketId
    ID.unique(), // fileId
    element // file
    // permissions (optional)
    );
    let add_file_to_album=await database.createDocument(config.website_db, config.album_images,ID.unique(),{"image_id":result.$id,
    "gallery":this.gallery_id});
    console.log(add_file_to_album);
    
    //this.default_image=result.$id;
    //this.save();
    this.$notify({
                    type: 'success',
                    text: this.$t('file_uploaded')
                });
                setTimeout(()=>{
        //this.getMD();
    },500)
    
            });
    //console.log(this.file_link[0]);
    
    
    


    //this.$notify(this.$t('file_uploaded'));
    this.uploading=false;
    this.getMD();
    },
    set_as_default(aa:string)
    {
        console.log(aa);
        this.default_image=aa;
        this.save();
        this.getMD();
    },
    delete_picture(aa:string,bb:string)
    {
    const storage = new Storage(appw);
    const database = new Databases(appw);
    
    try{
    let l= storage.deleteFile(config.gallery_pictures_storage,aa);
    }
    catch(ex)
    {
        console.log("hiba a törlésnél");
    }
    try{
    let k= database.deleteDocument(config.website_db, config.album_images,bb);
}
    catch(ex)
    {
        console.log("hiba a törlésnél");
    }
    this.getMD();
}
}

    
}


</script>