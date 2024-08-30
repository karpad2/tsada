import{u as w,g as $,D as v,b as k,d as l,I as B,S as N,Q as D,e as S,_ as T,r as b,c as y,a as n,t as _,F as V,f as E,h as C,o as h,i as x,w as d,k as L,j as F}from"./index-BpqW_Tlj.js";import{m as p}from"./moment-with-locales-C0hj9byS.js";const I={name:"Workers",components:{},setup(){},mounted(){const s=w();this.admin=s.userLoggedin,document.title=this.$t("studentdocuments"),$.fromTo("#render_title",{opacity:0,x:"50%"},{duration:1.5,opacity:1,x:0}),this.load_workers_base(),this.headers=[{title:this.$t("name"),align:"start",sortable:!1,key:"name",width:"200px"},{title:this.$t("date"),align:"start",key:"date",width:"300px"},{title:this.$t("open_document"),align:"start",key:"open",width:"300px"}],this.admin&&(this.headers.push({title:this.$t("edit_document"),align:"start",key:"edit",width:"300px"}),this.colDefs.push({field:"edit",headerName:this.$t("edit_message"),sortable:!0,filter:!0})),$.fromTo(".popups",{opacity:0,y:"50%"},{duration:1.5,opacity:1,y:0})},data:()=>({workers:[{img:"https://dummyimage.com/720x400",name:"SUBTITLE",role:"First",contact:"Lorem ipsum dolor sit"}],roles:[],colDefs:[],loaded:!1,headers:[],admin:!1}),methods:{rt_time(s){let e=w().language;return e=="rs"||e=="sr"?p.locale("sr"):e=="hu"?p.locale("hu"):e=="en"&&p.locale("en"),p(s).format("LLL")},async new_stuff(s){const e=await new v(k).createDocument(l.website_db,l.st_documents,B.unique(),{stDocumentCategories:s});this.$router.push("/admin/studentdocument/"+e.$id)},async load_workers_base(){const s=w();this.workers=[],this.roles=[];const c=new v(k);new N(k);let e=s.language,f=await c.listDocuments(l.website_db,l.st_document_categories,[D.orderAsc("listasorrend")]);for(let u=0;u<f.documents.length;u++){let i=f.documents[u],m=[],g=await c.listDocuments(l.website_db,l.st_documents,[D.equal("stDocumentCategories",[i.$id])]),r="";e=="en"?r=i.category_name_en:e=="hu"?r=i.category_name_hu:(e=="rs"||e=="sr")&&(r=S(i.category_name_rs)),await g.documents.forEach(async t=>{let a={name:"",contact:"",img:"",id:"",doc_id:"",date:""};a.id=t.$id,e=="en"||e=="hu"?(a.name=t.document_title_hu,a.contact=t.contact):(e=="rs"||e=="sr")&&(a.name=S(t.document_title_rs),a.contact=t.contact),t.worker_img==""||t.worker_img==null,a.id=t.$id,a.doc_id=t.document_id,a.date=t.$createdAt,m.push(a)});let o={role:"",workers:[],id:""};o.id=i.$id,o.role=r,o.workers=m,this.roles.push(o)}console.log(this.roles),this.loaded=!0},onReady(s){console.log("onReady")}}},q={class:"text-gray-600 min-h-screen"},A={class:"container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30"},Q={class:"flex flex-wrap w-full mb-20"},R={class:"lg:w-1/3 w-full mb-6 lg:mb-0"},W={id:"render_title",class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},j=n("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1),U={class:"sm:text-2xl text-sm font-medium mb-3 text-gray-900 dark:text-white"},z=n("i",{class:"pi pi-book text-5xl"},null,-1),G=n("i",{class:"pi pi-cloud-upload text-5xl"},null,-1);function H(s,c,e,f,u,i){const m=b("router-link"),g=b("v-data-table"),r=b("v-btn");return h(),y("section",q,[n("div",A,[n("div",Q,[n("div",R,[n("h1",W,_(s.$t("studentdocuments")),1),j])]),s.loaded?(h(!0),y(V,{key:0},E(s.roles,o=>(h(),y("div",{class:"m-auto w-full popups",key:o.role},[n("h1",U,_(o.role),1),x(g,{height:"400",headers:s.headers,items:o.workers},{"item.date":d(({item:t})=>[L(_(i.rt_time(t.date)),1)]),"item.open":d(({item:t})=>[x(m,{to:"/document/"+t.doc_id},{default:d(()=>[z]),_:2},1032,["to"])]),"item.edit":d(({item:t})=>[x(m,{to:"/admin/studentdocument/"+t.id},{default:d(()=>[G]),_:2},1032,["to"])]),bottom:d(()=>[]),_:2},1032,["headers","items"]),s.admin?(h(),F(r,{key:0,onClick:t=>i.new_stuff(o.id),class:"m-5"},{default:d(()=>[L(_(s.$t("add_new_document_in_that_category")),1)]),_:2},1032,["onClick"])):C("",!0)]))),128)):C("",!0)])])}const M=T(I,[["render",H]]);export{M as default};
