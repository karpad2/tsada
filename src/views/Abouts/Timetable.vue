<template>
    <section class="text-gray-600 min-h-screen">
        <div  class="container  px-5  mx-auto backdrop-filter bg-opacity-50  dark:bg-slate-500/50  bg-gray-100  backdrop-blur-lg" style="min-height: 70vh;">            
                <video-background  :src="video_link" style="min-height: 200px;" class="flex flex-wrap w-full mb-20 p-2 rounded"
                overlay="linear-gradient(45deg,#2a4ae430,#0EA5E950)"  >
                    <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                        <h1 id="render_title" class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100">{{ $t("timetable") }}</h1>
                        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                    </div>
                </video-background>
    
<div class="pb-2 w-full ">
<table class="table table-zebra mx-auto">
  <thead>
    <tr>
      <th style="width: 200px;" class="text-left text-xl dark:text-white">{{ $t("morning") }}</th>
      <th style="width: 200px;" class="text-left text-xl dark:text-white"> {{ $t("afternoon") }}</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1. 6:40-7:25</td>
      <td>1. 13:15-14:00</td>
    </tr>
    <tr>
        <td>2. 7:30-8:15</td>
        <td>2. 14:05-14:50</td>
      
    </tr>
    <tr>
        <td>3. 8:20-9:05</td>
        <td>3. 14:55-15:40</td>
    </tr>
    <tr>
        <td>4. 9:20-10:05</td>
        <td>4. 15:55-16:35</td>
    </tr>
    <tr>
        <td>5. 10:10-10:55</td>
        <td>5. 16:40-17:20</td>
    </tr>
    <tr>
        <td>6. 11:00-11:40</td>
        <td>6. 17:25-18:05</td>
    </tr>
    <tr>
        <td>7. 11:45-12:25</td>
        <td>7. 18:10-18:50</td>
    </tr>
    <tr>
        <td>8. 12:30-13:10</td>
        <td>8. 18:55-19:35</td>
    </tr>
  </tbody>
</table>
    </div>
    <v-data-table  height="400" :headers="headers" :items="documents">
     
 
   <template v-slot:item.open="{ item }">
     <router-link :to="'/document/'+item.doc_id"><i class="pi pi-book text-5xl"></i></router-link>
    
   </template>
   <template v-slot:item.date="{ item }">
     {{ rt_time(item.date) }}
     </template>

   <template v-slot:item.edit="{ item }">
     <router-link :to="'/admin/text-document-editor/'+item.id"><i class="pi pi-cloud-upload text-5xl"></i></router-link>
    
   </template>

   <template #bottom></template>
     </v-data-table>
    
    </div>
    </section>
    </template>
    <script lang="ts">
    
    import {Client,Databases,ID,Storage,Query } from "appwrite";
    import {useLoadingStore} from "@/stores/loading";
    import {appw,config} from "@/appwrite";
    import 'swiper/css';
    import 'swiper/css/effect-fade';
    import 'swiper/css/navigation';
    import 'swiper/css/pagination';
    import { Swiper, SwiperSlide } from 'swiper/vue';
    import { EffectFade, Navigation, Pagination } from 'swiper/modules';
    import {convertifserbian} from "@/lang";
    import moment from 'moment/min/moment-with-locales';
    import gsap from "gsap";
    
    export default {
        components: {
            Swiper,SwiperSlide
        },
        data() {
            return {
                
                chtml:'',
                gallery:[],
                title:'',
                img_cnt:3,
                loaded:false,
                author:"Admin",
                date:"",
                newsmode:false,
                video_id:"",
                video_link:"",
                edumode:false,
                admin:false,
                documents:[],
                headers:[],
                doc_loaded:false
            }
        },
        mounted()
        {
            this.headers= [
                    { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                    { title: this.$t("date"), align: 'start', key: 'date',width: '300px' },
                    
                    { title: this.$t("open_document"), align: 'start', key: 'open',width: '300px' },
                    
                    ];
           // this.getMD();
            const cc=useLoadingStore();
            this.admin=cc.userLoggedin;
            if(this.admin)
        {
            this.headers.push({ title: this.$t("edit_document"), align: 'start', key: 'edit',width: '300px' });
        }
            let v2="659d5e6949ae7294f9f1";
            const storage = new Storage(appw);
            this.video_link=storage.getFileView(config.website_images,v2).href;
            gsap.fromTo(
        "#render_title",
        {
          opacity: 0,
          x: "150%",
        },
        {
          duration: 1.5,
          opacity: 1,
          x: 0,
        }
      );
      this.synchronize_documents();
        },
        methods:{
            async getMD()
            {
                
                const database = new Databases(appw);
                const storage = new Storage(appw);
                const cc=useLoadingStore();
                //just fucking kill me
                let mode="";
                /*
                switch(this.$route.params.mode)
                {
                    case "about":
                        mode=config.about_us_db;
                     break;
                    case "erasmus":
                        mode=config.about_us_db;
                     break;
                     case "education":
                        mode=config.about_us_db;
                     break;
                    case "news":
                        mode=config.about_us_db; break;
                    
                }*/
                
                let k= await database.getDocument(config.website_db, config.about_us_db,this.$route.params.id);
                
                    if(cc.language=="sr"||cc.language=="rs")
                    {
                        this.title=convertifserbian(k.title_rs);
                        this.chtml=k.text_rs;
                        document.title=convertifserbian(k.title_rs);
                        
                    }
                    else if(cc.language=="hu")
                    {
                        this.title=k.title_hu;
                        this.chtml=k.text_hu;
                        document.title=k.title_hu;
                        //this.$router.push("/home");
                        
                    }
                    else if(cc.language=="en")
                    {
                        this.title=k.title_en;
                        this.chtml=k.text_en;
                        document.title=k.title_en;
                    }
    
                    else 
                {
                    console.warn("reading error");
                }
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
    
                this.video_id=k.video;
                let v2="659d5e6949ae7294f9f1";
                this.video_id=v2;
                //let v2="659d5e6949ae7294f9f1";
                
                console.log(this.video_link);
                this.video_link=config.default_video;
                this.loaded=true;
            },
            async synchronize_documents(){
                const database = new Databases(appw);
                this.doc_loaded=false;
                this.documents=[];
                const loadingStore = useLoadingStore();
                let local=loadingStore.language;
                let documents_cucc= await database.listDocuments(config.website_db, config.text_documents,[
                Query.equal("texts","timetable")]);
                console.log(documents_cucc);
                await documents_cucc.documents.forEach(async (el2) => {
                let a={name:"",contact:"",img:"",id:"",doc_id:"",date:""};
                try
                {
                a.id=el2.$id;
                }
                catch (ex)
                 {
                    console.log(ex);
                 }
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
            },
            rt_time(a)
                {   const loadingStore = useLoadingStore();
                    let local=loadingStore.language;
                    if(local=="rs"||local=="sr")
                    {
                        moment.locale('sr');
                    }
                    else if(local=="hu")
                    {
                        moment.locale('hu');
                    }
                    else if(local=="en")
                    {
                        moment.locale('en');
                    }
                    else {

                    }
                    return moment(a).format("LL");
                },
                editmode()
                {
                this.$router.push("/admin/edit/"+this.$route.params.mode+"/"+this.$route.params.id);   
                }    
        },
        

           
        }
    
    </script>