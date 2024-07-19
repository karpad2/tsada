import{u as g,g as f,D as b,b as h,S as x,d as a,Q as r,e as m,I as w,_ as y,c as n,a as i,t as d,h as p,F as v,f as k,l as F,o as c,k as $}from"./index-mvDuRNEt.js";const S={name:"Gallery",components:{},mounted(){document.title=this.$t("gallery");const s=g();this.load_courses_base(),this.admin=s.userLoggedin,f.fromTo(".becsuszo_kep",{opacity:0,x:"150%"},{duration:1.5,opacity:1,x:0})},data:()=>({admin:!1,courses:[{img:"https://dummyimage.com/720x400",imga:"",subtitle:"SUBTITLE",title:"First",text:"Lorem ipsum dolor sit"}]}),props:{mode:String},methods:{async load_courses_base(){this.courses=[];const s=new b(h),o=new x(h),u=g();let _;u.userLoggedin?_=await s.listDocuments(a.website_db,a.gallery,[r.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible"]),r.limit(6)]):_=await s.listDocuments(a.website_db,a.gallery,[r.equal("visible",!0),r.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible"]),r.limit(6)]);let l=u.language;_.documents.forEach(e=>{let t={title:"",subtitle:"",text:"",img:"",imga:"",en:"",id:"",visible:!1};t.id=e.$id,t.visible=e.visible,l=="en"?(t.title=e.title_en,t.subtitle=e.short_en):l=="hu"?(t.title=e.title_hu,t.subtitle=e.short_hu):(l=="rs"||l=="sr")&&(t.title=m(e.title_rs),t.subtitle=m(e.short_rs)),e.code==""||e.code==null?t.en=e.title_en:t.en=e.code,t.img=o.getFilePreview(a.gallery_pictures_storage,e.default_image,700,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,this.courses.push(t)})},isHidden(s){return!s},courseopen(s){console.log(s);let o=s.toLowerCase();o=o.replaceAll(" ",""),console.log(o),this.$router.push("/album/"+o)},async new_stuff(){const o=await new b(h).createDocument(a.website_db,a.gallery,w.unique(),{visible:!1});this.$router.push("/admin/gallery-edit/"+o.$id)}}},D={class:"text-gray-600 body-font mt-5 mb-5 h-screen",style:{"min-height":"40vh"},id:"courses"},L={class:"container px-5 mx-auto"},C={class:"flex flex-wrap w-full mb-20"},j={class:"lg:w-1/2 w-full mb-6 lg:mb-0"},z={class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},B=i("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1),T={class:"flex flex-wrap -m-4 grid-cols-3"},E={style:{"min-width":"273px","min-height":"276px"},class:"transition delay-150 bg-slate-100/80 backdrop-filter hover:bg-sky-600/60 dark:bg-slate-300/30 p-6 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"},I=i("img",{class:"size-16 m-auto rounded center object-cover object-center mb-6 transition duration-300 ease-in-out",src:F,alt:"content"},null,-1),N={class:"text-lg text-gray-900 font-medium title-font mb-4 dark:text-white"},V={class:"xl:w-1/5 md:w-1/2 sm:w-full p-4 cursor-pointer flex flex-wrap becsuszo_kep"},q=["onClick"],G=["src"],H={class:"tracking-widest text-sky-500 text-s font-medium title-font"},Q={key:0},A={class:"text-lg text-gray-900 font-medium title-font mb-4 dark:text-white"},P=["v-html"];function U(s,o,u,_,l,e){return c(),n("section",D,[i("div",L,[i("div",C,[i("div",j,[i("h1",z,d(s.$t("gallery")),1),B])]),i("div",T,[s.admin?(c(),n("div",{key:0,onClick:o[0]||(o[0]=(...t)=>e.new_stuff&&e.new_stuff(...t)),class:"xl:w-1/5 md:w-96 sm:w-full p-4 cursor-pointer becsuszo_kep"},[i("div",E,[I,i("h2",N,d(s.$t("add_new_content")),1)])])):p("",!0),(c(!0),n(v,null,k(s.courses,t=>(c(),n("div",V,[i("div",{style:{"min-width":"273px"},onClick:W=>e.courseopen(t.id),class:"transition delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60 dark:bg-slate-300/30 p-6 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]"},[i("img",{class:"h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out",src:t.img,alt:"content"},null,8,G),i("h3",H,[$(d(t.subtitle)+" ",1),e.isHidden(t.visible)?(c(),n("span",Q,d(s.$t("invisible")),1)):p("",!0)]),i("h2",A,d(t.title),1),i("p",{class:"leading-relaxed text-base","v-html":t.text},null,8,P)],8,q)]))),256))])])])}const K=y(S,[["render",U]]);export{K as default};
