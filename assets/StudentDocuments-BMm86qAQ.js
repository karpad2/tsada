import{u as w,g as $,D as v,b as k,d as c,I as B,S as N,Q as D,e as S,_ as T,r as b,c as y,a as d,t as _,F as V,f as E,k as C,o as h,i as x,w as r,j as L,h as F}from"./index-CAZ1nnMG.js";import{m as p}from"./moment-with-locales-y75CGwaZ.js";const I={name:"Workers",components:{},setup(){},mounted(){const s=w();this.admin=s.userLoggedin,document.title=this.$t("studentdocuments"),$.fromTo("#render_title",{opacity:0,x:"50%"},{duration:1.5,opacity:1,x:0}),this.load_workers_base(),this.headers=[{title:this.$t("name"),align:"start",sortable:!1,key:"name",width:"200px"},{title:this.$t("date"),align:"start",key:"date",width:"300px"},{title:this.$t("open_document"),align:"start",key:"open",width:"300px"}],this.admin&&(this.headers.push({title:this.$t("edit_document"),align:"start",key:"edit",width:"300px"}),this.colDefs.push({field:"edit",headerName:this.$t("edit_message"),sortable:!0,filter:!0})),$.fromTo(".popups",{opacity:0,y:"50%"},{duration:1.5,opacity:1,y:0})},data:()=>({workers:[{img:"https://dummyimage.com/720x400",name:"SUBTITLE",role:"First",contact:"Lorem ipsum dolor sit"}],roles:[],colDefs:[],loaded:!1,headers:[],admin:!1}),methods:{rt_time(s){let e=w().language;return e=="rs"||e=="sr"?p.locale("sr"):e=="hu"?p.locale("hu"):e=="en"&&p.locale("en"),p(s).format("LLL")},async new_stuff(s){const e=await new v(k).createDocument(c.website_db,c.st_documents,B.unique(),{stDocumentCategories:s});this.$router.push("/admin/studentdocument/"+e.$id)},async load_workers_base(){const s=w();this.workers=[],this.roles=[];const o=new v(k);new N(k);let e=s.language,f=await o.listDocuments(c.website_db,c.st_document_categories,[D.orderAsc("listasorrend")]);for(let u=0;u<f.documents.length;u++){let n=f.documents[u],m=[],g=await o.listDocuments(c.website_db,c.st_documents,[D.equal("stDocumentCategories",[n.$id])]),l="";e=="en"?l=n.category_name_en:e=="hu"?l=n.category_name_hu:(e=="rs"||e=="sr")&&(l=S(n.category_name_rs)),await g.documents.forEach(async t=>{let i={name:"",contact:"",img:"",id:"",doc_id:"",date:""};i.id=t.$id,e=="en"||e=="hu"?(i.name=t.document_title_hu,i.contact=t.contact):(e=="rs"||e=="sr")&&(i.name=S(t.document_title_rs),i.contact=t.contact),t.worker_img==""||t.worker_img==null,i.id=t.$id,i.doc_id=t.document_id,i.date=t.$createdAt,m.push(i)});let a={role:"",workers:[],id:""};a.id=n.$id,a.role=l,a.workers=m,this.roles.push(a)}console.log(this.roles),this.loaded=!0},onReady(s){console.log("onReady")}}},q={class:"text-gray-600 min-h-screen"},A={class:"container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30"},Q={class:"flex flex-wrap w-full mb-20"},R={class:"lg:w-1/3 w-full mb-6 lg:mb-0"},W={id:"render_title",class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},j={class:"sm:text-2xl text-sm font-medium mb-3 text-gray-900 dark:text-white"};function U(s,o,e,f,u,n){const m=b("router-link"),g=b("v-data-table"),l=b("v-btn");return h(),y("section",q,[d("div",A,[d("div",Q,[d("div",R,[d("h1",W,_(s.$t("studentdocuments")),1),o[0]||(o[0]=d("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1))])]),s.loaded?(h(!0),y(V,{key:0},E(s.roles,a=>(h(),y("div",{class:"m-auto w-full popups",key:a.role},[d("h1",j,_(a.role),1),x(g,{height:"400",headers:s.headers,items:a.workers},{"item.date":r(({item:t})=>[L(_(n.rt_time(t.date)),1)]),"item.open":r(({item:t})=>[x(m,{to:"/document/"+t.doc_id},{default:r(()=>o[1]||(o[1]=[d("i",{class:"pi pi-book text-5xl"},null,-1)])),_:2},1032,["to"])]),"item.edit":r(({item:t})=>[x(m,{to:"/admin/studentdocument/"+t.id},{default:r(()=>o[2]||(o[2]=[d("i",{class:"pi pi-cloud-upload text-5xl"},null,-1)])),_:2},1032,["to"])]),bottom:r(()=>o[3]||(o[3]=[])),_:2},1032,["headers","items"]),s.admin?(h(),F(l,{key:0,onClick:t=>n.new_stuff(a.id),class:"m-5"},{default:r(()=>[L(_(s.$t("add_new_document_in_that_category")),1)]),_:2},1032,["onClick"])):C("",!0)]))),128)):C("",!0)])])}const H=T(I,[["render",U]]);export{H as default};
