<template>
   
  <div class="relative py-3 sm:max-w-xl sm:mx-auto" style="min-height: 80vh;">
    <div
      class="absolute inset-0 bg-gradient-to-r from-cyan-400 to-sky-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl">
    </div>
    <div class="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">

      <div class="max-w-md mx-auto">
        <div>
          <h1 class="text-2xl font-semibold">{{ $t('login') }}</h1>
        </div>
        <div class="divide-y divide-gray-200">
          <div class="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
            <div class="relative">
              <input  id="email" v-model="email" name="email" type="text" class="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600" :placeholder="$t('email')" />
              <label for="email" class="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">{{ $t('email') }}</label>
            </div>
            <div class="relative">
              <input id="password" v-model="password" name="password" type="password" class="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600" :placeholder="$t('password')" />
              <label for="password" class="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">{{ $t('password') }}</label>
            </div>
            <div class="relative">
                <button @click="login_by_app" class="inline-flex text-white bg-sky-500/100 border-0 py-2 px-6 focus:outline-none hover:bg-sky-500/100 rounded text-lg">
                     {{$t('login')}}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script >
import { ref } from 'vue';
import { Client, Account } from "appwrite";
import {appw,config,user,checkUser} from "@/appwrite";
import router from '@/router';
import TextEmphasisPosition from 'autoprefixer/lib/hacks/text-emphasis-position';

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
     // if(checkUser()) this.router.push("/home");
       console.log("login");
    },  
    methods:{
        login_by_app()
        {
            
            const promise = user.createEmailSession(this.email,this.password);

            promise.then( (response)=>{
                console.log(response);
                router.push("/home");
                this.$notify(this.$t('success'));
                 // takarodjá befelé
            }, (error)=>{
                this.$notify(this.$t('login_failure'));
                console.log(error); // Failure
            });
        }
    }
}



</script>