import{u as w,g as S,D as p,b as g,S as b,d as a,Q as F,e as C,_ as B,r as y,c,a as r,t as h,k,i as _,w as f,o as m,j as x,F as L,f as V}from"./index-CAZ1nnMG.js";const D={name:"SlideModules",components:{},mounted(){const e=w();this.admin=e.userLoggedin,this.load_courses_base(),S.fromTo(".becsuszo_kep",{opacity:0,x:"150%"},{duration:1.5,opacity:1,x:0})},data:()=>({admin:!1,images:[],showed:[],title:"",options_for_image_viewer:{title:!1},courses:[{img:"https://dummyimage.com/720x400",imga:"",subtitle:"SUBTITLE",title:"First",text:"Lorem ipsum dolor sit"}]}),props:{mode:String,caption:Boolean,id:String},methods:{async load_courses_base(){this.courses=[],this.images=[];const e=new p(g),s=new b(g),d=w();let o;o=await e.getDocument(a.website_db,a.gallery,this.id,[F.select(["title_hu","title_en","title_rs"])]);let i=d.language;i=="en"?this.title=o.title_en:i=="hu"?this.title=o.title_hu:(i=="rs"||i=="sr")&&(this.title=C(o.title_rs)),document.title=this.title;let t=await e.listDocuments(a.website_db,a.album_images,[F.equal("gallery",this.id)]);for(const l of t.documents){let n={img:"",id:""};n.img=await s.getFilePreview(a.gallery_pictures_storage,l.image_id,968,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,n.id=l.image_id,await s.getFilePreview(a.gallery_pictures_storage,l.image_id,700,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,this.courses.push({img:n.img,id:l.$id}),this.images.push(n.img)}},isHidden(e){return!e},editmode(){this.$router.push("/admin/gallery-edit/"+this.id)},loaded(e){this.showed.push(e)},async deletebrokenimages(){const e=this.images.filter(s=>!this.showed.includes(s));for(const s of e){const d=new b(g),o=new p(g),i=this.courses.find(t=>t.img===s);if(i&&i.id)try{await o.deleteDocument(a.website_db,a.album_images,i.id),await d.deleteFile(a.gallery_pictures_storage,i.id),this.images=this.images.filter(t=>t!==s),this.courses=this.courses.filter(t=>t.id!==i.id)}catch(t){console.error("Failed to delete broken image: ",t)}}}}},I={class:"text-gray-600 body-font p-5",id:"courses",style:{"min-height":"70vh"}},$={class:"container px-5 mx-auto"},N={key:0,class:"flex flex-wrap w-full mb-20"},T={class:"lg:w-1/3 w-full mb-6 lg:mb-0"},j={class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},A={key:1,class:"mb-5 mt-5"},E=["onLoad","src"];function P(e,s,d,o,i,t){const l=y("VBtn"),n=y("viewer");return m(),c("section",I,[r("div",$,[d.caption?(m(),c("div",N,[r("div",T,[r("h1",j,h(e.title),1),s[0]||(s[0]=r("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1))])])):k("",!0),e.admin?(m(),c("div",A,[_(l,{class:"m-5",onClick:t.editmode},{default:f(()=>[x(h(e.$t("edit_gallery")),1)]),_:1},8,["onClick"]),_(l,{class:"m-5",onClick:t.deletebrokenimages},{default:f(()=>[x(h(e.$t("delete_broken_images")),1)]),_:1},8,["onClick"])])):k("",!0),s[1]||(s[1]=r("div",{class:"flex flex-wrap -m-4"},null,-1)),_(n,{images:e.images,onInited:e.inited,class:"flex flex-wrap flex-row",ref:"viewer",options:e.options_for_image_viewer},{default:f(v=>[(m(!0),c(L,null,V(v.images,u=>(m(),c("div",{key:u,class:"card card-compact cursor-pointer glass m-3 w-full sm:w-1/5 md:w-1/5 lg:w-1/5 transition delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl"},[r("figure",null,[r("img",{onLoad:Q=>t.loaded(u),style:{height:"272px"},class:"object-contain",src:u},null,40,E)])]))),128))]),_:1},8,["images","onInited","options"])])])}const z=B(D,[["render",P]]);export{z as A};