import{u,g as y,D as v,b as g,S as k,d as a,Q as p,e as S,_ as B,r as h,o,c as r,a as t,t as f,h as w,i as b,w as x,k as V,F as C,f as L,L as D,j as $,M as N}from"./index-Bqutj4x2.js";const T={name:"SlideModules",components:{},mounted(){const e=u();this.load_courses_base(),this.admin=e.userLoggedin,y.fromTo(".becsuszo_kep",{opacity:0,x:"150%"},{duration:1.5,opacity:1,x:0})},data:()=>({admin:!1,images:[],title:"",options_for_image_viewer:{title:!1},courses:[{img:"https://dummyimage.com/720x400",imga:"",subtitle:"SUBTITLE",title:"First",text:"Lorem ipsum dolor sit"}]}),props:{mode:String,caption:Boolean,id:String},methods:{async load_courses_base(){this.courses=[],this.images=[];const e=new v(g),c=new k(g),l=u();let s;this._id,s=await e.getDocument(a.website_db,a.gallery,this.id,[p.select(["title_hu","title_en","title_rs"])]);let i=l.language;i=="en"?this.title=s.title_en:i=="hu"?this.title=s.title_hu:(i=="rs"||i=="sr")&&(this.title=S(s.title_rs)),document.title=this.title,(await e.listDocuments(a.website_db,a.album_images,[p.equal("gallery",this.id)])).documents.forEach(async d=>{let n={img:""};n.img=await c.getFilePreview(a.gallery_pictures_storage,d.image_id,700,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,await c.getFilePreview(a.gallery_pictures_storage,d.image_id,700,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,this.courses.push(n),this.images.push(n.img)})},isHidden(e){return!e},editmode(){this.$router.push("/admin/gallery-edit/"+this.id)}}},E={class:"text-gray-600 body-font p-5",id:"courses",style:{"min-height":"70vh"}},I={class:"container px-5 mx-auto"},j={key:0,class:"flex flex-wrap w-full mb-20"},z={class:"lg:w-1/3 w-full mb-6 lg:mb-0"},A={class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},M=t("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1),P={key:1},Q=t("div",{class:"flex flex-wrap -m-4"},null,-1),q={style:{"min-width":"273px"},class:"align-middle transition items-center delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60 dark:bg-slate-300/30 p-6 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"},H=["src"];function R(e,c,l,s,i,_){const d=h("VBtn"),n=h("viewer");return o(),r("section",E,[t("div",I,[l.caption?(o(),r("div",j,[t("div",z,[t("h1",A,f(e.title),1),M])])):w("",!0),e.admin?(o(),r("p",P,[b(d,{onClick:_.editmode},{default:x(()=>[V(f(e.$t("edit")),1)]),_:1},8,["onClick"])])):w("",!0),Q,b(n,{images:e.images,onInited:e.inited,class:"flex flex-wrap flex-row",ref:"viewer",options:e.options_for_image_viewer},{default:x(F=>[(o(!0),r(C,null,L(F.images,m=>(o(),r("div",{key:m,class:"xl:w-1/5 md:w-1/2 sm:w-full p-4 cursor-pointer becsuszo_kep"},[t("div",q,[t("img",{style:{height:"272px"},class:"object-contain",src:m},null,8,H)])]))),128))]),_:1},8,["images","onInited","options"])])])}const U=B(T,[["render",R]]),G={__name:"Album",setup(e){let l=D().params.id;return(s,i)=>(o(),$(U,{caption:!0,id:N(l)},null,8,["id"]))}};export{G as default};