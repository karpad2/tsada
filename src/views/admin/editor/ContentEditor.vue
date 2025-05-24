<template>
    <div class="relative pb-5 container  px-5  mx-auto bg-white" >
        <div>
            <v-switch @change="save" v-model="visible" :label="$t('visible')"></v-switch>
            <v-switch @change="save" v-model="notNews" :label="$t('not_news')"></v-switch>
            <v-switch @change="save" v-model="show_date" :label="$t('show_date')"></v-switch>
            <v-btn class="m-5" @click="save" >{{ $t('save') }}</v-btn>
            <v-btn class="m-5" @click="delete_content">{{ $t('delete') }}</v-btn>
            <v-btn class="m-5" @click="share_fb">{{ $t('fb_share') }}</v-btn>
        </div>

        <div>
            <v-file-input @change="file_upload" v-model="file_link"  accept="image/*" :label="$t('fileupload')"></v-file-input>
            {{ $t("preview") }}
<div class="flex flex-wrap -m-4">

<div  class="xl:w-1/5 md:w-1/2 p-4 cursor-pointer">
    <div   class="bg-slate-100/30 hover:bg-sky-600/30  dark:bg-slate-300/30 p-6 rounded-lg  shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
            <img class="h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out "
                            v-lazy="img" alt="content">
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
        
          <ckeditor v-model="content_rs"></ckeditor>
            <QuillEditor v-if="false"  @textChange="save" content-type="html"  style="min-height:200px;"  v-model:content="content_rs" toolbar="full" theme="snow" />
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
          <ckeditor v-model="content_hu"></ckeditor>
          <QuillEditor v-if="false"  content-type="html"  @textChange="save" style="min-height:200px;" v-model:content="content_hu" toolbar="full" theme="snow" />
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
          <ckeditor v-model="content_en"></ckeditor>
            <QuillEditor v-if="false" content-type="html" @textChange="save"  style="min-height:200px;"  v-model:content="content_en" toolbar="full" theme="snow" />
        </div>
    </div>
    <v-text-field
            v-model="yt_video"
            :counter="100"
            @change="save"
            :label="$t('yt_video')"
            hide-details
          ></v-text-field>

    <div>
            <v-switch v-model="documents_flag" @change="documents_load" :label="$t('documents_flag')"></v-switch>
            <div v-if="documents_flag">
                <div  v-if="false"  class="m-auto w-full">
   
      
   <v-data-table   height="400" :headers="headers" :items="documents">
     <template v-slot:item.date="{ item }">
     {{ rt_time(item.date) }}
     </template>
 
   <template v-slot:item.open="{ item }">
     <router-link :to="'/document/'+item.doc_id"><i class="pi pi-book text-5xl"></i></router-link>
    
   </template>

   <template v-slot:item.edit="{ item }">
     <router-link :to="'/admin/text-document-editor/'+item.id"><i class="pi pi-cloud-upload text-5xl"></i></router-link>
    
   </template>

   <template #bottom></template>
     </v-data-table>
     <v-btn @click="new_stuff()" class="m-5">{{ $t('add_new_document_in_that_category') }}</v-btn>
 </div>
 <DocLister :_id="id" />
            
        </div>
    </div>

    <div >
        <v-switch v-model="album_flag" @change="save" :label="$t('album_flag')"></v-switch>
                       
            <div v-if="album_flag">
            <v-btn class="m-5" @click="gallery_change">{{ $t('create_a_new_album') }}</v-btn> 
            
            <v-select
            :items="galleries"
            v-model="gallery_id"
            :label="$t('gallery')"
            item-value="id"
            item-text="title"
            @update:modelValue="g_save"
            ></v-select>

            <div v-if="_update">
                <AlbumViewer  :caption="false" :id="gallery_id" />
             </div>
            </div>

    </div>

    </div>
</template>
<script lang="ts">
import {Client,Databases,ID,Storage,Query,Functions } from "appwrite";
import {appw,config} from "@/appwrite";
import axios from "axios";

