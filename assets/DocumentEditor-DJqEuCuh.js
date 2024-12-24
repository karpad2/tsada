import{D as _,b as d,S as m,u as b,d as n,Q as v,I as D,_ as y,r as c,c as V,a as l,i as u,w as f,o as k,j as p,t as g}from"./index-CAZ1nnMG.js";const C={data(){return{title_en:"",title_hu:"",title_rs:"",file_link:null,document_id:"",img:"",uploading:!1}},props:{modded:String},components:{},mounted(){this.getMD(),window.addEventListener("beforeunload",this.handleBeforeUnload)},onBeforeUnmount(){window.removeEventListener("beforeunload",this.handleBeforeUnload)},methods:{getDocumentsDB(){let e="";return this.modded=="documents_db"?e=n.documents_db:this.modded=="st_documents"?e=n.st_documents:this.modded=="text_documents"&&(e=n.text_documents),e},async getMD(){const e=new _(d);new m(d),b();let t=await e.getDocument(n.website_db,this.getDocumentsDB(),this.$route.params.id);this.title_rs=t.document_title_rs,this.title_hu=t.document_title_hu,this.title_en=t.document_title_en,this.document_id=t.document_id,t.gallery,console.log(t.gallery)},async save(){const e=new _(d);await e.listDocuments(n.website_db,this.getDocumentsDB(),[v.equal("$id",this.$route.params.id)]),await e.updateDocument(n.website_db,this.getDocumentsDB(),this.$route.params.id,{document_title_rs:this.title_rs,document_title_hu:this.title_hu,document_title_en:this.title_en,document_id:this.document_id}),this.$notify(this.$t("saved"))},handleBeforeUnload(e){if(this.uploading)return e.preventDefault(),this.$notify({type:"error",text:this.$t("file_still_uploading")}),e.returnValue="",""},async delete_content(){const e=new _(d),t=new m(d);try{let s=await t.deleteFile(n.documents_storage,this.document_id)}catch(s){console.warn(s)}try{let s=await e.deleteDocument(n.website_db,this.getDocumentsDB(),this.$route.params.id)}catch(s){console.warn(s)}this.$notify(this.$t("deleted")),this.$router.push("/home")},async file_upload(){if(!this.file_link){console.warn("no file");return}this.uploading=!0,this.$notify(this.$t("file_upload_in_progress")),console.log("file_upload");const t=await new m(d).createFile(n.documents_storage,D.unique(),this.file_link);this.document_id=await t.$id,this.save(),this.$notify(this.$t("file_uploaded")),this.uploading=!1}}},$={class:"relative mb-4 container px-5 mx-auto bg-white"};function B(e,t,s,x,i,a){const h=c("v-btn"),w=c("v-file-input"),r=c("v-text-field");return k(),V("div",$,[l("div",null,[u(h,{onClick:a.save,class:"m-5"},{default:f(()=>[p(g(e.$t("save")),1)]),_:1},8,["onClick"]),u(h,{onClick:a.delete_content},{default:f(()=>[p(g(e.$t("delete")),1)]),_:1},8,["onClick"])]),l("div",null,[u(w,{onChange:a.file_upload,modelValue:i.file_link,"onUpdate:modelValue":t[0]||(t[0]=o=>i.file_link=o),accept:"document/*",label:e.$t("fileupload")},null,8,["onChange","modelValue","label"]),t[4]||(t[4]=l("div",{class:"flex flex-wrap -m-4"},[l("div",{class:"xl:w-1/5 md:w-1/2 p-4 cursor-pointer"})],-1))]),l("div",null,[l("div",null,[u(r,{onChange:a.save,modelValue:i.title_rs,"onUpdate:modelValue":t[1]||(t[1]=o=>i.title_rs=o),counter:100,label:e.$t("srb_title"),"hide-details":""},null,8,["onChange","modelValue","label"])])]),l("div",null,[l("div",null,[u(r,{modelValue:i.title_hu,"onUpdate:modelValue":t[2]||(t[2]=o=>i.title_hu=o),counter:100,onChange:a.save,label:e.$t("hu_title"),"hide-details":""},null,8,["modelValue","onChange","label"])])]),l("div",null,[l("div",null,[u(r,{modelValue:i.title_en,"onUpdate:modelValue":t[3]||(t[3]=o=>i.title_en=o),counter:100,onChange:a.save,label:e.$t("en_title"),"hide-details":""},null,8,["modelValue","onChange","label"])])])])}const S=y(C,[["render",B]]);export{S as default};
