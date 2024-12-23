<template>
<section class="text-gray-600 min-h-screen">
    <div class="container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30">
            <div class="flex flex-wrap w-full mb-20">
                <div class="lg:w-1/3 w-full mb-6 lg:mb-0">
                    <h1 id="render_title" class="sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white" >{{ $t('workers') }}</h1>
                    <div class="h-1 w-20 bg-sky-500/100 rounded"></div>
                </div>
            
            </div>
            <div v-if="loaded"  v-for="role in roles" class="m-auto w-full popups" :key="role.role">
            <h1 class="sm:text-2xl text-sm font-medium   mb-3 text-gray-900  dark:text-white">{{ role.role }}</h1>
            <v-data-table  height="400" :headers="headers" :items="role.workers" :items-per-page="-1">
                <template v-slot:item.img="{ item }">
                <img :src="item.img"  class="object-cover w-20" />
            </template>

            <template v-slot:item.edit="{ item }">
                <router-link class="" :to="'/admin/worker/'+item.id"><i class="pi pi-user-edit worker_editor"></i></router-link>
            
            </template>
            <template #bottom></template>
                </v-data-table>
                <v-btn v-if="admin" @click="new_stuff(role.id)" class="m-5">{{ $t('add_new_worker_in_that_category') }}</v-btn>
            </div>
            <Loading v-else />
</div>
</section>


</template>
<script lang="ts">

import { Client, Databases, ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";
import { convertifserbian } from "@/lang";
import {useLoadingStore} from "@/stores/loading";
import {reactive,ref} from "vue";
import gsap from "gsap";
import Loading from "@/components/Loading.vue";
import { yapping } from "@/uwu";

export default {
    name: 'Workers',
    components: {
        Loading
    },
    setup()
    {

    },
    mounted()
    {
        const loadingStore = useLoadingStore();
        this.admin=loadingStore.userLoggedin;
        document.title=this.$t("workers");

        gsap.fromTo(
    "#render_title",
    {
      opacity: 0,
      x: "50%",
    },
    {
      duration: 1.5,
      opacity: 1,
      x: 0,
    }
  );

 


        //loadingStore.setLoading(true);
        if(!this.admin)
        this.headers= [
                { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                { title: this.$t("contact"), align: 'start', key: 'contact',width: '300px' },
                { title: this.$t("photo"), align: 'start', key: 'img',cellRenderer:function(params) {
                        return '<img href="'+params.value+'" class="object-cover w-20" />';
                      } }];
        else 
        this.headers= [
                { title: this.$t("name"), align: 'start', sortable: false, key: 'name',width: '200px' },
                { title: this.$t("contact"), align: 'start', key: 'contact',width: '300px' },
                { title: this.$t("photo"), align: 'start', key: 'img', width: '200px', cellRenderer:function(params) {
                        return '<img href="'+params.value+'" class="object-cover w-20" />';
                },
                },
                { title: this.$t("Edit"), align: 'start', key: 'edit',width: '300px' },
                ];
        this.load_workers_base();
        if(!this.admin)
        this.colDefs= [
                    { field: 'name', headerName:this.$t("name"), sortable: true, filter: true },
                    { field: 'contact', headerName:this.$t("contact"), sortable: true, filter: true },
                    { field: 'img', headerName:this.$t("image"), cellRenderer: function(params) {
                        return '<img href="'+params.value+'" class="object-cover w-20" />';
                      } },
                      
                      
                    
                    ];
    else
    this.colDefs= [
                    { field: 'name', headerName:this.$t("name"), sortable: true, filter: true },
                    { field: 'contact', headerName:this.$t("contact"), sortable: true, filter: true },
                    { field: 'img', headerName:this.$t("image"), cellRenderer: function(params) {
                        return '<img href="'+params.value+'" class="object-cover w-20" />';
                      } },
                      { field: 'edit', headerName:this.$t("edit"), sortable: true, filter: true },
                      
                    
                    ];


                    gsap.fromTo(
                    ".popups",
                    {
                    opacity: 0,
                    y: "50%",
                    },
                    {
                    duration: 1.5,
                    opacity: 1,
                    y: 0,
                    }
                );                
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
                headers:[],
                admin:false
                
            }),
    methods:{
        async new_stuff(aaa)
        {
            const database = new Databases(appw);
            const l= await database.createDocument(config.website_db, config.workers,ID.unique(),{"roles":aaa});
            this.$router.push("/admin/worker/"+l.$id);
        },
        async load_workers_base(){
        const loadingStore = useLoadingStore();
        //loadingStore.setLoading(true);
        this.workers=[];
        this.roles=[];
        //yapping();
        const database = new Databases(appw);
        const storage = new Storage(appw);

        let local=loadingStore.language;

        let missing_picture=storage.getFileView(config.website_images,config.missing_worker_picture).href;
        
        //this is f voodoo, and sucks, but it works
        
        let k= await database.listDocuments(config.website_db, config.roles_db,[Query.orderAsc("listasorrend")]);

        for (let i=0;i<k.documents.length;i++)
        {

        let el1=k.documents[i];
      //   k.documents.forEach(async (el1) => {
            let _works=[];
            //yapping(el1);
            let l= await database.listDocuments(config.website_db, config.workers,[Query.select(["worker_name_hu","worker_name_rs","contact","worker_img","$id"]),
                Query.equal("roles",[el1.$id])
        ]);
        //yapping(l);
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
            //yapping(l);
            await l.documents.forEach(async el2 => {
            let a={name:"",contact:"",img:"",id:""};
            a.id=el2.$id;
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

            a.img= await storage.getFileView(config.website_images,el2.worker_img).href;
            }    
            _works.push(a);
        });
        let b={role:"",workers:[],id:""};
        b.id=el1.$id;
        b.role=name;
        b.workers=_works;
        this.roles.push(b);
//        });
      }
        yapping(this.roles);
        //loadingStore.setLoading(false);
        this.loaded=true;
        },
        onReady(params) {
                yapping('onReady');

                //this.api = params.api;
                //this.calculateRowCount();
                //this.load_workers_base();
                //this.api.sizeColumnsToFit();
            }
       
    }
    
}
</script>
<style>
.worker_editor{
    font-size: 4em;;
}
</style>