<template>
   
  <div class="">
    <div v-if="!isLoggedin">
      <div class=" font-[sans-serif]">
      <div class="min-h-screen flex flex-col items-center justify-center  px-4 bg-white/60">
        <div class="max-w-md w-full ">
          

          <div class="p-8 rounded-2xl  shadow">
            <h2 class="text-gray-800 text-center text-2xl font-bold">{{ $t("login") }}</h2>
            <form class="mt-8 space-y-4">
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
                <button @click="login_by_app" type="button" class="w-full py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
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
        <VBtn @click="logout">{{ $t("logout") }}</VBtn>
    </div>
</div>

</template>

<script lang="ts">
import { ref } from 'vue';
import { Client, Account } from "appwrite";
import {appw,config,user} from "@/appwrite";
import router from '@/router';
import TextEmphasisPosition from 'autoprefixer/lib/hacks/text-emphasis-position';
import {useLoadingStore} from "@/stores/loading";
export default {
    name: 'Login',
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

      document.title=this.$t("login");
      this.checklogin();

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
        login_by_app()
        {
            
            const promise = user.createEmailSession(this.email,this.password);

            promise.then( (response)=>{
                console.log(response);
                
                this.$notify(this.$t('success'));
                
                const lo=useLoadingStore();
                
                lo.setUserLoggedin(true);
                
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