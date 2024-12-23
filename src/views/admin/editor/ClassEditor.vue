<template>
    <div v-if="!loading" class="relative mb-4 container  px-5  mx-auto bg-white" >
        <div>
            <v-btn @click="delete_content" class="m-5">{{ $t('delete') }}</v-btn>
            <VBtn @click="$router.go(-1)" class="m-5">{{ $t("goback") }}</VBtn>
        </div>

    <div>

            
            <div >
            <v-select
            :items="syears"
            v-model="year"
            :label="$t('year')"
            
            item-value="id"
            item-text="title"
            @update:modelValue="save"
            ></v-select>
            </div>
            
            <div >
            <v-select
            :items="sdelegation"
            v-model="delegation"
            :label="$t('class_number')"
            @update:modelValue="save"
            ></v-select>
            </div>
            
            <div >
            <v-autocomplete
            :items="workers"
            v-model="masterchief"
            :label="$t('masterchief')"
            item-value="id"
            item-text="title"
            @update:modelValue="save"
            ></v-autocomplete>
            </div>

            <div >
            <v-select
            :items="courses"
            v-model="course"
            :label="$t('school_profiles')"
            item-value="id"
            item-text="title"
            @update:modelValue="save"
            ></v-select>
            </div>

            <div >
            <v-select
            :items="languages"
            v-model="language"
            :label="$t('language')"
            item-value="id"
            item-text="title"
            @update:modelValue="save"
            ></v-select>
            </div>

            <div >
          <v-text-field
            @change="save"
            v-model="recepient_hour"
            :counter="100"
            :label="$t('receiving_hour')"
            hide-details
            
          ></v-text-field>
        </div>
    </div>
</div>    
        
    
</template>
<script lang="ts">
import {Client,Databases,ID,Storage,Query } from "appwrite";
import {appw,config} from "@/appwrite";
import { yapping } from "@/uwu";
import {useLoadingStore} from "@/stores/loading";
import { convertifserbian } from "@/lang";
import { data } from "autoprefixer";

export default{
data()
{
    return{
        year:1,
        syears:[
            {
                id:1,
                title:"I"
            },
            {
                id:2,
                title:"II"
            },
            {
                id:3,
                title:"III"
            },
            {
                id:4,
                title:"IV"
            },
        ],
        sdelegation:[1,2,3,4,5,6,7,8,9],
        delegation:null,
        courses:[],
        course:"",
        workers:[{id:"a",title:"test"}],
        masterchief:"",
        recepient_hour:"",
        loading:true,
        language:"",
        languages:[{id:"class_hun",title:this.$t('hun_teaching')},{id:"class_srb",title:this.$t('srb_teaching')}]

    }
},
components:{
},
mounted()
{
    this.getMD();

},
methods:{
    async getMD()
        {
            
            const database = new Databases(appw);
            const storage = new Storage(appw);
            const cc=useLoadingStore();
            //just fucking kill me
            let mode="";
           
            
            let k= await database.listDocuments(config.website_db, config.workers,[Query.limit(150)]);
            this.workers=[];

            for (let index = 0; index < k.total; index++) {
                const element = k.documents[index];
                //yapping(element);
                let a={title:"",id:""};
                try{
                a.title=element.worker_name_hu;
                if(cc.language=="sr"||cc.language=="rs")
                {
                    a.title=convertifserbian(element.worker_name_rs);
                }
                
                a.id=element.$id;

                this.workers.push(a);
            }
            catch(ex)
            {
                yapping(ex);
            }
                
            }
            
            this.courses=[];
            k= await database.listDocuments(config.website_db, config.courselist,[Query.limit(150)]);
            for (let index = 0; index < k.total; index++) {
                const element = k.documents[index];
                let a={title:"",id:""};
                a.id=element.$id;
                if(cc.language=="rs"||cc.language=="sr")
                {
                    a.title=convertifserbian(element.title_rs);
                }
                else if(cc.language=="hu")
                {
                    a.title=element.title_hu;
                }
                else if(cc.language=="en")
                {
                    a.title=element.title_en;
                }

                this.courses.push(a);
                }
                k=await database.getDocument(config.website_db,config.classlist,this.$route.params.id);
                yapping(k); 
                
                this.year=k.year;
                this.delegation=k.designation;
                try{
                this.masterchief=k.workers.$id;
                }catch(ex){yapping(ex)}
                try{
                this.course=k.courses.$id;
                }catch(ex){yapping(ex)}
                this.language=k.language;
                this.recepient_hour=k.receiving_hour;
            this.loading=false;
            //yapping(this.workers);
        },

    async save()
    {   
        const database = new Databases(appw);
        //const storage = new Storage(appw);
       // let k= await database.listDocuments(config.website_db, config.workers,[Query.equal("$id",this.$route.params.id)]);  

        
        const result = await database.updateDocument(
        config.website_db, // databaseId
        config.classlist, // collectionId
        this.$route.params.id, // documentId
        {
            "year":this.year,
            "designation":this.delegation,
            "workers":this.masterchief,
            "language":this.language,
            "receiving_hour":this.recepient_hour,
            "courses":this.course

        }, // data (optional)
    //["read("any)"] // permissions (optional)
    );
    this.$notify(this.$t('saved'));
    //this.getMD();

    },
    async delete_content()
    {
        const database = new Databases(appw);
        //const storage = new Storage(appw);
        let k= await database.deleteDocument(config.website_db, config.classlist,this.$route.params.id);  
        this.$notify(this.$t('deleted'));
        this.router.push("/about/classlist");
    },
    
}

    
}


</script>