import{k as b,u as i,A as p,b as r,D as h,d as a,Q as u,I as L,B as V,E as D,_ as U,r as w,c as g,a as s,t as l,G as $,H as f,J as y,h as v,w as q,o as m,j as C}from"./index-VDzj_Zsj.js";const B={name:"Login",data(){return{animation_backgound:!1,user_name:"",uid:""}},setup(){const e=b(""),t=b("");return{email:e,password:t}},mounted(){const e=i();document.title=this.$t("login"),this.checklogin(),e.isLoggedin&&this.get_user_settings(),console.log("login")},methods:{async checklogin(){const e=i();e.setUserLoggedin(!1);const t=new p(r);try{const o=await t.get();console.log(o),e.setUserLoggedin(!0)}catch{e.setUserLoggedin(!1)}},async get_user_settings(){const e=i(),t=new h(r);let o=await t.listDocuments(a.website_db,a.users_settings,[u.equal("uid",e.uid),u.equal("setting","animation")]);o.total!=0?(this.animation_backgound=o.documents[0].value,e.setAnimation(this.animation_backgound)):await t.createDocument(a.website_db,a.users_settings,L.unique(),{uid:this.uid,setting:"animation",value:!0})},async set_user_setting(){const e=i(),t=new h(r);let o=await t.listDocuments(a.website_db,a.users_settings,[u.equal("uid",e.uid),u.equal("setting","animation"),u.select(["$id"])]);await t.updateDocument(a.website_db,a.users_settings,o.documents[0].$id,{value:this.animation_backgound}),e.setAnimation(this.animation_backgound)},login_by_app(){const e=V.createEmailSession(this.email,this.password),t=i();e.then(o=>{console.log(o),this.$notify(this.$t("success")),i().setUserLoggedin(!0),console.log(o),t.setuid(o.userId)},o=>{this.$notify(this.$t("login_failure")),console.log(o)})},async logout(){i().setUserLoggedin(!1),await new p(r).deleteSession("current"),console.warn("logout"),D.push("/home")},animation_setting(){}},computed:{isLoggedin(){return i().userLoggedin}}},A={class:""},S={key:0},j={class:"font-[sans-serif]"},E={class:"min-h-screen flex flex-col items-center justify-center px-4 bg-white/60"},I={class:"max-w-md w-full"},N={class:"p-8 rounded-2xl shadow"},z={class:"text-gray-800 text-center text-2xl font-bold"},M={class:"text-gray-800 text-sm mb-2 block"},Q={class:"relative flex items-center"},T=["placeholder"],G={class:"text-gray-800 text-sm mb-2 block"},H={class:"relative flex items-center"},J=["placeholder"],F=s("div",{class:"flex flex-wrap items-center justify-between gap-4"},[s("div",{class:"flex items-center"}),s("div",{class:"text-sm"})],-1),K={class:"!mt-8"},O={key:1,class:"w-1/2 h-full m-auto p-40"};function P(e,t,o,d,_,c){const x=w("v-switch"),k=w("VBtn");return m(),g("div",A,[c.isLoggedin?(m(),g("div",O,[s("h1",null,l(e.$t("Account page")),1),s("h2",null,l(e.$t("welcome"))+" "+l()+" !",1),s("div",null,[v(x,{onChange:c.set_user_setting,modelValue:_.animation_backgound,"onUpdate:modelValue":t[4]||(t[4]=n=>_.animation_backgound=n),label:e.$t("disable_animation_background")},null,8,["onChange","modelValue","label"])]),v(k,{onClick:c.logout},{default:q(()=>[C(l(e.$t("logout")),1)]),_:1},8,["onClick"])])):(m(),g("div",S,[s("div",j,[s("div",E,[s("div",I,[s("div",N,[s("h2",z,l(e.$t("login")),1),s("form",{onSubmit:t[3]||(t[3]=$((...n)=>c.login_by_app&&c.login_by_app(...n),["prevent"])),class:"mt-8 space-y-4"},[s("div",null,[s("label",M,l(e.$t("email")),1),s("div",Q,[f(s("input",{"onUpdate:modelValue":t[0]||(t[0]=n=>d.email=n),name:"email",type:"text",required:"",class:"w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600",placeholder:e.$t("email")},null,8,T),[[y,d.email,void 0,{lazy:!0}]])])]),s("div",null,[s("label",G,l(e.$t("password")),1),s("div",H,[f(s("input",{"onUpdate:modelValue":t[1]||(t[1]=n=>d.password=n),name:"password",type:"password",required:"",class:"w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600",placeholder:e.$t("password")},null,8,J),[[y,d.password,void 0,{lazy:!0}]])])]),F,s("div",K,[s("button",{type:"submit",onClick:t[2]||(t[2]=(...n)=>c.login_by_app&&c.login_by_app(...n)),class:"w-full py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"},l(e.$t("login")),1)])],32)])])])])]))])}const W=U(B,[["render",P]]);export{W as default};
