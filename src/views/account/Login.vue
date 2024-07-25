<template>
   
  <div class="">
    <div v-if="!isLoggedin">
      <div class=" font-[sans-serif]">
      <div class="min-h-screen flex flex-col items-center justify-center  px-4 bg-white/60">
        <div class="max-w-md w-full ">
          
          
          <div class="p-8 rounded-2xl  shadow">
            <h2 class="text-gray-800 text-center text-2xl font-bold">{{ $t("login") }}</h2>
            <form @submit.prevent="login_by_app" class="mt-8 space-y-4">
              <div>
                <label class="text-gray-800 text-sm mb-2 block">{{ $t('email') }}</label>
                <div class="relative flex items-center">
                  <input v-model.lazy="email" name="email" type="text" required class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600" :placeholder="$t('email')" />
                  
                </div>
              </div>

              <div>
                <label class="text-gray-800 text-sm mb-2 block">{{ $t('password') }}</label>
                <div class="relative flex items-center">
                  <input v-model.lazy="password" name="password" type="password" required class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600" :placeholder="$t('password')" />
                  
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center">
                  
                </div>
                <div class="text-sm">
                  
                </div>
              </div>

              <div class="!mt-8">
                <button type="submit" @click="login_by_app"  class="w-full py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                  {{ $t("login") }}
                </button>
              </div>
              </form>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="w-1/2 h-full m-auto p-40" >
        <h1>{{ $t("Account page") }}</h1>
        <h2>{{ $t("welcome") }} {{  }} !</h2>

        <div>
          <v-switch @change="set_user_setting" v-model="animation_backgound" :label="$t('disable_animation_background')"></v-switch>
        </div>
        <VBtn @click="logout">{{ $t("logout") }}</VBtn>
    </div>
</div>

</template>

<script lang="ts">
import { ref } from 'vue';
import {Client,Databases,ID,Storage,Query,Account } from "appwrite";
//import { Client, Account } from "appwrite";
import {appw,config,user} from "@/appwrite";
import router from '@/router';
import TextEmphasisPosition from 'autoprefixer/lib/hacks/text-emphasis-position';
import {useLoadingStore} from "@/stores/loading";
export default {
    name: 'Login',
    data()
    {
      return {
        animation_backgound:false,
        user_name:"",
        uid:""
      }
    },
    setup() {
        const email = ref('');
        const password = ref('');
        return {
            email,
            password
        }
    },
    mounted()
    {
      const cc=useLoadingStore();
      document.title=this.$t("login");
      this.checklogin();
      if(cc.isLoggedin)
      {
        this.get_user_settings();
      }

     // if(checkUser()) this.router.push("/home");
       console.log("login");
    },  
    methods:{

        async checklogin()
        {
          const cc=useLoadingStore();
            cc.setUserLoggedin(false);
          const account = new Account(appw);
          try{
          const result = await account.get();
          console.log(result);
          cc.setUserLoggedin(true);
          }
          catch(e)
          {
            cc.setUserLoggedin(false);
          }
          
        },
        async get_user_settings()
        {
          /*const cc=useLoadingStore();
          const database = new Databases(appw);
          let k= await database.listDocuments(config.website_db, config.users_settings,[Query.equal("uid",cc.uid),Query.equal("setting","animation")]);
          
           if(k.total!=0)
           {
           this.animation_backgound=k.documents[0].value;
           cc.setAnimation(this.animation_backgound);
           }
           else
           {
           await database.createDocument(config.website_db,config.users_settings,ID.unique(),{
              "uid":this.uid,
              "setting":"animation",
              "value":true
            });
           }*/

        },
        async set_user_setting()
        {
          
          const cc=useLoadingStore();
          cc.setAnimation(this.animation_backgound);
          console.log("setted_animation");
          /*const database = new Databases(appw);
          let n= await database.listDocuments(config.website_db, config.users_settings,[Query.equal("uid",cc.uid),Query.equal("setting","animation"),Query.select(["$id"])]);
          let k= await database.updateDocument(config.website_db,config.users_settings,n.documents[0].$id,
            {
              "value":this.animation_backgound
            }
          );
          */
        },
        login_by_app()
        {
            
            const promise = user.createEmailSession(this.email,this.password);
            const cc=useLoadingStore();
            promise.then( (response)=>{
                console.log(response);
                
                this.$notify(this.$t('success'));
                
                const lo=useLoadingStore();
                
                lo.setUserLoggedin(true);
                console.log(response);
                cc.setuid(response.userId);
               

                
               /* setTimeout(()=>
              {
                router.push("/home");
              },300);*/
            
                 // takarodjá befelé
            }, (error)=>{
                this.$notify(this.$t('login_failure'));
                console.log(error); // Failure
            });
        
          
          },
          
          async logout()
          {
            const cc=useLoadingStore();
            cc.setUserLoggedin(false);

            const account = new Account(appw);
            const result = await account.deleteSession('current');
            
            
            
            console.warn("logout");
            router.push("/home");
            //window.location.reload();
        },
        animation_setting()
        {

        }
    },
    computed:{
      isLoggedin()
          {
            const cc=useLoadingStore();
            return cc.userLoggedin;
          },
    }
}



</script>