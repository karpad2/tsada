import{u as m,g as p,D as g,b as h,S as w,d as o,Q as r,e as b,I as x,_ as y,c as n,a as i,t as c,k as f,F as v,f as k,l as F,o as d,j as $}from"./index-gJPdk6Gh.js";const S={name:"Gallery",components:{},mounted(){document.title=this.$t("gallery");const s=m();this.load_courses_base(),this.admin=s.userLoggedin,p.fromTo(".becsuszo_kep",{opacity:0,x:"150%"},{duration:1.5,opacity:1,x:0})},data:()=>({admin:!1,courses:[{img:"https://dummyimage.com/720x400",imga:"",subtitle:"SUBTITLE",title:"First",text:"Lorem ipsum dolor sit"}]}),props:{mode:String},methods:{async load_courses_base(){this.courses=[];const s=new g(h),a=new w(h),_=m();let u;_.userLoggedin?u=await s.listDocuments(o.website_db,o.gallery,[r.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible"]),r.limit(25)]):u=await s.listDocuments(o.website_db,o.gallery,[r.equal("visible",!0),r.select(["title_hu","title_en","title_rs","short_en","short_hu","short_rs","$id","default_image","visible"]),r.limit(25)]);let l=_.language;u.documents.forEach(e=>{let t={title:"",subtitle:"",text:"",img:"",imga:"",en:"",id:"",visible:!1};t.id=e.$id,t.visible=e.visible,l=="en"?(t.title=e.title_en,t.subtitle=e.short_en):l=="hu"?(t.title=e.title_hu,t.subtitle=e.short_hu):(l=="rs"||l=="sr")&&(t.title=b(e.title_rs),t.subtitle=b(e.short_rs)),e.code==""||e.code==null?t.en=e.title_en:t.en=e.code,t.img=a.getFilePreview(o.gallery_pictures_storage,e.default_image,700,0,"center",90,5,"FFFFFF",15,1,0,"FFFFFF","webp").href,this.courses.push(t)})},isHidden(s){return!s},courseopen(s){console.log(s);let a=s.toLowerCase();a=a.replaceAll(" ",""),console.log(a),this.$router.push("/album/"+a)},async new_stuff(){const a=await new g(h).createDocument(o.website_db,o.gallery,x.unique(),{visible:!1});this.$router.push("/admin/gallery-edit/"+a.$id)}}},D={class:"text-gray-600 body-font p-5 min-h-screen",id:"courses"},L={class:"container px-5 mx-auto"},C={class:"flex flex-wrap w-full mb-20"},j={class:"lg:w-1/2 w-full mb-6 lg:mb-0"},B={class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},T=i("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1),E={class:"flex flex-wrap -m-4 grid-cols-3"},I=i("figure",{class:"h-40"},[i("img",{class:"size-16 m-auto rounded center object-cover object-center mb-6 transition duration-300 ease-in-out",src:F,alt:"content"})],-1),N={class:"card-body"},V={class:"text-lg text-gray-900 font-medium title-font mb-4 dark:text-white"},q=["onClick"],z=["src"],G={class:"card-body"},H={class:"tracking-widest text-sky-500 text-s font-medium title-font"},Q={key:0},A={class:"text-lg text-gray-900 font-medium title-font mb-4 dark:text-white"},P=["v-html"];function U(s,a,_,u,l,e){return d(),n("section",D,[i("div",L,[i("div",C,[i("div",j,[i("h1",B,c(s.$t("gallery")),1),T])]),i("div",E,[s.admin?(d(),n("div",{key:0,onClick:a[0]||(a[0]=(...t)=>e.new_stuff&&e.new_stuff(...t)),style:{"min-width":"273px","min-height":"276px"},class:"card card-compact cursor-pointer glass m-3 w-full sm:w-1/5 md:w-1/5 lg:w-1/5 transition delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl"},[I,i("div",N,[i("h2",V,c(s.$t("add_new_content")),1)])])):f("",!0),(d(!0),n(v,null,k(s.courses,t=>(d(),n("div",{onClick:W=>e.courseopen(t.id),class:"card card-compact cursor-pointer glass m-3 w-full sm:w-1/5 md:w-1/5 lg:w-1/5 transition delay-150 bg-slate-100/30 backdrop-filter hover:bg-sky-400/60 dark:bg-slate-300/30 shadow-xl"},[i("figure",null,[i("img",{class:"h-40 rounded w-full object-cover object-center mb-6 transition duration-300 ease-in-out",src:t.img,alt:"content"},null,8,z)]),i("div",G,[i("h3",H,[$(c(t.subtitle)+" ",1),e.isHidden(t.visible)?(d(),n("span",Q,c(s.$t("invisible")),1)):f("",!0)]),i("h2",A,c(t.title),1),i("p",{class:"leading-relaxed text-base","v-html":t.text},null,8,P)])],8,q))),256))])])])}const K=y(S,[["render",U]]);export{K as default};
