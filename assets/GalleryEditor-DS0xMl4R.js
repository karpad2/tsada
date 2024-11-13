import{D as m,b as u,S as w,u as U,d as a,Q as y,I as V,_ as $,r as b,c as p,a as n,i as d,w as v,j as c,t as h,F as B,f as x,o as g,k as C,h as E}from"./index-GppQd-LD.js";const q={data(){return{title_en:"",title_hu:"",title_rs:"",short_rs:"",short_hu:"",short_en:"",gallery_id:"",visible:!1,default_image:"",file_link:null,images:[""],uploading:!1}},components:{},mounted(){this.getMD(),this.gallery_id=this.$route.params.id,window.addEventListener("beforeunload",this.handleBeforeUnload)},onBeforeUnmount(){window.removeEventListener("beforeunload",this.handleBeforeUnload)},methods:{async getMD(){const e=new m(u),l=new w(u);U();let o=await e.listDocuments(a.website_db,a.gallery,[y.equal("$id",this.$route.params.id)]);this.title_rs=o.documents[0].title_rs,this.content_rs=o.documents[0].text_rs,this.title_hu=o.documents[0].title_hu,this.content_hu=o.documents[0].text_hu,this.title_en=o.documents[0].title_en,this.content_en=o.documents[0].text_en,this.visible=o.documents[0].visible,this.default_image=o.documents[0].default_image;let r=await e.listDocuments(a.website_db,a.album_images,[y.equal("gallery",this.$route.params.id)]);this.images=[],r.documents.forEach(t=>{let i={img:"",img_id:"",doc_id:""};i.img_id=t.image_id,i.doc_id=t.$id,i.img=l.getFilePreview(a.gallery_pictures_storage,t.image_id,300,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,this.images.push(i)}),o.documents[0].gallery},handleBeforeUnload(e){if(this.uploading)return e.preventDefault(),this.$notify({type:"error",text:this.$t("file_still_uploading")}),e.returnValue="",""},async save(){const e=new m(u);await e.listDocuments(a.website_db,a.gallery,[y.equal("$id",this.$route.params.id)]),await e.updateDocument(a.website_db,a.gallery,this.$route.params.id,{title_rs:this.title_rs,title_hu:this.title_hu,title_en:this.title_en,short_en:this.short_en,short_hu:this.short_hu,short_rs:this.short_rs,visible:this.visible,default_image:this.default_image}),this.$notify(this.$t("saved"))},async delete_content(){await new m(u).deleteDocument(a.website_db,a.gallery,this.$route.params.id),this.$notify(this.$t("deleted")),this.router.push("/home")},async file_upload(){const e=new w(u),l=new m(u);if(!this.file_link){console.warn("no file");return}console.log("file_upload"),this.uploading=!0,await this.file_link.forEach(async o=>{this.$notify({type:"info",text:this.$t("file_upload_started")}),console.log(o);const r=await e.createFile(a.gallery_pictures_storage,V.unique(),o);let t=await l.createDocument(a.website_db,a.album_images,V.unique(),{image_id:r.$id,gallery:this.gallery_id});console.log(t),this.$notify({type:"success",text:this.$t("file_uploaded")}),setTimeout(()=>{},500)}),this.uploading=!1,this.getMD()},set_as_default(e){console.log(e),this.default_image=e,this.save(),this.getMD()},delete_picture(e,l){const o=new w(u),r=new m(u);try{let t=o.deleteFile(a.gallery_pictures_storage,e)}catch{console.log("hiba a törlésnél")}try{let t=r.deleteDocument(a.website_db,a.album_images,l)}catch{console.log("hiba a törlésnél")}this.getMD()}}},M={class:"relative mb-4 container px-5 mx-auto bg-white"},L={class:"w-full grid sm:grid-cols-3"},N={class:"card card-compact bg-base-100 w-96 shadow-xl m-5 flex",style:{"max-width":"400px"}},S=["src"],j={class:"card-body"},I={key:0},Q={class:"card-actions justify-end"};function T(e,l,o,r,t,i){const k=b("v-switch"),f=b("v-btn"),D=b("v-file-input"),_=b("v-text-field");return g(),p("div",M,[n("div",null,[d(k,{onChange:i.save,modelValue:t.visible,"onUpdate:modelValue":l[0]||(l[0]=s=>t.visible=s),label:e.$t("visible")},null,8,["onChange","modelValue","label"]),d(f,{onClick:i.save,class:"m-5"},{default:v(()=>[c(h(e.$t("save")),1)]),_:1},8,["onClick"]),d(f,{onClick:i.delete_content},{default:v(()=>[c(h(e.$t("delete")),1)]),_:1},8,["onClick"])]),n("div",null,[d(D,{onChange:i.file_upload,multiple:"",modelValue:t.file_link,"onUpdate:modelValue":l[1]||(l[1]=s=>t.file_link=s),accept:"image/*",label:e.$t("fileupload")},null,8,["onChange","modelValue","label"]),c(" "+h(e.$t("preview"))+" ",1),n("div",L,[(g(!0),p(B,null,x(t.images,s=>(g(),p("div",N,[n("figure",null,[n("img",{src:s.img,alt:"mrow"},null,8,S)]),n("div",j,[t.default_image==s.img_id?(g(),p("p",I,h(e.$t("default_picture")),1)):C("",!0),n("div",Q,[t.default_image!=s.img_id?(g(),E(f,{key:0,onClick:F=>i.set_as_default(s.img_id)},{default:v(()=>[c(h(e.$t("set_as_default")),1)]),_:2},1032,["onClick"])):C("",!0),d(f,{onClick:F=>i.delete_picture(s.img_id,s.doc_id)},{default:v(()=>[c(h(e.$t("delete")),1)]),_:2},1032,["onClick"])])])]))),256))])]),n("div",null,[d(_,{onChange:i.save,modelValue:t.title_rs,"onUpdate:modelValue":l[2]||(l[2]=s=>t.title_rs=s),counter:100,label:e.$t("srb_title"),"hide-details":""},null,8,["onChange","modelValue","label"]),d(_,{onChange:i.save,modelValue:t.short_rs,"onUpdate:modelValue":l[3]||(l[3]=s=>t.short_rs=s),counter:100,label:e.$t("srb_short"),"hide-details":""},null,8,["onChange","modelValue","label"])]),n("div",null,[n("div",null,[d(_,{modelValue:t.title_hu,"onUpdate:modelValue":l[4]||(l[4]=s=>t.title_hu=s),counter:100,onChange:i.save,label:e.$t("hu_title"),"hide-details":""},null,8,["modelValue","onChange","label"]),d(_,{onChange:i.save,modelValue:t.short_hu,"onUpdate:modelValue":l[5]||(l[5]=s=>t.short_hu=s),counter:100,label:e.$t("hu_short"),"hide-details":""},null,8,["onChange","modelValue","label"])]),n("div",null,[d(_,{modelValue:t.title_en,"onUpdate:modelValue":l[6]||(l[6]=s=>t.title_en=s),counter:100,onChange:i.save,label:e.$t("en_title"),"hide-details":""},null,8,["modelValue","onChange","label"]),d(_,{onChange:i.save,modelValue:t.short_en,"onUpdate:modelValue":l[7]||(l[7]=s=>t.short_en=s),counter:100,label:e.$t("en_short"),"hide-details":""},null,8,["onChange","modelValue","label"])])])])}const P=$(q,[["render",T]]);export{P as default};
