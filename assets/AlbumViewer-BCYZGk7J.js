import{u as g,g as y,D as v,b as u,S as k,d as s,Q as h,e as S,_ as B,r as p,c as l,a as t,t as f,h as w,i as b,w as F,o as n,k as V,F as C,f as D}from"./index-BYL3mT12.js";const L={name:"SlideModules",components:{},mounted(){const e=g();this.load_courses_base(),this.admin=e.userLoggedin,y.fromTo(".becsuszo_kep",{opacity:0,x:"150%"},{duration:1.5,opacity:1,x:0})},data:()=>({admin:!1,images:[],title:"",options_for_image_viewer:{title:!1},courses:[{img:"https://dummyimage.com/720x400",imga:"",subtitle:"SUBTITLE",title:"First",text:"Lorem ipsum dolor sit"}]}),props:{mode:String,caption:Boolean,id:String},methods:{async load_courses_base(){this.courses=[],this.images=[];const e=new v(u),d=new k(u),c=g();let i;this._id,i=await e.getDocument(s.website_db,s.gallery,this.id,[h.select(["title_hu","title_en","title_rs"])]);let a=c.language;a=="en"?this.title=i.title_en:a=="hu"?this.title=i.title_hu:(a=="rs"||a=="sr")&&(this.title=S(i.title_rs)),document.title=this.title,(await e.listDocuments(s.website_db,s.album_images,[h.equal("gallery",this.id)])).documents.forEach(async r=>{let o={img:""};o.img=await d.getFilePreview(s.gallery_pictures_storage,r.image_id,700,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,await d.getFilePreview(s.gallery_pictures_storage,r.image_id,700,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,this.courses.push(o),this.images.push(o.img)})},isHidden(e){return!e},editmode(){this.$router.push("/admin/gallery-edit/"+this.id)}}},N={class:"text-gray-600 body-font p-5",id:"courses",style:{"min-height":"70vh"}},T={class:"container px-5 mx-auto"},$={key:0,class:"flex flex-wrap w-full mb-20"},E={class:"lg:w-1/3 w-full mb-6 lg:mb-0"},I={class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},z=t("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1),A={key:1,class:"mb-5 mt-5"},P=t("div",{class:"flex flex-wrap -m-4"},null,-1),Q={style:{"min-width":"273px"},class:"align-middle transition items-center delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60 dark:bg-slate-300/30 p-6 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"},j=["src"];function q(e,d,c,i,a,m){const r=p("VBtn"),o=p("viewer");return n(),l("section",N,[t("div",T,[c.caption?(n(),l("div",$,[t("div",E,[t("h1",I,f(e.title),1),z])])):w("",!0),e.admin?(n(),l("div",A,[b(r,{onClick:m.editmode},{default:F(()=>[V(f(e.$t("edit_gallery")),1)]),_:1},8,["onClick"])])):w("",!0),P,b(o,{images:e.images,onInited:e.inited,class:"flex flex-wrap flex-row",ref:"viewer",options:e.options_for_image_viewer},{default:F(x=>[(n(!0),l(C,null,D(x.images,_=>(n(),l("div",{key:_,class:"xl:w-1/5 md:w-1/2 sm:w-full p-4 cursor-pointer becsuszo_kep"},[t("div",Q,[t("img",{style:{height:"272px"},class:"object-contain",src:_},null,8,j)])]))),128))]),_:1},8,["images","onInited","options"])])])}const M=B(L,[["render",q]]);export{M as A};