<template>
  <header v-if="reload" style="z-index: 200;"  class="navbar text-gray-600 backdrop-filter bg-opacity-50 bg-gray-300  backdrop-blur-lg body-font sticky top-0" id="home">
          <div class="container mx-auto flex flex-wrap p-4 flex-col md:flex-row items-center ">
            
                <div class="flex items-center">

              <div class="md:hidden flex items-start text-xl">
                <button  @click="menuopener" class="mobile-menu-button m-3">
                <i v-if="!menu_opened" class="pi pi-align-left"></i>
                <i v-else class="pi pi-times"></i>
              </button> 
              </div>
              <router-link to="/home" class="flex flex-row items-center title-font font-medium  text-gray-900 mb-4 md:mb-0 ">
                  <img src="@a/tsada_logo.png" class="size-20 text-white p-1 bg-sky-400/15 rounded-full">
              <span class="ml-3 text-xl max-sm:hidden" >{{ $t('school_name') }}</span>
              <img src="@a/certop_logo.png" class="w-36 h-12 text-white p-2 ">
              
              <img src="@a/Erasmus_Logo.svg" class="w-36 h-12 text-white p-2 " v-if="erasmusflag">
            </router-link>
            </div>
              <nav v-if="mobile_mode"  class="md:ml-auto flex flex-col md:flex-row items-center text-base justify-acenter">
                  
                  <router-link to="/home" class="mr-5 hover:text-sky-400 cursor-pointer block  py-2">{{ $t('home') }}</router-link>
                  <div class="dropdown">
                  <div v-if="reload" tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer block  py-2">{{ $t('aboutus') }} <i class="pi pi-angle-down"></i></div>
                  <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2 dark:text-white bg-base-100 rounded-box block w-52  py-2">
                      <li v-if="reload"  v-for="about in abouts"><router-link :to="'/renderer/about/'+about.id">{{ about.title }}</router-link></li>
                      <li ><router-link to="/renderer/about/history">{{ $t("history_of_school") }}</router-link></li>
                      <li ><router-link to="/about/workers">{{ $t("workers") }}</router-link></li>
                  </ul>
                  </div>

                  <div class="dropdown">
                  <div tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer block  py-2">{{ $t('education') }} <i class="pi pi-angle-down"></i></div>
                  <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2 dark:text-white bg-base-100 rounded-box block w-52  py-2">
                      <li v-if="false" ><router-link to="/education">{{ $t("education_profiles") }}</router-link></li>
                      <li ><router-link to="/renderer/education/adult_education">{{ $t("adult_education") }}</router-link></li>
                  </ul>
                  </div>
  
                  
                  <div class="dropdown">
                  <div tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer block  py-2">{{ $t('documents') }} <i class="pi pi-angle-down"></i></div>
                  <ul tabindex="0" class="dropdown-content  z-[1] menu p-2 dark:text-white bg-base-100 rounded-box w-52">
                      <li v-for="doccategory in doccategories" :key="doccategory.id"><router-link :to="'/documents/'+doccategory.id">{{ doccategory.name }}</router-link></li>
                  </ul>
                  </div>
  
                  <div v-if="!mobile_view" class="dropdown ">
                  <div tabindex="0" role="button" class="mr-5 hover:text-sky-400 cursor-pointer block  py-2"><country-flag :country='lang' size='small'/> <i class="pi pi-angle-down"></i></div>
                  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 dark:text-white bg-base-100 rounded-box w-52">
                      <li v-for="lang in languages" ><a @click="changeLanguage(lang.code)"><country-flag :country='lang.country' size='small'/> {{ lang.name }}  </a></li>
                  </ul>
                  </div>
                  <div v-if="mobile_view" role="button" class="mr-5 hover:text-sky-400 cursor-pointer block  py-2">
                    <button v-for="lang in languages" class="m-5 w-10" ><a @click="changeLanguage(lang.code)"><country-flag :country='lang.country' size='small'/>  </a></button>
                  </div>
  
                  
  
                  <div class="dropdown">
                  <div tabindex="0" role="button" class="mr-6 hover:text-sky-400 cursor-pointer block  py-2">{{ $t('Erasmus') }} <i class="pi pi-angle-down"></i></div>
                  <ul  v-if="reload" tabindex="0" class="dropdown-content z-[1] menu p-2 dark:text-white bg-base-100 rounded-box w-52">
                      <li v-for="_eras in _erasmus" :key="_eras.id"><router-link :to="'/renderer/erasmus/'+_eras.id">{{ _eras.name }}</router-link></li>
                  </ul>
                  </div>
  
  
                  <router-link v-if="!isLoggedin" to="/contact" class="mr-6 hover:text-sky-400 cursor-pointer block  py-2">
                  {{ $t('contactus') }}
                  <i class="pi pi-right"></i>
                  </router-link>
  
                  <router-link v-else to="/admin/messages" class="mr-6 hover:text-sky-400 cursor-pointer block  py-2">
                  {{ $t('messages') }}
                  <i class="pi pi-right"></i>
                  </router-link>
  
                  <span v-if="isLoggedin" @click="logout" class="mr-6 hover:text-sky-400 cursor-pointer block  py-2">
                  {{ $t('logout') }}
                  </span>
  
                  <router-link v-else to="/login" class="mr-6 hover:text-sky-400 cursor-pointer block  py-2">
                  {{ $t('login') }}
                  </router-link>
  
  
              </nav>
              
                  
          </div>
      </header>
  </template>
  <script lang="ts">
  import { Client, Databases, ID,Storage,Query,Account } from "appwrite";
  import {convertifserbian} from "@/lang";
  
  import {appw,config} from "@/appwrite";
  import { ref,nextTick } from "vue";
  import {useLoadingStore} from "@/stores/loading";
  export default
  {
      name: 'Header',
      components:{
        
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
              logged_in:false,
              lang:"",
              loa:null
          }
      },
      mounted()
      {
          
          //cc=useLoadingStore();
          //this.erasmusflag=cc.isErasmus;
          
          //this.language=cc.language;
          
          /*if(this.language==null)
          {
              this.language='sr';
          }*/
          const cc=useLoadingStore();
          this.$i18n.locale=cc.language;
          document.title=this.$t("school_name");
          this.getDocumentsCategories();
          this.getAbouts();
          this.getErasmus();
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
          this.mobile_view=window.innerWidth<=768;
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
  
              /*await this.$router.push("/home");
              this.reload.value=false;
              await  nextTick()
              this.reload.value=true;
              this.getDocumentsCategories();
              this.getAbouts();*/
              window.location.reload();
              //this.language=lang;
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
              l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("show_at_the_header_from_about",true),Query.select(["title_hu","title_en","title_rs","$id"])]);
          }
          else l= await database.listDocuments(config.website_db, config.about_us_db,[Query.equal("show_at_the_header_from_about",true),Query.select(["title_hu","title_en","title_rs","$id"])]);
          //let local=localStorage.getItem("lang");
          //console.log(l);
          l.documents.forEach(async element => {
              
              let a={title:"",id:""};
              a.title=convertifserbian(element.title_rs);
  
              a.id=element.$id;
              this.abouts.push(a);
          });
  
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
              
              if( a.title!="---")
              {
              a.id=element.$id;
              this.abouts.push(a);
              }
          });
  
          },
          async getErasmus()
          {
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
  
              a.id=element.$id;
              this._erasmus.push(a);
          });
  
          },
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

          
      
          isLoggedin()
          {
              const cc=useLoadingStore();
              return cc.userLoggedin;
          },
      }
  
    
  }
  </script>