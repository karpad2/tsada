import{D as u,b as i,S as h,u as f,d as n,Q as v,_ as w,r as d,c as V,a as s,i as l,w as r,h as $,o as k,k as c,t as _}from"./index-BpqW_Tlj.js";const D={data(){return{name_hu:"",email:"",contact:"",message:"",default_img_link:"",file_link:null,img:""}},components:{},mounted(){this.getMD()},methods:{async getMD(){const e=new u(i);new h(i),f();let t=await e.listDocuments(n.website_db,n.mess_coll,[v.equal("$id",this.$route.params.id)]);this.name=t.documents[0].name,this.email=t.documents[0].email,this.message=t.documents[0].message},async delete_content(){await new u(i).deleteDocument(n.website_db,n.mess_coll,this.$route.params.id),this.$notify(this.$t("deleted")),this.$router.push("/admin/messages")}}},x={class:"relative mb-4 container px-5 mx-auto bg-white"},y=s("div",{class:"flex flex-wrap -m-4"},null,-1),C={class:"relative mb-4 container px-10"},B=["innerHTML"];function M(e,t,N,S,o,p){const b=d("v-btn"),g=d("VBtn"),m=d("v-text-field");return k(),V("div",x,[s("div",null,[l(b,{onClick:p.delete_content,class:"m-5"},{default:r(()=>[c(_(e.$t("delete")),1)]),_:1},8,["onClick"]),l(g,{onClick:t[0]||(t[0]=a=>e.$router.go(-1)),class:"m-5"},{default:r(()=>[c(_(e.$t("goback")),1)]),_:1}),$("",!0)]),s("div",null,[y,s("div",C,[s("div",null,[l(m,{disabled:"",modelValue:e.name,"onUpdate:modelValue":t[2]||(t[2]=a=>e.name=a),counter:100,label:e.$t("name"),"hide-details":""},null,8,["modelValue","label"])]),s("div",null,[l(m,{disabled:"",modelValue:o.email,"onUpdate:modelValue":t[3]||(t[3]=a=>o.email=a),counter:100,label:e.$t("email"),"hide-details":""},null,8,["modelValue","label"])]),s("div",{style:{"min-height":"300px"},class:"bg-slate-100",innerHTML:o.message},null,8,B)])])])}const T=w(D,[["render",M]]);export{T as default};