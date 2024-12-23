import{L as N,u as D,g as S,D as $,b as p,d as n,I as T,S as A,Q as g,e as q,_ as E,r as x,c as w,a as m,t as f,F as V,f as F,i as b,h as L,w as l,k as B,o as _,j as k}from"./index-BfJHO_zn.js";import{m as C}from"./moment-with-locales-oJukZN0N.js";const I={name:"Workers",components:{Loading:N},setup(){},mounted(){const a=D();this.admin=a.userLoggedin,document.title=this.$t("documents"),S.fromTo("#render_title",{opacity:0,x:"50%"},{duration:1.5,opacity:1,x:0}),this.load_workers_base(),this.headers=[{title:this.$t("name"),align:"start",sortable:!1,key:"name",width:"200px"},{title:this.$t("date"),align:"start",key:"date",width:"300px"},{title:this.$t("open_document"),align:"start",key:"open",width:"300px"}],this.admin&&(this.headers.push({title:this.$t("edit_document"),align:"start",key:"edit",width:"300px"}),this.colDefs.push({field:"edit",headerName:this.$t("edit_message"),sortable:!0,filter:!0})),S.fromTo(".popups",{opacity:0,y:"50%"},{duration:1.5,opacity:1,y:0})},data:()=>({workers:[{img:"https://dummyimage.com/720x400",name:"SUBTITLE",role:"First",contact:"Lorem ipsum dolor sit"}],roles:[],colDefs:[],loaded:!1,headers:[],admin:!1,archived:!1}),methods:{rt_time(a){let t=D().language;return t=="rs"||t=="sr"?C.locale("sr"):t=="hu"?C.locale("hu"):t=="en"&&C.locale("en"),C(a).format("LLL")},async new_stuff(a){const t=await new $(p).createDocument(n.website_db,n.documents_db,T.unique(),{documentCategories:a});this.$router.push("/admin/document/"+t.$id)},async archive_stuff(a){const t=await new $(p).updateDocument(n.website_db,n.document_categories_db,a,{archived:!0});yapping(t),this.load_workers_base()},async restore_stuff(a){const t=await new $(p).updateDocument(n.website_db,n.document_categories_db,a,{archived:!1});yapping(t),this.load_workers_base()},async open_archive(){this.archived=!0,this.load_workers_base()},async load_workers_base(){this.loaded=!1;const a=D();this.workers=[],this.roles=[];const i=new $(p);new A(p);let t=a.language,y,v;y=await i.listDocuments(n.website_db,n.document_categories_db,[g.orderAsc("listasorrend"),g.equal("archived",!1)]),this.archived&&(v=await i.listDocuments(n.website_db,n.document_categories_db,[g.orderAsc("listasorrend"),g.equal("archived",!0)]));for(let r=0;r<y.documents.length;r++){let d=y.documents[r],h=[],u=await i.listDocuments(n.website_db,n.documents_db,[g.equal("documentCategories",[d.$id])]),c="";t=="en"?c=d.category_name_en:t=="hu"?c=d.category_name_hu:(t=="rs"||t=="sr")&&(c=d.category_name_rs),await u.documents.forEach(async e=>{let o={name:"",contact:"",img:"",id:"",doc_id:"",date:""};o.id=e.$id,t=="en"||t=="hu"?(o.name=e.document_title_hu,o.contact=e.contact):(t=="rs"||t=="sr")&&(o.name=e.document_title_rs,o.contact=e.contact),e.worker_img==""||e.worker_img==null,o.id=e.$id,o.doc_id=e.document_id,o.date=e.$createdAt,h.push(o)});let s={role:"",workers:[],id:"",archived:!1};s.id=d.$id,s.role=c,s.archived=d.archived,s.workers=h,this.roles.push(s)}if(this.archived)for(let r=0;r<v.documents.length;r++){let d=v.documents[r],h=[],u=await i.listDocuments(n.website_db,n.documents_db,[g.equal("documentCategories",[d.$id])]),c="";t=="en"?c=d.category_name_en:t=="hu"?c=d.category_name_hu:(t=="rs"||t=="sr")&&(c=q(d.category_name_rs)),c+=` ~ ${this.$t("archived")}`,await u.documents.forEach(async e=>{let o={name:"",contact:"",img:"",id:"",doc_id:"",date:""};o.id=e.$id,t=="en"||t=="hu"?(o.name=e.document_title_hu,o.contact=e.contact):(t=="rs"||t=="sr")&&(o.name=q(e.document_title_rs),o.contact=e.contact),e.worker_img==""||e.worker_img==null,o.id=e.$id,o.doc_id=e.document_id,o.date=e.$createdAt,h.push(o)});let s={role:"",workers:[],id:"",archived:!1};s.id=d.$id,s.role=c,s.archived=d.archived,s.workers=h,this.roles.push(s)}yapping(this.roles),this.loaded=!0},onReady(a){yapping("onReady")}}},z={class:"text-gray-600 min-h-screen"},Q={class:"container px-5 py-20 mx-auto bg-slate-100/30 dark:bg-slate-300/30"},R={class:"flex flex-wrap w-full mb-20"},W={class:"lg:w-1/3 w-full mb-6 lg:mb-0"},j={id:"render_title",class:"sm:text-3xl text-2xl font-medium title-font mb-2 text-gray-900 dark:text-white"},U={class:"sm:text-2xl text-sm font-medium mb-3 text-gray-900 dark:text-white"},G={key:0},H={key:1};function J(a,i,t,y,v,r){const d=x("router-link"),h=x("v-data-table"),u=x("v-btn"),c=x("Loading");return _(),w("section",z,[m("div",Q,[m("div",R,[m("div",W,[m("h1",j,f(a.$t("documents")),1),i[0]||(i[0]=m("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1))])]),a.loaded?(_(!0),w(V,{key:0},F(a.roles,s=>(_(),w("div",{class:"m-auto w-full popups",key:s.role},[m("h1",U,f(s.role),1),b(h,{height:"400",headers:a.headers,items:s.workers,"items-per-page":-1},{"item.date":l(({item:e})=>[k(f(r.rt_time(e.date)),1)]),"item.open":l(({item:e})=>[b(d,{to:"/document/"+e.doc_id},{default:l(()=>i[1]||(i[1]=[m("i",{class:"pi pi-book icon_size"},null,-1)])),_:2},1032,["to"])]),"item.edit":l(({item:e})=>[b(d,{to:"/admin/document/"+e.id},{default:l(()=>i[2]||(i[2]=[m("i",{class:"pi pi-cloud-upload icon_size"},null,-1)])),_:2},1032,["to"])]),bottom:l(()=>i[3]||(i[3]=[])),_:2},1032,["headers","items"]),a.admin?(_(),w("div",G,[b(u,{onClick:e=>r.new_stuff(s.id),class:"m-5"},{default:l(()=>[k(f(a.$t("add_new_document_in_that_category")),1)]),_:2},1032,["onClick"]),s.archived?(_(),L(u,{key:1,onClick:e=>r.restore_stuff(s.id),class:"m-5"},{default:l(()=>[k(f(a.$t("restore")),1)]),_:2},1032,["onClick"])):(_(),L(u,{key:0,onClick:e=>r.archive_stuff(s.id),class:"m-5"},{default:l(()=>[k(f(a.$t("archive_category")),1)]),_:2},1032,["onClick"]))])):B("",!0)]))),128)):(_(),w("div",H,[b(c)])),m("div",null,[a.loaded&&!a.archived?(_(),L(u,{key:0,onClick:r.open_archive,class:"m-5"},{default:l(()=>[k(f(a.$t("show_archive")),1)]),_:1},8,["onClick"])):B("",!0)])])])}const O=E(I,[["render",J]]);export{O as default};
