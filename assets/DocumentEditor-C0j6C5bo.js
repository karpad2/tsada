import{D as c,b as d,S as r,u as w,d as l,Q as p,I as V,_ as k,r as m,c as y,a as n,i as u,w as f,o as C,k as b,t as g}from"./index-QeMuxxm_.js";const D={data(){return{title_en:"",title_hu:"",title_rs:"",file_link:null,document_id:"",img:""}},components:{},mounted(){this.getMD()},methods:{async getMD(){const t=new c(d);new r(d),w();let e=await t.listDocuments(l.website_db,l.documents_db,[p.equal("$id",this.$route.params.id)]);this.title_rs=e.documents[0].document_title_rs,this.title_hu=e.documents[0].document_title_hu,this.title_en=e.documents[0].document_title_en,this.document_id=e.documents[0].document_id,e.documents[0].gallery,console.log(e.documents[0].gallery)},async save(){const t=new c(d);await t.listDocuments(l.website_db,l.documents_db,[p.equal("$id",this.$route.params.id)]),await t.updateDocument(l.website_db,l.documents_db,this.$route.params.id,{document_title_rs:this.title_rs,document_title_hu:this.title_hu,document_title_en:this.title_en,document_id:this.document_id}),this.$notify(this.$t("saved"))},async delete_content(){const t=new c(d),e=new r(d);try{let o=await e.deleteFile(l.documents_storage,this.document_id)}catch(o){console.warn(o)}try{let o=await t.deleteDocument(l.website_db,l.documents_db,this.$route.params.id)}catch(o){console.warn(o)}this.$notify(this.$t("deleted")),this.router.push("/home")},async file_upload(){if(!this.file_link){console.warn("no file");return}this.$notify(this.$t("file_upload_in_progress")),console.log("file_upload");const e=await new r(d).createFile(l.documents_storage,V.unique(),this.file_link);this.document_id=await e.$id,this.save(),this.getMD(),this.$notify(this.$t("file_uploaded"))}}},$={class:"relative mb-4 container px-5 mx-auto bg-white"},x=n("div",{class:"flex flex-wrap -m-4"},[n("div",{class:"xl:w-1/5 md:w-1/2 p-4 cursor-pointer"})],-1);function S(t,e,o,U,i,a){const h=m("v-btn"),v=m("v-file-input"),_=m("v-text-field");return C(),y("div",$,[n("div",null,[u(h,{onClick:a.save,class:"m-5"},{default:f(()=>[b(g(t.$t("save")),1)]),_:1},8,["onClick"]),u(h,{onClick:a.delete_content},{default:f(()=>[b(g(t.$t("delete")),1)]),_:1},8,["onClick"])]),n("div",null,[u(v,{onChange:a.file_upload,modelValue:i.file_link,"onUpdate:modelValue":e[0]||(e[0]=s=>i.file_link=s),accept:"document/*",label:t.$t("fileupload")},null,8,["onChange","modelValue","label"]),x]),n("div",null,[n("div",null,[u(_,{onChange:a.save,modelValue:i.title_rs,"onUpdate:modelValue":e[1]||(e[1]=s=>i.title_rs=s),counter:100,label:t.$t("srb_title"),"hide-details":""},null,8,["onChange","modelValue","label"])])]),n("div",null,[n("div",null,[u(_,{modelValue:i.title_hu,"onUpdate:modelValue":e[2]||(e[2]=s=>i.title_hu=s),counter:100,onChange:a.save,label:t.$t("hu_title"),"hide-details":""},null,8,["modelValue","onChange","label"])])]),n("div",null,[n("div",null,[u(_,{modelValue:i.title_en,"onUpdate:modelValue":e[3]||(e[3]=s=>i.title_en=s),counter:100,onChange:a.save,label:t.$t("en_title"),"hide-details":""},null,8,["modelValue","onChange","label"])])])])}const B=k(D,[["render",S]]);export{B as default};
