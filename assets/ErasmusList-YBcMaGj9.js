import{u as p,g as w,D as x,b as y,S as $,d as u,Q as b,_ as S,r as L,c as g,a as r,t as k,F as v,f as D,k as B,o as f,i as C,w as E}from"./index-Cb7Q3wCk.js";import{m as h}from"./moment-with-locales-CcfNu94n.js";const T={name:"Workers",components:{},setup(){},mounted(){const e=p();this.admin=e.userLoggedin,document.title=this.$t("erasmus_applies_result"),w.fromTo("#render_title",{opacity:0,x:"50%"},{duration:1.5,opacity:1,x:0}),this.load_workers_base(),this.headers=[{title:this.$t("name"),align:"start",sortable:!1,key:"name",width:"200px"},{title:this.$t("class"),align:"start",key:"_class",width:"300px"},{title:this.$t("score"),align:"start",key:"score",width:"300px"}],w.fromTo(".popups",{opacity:0,y:"50%"},{duration:1.5,opacity:1,y:0})},data:()=>({workers:[{img:"https://dummyimage.com/720x400",name:"SUBTITLE",role:"First",contact:"Lorem ipsum dolor sit"}],roles:[],colDefs:[],loaded:!1,headers:[],admin:!1}),methods:{rt_time(e){let s=p().language;return s=="rs"||s=="sr"?h.locale("sr"):s=="hu"?h.locale("hu"):s=="en"&&h.locale("en"),h(e).format("LLL")},async load_workers_base(){const e=p();this.workers=[],this.roles=[];const l=new x(y);new $(y);let s=e.language,_=await l.listDocuments(u.website_db,u.erasmus_location,[b.orderDesc("location_hu")]);for(let n=0;n<_.documents.length;n++){let a=_.documents[n],d=[],i=await l.listDocuments(u.website_db,u.erasmus_applies,[b.equal("erasmusLocation",[a.$id])]),c="";s=="en"||s=="hu"?c=a.location_hu:(s=="rs"||s=="sr")&&(c=a.location_rs),await i.documents.forEach(async o=>{let t={name:"",score:"",_class:""};t.id=o.$id,t.name=o.name,t._class=o.class,t.score=o.score,t.id=o.$id,t.date=o.$createdAt,d.push(t)});let m={role:"",workers:[],id:""};m.id=a.$id,m.role=c,m.workers=d,this.roles.push(m)}console.log(this.roles),this.loaded=!0},onReady(e){console.log("onReady")}}},F={class:"text-gray-600 min-h-screen"},N={class:"container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30"},V={class:"flex flex-wrap w-full mb-20"},Q={class:"w-full mb-6 lg:mb-0"},R={id:"render_title",class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},W=r("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1),q={class:"sm:text-2xl text-sm font-medium mb-3 text-gray-900 dark:text-white"};function A(e,l,s,_,n,a){const d=L("v-data-table");return f(),g("section",F,[r("div",N,[r("div",V,[r("div",Q,[r("h1",R,k(e.$t("erasmus_applies_result")),1),W])]),e.loaded?(f(!0),g(v,{key:0},D(e.roles,i=>(f(),g("div",{class:"m-auto w-full popups",key:i.role},[r("h1",q,k(i.role),1),C(d,{height:"400",headers:e.headers,items:i.workers,"items-per-page":-1},{bottom:E(()=>[]),_:2},1032,["headers","items"])]))),128)):B("",!0)])])}const j=S(T,[["render",A]]);export{j as default};