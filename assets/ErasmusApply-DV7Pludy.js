import{m as S,p as q,u as d,S as _,b as r,D as v,d as a,I as p,_ as x,r as n,c,a as u,i,w as f,N as U,t as b,o as g,j as D}from"./index-GppQd-LD.js";const F={components:{Swiper:S,SwiperSlide:q},data(){return{erasmus_applied:!1,chtml:"",gallery:[],title:"",img_cnt:3,loaded:!1,author:"Admin",date:"",newsmode:!1,video_id:"",video_link:"",edumode:!1,admin:!1,name:"",email:"",phone:"",which_class:"",born_year:null,file_motivation_letter:null,link_motivation_letter:null,file_positive_document:null,link_positive_document:null,erasmus_apply_on:!1,isFormValid:!1,mark:null,accept_law:!1,items:[]}},mounted(){const l=d();this.erasmus_applied=l.erasmus_apply,this.admin=l.userLoggedin,new _(r),document.title=this.$t("erasmus_apply"),this.getErasmusSettings()},methods:{async submit(){await new v(r).createDocument(a.website_db,a.erasmus_applies,p.unique(),{name:this.name,email:this.email,age:this.born_year,class:this.which_class,phone:this.phone,mark:this.mark_avg,link_motivation_letter:this.link_motivation_letter,link_other_document:this.link_positive_document}),this.$notify(this.$t("apply_saved")),d().setErasmusAppliedSetting(!0),this.erasmus_applied=!0},age(){return new Date().getFullYear()-this.born_year},async upload_positive_document(){if(!this.file_positive_document){console.warn("no file");return}this.$notify(this.$t("file_upload_in_progress")),console.log("file_upload");const e=await new _(r).createFile(a.fs_erasmus,p.unique(),this.file_positive_document);this.link_positive_document=await e.$id,this.$notify(this.$t("file_uploaded"))},async upload_motivation_letter(){if(!this.file_motivation_letter){console.warn("no file");return}this.$notify(this.$t("file_upload_in_progress")),console.log("file_upload");const e=await new _(r).createFile(a.fs_erasmus,p.unique(),this.file_motivation_letter);this.link_motivation_letter=await e.$id,this.$notify(this.$t("file_uploaded"))},async getErasmusSettings(){d();const l=new v(r);let e;e=await l.getDocument(a.website_db,a.general_settings,"erasmus_apply_on"),this.erasmus_apply_on=e.setting_status}},computed:{eg_age(){return new Date().getFullYear()-16}}},E={class:"text-gray-600"},C={class:"container px-5 mx-auto backdrop-filter bg-opacity-50 dark:bg-slate-500/50 bg-gray-100 backdrop-blur-lg",style:{"min-height":"70vh"}},I={class:"lg:w-1/3 w-full mb-6 lg:mb-0"},$={id:"render_title",class:"sm:text-3xl p-3 text-2xl font-medium title-font mb-2 text-gray-100"},A={key:0,class:"pb-2 w-full dark:text-white"},N={key:1,class:"pb-2 w-full dark:text-white text-black text-center"},B={class:"sm:text-3xl p-3 text-2xl font-medium title-font mb-2"};function L(l,e,Y,j,t,m){const w=n("video-background"),s=n("v-text-field"),h=n("v-file-input"),y=n("v-checkbox"),V=n("v-btn"),k=n("v-form");return g(),c("section",E,[u("div",C,[i(w,{src:t.video_link,style:{"min-height":"200px"},class:"flex flex-wrap w-full mb-20 p-2 rounded",overlay:"linear-gradient(45deg,#2a4ae430,#0EA5E950)"},{default:f(()=>[u("div",I,[u("h1",$,b(l.$t("erasmus_apply")),1),e[10]||(e[10]=u("div",{class:"h-1 w-20 bg-sky-500/100 rounded"},null,-1))])]),_:1},8,["src"]),t.erasmus_apply_on&&!t.erasmus_applied?(g(),c("div",A,[i(k,{onSubmit:U(m.submit,["prevent"]),ref:"form",modelValue:t.isFormValid,"onUpdate:modelValue":e[9]||(e[9]=o=>t.isFormValid=o)},{default:f(()=>[i(s,{required:"",modelValue:t.name,"onUpdate:modelValue":e[0]||(e[0]=o=>t.name=o),counter:40,label:l.$t("name")},null,8,["modelValue","label"]),i(s,{required:"",modelValue:t.phone,"onUpdate:modelValue":e[1]||(e[1]=o=>t.phone=o),counter:15,label:l.$t("phone")},null,8,["modelValue","label"]),i(s,{required:"",modelValue:t.email,"onUpdate:modelValue":e[2]||(e[2]=o=>t.email=o),type:"email",label:l.$t("email")},null,8,["modelValue","label"]),i(s,{required:"",modelValue:t.born_year,"onUpdate:modelValue":e[3]||(e[3]=o=>t.born_year=o),type:"number",hint:l.$t("e.g.")+m.eg_age,label:l.$t("born_year")},null,8,["modelValue","hint","label"]),i(s,{required:"",modelValue:l.mark_avg,"onUpdate:modelValue":e[4]||(e[4]=o=>l.mark_avg=o),type:"number",hint:l.$t("e.g.")+" 5.00",label:l.$t("mark_avg")},null,8,["modelValue","hint","label"]),i(s,{required:"",modelValue:t.which_class,"onUpdate:modelValue":e[5]||(e[5]=o=>t.which_class=o),hint:l.$t("e.g.")+" III-3",label:l.$t("class")},null,8,["modelValue","hint","label"]),i(h,{required:"",onChange:m.upload_motivation_letter,modelValue:t.file_motivation_letter,"onUpdate:modelValue":e[6]||(e[6]=o=>t.file_motivation_letter=o),accept:".pdf",label:l.$t("motivation_letter")},null,8,["onChange","modelValue","label"]),i(h,{onChange:m.upload_positive_document,modelValue:t.file_positive_document,"onUpdate:modelValue":e[7]||(e[7]=o=>t.file_positive_document=o),accept:".pdf",label:l.$t("other_positive_documents")},null,8,["onChange","modelValue","label"]),i(y,{required:"",modelValue:t.accept_law,"onUpdate:modelValue":e[8]||(e[8]=o=>t.accept_law=o),label:l.$t("law_for_data_store"),color:"info"},null,8,["modelValue","label"]),i(V,{class:"me-4",type:"submit",disabled:!t.accept_law&&t.isFormValid},{default:f(()=>[D(b(l.$t("apply_for_erasmus")),1)]),_:1},8,["disabled"])]),_:1},8,["onSubmit","modelValue"])])):(g(),c("div",N,[u("h2",B,b(l.$t("applies_are_closed")),1)]))])])}const T=x(F,[["render",L]]);export{T as default};
