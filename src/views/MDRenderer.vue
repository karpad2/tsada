<template>

<section class="text-gray-600 min-h-screen ">
    <div  class="container  px-5  mx-auto backdrop-filter bg-opacity-50 mb-5  dark:bg-slate-500/50  bg-gray-100  backdrop-blur-lg" v-if="loaded" style="min-height: 70vh;">
            <div v-if="video_id==''" class="flex flex-wrap w-full mb-20 p-2 rounded">
                <div class="w-full mb-6 lg:mb-0">
                    <h1 id="render_title" class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white">{{ title }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
                <p v-if="show_date||admin" class="align-bottom  ml-3 leading-relaxed text-white">
                    <strong>{{ $t("date") }}</strong>: {{ rt_time(date) }}
                </p>
                
            </div>
            <video-background v-else :src="video_link" style="min-height: 200px;" class="flex flex-wrap w-full mb-20 p-2 rounded"
            overlay="linear-gradient(45deg,#2a4ae430,#0EA5E950)"  >
                <div class="mt-3 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100">{{ title }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
                <p v-if="show_date||admin" class=" align-bottom ml-3 leading-relaxed text-white">
                    
                    <strong>{{ $t("date") }}</strong>: {{ rt_time(date) }}
                    
                </p>
            </video-background>

            <p class="no_print" v-if="admin ">
                    <VBtn   @click="editmode">{{ $t("edit") }}</VBtn>
                    <VBtn v-if="false" @click="downloadPDF">PDF</VBtn>
            </p>



<div ref="pdfContent" class="w-full p-5 dark:text-white print_content" v-html="chtml">
</div>

<div  v-if="yt_video!=null&&yt_video!=''" class="p-5">
    <iframe class="mx-auto" width="560" height="315" :src="yt_video_link" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<div v-if="gallery_flag">
    <AlbumViewer :caption="false" :id="gallery_id" />
</div>

<div v-if="has_documents">
                <div   class="m-auto w-full">
   
      
   <v-data-table  height="400" :headers="headers" :items="documents">
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
     
 </div>
</div>

</div>
<Loading v-else />
</section>
</template>
<script lang="ts">

import {Client,Databases,ID,Storage,Query,Account } from "appwrite";
import {useLoadingStore} from "@/stores/loading";
import {appw,config} from "@/appwrite";
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { EffectFade, Navigation, Pagination } from 'swiper/modules';
import AlbumViewer from "@/components/AlbumViewer.vue";
import {convertifserbian} from "@/lang";
import gsap from "gsap";
import moment from 'moment/min/moment-with-locales';
import Loading from "@/components/Loading.vue";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";



export default {
    components: {
        Swiper,SwiperSlide,
        AlbumViewer,
        Loading
    },
    data() {
        return {
            
            chtml:'',
            gallery:[],
            title:'',
            img_cnt:3,
            loaded:false,
            author:"Admin",
            gallery_id:"",
            gallery_flag:false,
            date:"",
            newsmode:false,
            video_id:"",
            video_link:"",
            yt_video:null,
            yt_video_link:"",
            edumode:false,
            admin:false,
            not_fotos:false,
            show_date:false,
            headers:[],
            colDefs:[],
            documents:[],
            has_documents:false,
            _loading:true
        }
    },
    mounted()
    {
        this.getMD();
        const cc=useLoadingStore();
        this.admin=cc.userLoggedin;
        if(this.admin)
        {
            let kkk=new Account(appw);
            console.log(kkk.client);
        }

        this.headers= [
                    { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                    { title: this.$t("date"), align: 'start', key: 'date',width: '300px' },
                    { title: this.$t("open_document"), align: 'start', key: 'open',width: '300px' },
                    ];
        
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
            
            let k= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("$id",this.$route.params.id)]);
                this.has_documents=k.documents[0].has_documents;
                if(k.documents[0].yt_video==""||k.documents[0].yt_video==null)
                {this.yt_video=null;

                }
                else 
                {
                    this.yt_video=k.documents[0].yt_video;
                    this.yt_video_link=this.getytvideo();
                }
                
                if(cc.language=="sr"||cc.language=="rs")
                {
                    this.title=convertifserbian(k.documents[0].title_rs);
                    this.chtml=k.documents[0].text_rs;
                    document.title=convertifserbian(k.documents[0].title_rs);
                    
                }
                else if(cc.language=="hu")
                {
                    this.title=k.documents[0].title_hu;
                    this.chtml=k.documents[0].text_hu;
                    document.title=k.documents[0].title_hu;
                    //this.$router.push("/home");
                    
                }
                else if(cc.language=="en")
                {
                    this.title=k.documents[0].title_en;
                    this.chtml=k.documents[0].text_en;
                    document.title=k.documents[0].title_en;
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
            this.gallery_flag=k.documents[0].has_gallery;
            this.show_date=k.documents[0].show_date;
            this.has_documents=k.documents[0].has_documents;
            if (this.has_documents)
            {
            try{
            this.gallery_id=k.documents[0].gallery.$id;
            }
            catch(ex)
            {
                console.log(ex);
            }
            }
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

            this.video_id=k.documents[0].video;
            this.date=k.documents[0].$createdAt;
                
            if(this.video_id==""||this.video_id==null)
            
            { this.video_link=config.default_video;}
            else
            {
                this.video_link=this.video_id;
            }
            //this.video_link=storage.getFileView(config.website_images,this.video_id).href;
            console.log(this.video_link);
            //if(this.video_id==""||this.video_id==null||this.video_id=="659d5e6949ae7294f9f1")
            
            this.loaded=true;
            if(this.has_documents)
            {
                this.synchronize_documents();
            }
        },
       
        editmode()
        {
            this.$router.push("/admin/edit/"+this.$route.params.mode+"/"+this.$route.params.id);   
        },
        async synchronize_documents()
        {
            const database = new Databases(appw);
            if(this.has_documents)
            {
                this.doc_loaded=false;
            this.documents=[];
                const loadingStore = useLoadingStore();
                let local=loadingStore.language;
                let documents_cucc= await database.listDocuments(config.website_db, config.text_documents,[
                Query.equal("texts",[this.$route.params.id])]);

                await documents_cucc.documents.forEach(async el2 => {
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
            }
        },
        async downloadPDF() {
      const pdfContent = this.$refs.pdfContent;

      // Capture the content using html2canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2, // Increase scale for better resolution
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      let heightLeft = imgHeight;

      const addHeaderFooter = (pdf, pageNumber) => {
        pdf.setFontSize(12);
        // Custom header text (top of each page)
        pdf.text("Custom Header", 105, 10, { align: "center" });
        // Custom footer text (bottom of each page)
        pdf.text(`Page ${pageNumber}`, 105, pageHeight - 10, { align: "center" });
      };

      let pageNumber = 1;

      // Add first page
      addHeaderFooter(pdf, pageNumber);
      pdf.addImage(imgData, "PNG", 0, 20, imgWidth, imgHeight); // Start content below header
      heightLeft -= pageHeight - 30; // Adjust for header and footer space

      // Add more pages if necessary
      while (heightLeft > 0) {
        pageNumber++;
        position = heightLeft - imgHeight;
        pdf.addPage();
        addHeaderFooter(pdf, pageNumber);
        pdf.addImage(imgData, "PNG", 0, position + 20, imgWidth, imgHeight); // Adjust for header
        heightLeft -= pageHeight - 30; // Again, leave space for header/footer
      }

      // Save the PDF
      pdf.save("content.pdf");
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
                getytvideo()
        {
        let url=this.yt_video;    
        //var url = "https://www.youtube.com/watch?v=sGbxmsDFVnE";
        var id = url.split("?v=")[1]; //sGbxmsDFVnE

        var embedlink = "http://www.youtube.com/embed/" + id;
        return embedlink;
        }   
    },
    
}   
</script>