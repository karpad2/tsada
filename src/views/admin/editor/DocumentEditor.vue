<template>
    <div class="relative mb-4 container  px-5  mx-auto bg-white" >
        <div>
            
            <v-btn @click="save" class="m-5">{{ $t('save') }}</v-btn>
            <v-btn @click="delete_content">{{ $t('delete') }}</v-btn>
        </div>

        <div>
            <v-file-input @change="file_upload" v-model="file_link"  accept="document/*" :label="$t('fileupload')"></v-file-input>
           
<div class="flex flex-wrap -m-4">

<div  class="xl:w-1/5 md:w-1/2 p-4 cursor-pointer">
    
    </div>
</div>
</div>
        <div>
            <div >
            <v-text-field
            @change="save"
            v-model="title_rs"
            :counter="100"
            :label="$t('srb_title')"
            hide-details  
          ></v-text-field>
        </div>
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
            
        </div>
    </div>
        <div>
            
            <div >
            <v-text-field
            v-model="title_en"
            :counter="100"
            @change="save"
            :label="$t('en_title')"
            hide-details
            
          ></v-text-field>
            
        </div>
    </div>
    </div>
</template>
<script lang="ts">
import {Client,Databases,ID,Storage,Query,Functions } from "appwrite";
import {appw,config} from "@/appwrite";


import {useLoadingStore} from "@/stores/loading";

export default{
data()
{
    return{
        title_en:"",
        title_hu:"",
        title_rs:"",
       
        file_link:null,
        document_id:"",
        img:"",
        uploading:false
    }
},
props:{
    modded:String
},
components:{
    
},
mounted()
{
    this.getMD();
    window.addEventListener('beforeunload', this.handleBeforeUnload);

},
onBeforeUnmount()
{
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
},
methods:{
    getDocumentsDB()
    {
        let k="";
        if (this.modded=="documents_db")
        k=config.documents_db;
        else if(this.modded=="st_documents")
        k=config.st_documents;
        else if(this.modded=="text_documents")
        k=config.text_documents;
        else {}
        return k;
    },
    async getMD()
        {
            
            const database = new Databases(appw);
            const storage = new Storage(appw);
            const cc=useLoadingStore();
            //just fucking kill me
            let mode="";
            let k= await database.getDocument(config.website_db, this.getDocumentsDB(),this.$route.params.id);
            
                
                    this.title_rs=k.document_title_rs;
                    
                
                    this.title_hu=k.document_title_hu;
                    
                    //this.$router.push("/home");
                    
                
                    this.title_en=k.document_title_en;
                    this.document_id=k.document_id;
               
           /* if(this.chtml=="---")
            {
                this.$router.push("/home");
            }*/

            /*if(this.$route.params.node=="news")
            {
                this.newsmode=true;
                if(k.author!="")
                this.author= convertifserbian(k.author);
                this.date= moment(k.$createdAt).locale(cc.language).format('LL');
            }

            if(this.$route.params.node=="education")
            {
                this.edumode=true;
            }*/

            //this.title=convertifserbian(k.title);
            let gal=k.gallery;
            console.log(k.gallery);
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
            this.video_id=k.video;
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
        let k= await database.listDocuments(config.website_db, this.getDocumentsDB(),[Query.equal("$id",this.$route.params.id)]);  

        
        const result = await database.updateDocument(
        config.website_db, // databaseId
        this.getDocumentsDB(), // collectionId
        this.$route.params.id, // documentId
        {
            "document_title_rs":this.title_rs,
            "document_title_hu":this.title_hu,
            "document_title_en":this.title_en,
            "document_id":this.document_id
            

        }, // data (optional)
    //["read("any)"] // permissions (optional)
    );
    this.$notify(this.$t('saved'));
    //this.getMD();

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
    

    async delete_content()
    {
        const database = new Databases(appw);
        const storage = new Storage(appw);
        try{
        let n=await storage.deleteFile(config.documents_storage,this.document_id);
        }
        catch (ex)
        {
            console.warn(ex)
        }
        try{
        let k= await database.deleteDocument(config.website_db, this.getDocumentsDB(),this.$route.params.id);  
        }
        catch(ex)
        {
            console.warn(ex)
        }
        this.$notify(this.$t('deleted'));
        this.$router.push("/home");
    },
    async file_upload()
    {
        if (!this.file_link)
        {
            console.warn("no file");
            return;
        }
        this.uploading=true;
        this.$notify(this.$t('file_upload_in_progress'));
    console.log("file_upload");
    //console.log(this.file_link[0]);

    const storage = new Storage(appw);
    const result = await storage.createFile(
    config.documents_storage, // bucketId
    ID.unique(), // fileId
    this.file_link // file
    // permissions (optional)
    );

    this.document_id= await result.$id;
    this.save();
    
    this.$notify(this.$t('file_uploaded'));
    this.uploading=false;
    }
}   
}
</script>