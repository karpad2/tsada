import{_ as g,q as x,v as y,s as w,y as k,C as v,x as C,z as b,r as s,c as z,a as t,h as n,w as l,t as e,i as U,g as i,o as r}from"./index-VDzj_Zsj.js";const B={components:{LMap:x,LTileLayer:y,LMarker:w,LPopup:k,ContactUsPlugin:v,ContactUs:C},props:{showContactUs:{type:Boolean,default:!0}},mounted(){this.contact=b},data(){return{zoom:17,contact:{}}}},L={class:"text-gray-600 body-font relative"},P={class:"container px-5 py-24 mx-auto flex sm:flex-nowrap flex-wrap"},M={class:"w-full bg-gray-300 rounded-lg overflow-hidden sm:mr-10 p-10 flex items-end justify-start relative m-5"},N={class:"bg-white relative flex flex-wrap py-6 rounded shadow-md"},V={class:"lg:w-1/2 px-6"},S={class:"title-font font-semibold text-gray-900 tracking-widest text-xs"},j={class:"mt-1"},q={class:"lg:w-1/2 px-6 mt-4 lg:mt-0"},D={class:"title-font font-semibold text-gray-900 tracking-widest text-xs"},E=["href"],O={class:"title-font font-semibold text-gray-900 tracking-widest text-xs mt-4"},T={class:"leading-relaxed"};function A(a,c,p,F,o,G){const m=s("l-tile-layer"),d=s("l-popup"),_=s("l-marker"),f=s("l-map"),h=s("ContactUsPlugin");return s("ContactUs"),r(),z("section",L,[t("div",P,[t("div",M,[n(f,{class:"sm:hidden md:block absolute inset-0 h-250",ref:"map",style:{filter:"grayscale(1) contrast(1.5) opacity(0.4)","min-height":"250px","min-width":"300px"},"use-global-leaflet":!1,zoom:o.zoom,"onUpdate:zoom":c[0]||(c[0]=u=>o.zoom=u),center:[45.790699127440185,20.12923110967009]},{default:l(()=>[n(m,{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png","layer-type":"base",name:"OpenStreetMap"}),n(_,{"lat-lng":[45.790699127440185,20.12923110967009]},{default:l(()=>[n(d,null,{default:l(()=>[t("p",null,e(a.$t("school_name")),1)]),_:1})]),_:1})]),_:1},8,["zoom"]),t("div",N,[t("div",V,[t("h2",S,e(a.$t("address")),1),t("p",j,e(o.contact.address)+", "+e(o.contact.city)+" "+e(o.contact.country),1)]),t("div",q,[t("h2",D,e(a.$t("email")),1),t("a",{href:"mailto:"+o.contact.email,class:"text-sky-500 leading-relaxed"},e(o.contact.email),9,E),t("h2",O,e(a.$t("phone")),1),t("p",T,e(o.contact.phone1),1)])])]),p.showContactUs?(r(),U(h,{key:0,class:"m-5"})):i("",!0),i("",!0)])])}const I=g(B,[["render",A]]);export{I as default};
