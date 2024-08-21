import{D as _,b as a,S as c,u as v,d as l,Q as h,I as w,_ as V,r,c as C,a as n,i as d,w as p,o as k,k as f,t as b}from"./index-Bqutj4x2.js";const y={data(){return{title_en:"",title_hu:"",title_rs:"",file_link:null,document_id:"",img:""}},components:{},mounted(){this.getMD()},methods:{async getMD(){const t=new _(a);new c(a),v();let e=await t.listDocuments(l.website_db,l.documents_db,[h.equal("$id",this.$route.params.id)]);this.title_rs=e.documents[0].document_title_rs,this.title_hu=e.documents[0].document_title_hu,this.title_en=e.documents[0].document_title_en,this.document_id=e.documents[0].document_id,e.documents[0].gallery,console.log(e.documents[0].gallery)},async save(){const t=new _(a);await t.listDocuments(l.website_db,l.documents_db,[h.equal("$id",this.$route.params.id)]),await t.updateDocument(l.website_db,l.documents_db,this.$route.params.id,{document_title_rs:this.title_rs,document_title_hu:this.title_hu,document_title_en:this.title_en,document_id:this.document_id}),this.$notify(this.$t("saved"))},async delete_content(){const t=new _(a);await new c(a).deleteFile(l.documents_storage,this.document_id),await t.deleteDocument(l.website_db,l.documents_db,this.$route.params.id),this.$notify(this.$t("deleted")),this.router.push("/home")},async file_upload(){if(!this.file_link){console.warn("no file");return}this.$notify(this.$t("file_upload_in_progress")),console.log("file_upload");const e=await new c(a).createFile(l.documents_storage,w.unique(),this.file_link);this.document_id=await e.$id,this.save(),this.getMD(),this.$notify(this.$t("file_uploaded"))}}},D={class:"relative mb-4 container px-5 mx-auto bg-white"},$=n("div",{class:"flex flex-wrap -m-4"},[n("div",{class:"xl:w-1/5 md:w-1/2 p-4 cursor-pointer"})],-1);function x(t,e,S,U,i,o){const m=r("v-btn"),g=r("v-file-input"),u=r("v-text-field");return k(),C("div",D,[n("div",null,[d(m,{onClick:o.save,class:"m-5"},{default:p(()=>[f(b(t.$t("save")),1)]),_:1},8,["onClick"]),d(m,{onClick:o.delete_content},{default:p(()=>[f(b(t.$t("delete")),1)]),_:1},8,["onClick"])]),n("div",null,[d(g,{onChange:o.file_upload,modelValue:i.file_link,"onUpdate:modelValue":e[0]||(e[0]=s=>i.file_link=s),accept:"document/*",label:t.$t("fileupload")},null,8,["onChange","modelValue","label"]),$]),n("div",null,[n("div",null,[d(u,{onChange:o.save,modelValue:i.title_rs,"onUpdate:modelValue":e[1]||(e[1]=s=>i.title_rs=s),counter:100,label:t.$t("srb_title"),"hide-details":""},null,8,["onChange","modelValue","label"])])]),n("div",null,[n("div",null,[d(u,{modelValue:i.title_hu,"onUpdate:modelValue":e[2]||(e[2]=s=>i.title_hu=s),counter:100,onChange:o.save,label:t.$t("hu_title"),"hide-details":""},null,8,["modelValue","onChange","label"])])]),n("div",null,[n("div",null,[d(u,{modelValue:i.title_en,"onUpdate:modelValue":e[3]||(e[3]=s=>i.title_en=s),counter:100,onChange:o.save,label:t.$t("en_title"),"hide-details":""},null,8,["modelValue","onChange","label"])])])])}const B=V(y,[["render",x]]);export{B as default};