import{m as v,p as k,u,S as b,b as c,d as n,g as $,D as w,e as p,Q as S,_ as D,r as f,c as E,a as t,i as m,w as a,t as h,o as L,j as V}from"./index-Bj2XD3rw.js";import{m as _}from"./moment-with-locales-BAc6geXb.js";const z={components:{Swiper:v,SwiperSlide:k},data(){return{chtml:"",gallery:[],title:"",img_cnt:3,loaded:!1,author:"Admin",date:"",newsmode:!1,video_id:"",video_link:"",edumode:!1,admin:!1,documents:[],headers:[],doc_loaded:!1}},mounted(){this.headers=[{title:this.$t("name"),align:"start",sortable:!1,key:"name",width:"200px"},{title:this.$t("date"),align:"start",key:"date",width:"300px"},{title:this.$t("open_document"),align:"start",key:"open",width:"300px"}];const i=u();this.admin=i.userLoggedin,this.admin&&this.headers.push({title:this.$t("edit_document"),align:"start",key:"edit",width:"300px"});let l="659d5e6949ae7294f9f1";const e=new b(c);this.video_link=e.getFileView(n.website_images,l).href,$.fromTo("#render_title",{opacity:0,x:"150%"},{duration:1.5,opacity:1,x:0}),this.synchronize_documents()},methods:{async getMD(){const i=new w(c);new b(c);const l=u();let e=await i.getDocument(n.website_db,n.about_us_db,this.$route.params.id);l.language=="sr"||l.language=="rs"?(this.title=p(e.title_rs),this.chtml=e.text_rs,document.title=p(e.title_rs)):l.language=="hu"?(this.title=e.title_hu,this.chtml=e.text_hu,document.title=e.title_hu):l.language=="en"?(this.title=e.title_en,this.chtml=e.text_en,document.title=e.title_en):console.warn("reading error"),e.gallery,console.log(e.gallery),this.video_id=e.video;let d="659d5e6949ae7294f9f1";this.video_id=d,console.log(this.video_link),this.video_link=n.default_video,this.loaded=!0},async synchronize_documents(){const i=new w(c);this.doc_loaded=!1,this.documents=[];let e=u().language,d=await i.listDocuments(n.website_db,n.text_documents,[S.equal("texts","timetable")]);console.log(d),await d.documents.forEach(async s=>{let o={name:"",contact:"",img:"",id:"",doc_id:"",date:""};try{o.id=s.$id}catch(g){console.log(g)}e=="en"||e=="hu"?(o.name=s.document_title_hu,o.contact=s.contact):(e=="rs"||e=="sr")&&(o.name=p(s.document_title_rs),o.contact=s.contact),o.id=s.$id,o.doc_id=s.document_id,o.date=s.$createdAt,this.documents.push(o)}),this.doc_loaded=!0},rt_time(i){let e=u().language;return e=="rs"||e=="sr"?_.locale("sr"):e=="hu"?_.locale("hu"):e=="en"&&_.locale("en"),_(i).format("LL")},editmode(){this.$router.push("/admin/edit/"+this.$route.params.mode+"/"+this.$route.params.id)}}},A={class:"text-gray-600 min-h-screen"},B={class:"container px-5 mx-auto backdrop-filter bg-opacity-50 dark:bg-slate-500/50 bg-gray-100 backdrop-blur-lg",style:{"min-height":"70vh"}},C={class:"lg:w-1/3 w-full mb-6 lg:mb-0"},N={id:"render_title",class:"sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100"},T={class:"pb-2 w-full"},Q={class:"table table-zebra mx-auto"},j={style:{width:"200px"},class:"text-left text-xl dark:text-white"},q={style:{width:"200px"},class:"text-left text-xl dark:text-white"};function F(i,l,e,d,s,o){const g=f("video-background"),x=f("router-link"),y=f("v-data-table");return L(),E("section",A,[t("div",B,[m(g,{src:s.video_link,style:{"min-height":"200px"},class:"flex flex-wrap w-full mb-20 p-2 rounded",overlay:"linear-gradient(45deg,#2a4ae430,#0EA5E950)"},{default:a(()=>[t("div",C,[t("h1",N,h(i.$t("timetable")),1),l[0]||(l[0]=t("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1))])]),_:1},8,["src"]),t("div",T,[t("table",Q,[t("thead",null,[t("tr",null,[t("th",j,h(i.$t("morning")),1),t("th",q,h(i.$t("afternoon")),1)])]),l[1]||(l[1]=t("tbody",null,[t("tr",null,[t("td",null,"1. 6:40-7:25"),t("td",null,"1. 13:15-14:00")]),t("tr",null,[t("td",null,"2. 7:30-8:15"),t("td",null,"2. 14:05-14:50")]),t("tr",null,[t("td",null,"3. 8:20-9:05"),t("td",null,"3. 14:55-15:40")]),t("tr",null,[t("td",null,"4. 9:20-10:05"),t("td",null,"4. 15:55-16:35")]),t("tr",null,[t("td",null,"5. 10:10-10:55"),t("td",null,"5. 16:40-17:20")]),t("tr",null,[t("td",null,"6. 11:00-11:40"),t("td",null,"6. 17:25-18:05")]),t("tr",null,[t("td",null,"7. 11:45-12:25"),t("td",null,"7. 18:10-18:50")]),t("tr",null,[t("td",null,"8. 12:30-13:10"),t("td",null,"8. 18:55-19:35")])],-1))])]),m(y,{height:"400",headers:s.headers,items:s.documents},{"item.open":a(({item:r})=>[m(x,{to:"/document/"+r.doc_id},{default:a(()=>l[2]||(l[2]=[t("i",{class:"pi pi-book text-5xl"},null,-1)])),_:2},1032,["to"])]),"item.date":a(({item:r})=>[V(h(o.rt_time(r.date)),1)]),"item.edit":a(({item:r})=>[m(x,{to:"/admin/text-document-editor/"+r.id},{default:a(()=>l[3]||(l[3]=[t("i",{class:"pi pi-cloud-upload text-5xl"},null,-1)])),_:2},1032,["to"])]),bottom:a(()=>l[4]||(l[4]=[])),_:1},8,["headers","items"])])])}const G=D(z,[["render",F]]);export{G as default};
