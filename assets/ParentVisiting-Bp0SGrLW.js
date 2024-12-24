import{L as p,u as h,D as b,b as u,S as w,d as g,Q as m,e as y,_ as k,r as _,c as f,a as l,t as x,i as v,w as $,h as I,o as d}from"./index-CAZ1nnMG.js";const L={name:"PClassList",components:{Loading:p},mounted(){this.headers=[{title:this.$t("name"),align:"start",sortable:!1,key:"chief",width:"200px"},{title:this.$t("class"),align:"start",key:"_class",width:"300px"},{title:this.$t("classroom_chief_receiving_hour"),align:"start",key:"receiving_hour",width:"300px"}],document.title=this.$t("parentsvisiting");const e=h();this.load_courses_base(),this.admin=e.userLoggedin},data:()=>({admin:!1,classes:[],headers:[],loaded:!1}),props:{mode:String},methods:{async load_courses_base(){this.classes=[];const e=new b(u);new w(u);const s=h();let a;a=await e.listDocuments(g.website_db,g.classlist,[m.orderAsc("year"),m.orderAsc("designation")]);let n=s.language;for(let o=0;o<a.total;o++){let t={year:1,designation:"",role:"",chief:"",imga:"",language:"",id:"",receiving_hour:"",_class:""};console.log(a.documents[o]),t.id=a.documents[o].$id,t.designation=a.documents[o].designation,t.language=a.documents[o].language,t.year=a.documents[o].year,t.receiving_hour=a.documents[o].receiving_hour;let i=null;t._class=this.class_designation(t.year,t.designation);try{i=a.documents[o].workers}catch(r){console.log(r)}let c=null;try{c=a.documents[o].courses}catch(r){console.log(r)}try{n=="rs"||n=="sr"?t.chief=y(i.worker_name_rs):(n=="hu"||n=="en")&&(t.chief=i.worker_name_hu)}catch(r){console.log(r)}this.classes.push(t)}console.log(this.classes),this.loaded=!0},isHidden(e){return!e},class_designation(e,s){return`${this.roman_number(e)}-${s}`},roman_number(e){let s="Hiba";return e==1?s="I":e==2?s="II":e==3?s="III":e==4&&(s="IV"),s}}},S={class:"text-gray-600 body-font mt-5 mb-5 min-h-screen",id:"courses"},B={key:0,class:"container px-5 mx-auto"},D={class:"flex flex-wrap w-full mb-20"},V={class:"lg:w-1/2 w-full mb-6 lg:mb-0"},C={class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"};function A(e,s,a,n,o,t){const i=_("v-data-table"),c=_("Loading");return d(),f("section",S,[e.loaded?(d(),f("div",B,[l("div",D,[l("div",V,[l("h1",C,x(e.$t("parentsvisiting")),1),s[0]||(s[0]=l("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1))])]),v(i,{height:"400",headers:e.headers,items:e.classes,"items-per-page":-1},{bottom:$(()=>s[1]||(s[1]=[])),_:1},8,["headers","items"])])):(d(),I(c,{key:1}))])}const N=k(L,[["render",A]]);export{N as default};
