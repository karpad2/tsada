import{D as _,b as d,S as c,u as v,d as l,Q as f,I as y,_ as V,r as m,c as C,a as n,i as u,w as p,o as k,j as b,t as g}from"./index-DBza809s.js";const D={data(){return{title_en:"",title_hu:"",title_rs:"",file_link:null,document_id:"",img:"",uploading:!1}},components:{},mounted(){this.getMD(),window.addEventListener("beforeunload",this.handleBeforeUnload)},onBeforeUnmount(){window.removeEventListener("beforeunload",this.handleBeforeUnload)},methods:{async getMD(){const t=new _(d);new c(d),v();let e=await t.listDocuments(l.website_db,l.documents_db,[f.equal("$id",this.$route.params.id)]);this.title_rs=e.documents[0].document_title_rs,this.title_hu=e.documents[0].document_title_hu,this.title_en=e.documents[0].document_title_en,this.document_id=e.documents[0].document_id,e.documents[0].gallery,console.log(e.documents[0].gallery)},async save(){const t=new _(d);await t.listDocuments(l.website_db,l.documents_db,[f.equal("$id",this.$route.params.id)]),await t.updateDocument(l.website_db,l.documents_db,this.$route.params.id,{document_title_rs:this.title_rs,document_title_hu:this.title_hu,document_title_en:this.title_en,document_id:this.document_id}),this.$notify(this.$t("saved"))},handleBeforeUnload(t){if(this.uploading)return t.preventDefault(),this.$notify({type:"error",text:this.$t("file_still_uploading")}),t.returnValue="",""},async delete_content(){const t=new _(d),e=new c(d);try{let s=await e.deleteFile(l.documents_storage,this.document_id)}catch(s){console.warn(s)}try{let s=await t.deleteDocument(l.website_db,l.documents_db,this.$route.params.id)}catch(s){console.warn(s)}this.$notify(this.$t("deleted")),this.router.push("/home")},async file_upload(){if(!this.file_link){console.warn("no file");return}this.uploading=!0,this.$notify(this.$t("file_upload_in_progress")),console.log("file_upload");const e=await new c(d).createFile(l.documents_storage,y.unique(),this.file_link);this.document_id=await e.$id,this.save(),this.getMD(),this.$notify(this.$t("file_uploaded")),this.uploading=!1}}},$={class:"relative mb-4 container px-5 mx-auto bg-white"},x=n("div",{class:"flex flex-wrap -m-4"},[n("div",{class:"xl:w-1/5 md:w-1/2 p-4 cursor-pointer"})],-1);function U(t,e,s,B,i,a){const h=m("v-btn"),w=m("v-file-input"),r=m("v-text-field");return k(),C("div",$,[n("div",null,[u(h,{onClick:a.save,class:"m-5"},{default:p(()=>[b(g(t.$t("save")),1)]),_:1},8,["onClick"]),u(h,{onClick:a.delete_content},{default:p(()=>[b(g(t.$t("delete")),1)]),_:1},8,["onClick"])]),n("div",null,[u(w,{onChange:a.file_upload,modelValue:i.file_link,"onUpdate:modelValue":e[0]||(e[0]=o=>i.file_link=o),accept:"document/*",label:t.$t("fileupload")},null,8,["onChange","modelValue","label"]),x]),n("div",null,[n("div",null,[u(r,{onChange:a.save,modelValue:i.title_rs,"onUpdate:modelValue":e[1]||(e[1]=o=>i.title_rs=o),counter:100,label:t.$t("srb_title"),"hide-details":""},null,8,["onChange","modelValue","label"])])]),n("div",null,[n("div",null,[u(r,{modelValue:i.title_hu,"onUpdate:modelValue":e[2]||(e[2]=o=>i.title_hu=o),counter:100,onChange:a.save,label:t.$t("hu_title"),"hide-details":""},null,8,["modelValue","onChange","label"])])]),n("div",null,[n("div",null,[u(r,{modelValue:i.title_en,"onUpdate:modelValue":e[3]||(e[3]=o=>i.title_en=o),counter:100,onChange:a.save,label:t.$t("en_title"),"hide-details":""},null,8,["modelValue","onChange","label"])])])])}const S=V(D,[["render",U]]);export{S as default};
