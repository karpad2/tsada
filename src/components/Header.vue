<template>
  <header v-if="reload" :class="{mobile_force:style_computed_for_mobile}" style="z-index: 200;"  class="navbar transition-all delay-150 pt-5 text-gray-600 backdrop-filter bg-opacity-50 bg-gray-300 dark:bg-gray-900 backdrop-blur-lg body-font sticky top-0" id="home">
          <div :class="[{'flex-col':mobile_view},{'flex-row':!mobile_view}]" class="container mx-auto flex flex-wrap items-center ">
            
            <div class="flex items-center">

              <div v-if="mobile_view" class="flex items-start ">
                <button  @click="menuopener" class="btn btn-ghost mobile-menu-button m-3 dark:text-white">
                <i v-if="!menu_opened" class="pi pi-align-left"></i>
                <i v-else class="pi pi-times"></i>
              </button> 
              </div>
              <router-link to="/home" class=" flex flex-row items-center title-font font-medium  text-gray-900 mb-4 md:mb-0  ">
                  <img src="@a/tsada_logo.png" alt="logo" class="size-20 text-white p-1 bg-sky-400/15 rounded-full">
              <span class="ml-1  max-sm:hidden text-xl dark:text-white" >{{ $t('school_name') }}</span>
              
              <Certop class="h-28 w-28"/>
              
              <img src="@a/Erasmus_Logo.svg"  alt="erasmus+" class="w-36 h-12 text-white p-2 " v-if="erasmusflag">
            </router-link>
            </div>
              <nav v-if="mobile_mode"  :class="[{'flex-col':mobile_view},{'mx-auto':mobile_view||tablet_mode},{'flex-row':!mobile_view}]" class="md:ml-auto flex items-center text-base justify-acenter ">
                  
                  <router-link to="/home" class=" btn btn-ghost cursor-pointer dark:text-white">{{ $t('home') }}</router-link>
                  <div class="dropdown dropdown-hover">
                  <div v-if="reload" tabindex="0" role="button" class="btn btn-ghost cursor-pointer  dark:text-white ">{{ $t('aboutus') }} <i class="pi pi-angle-down"></i></div>
                  <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2  bg-base-100 rounded-box block w-52  ">
                      <li ><router-link to="/renderer/about/history">{{ $t("history_of_school") }}</router-link></li>
                      <li v-if="reload"  v-for="about in abouts"><router-link :to="'/renderer/about/'+about.id">{{ about.title }}</router-link></li>
                      <li ><router-link to="/about/workers">{{ $t("workers") }}</router-link></li>
                      <li ><router-link to="/about/classlist">{{ $t("classlist") }}</router-link></li>
                      <li v-if="false" ><router-link to="/about/birthday">{{ $t("birthday") }}</router-link></li>
                  </ul>
                  </div>

                  <div class="dropdown dropdown-hover">
                  <div tabindex="0" role="button" class="btn btn-ghost  cursor-pointer    dark:text-white">{{ $t('education') }} <i class="pi pi-angle-down"></i></div>
                  <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2  bg-base-100 rounded-box block w-52  ">
                    <li><details :class="{'dropdown-right':!mobile_view}" class="dropdown dropdown-hover">
                        <summary >{{ $t("courses") }} </summary>
                        <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                            
                        <li ><details :class="{'dropdown-right':!mobile_view}" class="dropdown dropdown-hover">
                        <summary >{{ $t("machine") }} </summary>
                        <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                            <li><router-link to="/renderer/education/mechanical_technician">{{ $t("mechanical_technician") }}</router-link></li>
                            <li><router-link to="/renderer/education/cnc_miller">{{ $t("cnc_miller") }}</router-link></li>
                        </ul>
                        </details>
                        </li>
                        
                        <li ><details :class="{'dropdown-right':!mobile_view}"  class="dropdown dropdown-hover">
                        <summary >{{ $t("electrotechnic") }} </summary>
                        <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                            <li><router-link to="/renderer/education/mechatronic_technician">{{ $t("mechatronic_technician") }}</router-link></li>
                            <li><router-link to="/renderer/education/computer_electrotechnician">{{ $t("computer_electrotechnician") }}</router-link></li>
                        </ul>
                        </details>
                        </li>
                        <li ><details :class="{'dropdown-right':!mobile_view}" class="dropdown dropdown-hover">
                        <summary >{{ $t("civil_engineering") }} </summary>
                        <ul class="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                            <li><router-link to="/renderer/education/primary_construction_works_operator">{{ $t("primary_construction_works_operator") }}</router-link></li>
                        </ul>
                        </details>
                        </li>
                        </ul>
                        </details>
                    </li>
                    
                    <li ><router-link to="/about/timetable">{{ $t("timetable") }}</router-link></li>
                    <li ><router-link to="/about/workerstimetable">{{ $t("teachers_receiving_hour") }}</router-link></li>
                    <li ><router-link to="/about/parentvisiting">{{ $t("parentsvisiting") }}</router-link></li>
                    <li><router-link to="/renderer/education/examslist">{{ $t("examslist") }}</router-link></li> 
                    <li><router-link to="/renderer/education/textbooks">{{ $t("textbooks") }}</router-link></li> 
                  </ul>
                  </div>
  
                  <router-link to="/gallery" class="btn btn-ghost  cursor-pointer  dark:text-white">{{ $t('gallery') }}</router-link>
                  
                  <div class="dropdown dropdown-hover">
                  <div tabindex="0" role="button" class="btn btn-ghost  cursor-pointer  dark:text-white ">{{ $t('for_students') }} <i class="pi pi-angle-down"></i></div>
                  <ul tabindex="0" class="dropdown-content  z-[1] menu p-2  bg-base-100 rounded-box w-52">
                      <li v-for="doccategory in _students" :key="doccategory.id"><router-link :to="'/renderer/students/'+doccategory.id">{{ doccategory.name }}</router-link></li>
                      <li  ><router-link to="/studentdocuments">{{ $t("studentdocuments") }}</router-link></li> 
                      <li  ><a href="https://moodle.tsada.edu.rs">{{ $t("eclassroom") }}</a></li>  
                    </ul>
                  </div>
                  
                  <div class="dropdown dropdown-hover">
                  <div tabindex="0" role="button" class="btn btn-ghost  cursor-pointer   dark:text-white">{{  $t('documents') }} <i class="pi pi-angle-down"></i></div>
                  <ul tabindex="0" class="dropdown-content  z-[1] menu p-2  bg-base-100 rounded-box w-52">
                      <li  ><router-link to="/documents">{{ $t("school_documents") }}</router-link></li> 
                      <li  ><router-link to="/docs/public_procurements">{{ $t("public_procurements") }}</router-link></li> 
                      <li  ><router-link to="/docs/leases">{{ $t("lease") }}</router-link></li>
                      <li><router-link to="/renderer/education/67b4d43f0017f6a974b8">{{ $t("duplicates_of_diplomas") }}</router-link></li>    
                    </ul>
                  </div>

                  <router-link to="/renderer/education/adult_education" class="btn btn-ghost cursor-pointer dark:text-white ">{{ $t('adult_education') }}</router-link>
  
                  <div v-if="!mobile_view" class="dropdown dropdown-hover">
                  <div tabindex="0" role="button" class="btn btn-ghost cursor-pointer   dark:text-white"><country-flag :country='lang' size='small'/> <i class="pi pi-angle-down"></i></div>
                  <ul tabindex="0" class="dropdown-content z-[1] menu p-2  bg-base-100 rounded-box w-52">
                      <li v-for="lang in languages" ><a @click="changeLanguage(lang.code)"><country-flag :country='lang.country' size='small'/> {{ lang.name }}  </a></li>
                  </ul>
                  </div>
                  <div v-if="mobile_view" role="button" class=" btn btn-ghost  cursor-pointer  ">
                    <button v-for="lang in languages" class="m-5 w-10" ><a @click="changeLanguage(lang.code)"><country-flag :country='lang.country' size='small'/>  </a></button>
                  </div>
  
                  <div class="dropdown dropdown-hover">
                  <div tabindex="0" role="button" class="btn btn-ghost  mr-5 cursor-pointer   dark:text-white">{{ $t('Erasmus') }} <i class="pi pi-angle-down"></i></div>
                  <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2  bg-base-100 rounded-box w-52">
                      <li v-for="_eras in _erasmus" :key="_eras.id"><router-link :to="'/renderer/erasmus/'+_eras.id">{{ _eras.name }}</router-link></li>
                      <li v-if="erasmus_apply_on" ><router-link to="/erasmus/apply">{{ $t("erasmus_apply") }}</router-link></li>
                      <li v-if="erasmus_list" ><router-link to="/erasmus/results">{{ $t("erasmus_applies_result") }}</router-link></li>
                      <li v-if="isLoggedin" ><router-link  to="/admin/erasmus/applies">{{ $t("erasmus_applies") }}</router-link></li>
                  </ul>
                  </div>
                  
  
                  <router-link v-if="false" to="/contact" class="btn btn-ghost  mr-5  cursor-pointer  dark:text-white  ">
                  {{ $t('contactus') }}
                  <i class="pi pi-right"></i>
                  </router-link>
  
                  <div v-if="isLoggedin"  class="dropdown dropdown-hover">
                  <div tabindex="0" role="button" class="btn btn-ghost m-3 mr-5 cursor-pointer  dark:text-white ">{{ $t('account') }} <i class="pi pi-angle-down"></i></div>
                  <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2  bg-base-100 rounded-box w-52">
                      <li  ><router-link to="/admin/messages">{{ $t('messages') }}</router-link></li>
                      <li  ><router-link to="/admin/slide-editor">{{ $t('presentation_editor') }}</router-link></li>
                      <li  ><router-link to="/" @click="logout">{{ $t('logout') }}</router-link></li>
                  </ul>
                  </div>

                  <router-link v-else to="/login" class="btn btn-ghost  mr-5  cursor-pointer dark:text-white  ">
                  {{ $t('login') }}
                  </router-link>
              </nav> 
          </div>
      </header>
  </template>
  <script lang="ts">
  import { Client, Databases, ID,Storage,Query,Account } from "appwrite";
  import {convertifserbian} from "@/lang";
  
  import {appw,config,check} from "@/appwrite";
  import { ref,nextTick } from "vue";
  import {useLoadingStore} from "@/stores/loading";
  import Certop from "./Certop.vue";
  export default
  {
      name: 'Header',
      components:{
        Certop
      },
      data()
      {
          return {
              language: null,
              languages: [
                  {name: 'Српски', code: 'sr',country:"srb"},
                  
                  {name: 'Magyar', code: 'hu',country:"hun"},
                  {name: 'English', code: 'en',country:"gbr"}
              ],
              doccategories:[],
              _erasmus:[],
              abouts:[],
              reload:ref(true),
              menu_opened:false,
              mobile_view:false,
              _students:[],
              logged_in:false,
              lang:"",
              tablet_view:false,
              erasmus_list:false,
              erasmus_apply_on:false,

              loa:null
          }
      },
      mounted()
      {
          const cc=useLoadingStore();
          this.$i18n.locale=cc.language;
          document.title=this.$t("school_name");
          this.checker();
          
          this.languages.forEach(element => {
              if(element.code==cc.language)
              this.lang=element.country;
          });
        this.onResize();
        this.$nextTick(() => {
      window.addEventListener('resize', this.onResize);
    })
  
  
      },

      methods:{
        onResize()
        {
          this.mobile_view=window.innerWidth<=1276;
          this.tablet_view=window.innerWidth>=1276&&window.innerWidth<=1550;
        },
        async checker()
        {
            check();
          this.getDocumentsCategories();
          this.getAbouts();
          this.getErasmus();
          this.getStudents();
        },
        menuopener()
        {
          this.menu_opened=!this.menu_opened;
        },
          changeLanguage(code)
          {
              const cc=useLoadingStore();
              cc.setLanguage(code)
              //await localStorage.setItem('lang', code);
              this.$i18n.locale=code;
  
              this.languages.forEach(element => {
              if(element.code==cc.language)
              this.lang=element.country;
          });
              
             
              //i am want to cry, but i cant
  
             
              window.location.reload();
              
          },
          async logout()
          {
              const account = new Account(appw);
              const result = await account.deleteSession(
      'current' // sessionId
  );
              const cc=useLoadingStore();
              cc.setUserLoggedin(false);
              console.warn("logout");
              window.location.reload();
          },
         

      
          async getDocumentsCategories()
          {
          const database = new Databases(appw);
          const storage = new Storage(appw);
          const cc=useLoadingStore();
          let l= await database.listDocuments(config.website_db, config.document_categories_db);
          //let local=localStorage.getItem("lang");
          l.documents.forEach(async element => {
              //console.log(element);
              let a={name:"",id:""};
              if(cc.language=="en")
              {
                  a.name=element.category_name_en;
                  
              }
              else if(cc.language=="hu")
              {
                  a.name=element.category_name_hu;
                  
              }
              else if(cc.language=="rs"||cc.language=="sr")
              {
                  a.name=convertifserbian(element.category_name_rs);
              }
  
              a.id=element.$id;
              this.doccategories.push(a);
          });
  
          },
          async getAbouts()
          {
          const database = new Databases(appw);
          const storage = new Storage(appw);
          let l;
          const cc=useLoadingStore();
          //console.log(this.language);//show_at_the_header_from_about
          if(cc.language=="sr")
          {
              l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("show_at_the_header_from_about",true),Query.select(["title_hu","title_en","title_rs","$id"]),Query.orderAsc("sorrend")]);
          }
          else l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("show_at_the_header_from_about",true),Query.select(["title_hu","title_en","title_rs","$id"]),Query.orderAsc("sorrend")]);
          //let local=localStorage.getItem("lang");
          //console.log(l);
          for (let i=0;i<l.documents.length;i++)

          
          {
            let element=l.documents[i];    
              let a={title:"",id:""};
              if(cc.language=="sr")
              a.title=convertifserbian(element.title_rs);
              else if(cc.language=="rs")   
              a.title=element.title_rs;
              else if(cc.language=="hu")
              a.title=element.title_hu;
              else if(cc.language=="en")
              a.title=element.title_en;
              else 
              {
  
              }
              a.id=element.$id;
              this.abouts.push(a);
          }
  
          },
  
          async getCourses()
          {
          const cc=useLoadingStore();
          const database = new Databases(appw);
          const storage = new Storage(appw);
          let l;
          //console.log(cc.language);
          if(cc.language=="sr")
          {
              l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("aboutCategories","about"),Query.select(["title_hu","title_en","title_rs","$id"])]);
          }
          else l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("aboutCategories","about"),Query.select(["title_hu","title_en","title_rs","$id"])]);
          //let local=localStorage.getItem("lang");
          //console.log(l);
          l.documents.forEach(async element => {
              let a={title:"",id:""};
              if(cc.language=="sr")
              a.title=convertifserbian(element.title_rs);
              else if(cc.language=="rs")   
              a.title=element.title_rs;
              else if(cc.language=="hu")
              a.title=element.title_hu;
              else if(cc.language=="en")
              a.title=element.title_hu;
              else 
              {
  
              }
              if( a.title=="") return;
            if( a.title!="---")
              {
              a.id=element.$id;
              this.abouts.push(a);
              }
          });
  
          },
          async getErasmus()
          {
          this.getErasmusSettings();
          const database = new Databases(appw);
          const storage = new Storage(appw);
          const cc=useLoadingStore();
          let l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("type","erasmus"),Query.select(["title_hu","title_en","title_rs","$id"])]);
          //console.log(l);
          //let local=localStorage.getItem("lang");
          l.documents.forEach(async element => {
              //console.log(element);
              let a={name:"",id:""};
              if(cc.language=="en")
              {
                  a.name=element.title_en;  
              }
              else if(cc.language=="hu")
              {
                  a.name=element.title_hu;
                  
              }
              else if(cc.language=="rs"||cc.language=="sr")
              {
                  a.name=convertifserbian(element.title_rs);
              }
              if( a.name=="") return;
              a.id=element.$id;
              this._erasmus.push(a);
          });
  
          },
          async getStudents()
          {
          const database = new Databases(appw);
          const storage = new Storage(appw);
          const cc=useLoadingStore();
          let l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("type","students"),Query.select(["title_hu","title_en","title_rs","$id"])]);
          //console.log(l);
          //let local=localStorage.getItem("lang");
          l.documents.forEach(async element => {
              //console.log(element);
              let a={name:"",id:""};
              if(cc.language=="en")
              {
                  a.name=element.title_en;  
              }
              else if(cc.language=="hu")
              {
                  a.name=element.title_hu;
                  
              }
              else if(cc.language=="rs"||cc.language=="sr")
              {
                  a.name=convertifserbian(element.title_rs);
              }
              if( a.name=="") return;
              a.id=element.$id;
              this._students.push(a);
          });
  
          },

          async getErasmusSettings()
          {
            const cc=useLoadingStore();
            const database = new Databases(appw);

            let l,k;
            l= await database.getDocument(config.website_db,config.general_settings,"erasmus_list");
            k= await database.getDocument(config.website_db,config.general_settings,"erasmus_apply_on");
            this.erasmus_apply_on=k.setting_status;
            this.erasmus_list=l.setting_status;
            //console.log(l);
            //console.log(k);

          }

      },
      computed:{
          erasmus()
          {
              const cc=useLoadingStore();
              if(cc.language=="sr")
              {
                  this.$router.push("/renderer/erasmus/erasmus_rs");  
              }
              else
              this.$router.push("/renderer/erasmus/");
          },
          erasmusflag()
          {
              const cc=useLoadingStore();
              return cc.isErasmus;
          },
          mobile_mode()
          {
            /*f(!this.mobile_view&&window.innerWidth<=768)
            return false;
              */
            return this.menu_opened&&this.mobile_view||!this.mobile_view;

          },


          style_computed_for_mobile()
          {
            return this.mobile_view&&!this.mobile_mode;
          },

          
      
          isLoggedin()
          {
              const cc=useLoadingStore();
              return cc.userLoggedin;
          },
          notMobile()
          {
            return !this.mobile_mode;
          }
      }
  
    
  }
  </script>
  <style>
.mobile_force{
    max-height: 80px;
}
</style>