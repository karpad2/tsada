<template>
    <div class="bg-slate-900 h-screen flex justify-center items-center">
        <div class="bg-slate-700 backdrop-blur-sm  p-9 rounded-xl shadow-lg w-2/3 md:w-1/2 lg:w-1/3 border-t-8 border-blue-500" style="z-index: 4;">
            <main>
    <h1 class="text-3xl font-bold mb-7 text-center text-white bg-blue-500 p-3 rounded">
            🏫 {{ $t("school_birthday") }} 🏫
        </h1>

        <ul v-if="filteredList.length && !loading" class="mt-5">
            <li v-for="person in filteredList"
                class="birthday-card bg-gradient-to-r from-yellow-200 via-red-100 to-pink-100 p-4 rounded-lg mb-4 fade-in-up flex items-center justify-between"
                :style="{animationDelay: (0.2 * (filteredList.indexOf(person) + 1)) + 's'}">
                <div>
                    <span class="text-lg font-semibold text-gray-500">{{ person.name }}</span>
                    <small class="text-gray-500 block">{{ person.class }}</small>
                    <small class="text-gray-600 block mt-1">{{ $t("born") }} {{ person.birthday }}</small>
                </div>
                <span class="text-blue-500 font-semibold">{{ calculateAge(person.birthday) }} {{ $t("yrs") }} 🎂</span>
            </li>
        </ul>

        <div v-if="filteredList.length === 0 && !loading" class="text-center mt-10">
            <span class="text-gray-200">😞{{ $t("no_one_has_birthday_today") }}</span>
        </div>

        <div v-if="loading" class="flex justify-center items-center mt-10">
            <span class="text-gray-200">⏳ {{ $t("loading") }}...</span>
        </div>
  </main>  

        </div>
    </div>

</template>

<script lang="ts">
import { Client, Databases,Query  } from "appwrite";
import {appw,config} from "@/appwrite";
export default{
  data(){ return {
                people: [],
                today: new Date().toISOString().slice(5, 10),
                
                loading: true
            }},
            computed: {
                filteredList() {
                    return this.people.filter(person => {
                        const personMonthDay = person.birthday.slice(5, 10);
                        return personMonthDay === this.today;
                    });
                }
            },
           
            mounted()
            {
              this.selfloading();
              setInterval(  
              this.selfloading,
              360000)
            },
            methods:{
              async selfloading()
              {
              
              const databases = new Databases(appw);

              
              let promise=await databases.listDocuments(config.birthday_db, config.birthday_coll,
              [
                Query.endsWith('birthday',this.today)
              ]);
              
              
              try{
              this.people = await promise.documents;
              this.loading = false; // Success
              console.log(promise.documents);
              }
              catch(e)
              {
                console.log(e);
                setTimeout(
                this.selfloading(),10000);
              }
              },calculateAge(birthday) {
                    const birthYear = parseInt(birthday.slice(0, 4));
                    const currentYear = new Date().getFullYear();
                    return currentYear - birthYear;
                }
            }
        
}
</script>