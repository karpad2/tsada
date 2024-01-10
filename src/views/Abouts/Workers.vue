<template>
<section class="text-gray-600 ">
    <div class="container px-5 py-20 mx-auto bg-gray-100">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900">{{ $t('workers') }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            
            </div>
<div v-if="loaded"  v-for="role in roles" class="m-auto w-full" :key="role.role">
<h1 class="sm:text-2xl text-sm font-medium   mb-3 text-gray-900">{{ role.role }}</h1>
  <table v-if="false"  class=" table-auto table-zebra rounded w-full">
    <!-- head -->
    <thead>
      <tr>
        <th></th>
        <th>{{ $t("name") }}</th>
        <th>{{ $t("image") }}</th>
      </tr>
    </thead>
    <tbody>
      <!-- row 1 -->
      <tr v-for="(worker,index) in role.workers" :key="index"  >
        <th>{{ index+1 }}</th>
        <td class="w-1/4"><h3>{{worker.name}}</h3><p>{{ worker.contact }}</p></td>
        <td class="w-1/4">{{ worker.role }} </td>
        <td class="w-1/4"><img :src="worker.img"  class="object-cover w-20" /></td>
      </tr>
    </tbody>
  </table>

 
  <v-data-table  height="400" :headers="headers" :items="role.workers">
    <template v-slot:item.img="{ item }">
    <img :src="item.img"  class="object-cover w-20" />
  </template>
  <template #bottom></template>
    </v-data-table>
</div>
</div>
</section>


</template>
<script>

import { Client, Databases, ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";
import {convertifserbian} from "@/lang";
import useLoadingStore from '@/stores';
import {reactive,ref} from "vue";



export default {
    name: 'Courses',
    components: {
        
    },
    setup()
    {

    },
    mounted()
    {
        const loadingStore = useLoadingStore();
        //loadingStore.setLoading(true);
        this.headers= [
                { title: this.$t("name"), align: 'start', sortable: false, key: 'name' },
                { title: this.$t("contactus"), align: 'start', key: 'contact' },
                { title: this.$t("photo"), align: 'start', key: 'img',cellRenderer:function(params) {
                        return '<img href="'+params.value+'" class="object-cover w-20" />';
                      } }];
        this.load_workers_base();
        this.colDefs= [
                    { field: 'name', headerName:this.$t("name"), sortable: true, filter: true },
                    { field: 'contact', headerName:this.$t("contact"), sortable: true, filter: true },
                    { field: 'img', headerName:this.$t("image"), cellRenderer: function(params) {
                        return '<img href="'+params.value+'" class="object-cover w-20" />';
                      } }];
    },
    data: () => ({
        workers: [
            {
                img: 'https://dummyimage.com/720x400',
                name: 'SUBTITLE',
                role: 'First',
                contact: 'Lorem ipsum dolor sit'}],
                roles:[],
                colDefs:[],
                loaded:false,
                headers:[]
                
            }),
    methods:{
        async load_workers_base()
        {
        const loadingStore = useLoadingStore();
        //loadingStore.setLoading(true);
        this.workers=[];
        this.roles=[];
        //console.log();
        const database = new Databases(appw);
        const storage = new Storage(appw);

        let local=localStorage.getItem("lang");
        let missing_picture=storage.getFileView(config.website_images,config.missing_worker_picture).href;
        
        //this is f voodoo, and sucks, but it works

        let k= await database.listDocuments(config.website_db, config.roles_db);
        k.documents.forEach(async el1 => {
            let _works=[];
            console.log(el1);
            let l= await database.listDocuments(config.website_db, config.workers,[
                Query.equal("roles",[el1.$id])
        ]);
            let name="";
            if(local=="en")
            {
                name=el1.role_en;
            }
            else if(local=="hu")
            {
                name=el1.role_hu;
            }
            else if(local=="rs"||local=="sr")
            {
                name=convertifserbian(el1.role_rs);
            }
            //console.log(l);
            l.documents.forEach(el2 => {
            let a={name:"",contact:"",img:""};
            if(local=="en"||local=="hu")
            {
                a.name=el2.worker_name_hu;
                //a.role=el2.role;
                a.contact=el2.contact;
            }
            else if(local=="rs"||local=="sr")
            {
                a.name=convertifserbian(el2.worker_name_rs);
                //a.role=convertifserbian(el2.role);
                a.contact=el2.contact;
            }
            if(el2.worker_img==""||el2.worker_img==null)
            {
            a.img=missing_picture;
            }
            else
            {

            a.img=storage.getFileView(config.website_images,el2.worker_img).href;
            }    
            _works.push(a);
        });
        let b={role:"",workers:[]};
        b.role=name;
        b.workers=_works;
        this.roles.push(b);
        });

        console.log(this.roles);
        //loadingStore.setLoading(false);
        this.loaded=true;
        },
        onReady(params) {
                console.log('onReady');

                //this.api = params.api;
                //this.calculateRowCount();
                //this.load_workers_base();
                //this.api.sizeColumnsToFit();
            },
    }
    
}
</script>