import {useLoadingStore} from "@/stores/loading";
import AlbumViewer from "@/components/AlbumViewer.vue";
import { convertifserbian } from "@/lang";
import DocLister from "@/components/DocLister.vue";

export default{
data()
{
    return{
        id:"",
        title_en:"",
        title_hu:"",
        title_rs:"",
        content_rs:"",
        content_hu:"",
        content_en:"",
        yt_video:"",
        show_date:false,
        srb_flag:true,
        hun_flag:true,
        en_flag:false,
        visible:false,
        documents_flag:false,
        album_flag:false,
        choosen_gallery:false,
        galleries:[],
        default_img_link:"",
        gallery_id:"",
        file_link:null,
        fb_message:"",
        fb_public:false,
        img:"",
        headers:[],
        colDefs:[],
        documents:[],
        doc_loaded:false,
        notNews:true,
        uploading:false,
        _update:true
    }
},
components:{
    AlbumViewer,
    DocLister
},
mounted()
{
    this.id=this.$route.params.id;
    this.getMD();
    this.headers= [
                    { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                    { title: this.$t("date"), align: 'start', key: 'date',width: '300px' },
                    
                    { title: this.$t("open_document"), align: 'start', key: 'open',width: '300px' },
                    
                    ];
        

        
            this.headers.push({ title: this.$t("edit_document"), align: 'start', key: 'edit',width: '300px' });
            this.colDefs.push({ field: 'edit', headerName:this.$t("edit_message"), sortable: true, filter: true });
    this.load_galleries();
            window.addEventListener('beforeunload', this.handleBeforeUnload);
},
onBeforeUnmount()
{
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
},
methods:{
    async g_save()
    {
        this._update=false;
        await this.save();
        this._update=true;
    },
    async getMD()
        {
            
            const database = new Databases(appw);
            const storage = new Storage(appw);
            const cc=useLoadingStore();
            //just fucking kill me
            let mode="";
           
            
            let k= await database.getDocument(config.website_db, config.about_us_db,this.$route.params.id);
            
                
                    this.title_rs=k.title_rs;
                    this.content_rs=k.text_rs;
                
                    this.title_hu=k.title_hu;
                    this.content_hu=k.text_hu;
                    //this.$router.push("/home");
                    
                
                    this.title_en=k.title_en;
                    this.content_en=k.text_en;
                    this.yt_video=k.yt_video;
                    this.visible=k.visible;
                    this.notNews=k.notNews;
                    this.show_date=k.show_date;

                    if(k.default_image==null||k.default_image=='')
                    {
                        this.img="https://dummyimage.com/720x400";
                    }
                    else
                    this.img=storage.getFileView(config.website_images,k.default_image).toString();
            
            this.gallery_id=k.gallery.$id;
          
            this.documents_flag=k.has_documents;
            this.album_flag=k.has_gallery;
            
               
            
            



            this.synchronize_documents();
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
        let k= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("$id",this.$route.params.id)]);  
       /* if(!this.album_flag)
        {
            this.gallery_id=null;
        }*/   
        
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
            "yt_video":this.yt_video,
            "has_documents":this.documents_flag,
            "has_gallery":this.album_flag,
            "gallery":this.gallery_id,
            "default_image":this.default_image,
            "notNews":this.notNews,
            "show_date":this.show_date

        }, // data (optional)
    //["read("any)"] // permissions (optional)
    );
    this.$notify(this.$t('saved'));
    
    //this.getMD();

    },
    async share_fb() {
  //const functions = new Functions(appw);
  const database = new Databases(appw);

  let kk=await database.getDocument(config.website_db,config.users_settings,"fb_access_token");
  // Prepare the URL to share
  let x = `https://share.tsada.edu.rs/${this.$route.params.id}`;

  const response = await axios.post(
      `https://graph.facebook.com/v20.0/${config.pan}/feed`,
      {
        message: null,  // Custom message from the request
        link: x,  // Link to share
        access_token: kk.parameter,
        published: true  // If 'makePrivate' is true, set published to false
      }
    );
    console.log(response);
},
async documents_load()
{
    this.save();
    this.synchronize_documents();
    
},
async gallery_change()
{
    if(this.gallery_id==null)
    {
        this.gallery_id=await this.new_gallery();
    }
    this.save();
    //console.log(this.gallery_id);
 //if(this.gallery_id)
}, 
async load_galleries()
{
    const database = new Databases(appw);
    let  l= await database.listDocuments(config.website_db, config.gallery,[Query.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible"]),Query.limit(25)]);
    this.galleries=[];
    const cc=useLoadingStore();
    let local=cc.language;     
    l.documents.forEach(element => {
            let a={title:"",subtitle:"",text:"",img:"",imga:"",en:"",id:"",visible:false};
            //console.log(element);
            a.id=element.$id;
            a.visible=element.visible;
            if(local=="en")
            {
                a.title=element.title_en;
                a.subtitle=element.short_en;
                //a.text=element.course_en_detail;
            }
            else if(local=="hu")
            {
                a.title=element.title_hu;
                a.subtitle=element.short_hu;
                //a.text=element.course_hu_detail;
            }
            else if(local=="rs"||local=="sr")
            {
                a.title=convertifserbian(element.title_rs);
                a.subtitle=convertifserbian(element.short_rs);
                //a.text=convertifserbian(element.course_rs_detail);
            }
            if(element.code==""||element.code==null)
            a.en=element.title_en;
            else a.en=element.code;
            //console.log(element.course_img);
        
            //=storage.getFileView(,).toString();
            //a.imga=element.default_image.toString();
            this.galleries.push(a);
        });

},

async exist_new_gallery_change()
{
    this.gallery_change();
},

    async new_stuff()
        {
            const database = new Databases(appw);
            const l= await database.createDocument(config.website_db, config.text_documents,ID.unique(),{"texts":this.$route.params.id});
            this.$router.push("/admin/text-document-editor/"+l.$id);
        },
        async new_gallery()
        {
            const database = new Databases(appw);
            const l= await database.createDocument(config.website_db, config.gallery,ID.unique(),{"visible":false, "title_rs":this.title_rs,
            "title_hu":this.title_hu,
            "title_en":this.title_en});
            return l.$id;
            //this.$router.push("/admin/gallery-edit/"+l.$id);
        },

        async synchronize_documents()
        {
            const database = new Databases(appw);
            if(this.documents_flag)
            {
                this.doc_loaded=false;
            this.documents=[];
                const loadingStore = useLoadingStore();
                let local=loadingStore.language;
                let documents_cucc= await database.listDocuments(config.website_db, config.text_documents,[
                Query.equal("texts",[this.$route.params.id])]);

                await documents_cucc.documents.forEach(async el2 => {
                let a={name:"",contact:"",img:"",id:"",doc_id:"",date:""};
                a.id=el2.$id;
                if(local=="en"||local=="hu")
                {
                    a.name=el2.document_title_hu;
                    //a.role=el2.role;
                    a.contact=el2.contact;
                }
                else if(local=="rs"||local=="sr")
                {
                    a.name=convertifserbian(el2.document_title_rs);
                    //a.role=convertifserbian(el2.role);
                    a.contact=el2.contact;
                }
                
                else
                {
    
                //a.img= await storage.getFileView(config.website_images,el2.worker_img).href;
                }
                a.id=el2.$id;
                a.doc_id=el2.document_id;
                a.date=el2.$createdAt;    
                this.documents.push(a);
                });
                this.doc_loaded=true;
            }
        },
        

    async delete_content()
    {
        const database = new Databases(appw);
        //const storage = new Storage(appw);
        let k= await database.deleteDocument(config.website_db, config.about_us_db,this.$route.params.id);  
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
    console.log("file_upload");
    //console.log(this.file_link[0]);
    this.uploading=true;
    const storage = new Storage(appw);
    const result = await storage.createFile(
    config.website_images, // bucketId
    ID.unique(), // fileId
    this.file_link // file
    // permissions (optional)
    );
    this.default_image=result.$id;
    this.save();
    
    this.$notify(this.$t('file_uploaded'));
    this.uploading=false;
    }
}

    
}


</script>