<template>
    <div class="relative mb-4 container  px-5  mx-auto bg-white" >
        <div>
            <v-switch @change="save" v-model="visible" :label="$t('visible')"></v-switch>
            <v-btn @click="save" class="m-5">{{ $t('save') }}</v-btn>
            <v-btn @click="delete_content">{{ $t('delete') }}</v-btn>
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
</div>
        <div>
            <v-switch @change="save" v-model="srb_flag" :label="$t('srb')"></v-switch>
            
            <div v-if="srb_flag">
            <v-text-field
            @change="save"
            v-model="title_rs"
            :counter="100"
            :label="$t('srb_title')"
            hide-details
            
          ></v-text-field>
        

            <QuillEditor  @textChange="save" content-type="html"  style="min-height:200px;"  v-model:content="content_rs" toolbar="full" theme="snow" />
        </div>
    </div>
        <div>
            <v-switch v-model="hun_flag" @change="save" :label="$t('hu')"></v-switch>
            <div v-if="hun_flag">
            <v-text-field
            v-model="title_hu"
            :counter="100"
            @change="save"
            :label="$t('hu_title')"
            hide-details
            
          ></v-text-field>
            <QuillEditor  content-type="html"  @textChange="save" style="min-height:200px;" v-model:content="content_hu" toolbar="full" theme="snow" />
        </div>
    </div>
        <div>
            <v-switch v-model="en_flag" @change="save" :label="$t('en')"></v-switch>
            <div v-if="en_flag">
            <v-text-field
            v-model="title_en"
            :counter="100"
            @change="save"
            :label="$t('en_title')"
            hide-details
            
          ></v-text-field>
            <QuillEditor content-type="html" @textChange="save"  style="min-height:200px;"  v-model:content="content_en" toolbar="full" theme="snow" />
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
        content_rs:"",
        content_hu:"",
        content_en:"",
        srb_flag:true,
        hun_flag:true,
        en_flag:false,
        visible:false,
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
           
            
            let k= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("$id",this.$route.params.id)]);
            
                
                    this.title_rs=k.documents[0].title_rs;
                    this.content_rs=k.documents[0].text_rs;
                
                    this.title_hu=k.documents[0].title_hu;
                    this.content_hu=k.documents[0].text_hu;
                    //this.$router.push("/home");
                    
                
                    this.title_en=k.documents[0].title_en;
                    this.content_en=k.documents[0].text_en;

                    this.visible=k.documents[0].visible;


                    if(k.documents[0].default_image==null||k.documents[0].default_image=='')
                    {
                        this.img="https://dummyimage.com/720x400";
                    }
                    else
                    this.img=storage.getFileView(config.website_images,k.documents[0].default_image).toString();
                

               
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
            //console.log(k.documents[0].gallery);
            
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
        let k= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("$id",this.$route.params.id)]);  

        
        const result = await database.updateDocument(
        config.website_db, // databaseId
        config.about_us_db, // collectionId
        this.$route.params.id, // documentId
        {
            "title_rs":this.title_rs,
            "title_hu":this.title_hu,
            "title_en":this.title_en,
            "text_en":this.content_en,
            "text_hu":this.content_hu,
            "text_rs":this.content_rs,
            "isHungarian":this.hun_flag,
            "isSerbian":this.srb_flag,
            "isEnglish":this.en_flag,
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
        let k= await database.deleteDocument(config.website_db, config.about_us_db,this.$route.params.id);  
        this.$notify(this.$t('deleted'));
        this.router.push("/home");
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