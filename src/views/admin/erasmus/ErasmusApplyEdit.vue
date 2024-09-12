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
    
<div class="pb-2 w-full dark:text-white">
    
  <v-form  ref="form">
    <v-text-field
    required
      v-model="name"
      :counter="40"
       @change="save"
      :label="$t('name')"
    ></v-text-field>

    <v-text-field
    required
      v-model="phone"
       @change="save"
      :counter="15"
      :label="$t('phone')"
    ></v-text-field>

    <v-text-field
    required
      v-model="email"
       @change="save"
      type="email"
      :label="$t('email')"
    ></v-text-field>


    <v-text-field
    required
     @change="save"
      v-model="which_class"
      :hint="$t('e.g.')+' III-3'"
      :label="$t('class') "
    ></v-text-field>

    <v-select
            :items="locations"
            v-model="location"
             @change="save"
            :label="$t('location')"
            item-value="id"
            item-text="title"
            @update:modelValue="save"
            ></v-select>

            <v-text-field
    required
     @change="save"
      v-model="score"
      
      :label="$t('score') "
    ></v-text-field>        

    
  </v-form>
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
import { AgXToneMapping } from "three";
    
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
                name:"",
                email:"",
                phone:"",
                score:"",
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
                items:[],
                locations:[{id:"",title:""}]
            }
        },
        mounted()
        {
           // this.getMD();
            const cc=useLoadingStore();
            this.admin=cc.userLoggedin;
            let v2="659d5e6949ae7294f9f1";
            const storage = new Storage(appw);
            this.getLocations();
            this.getData();
            document.title=this.$t("erasmus_apply");
            this.getErasmusSettings();
            //this.video_link=storage.getFileView(config.website_images,v2).href;
           
        },
        methods:{
            async getData()
            {
                const database = new Databases(appw);
                const storage = new Storage(appw);
                const loadingStore = useLoadingStore();
                let local=loadingStore.language;
                let n= await database.getDocument(config.website_db, config.erasmus_applies,this.$route.params.id);
                //await n.documents.forEach(async el2 => {
                  //  let a={name:"",class:"",contact:"",email:"",date:"",id:"",phone:"",mark:"",motivation_letter:"",other_document:""};
                        
                        this.name=n.name;
                        this.phone=n.phone;
                        this.email=n.email;
                        this.mark=n.mark;
                        this.score=n.score;
                        this.which_class=n.class;
                        console.log(n);
                        if(n.erasmusLocation!=null)
                        this.location=n.erasmusLocation.$id;
                        //a.motivation_letter=el2.link_motivation_letter;
                        //a.other_document=el2.link_other_document;
                    //this.messages.push(a);
                    //});
            },
            async getLocations()
            {
                this.locations=[{id:"",title:"nem megy"}]
                const database = new Databases(appw);
                let k= await database.listDocuments(config.website_db, config.erasmus_location);
                k.documents.forEach(ll=>{
                    this.locations.push({id:ll.$id,title:ll.location_hu})
                })

            },
            async submit()
            {
             /* const database = new Databases(appw);
              const l= await database.createDocument(config.website_db, config.erasmus_applies,ID.unique(),
              {"name":this.name,"email":this.email,"age":this.born_year,"class":this.which_class,"phone":this.phone,"mark":this.mark_avg,
              "link_motivation_letter":this.link_motivation_letter,"link_other_document":this.link_positive_document}
            );*/
            this.$notify(this.$t('apply_saved'));

            },
            age()
            {
              let l=new Date();
              return l.getFullYear()-this.born_year;
            },
            async save() {   
  const database = new Databases(appw);
  
  try {
    // Update the Erasmus application document with the data from the form
    const result = await database.updateDocument(
      config.website_db,         // Database ID
      config.erasmus_applies,    // Collection ID
      this.$route.params.id,     // Document ID (from route parameters)
      {
        name: this.name,
        phone: this.phone,
        email: this.email,
        class: this.which_class,
        erasmusLocation: this.location,   // Assuming the location stores an ID
        score: this.score,                // Assuming there's a score field
        mark: this.mark                   // Assuming there's a mark field
        // Add any other fields you want to update
      }
    );
    
    // Notify the user of success
    this.$notify(this.$t('apply_saved'));
    console.log('Save successful:', result);
  } catch (error) {
    // Handle any errors during the document update
    console.error('Error saving data:', error);
    this.$notify({
      type: 'error',
      text: this.$t('error_saving')
    });
  }
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
            //console.log(l);
            //console.log(k);

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