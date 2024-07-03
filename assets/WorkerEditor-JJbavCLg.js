import{D as m,b as d,S as g,u as v,d as o,Q as h,I as V,_ as C,r as u,c as y,a,h as i,w as k,j as c,t as w,o as $}from"./index-79_NoGyA.js";const D={data(){return{worker_name_hu:"",worker_name_rs:"",contact:"",default_img_link:"",file_link:null,img:""}},components:{},mounted(){this.getMD()},methods:{async getMD(){const e=new m(d),t=new g(d);v();let s=await e.listDocuments(o.website_db,o.workers,[h.equal("$id",this.$route.params.id)]);this.worker_name_hu=s.documents[0].worker_name_hu,this.worker_name_rs=s.documents[0].worker_name_rs,this.contact=s.documents[0].contact,s.documents[0].worker_img==null||s.documents[0].worker_img==""?this.img=t.getFileView(o.website_images,o.missing_worker_picture).href:this.img=t.getFileView(o.website_images,s.documents[0].worker_img).toString(),s.documents[0].gallery,console.log(s.documents[0].gallery)},async save(){const e=new m(d);await e.listDocuments(o.website_db,o.workers,[h.equal("$id",this.$route.params.id)]),await e.updateDocument(o.website_db,o.workers,this.$route.params.id,{worker_name_hu:this.worker_name_hu,worker_name_rs:this.worker_name_rs,worker_img:this.worker_img,contact:this.contact}),this.$notify(this.$t("saved"))},async delete_content(){await new m(d).deleteDocument(o.website_db,o.workers,this.$route.params.id),this.$notify(this.$t("deleted")),this.router.push("/about/workers")},async file_upload(){if(!this.file_link){console.warn("no file");return}console.log("file_upload");const t=await new g(d).createFile(o.website_images,V.unique(),this.file_link[0]);this.default_image=t.$id,this.save(),this.getMD(),this.$notify(this.$t("file_uploaded"))}}},x={class:"relative mb-4 container px-5 mx-auto bg-white"},B={class:"flex flex-wrap -m-4"},S={class:"xl:w-1/5 md:w-1/2 p-4 cursor-pointer"},U={class:"bg-slate-100/30 hover:bg-sky-600/30 dark:bg-slate-300/30 p-6 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"},j=["src"];function q(e,t,s,F,n,r){const p=u("v-btn"),b=u("VBtn"),f=u("v-file-input"),_=u("v-text-field");return $(),y("div",x,[a("div",null,[i(p,{onClick:r.delete_content,class:"m-5"},{default:k(()=>[c(w(e.$t("delete")),1)]),_:1},8,["onClick"]),i(b,{onClick:t[0]||(t[0]=l=>e.$router.go(-1)),class:"m-5"},{default:k(()=>[c(w(e.$t("goback")),1)]),_:1})]),a("div",null,[i(f,{onChange:r.file_upload,modelValue:n.file_link,"onUpdate:modelValue":t[1]||(t[1]=l=>n.file_link=l),accept:"image/*",label:e.$t("fileupload")},null,8,["onChange","modelValue","label"]),c(" "+w(e.$t("preview"))+" ",1),a("div",B,[a("div",S,[a("div",U,[a("img",{class:"h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out",src:n.img,alt:"content"},null,8,j)])])]),a("div",null,[i(_,{onChange:r.save,modelValue:n.worker_name_hu,"onUpdate:modelValue":t[2]||(t[2]=l=>n.worker_name_hu=l),counter:100,label:e.$t("worker_name_hu"),"hide-details":""},null,8,["onChange","modelValue","label"])]),a("div",null,[i(_,{onChange:r.save,modelValue:n.worker_name_rs,"onUpdate:modelValue":t[3]||(t[3]=l=>n.worker_name_rs=l),counter:100,label:e.$t("worker_name_rs"),"hide-details":""},null,8,["onChange","modelValue","label"])]),a("div",null,[i(_,{onChange:r.save,modelValue:n.contact,"onUpdate:modelValue":t[4]||(t[4]=l=>n.contact=l),counter:100,label:e.$t("contact"),"hide-details":""},null,8,["onChange","modelValue","label"])])])])}const N=C(D,[["render",q]]);export{N as default};
