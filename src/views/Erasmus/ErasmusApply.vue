<template>
    <section class="text-gray-600 ">
        <div  class="container  px-5  mx-auto backdrop-filter bg-opacity-50  dark:bg-slate-500/50  bg-gray-100  backdrop-blur-lg" style="min-height: 70vh;">            
                <video-background  :src="video_link" style="min-height: 200px;" class="flex flex-wrap w-full mb-20 p-2 rounded"
                overlay="linear-gradient(45deg,#2a4ae430,#0EA5E950)"  >
                    <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                        <h1 id="render_title" class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100">{{ $t("erasmus_apply") }}</h1>
                        <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                    </div>
                </video-background>

                
<div class="pb-2 w-full dark:text-white" v-if="erasmus_apply_on&&!erasmus_applied">
    
  <v-form @submit.prevent="submit" ref="form" v-model="isFormValid">
    <v-text-field
    required
      v-model="name"
      :counter="40"
      :label="$t('name')"
    ></v-text-field>

    <v-text-field
    required
      v-model="phone"
      
      :counter="15"
      :label="$t('phone')"
    ></v-text-field>

    <v-text-field
    required
      v-model="email"
      type="email"
      :label="$t('email')"
    ></v-text-field>

    <v-text-field
    required
      v-model="born_year"
      type="number"
      :hint="$t('e.g.')+ eg_age"
      :label="$t('born_year')"
    ></v-text-field>

    <v-text-field
    required
      v-model="mark_avg"
      type="number"
      :hint="$t('e.g.')+' 5.00'"
      :label="$t('mark_avg')"
    ></v-text-field>

    <v-text-field
    required
    
      v-model="which_class"
      :hint="$t('e.g.')+' III-3'"
      :label="$t('class') "
    ></v-text-field>

    <v-file-input required @change="upload_motivation_letter" v-model="file_motivation_letter"  accept=".pdf" :label="$t('motivation_letter')"></v-file-input>

    <v-file-input @change="upload_positive_document" v-model="file_positive_document"  accept=".pdf" :label="$t('other_positive_documents')"></v-file-input>

    <v-checkbox
      required
      v-model="accept_law"
      :label="$t('law_for_data_store')"
      color="info"
      
    ></v-checkbox>

    <v-btn
    
      class="me-4"
      type="submit"
      :disabled="!accept_law&&isFormValid"  
    >
      {{$t("apply_for_erasmus")}}
    </v-btn>

    
  </v-form>
</div>

<div class="pb-2 w-full dark:text-white text-black text-center" v-else>
    <h2 class="sm:text-3xl p-3 text-2xl font-medium title-font mb-2">{{ $t("applies_are_closed") }}</h2>
    
  </div>
    
    
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
    import moment from "moment";
    import gsap from "gsap";
import { AgXToneMapping, CubeCamera } from "three";
    
    export default {
        components: {
            Swiper,SwiperSlide
        },
        data() {
            return {
                erasmus_applied:false,
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
                name:"",
                email:"",
                phone:"",
                which_class:"",
                born_year:null,
                file_motivation_letter:null,
                link_motivation_letter:null,
                file_positive_document:null,
                link_positive_document:null,
                erasmus_apply_on:false,
                isFormValid:false,
                mark:null,
                accept_law:false,
                items:[]
            }
        },
        mounted()
        {
           // this.getMD();
            const cc=useLoadingStore();
            this.erasmus_applied=cc.erasmus_apply;
            this.admin=cc.userLoggedin;
            let v2="659d5e6949ae7294f9f1";
            const storage = new Storage(appw);
            document.title=this.$t("erasmus_apply");
            this.getErasmusSettings();
            //this.video_link=storage.getFileView(config.website_images,v2).href;
           
        },
        methods:{
            
            async submit()
            {
              const database = new Databases(appw);
              const l= await database.createDocument(config.website_db, config.erasmus_applies,ID.unique(),
              {"name":this.name,"email":this.email,"age":this.born_year,"class":this.which_class,"phone":this.phone,"mark":this.mark_avg,
              "link_motivation_letter":this.link_motivation_letter,"link_other_document":this.link_positive_document}

            );


            this.$notify(this.$t('apply_saved'));
            const cc=useLoadingStore();
            cc.setErasmusAppliedSetting(true);
            this.erasmus_applied=true;
            },
            age()
            {
              let l=new Date();
              return l.getFullYear()-this.born_year;
            },
            async upload_positive_document()
            {
              if (!this.file_positive_document)
                {
                    console.warn("no file");
                    return;
                } 
            this.$notify(this.$t('file_upload_in_progress'));
            yapping("file_upload");
            //yapping(this.file_link[0]);

            const storage = new Storage(appw);
            const result = await storage.createFile(
            config.fs_erasmus, // bucketId
            ID.unique(), // fileId
            this.file_positive_document // file
            // permissions (optional)
            );
            this.link_positive_document= await result.$id;
            //this.save();
            //this.getMD();
            this.$notify(this.$t('file_uploaded'));


            },
            async upload_motivation_letter()
            {
              if (!this.file_motivation_letter)
                {
                    console.warn("no file");
                    return;
                } 
            this.$notify(this.$t('file_upload_in_progress'));
            yapping("file_upload");
            //yapping(this.file_motivation_letter);

            const storage = new Storage(appw);
            const result = await storage.createFile(
            config.fs_erasmus, // bucketId
            ID.unique(), // fileId
            this.file_motivation_letter // file
            // permissions (optional)
            );
            this.link_motivation_letter= await result.$id;
            //this.save();
            //this.getMD();
            this.$notify(this.$t('file_uploaded'));


            },
            async getErasmusSettings()
          {
            const cc=useLoadingStore();
            const database = new Databases(appw);

            let l,k;
            //l= await database.getDocument(config.website_db,config.general_settings,"erasmus_list");
            k= await database.getDocument(config.website_db,config.general_settings,"erasmus_apply_on");
            this.erasmus_apply_on=k.setting_status;
            //this.erasmus_list=l.setting_status;
            //yapping(l);
            //yapping(k);

          }  
        },
        computed:{
          eg_age()
          {
            let l=new Date()
            return l.getFullYear()-16;
          }
        }
    }   
    </script>

    <style>
    
    </style>