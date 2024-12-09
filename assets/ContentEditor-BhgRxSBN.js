import{D as g,b as r,S as x,u as C,d as o,Q as y,v as L,e as D,I as U,_ as q,r as d,c,a as u,i as n,w as V,j as f,t as p,k as _,o as b}from"./index-B4ACEYYQ.js";import{A}from"./AlbumViewer-GXRCSUIN.js";import{D as j}from"./DocLister-npnuUeTM.js";import"./moment-with-locales-C2fONLux.js";const z={data(){return{id:"",title_en:"",title_hu:"",title_rs:"",content_rs:"",content_hu:"",content_en:"",yt_video:"",show_date:!1,srb_flag:!0,hun_flag:!0,en_flag:!1,visible:!1,documents_flag:!1,album_flag:!1,choosen_gallery:!1,galleries:[],default_img_link:"",gallery_id:"",file_link:null,fb_message:"",fb_public:!1,img:"",headers:[],colDefs:[],documents:[],doc_loaded:!1,notNews:!0,uploading:!1,_update:!0}},components:{AlbumViewer:A,DocLister:j},mounted(){this.id=this.$route.params.id,this.getMD(),this.headers=[{title:this.$t("name"),align:"start",sortable:!1,key:"name",width:"200px"},{title:this.$t("date"),align:"start",key:"date",width:"300px"},{title:this.$t("open_document"),align:"start",key:"open",width:"300px"}],this.headers.push({title:this.$t("edit_document"),align:"start",key:"edit",width:"300px"}),this.colDefs.push({field:"edit",headerName:this.$t("edit_message"),sortable:!0,filter:!0}),this.load_galleries(),window.addEventListener("beforeunload",this.handleBeforeUnload)},onBeforeUnmount(){window.removeEventListener("beforeunload",this.handleBeforeUnload)},methods:{async g_save(){this._update=!1,await this.save(),this._update=!0},async getMD(){const s=new g(r),t=new x(r);C();let a=await s.getDocument(o.website_db,o.about_us_db,this.$route.params.id);this.title_rs=a.title_rs,this.content_rs=a.text_rs,this.title_hu=a.title_hu,this.content_hu=a.text_hu,this.title_en=a.title_en,this.content_en=a.text_en,this.yt_video=a.yt_video,this.visible=a.visible,this.notNews=a.notNews,this.show_date=a.show_date,a.default_image==null||a.default_image==""?this.img="https://dummyimage.com/720x400":this.img=t.getFileView(o.website_images,a.default_image).toString(),this.gallery_id=a.gallery.$id,this.documents_flag=a.has_documents,this.album_flag=a.has_gallery,this.synchronize_documents()},handleBeforeUnload(s){if(this.uploading)return s.preventDefault(),this.$notify({type:"error",text:this.$t("file_still_uploading")}),s.returnValue="",""},async save(){const s=new g(r);await s.listDocuments(o.website_db,o.about_us_db,[y.equal("$id",this.$route.params.id)]),await s.updateDocument(o.website_db,o.about_us_db,this.$route.params.id,{title_rs:this.title_rs,title_hu:this.title_hu,title_en:this.title_en,text_en:this.content_en,text_hu:this.content_hu,text_rs:this.content_rs,isHungarian:this.hun_flag,isSerbian:this.srb_flag,isEnglish:this.en_flag,visible:this.visible,yt_video:this.yt_video,has_documents:this.documents_flag,has_gallery:this.album_flag,gallery:this.gallery_id,default_image:this.default_image,notNews:this.notNews,show_date:this.show_date}),this.$notify(this.$t("saved"))},async share_fb(){let t=await new g(r).getDocument(o.website_db,o.users_settings,"fb_access_token"),a=`https://share.tsada.edu.rs/${this.$route.params.id}`;const h=await L.post(`https://graph.facebook.com/v20.0/${o.pan}/feed`,{message:null,link:a,access_token:t.parameter,published:!0});console.log(h)},async documents_load(){this.save(),this.synchronize_documents()},async gallery_change(){this.gallery_id==null&&(this.gallery_id=await this.new_gallery()),this.save()},async load_galleries(){let t=await new g(r).listDocuments(o.website_db,o.gallery,[y.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible"]),y.limit(25)]);this.galleries=[];let h=C().language;t.documents.forEach(e=>{let l={title:"",subtitle:"",text:"",img:"",imga:"",en:"",id:"",visible:!1};l.id=e.$id,l.visible=e.visible,h=="en"?(l.title=e.title_en,l.subtitle=e.short_en):h=="hu"?(l.title=e.title_hu,l.subtitle=e.short_hu):(h=="rs"||h=="sr")&&(l.title=D(e.title_rs),l.subtitle=D(e.short_rs)),e.code==""||e.code==null?l.en=e.title_en:l.en=e.code,this.galleries.push(l)})},async exist_new_gallery_change(){this.gallery_change()},async new_stuff(){const t=await new g(r).createDocument(o.website_db,o.text_documents,U.unique(),{texts:this.$route.params.id});this.$router.push("/admin/text-document-editor/"+t.$id)},async new_gallery(){return(await new g(r).createDocument(o.website_db,o.gallery,U.unique(),{visible:!1,title_rs:this.title_rs,title_hu:this.title_hu,title_en:this.title_en})).$id},async synchronize_documents(){const s=new g(r);if(this.documents_flag){this.doc_loaded=!1,this.documents=[];let a=C().language;await(await s.listDocuments(o.website_db,o.text_documents,[y.equal("texts",[this.$route.params.id])])).documents.forEach(async e=>{let l={name:"",contact:"",img:"",id:"",doc_id:"",date:""};l.id=e.$id,a=="en"||a=="hu"?(l.name=e.document_title_hu,l.contact=e.contact):(a=="rs"||a=="sr")&&(l.name=D(e.document_title_rs),l.contact=e.contact),l.id=e.$id,l.doc_id=e.document_id,l.date=e.$createdAt,this.documents.push(l)}),this.doc_loaded=!0}},async delete_content(){await new g(r).deleteDocument(o.website_db,o.about_us_db,this.$route.params.id),this.$notify(this.$t("deleted")),this.$router.push("/home")},async file_upload(){if(!this.file_link){console.warn("no file");return}console.log("file_upload"),this.uploading=!0;const t=await new x(r).createFile(o.website_images,U.unique(),this.file_link);this.default_image=t.$id,this.save(),this.$notify(this.$t("file_uploaded")),this.uploading=!1}}},Q={class:"relative mb-4 container px-5 mx-auto bg-white"},F={class:"flex flex-wrap -m-4"},I={class:"xl:w-1/5 md:w-1/2 p-4 cursor-pointer"},M={class:"bg-slate-100/30 hover:bg-sky-600/30 dark:bg-slate-300/30 p-6 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"},H=["src"],T={key:0},G={key:0},J={key:0},K={key:0},O={key:0},P={key:0};function R(s,t,a,h,e,l){const m=d("v-switch"),v=d("v-btn"),N=d("v-file-input"),w=d("v-text-field"),k=d("ckeditor");d("QuillEditor"),d("router-link"),d("v-data-table");const E=d("DocLister"),S=d("v-select"),B=d("AlbumViewer");return b(),c("div",Q,[u("div",null,[n(m,{onChange:l.save,modelValue:e.visible,"onUpdate:modelValue":t[0]||(t[0]=i=>e.visible=i),label:s.$t("visible")},null,8,["onChange","modelValue","label"]),n(m,{onChange:l.save,modelValue:e.notNews,"onUpdate:modelValue":t[1]||(t[1]=i=>e.notNews=i),label:s.$t("not_news")},null,8,["onChange","modelValue","label"]),n(m,{onChange:l.save,modelValue:e.show_date,"onUpdate:modelValue":t[2]||(t[2]=i=>e.show_date=i),label:s.$t("show_date")},null,8,["onChange","modelValue","label"]),n(v,{class:"m-5",onClick:l.save},{default:V(()=>[f(p(s.$t("save")),1)]),_:1},8,["onClick"]),n(v,{class:"m-5",onClick:l.delete_content},{default:V(()=>[f(p(s.$t("delete")),1)]),_:1},8,["onClick"]),n(v,{class:"m-5",onClick:l.share_fb},{default:V(()=>[f(p(s.$t("fb_share")),1)]),_:1},8,["onClick"])]),u("div",null,[n(N,{onChange:l.file_upload,modelValue:e.file_link,"onUpdate:modelValue":t[3]||(t[3]=i=>e.file_link=i),accept:"image/*",label:s.$t("fileupload")},null,8,["onChange","modelValue","label"]),f(" "+p(s.$t("preview"))+" ",1),u("div",F,[u("div",I,[u("div",M,[u("img",{class:"h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out",src:e.img,alt:"content"},null,8,H)])])])]),u("div",null,[n(m,{onChange:l.save,modelValue:e.srb_flag,"onUpdate:modelValue":t[4]||(t[4]=i=>e.srb_flag=i),label:s.$t("srb")},null,8,["onChange","modelValue","label"]),e.srb_flag?(b(),c("div",T,[n(w,{onChange:l.save,modelValue:e.title_rs,"onUpdate:modelValue":t[5]||(t[5]=i=>e.title_rs=i),counter:100,label:s.$t("srb_title"),"hide-details":""},null,8,["onChange","modelValue","label"]),n(k,{modelValue:e.content_rs,"onUpdate:modelValue":t[6]||(t[6]=i=>e.content_rs=i)},null,8,["modelValue"]),_("",!0)])):_("",!0)]),u("div",null,[n(m,{modelValue:e.hun_flag,"onUpdate:modelValue":t[8]||(t[8]=i=>e.hun_flag=i),onChange:l.save,label:s.$t("hu")},null,8,["modelValue","onChange","label"]),e.hun_flag?(b(),c("div",G,[n(w,{modelValue:e.title_hu,"onUpdate:modelValue":t[9]||(t[9]=i=>e.title_hu=i),counter:100,onChange:l.save,label:s.$t("hu_title"),"hide-details":""},null,8,["modelValue","onChange","label"]),n(k,{modelValue:e.content_hu,"onUpdate:modelValue":t[10]||(t[10]=i=>e.content_hu=i)},null,8,["modelValue"]),_("",!0)])):_("",!0)]),u("div",null,[n(m,{modelValue:e.en_flag,"onUpdate:modelValue":t[12]||(t[12]=i=>e.en_flag=i),onChange:l.save,label:s.$t("en")},null,8,["modelValue","onChange","label"]),e.en_flag?(b(),c("div",J,[n(w,{modelValue:e.title_en,"onUpdate:modelValue":t[13]||(t[13]=i=>e.title_en=i),counter:100,onChange:l.save,label:s.$t("en_title"),"hide-details":""},null,8,["modelValue","onChange","label"]),n(k,{modelValue:e.content_en,"onUpdate:modelValue":t[14]||(t[14]=i=>e.content_en=i)},null,8,["modelValue"]),_("",!0)])):_("",!0)]),n(w,{modelValue:e.yt_video,"onUpdate:modelValue":t[16]||(t[16]=i=>e.yt_video=i),counter:100,onChange:l.save,label:s.$t("yt_video"),"hide-details":""},null,8,["modelValue","onChange","label"]),u("div",null,[n(m,{modelValue:e.documents_flag,"onUpdate:modelValue":t[17]||(t[17]=i=>e.documents_flag=i),onChange:l.documents_load,label:s.$t("documents_flag")},null,8,["modelValue","onChange","label"]),e.documents_flag?(b(),c("div",K,[_("",!0),n(E,{_id:e.id},null,8,["_id"])])):_("",!0)]),u("div",null,[n(m,{modelValue:e.album_flag,"onUpdate:modelValue":t[19]||(t[19]=i=>e.album_flag=i),onChange:l.save,label:s.$t("album_flag")},null,8,["modelValue","onChange","label"]),e.album_flag?(b(),c("div",O,[n(v,{class:"m-5",onClick:l.gallery_change},{default:V(()=>[f(p(s.$t("create_a_new_album")),1)]),_:1},8,["onClick"]),n(S,{items:e.galleries,modelValue:e.gallery_id,"onUpdate:modelValue":[t[20]||(t[20]=i=>e.gallery_id=i),l.g_save],label:s.$t("gallery"),"item-value":"id","item-text":"title"},null,8,["items","modelValue","label","onUpdate:modelValue"]),e._update?(b(),c("div",P,[n(B,{caption:!1,id:e.gallery_id},null,8,["id"])])):_("",!0)])):_("",!0)])])}const $=q(z,[["render",R]]);export{$ as default};
