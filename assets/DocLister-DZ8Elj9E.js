import{_ as y,u as r,D as _,b as h,d,Q as D,e as $,I as v,r as l,c as S,i as m,x as L,w as n,h as N,k as B,o as f,a as p,j as g,t as x}from"./index-GppQd-LD.js";import{m as c}from"./moment-with-locales-C-P3pzYs.js";const C={data(){return{headers:[],colDefs:[],documents:[],admin:!1}},props:{_id:String},mounted(){this.headers=[{title:this.$t("name"),align:"start",sortable:!1,key:"name",width:"200px"},{title:this.$t("date"),align:"start",key:"date",width:"300px"},{title:this.$t("open_document"),align:"start",key:"open",width:"300px"}];const o=r();this.admin=o.userLoggedin,this.admin&&(this.headers.push({title:this.$t("edit_document"),align:"start",key:"edit",width:"300px"}),this.colDefs.push({field:"edit",headerName:this.$t("edit_message"),sortable:!0,filter:!0})),this.synchronize_documents()},methods:{async synchronize_documents(){const o=new _(h);this.doc_loaded=!1,this.documents=[];let a=r().language;await(await o.listDocuments(d.website_db,d.text_documents,[D.equal("texts",this._id)])).documents.forEach(async t=>{let e={name:"",contact:"",img:"",id:"",doc_id:"",date:""};e.id=t.$id,a=="en"||a=="hu"?(e.name=t.document_title_hu,e.contact=t.contact):(a=="rs"||a=="sr")&&(e.name=$(t.document_title_rs),e.contact=t.contact),e.id=t.$id,e.doc_id=t.document_id,e.date=t.$createdAt,this.documents.push(e)})},async new_stuff(){const s=await new _(h).createDocument(d.website_db,d.text_documents,v.unique(),{texts:this._id});this.$router.push("/admin/text-document-editor/"+s.$id)},rt_time(o){let a=r().language;return a=="rs"||a=="sr"?c.locale("sr"):a=="hu"?c.locale("hu"):a=="en"&&c.locale("en"),c(o).format("LLL")}}},V={class:"m-auto w-full"};function q(o,s,a,b,t,e){const u=l("router-link"),w=l("v-data-table"),k=l("v-btn");return f(),S("div",V,[m(w,{height:"400",headers:t.headers,items:t.documents},L({"item.date":n(({item:i})=>[g(x(e.rt_time(i.date)),1)]),"item.open":n(({item:i})=>[m(u,{to:"/document/"+i.doc_id},{default:n(()=>s[1]||(s[1]=[p("i",{class:"pi pi-book text-5xl"},null,-1)])),_:2},1032,["to"])]),bottom:n(()=>[]),_:2},[t.admin?{name:"item.edit",fn:n(({item:i})=>[m(u,{to:"/admin/text-document-editor/"+i.id},{default:n(()=>s[2]||(s[2]=[p("i",{class:"pi pi-cloud-upload text-5xl"},null,-1)])),_:2},1032,["to"])]),key:"0"}:void 0]),1032,["headers","items"]),t.admin?(f(),N(k,{key:0,onClick:s[0]||(s[0]=i=>e.new_stuff()),class:"m-5"},{default:n(()=>[g(x(o.$t("add_new_document_in_that_category")),1)]),_:1})):B("",!0)])}const I=y(C,[["render",q]]);export{I as D};
