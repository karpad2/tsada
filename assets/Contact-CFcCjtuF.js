import{_ as x,x as g,y,z as w,B as k,C,E as v,G as b,r as s,c as z,a as t,i as n,w as l,t as e,h as U,k as i,o as r}from"./index-CExocia-.js";const B={components:{LMap:g,LTileLayer:y,LMarker:w,LPopup:k,ContactUsPlugin:C,ContactUs:v},props:{showContactUs:{type:Boolean,default:!0}},mounted(){this.contact=b},data(){return{zoom:17,contact:{}}}},L={class:"text-gray-600 body-font relative"},P={class:"container px-5 py-24 mx-auto flex sm:flex-nowrap flex-wrap"},M={class:"w-full bg-gray-300 rounded-lg overflow-hidden sm:mr-10 p-10 flex items-end justify-start relative m-5"},N={class:"bg-white relative flex flex-wrap py-6 rounded shadow-md"},V={class:"lg:w-1/2 px-6"},E={class:"title-font font-semibold text-gray-900 tracking-widest text-xs"},S={class:"mt-1"},j={class:"lg:w-1/2 px-6 mt-4 lg:mt-0"},D={class:"title-font font-semibold text-gray-900 tracking-widest text-xs"},G=["href"],O={class:"title-font font-semibold text-gray-900 tracking-widest text-xs mt-4"},T={class:"leading-relaxed"};function q(a,c,p,A,o,F){const m=s("l-tile-layer"),d=s("l-popup"),_=s("l-marker"),f=s("l-map"),h=s("ContactUsPlugin");return s("ContactUs"),r(),z("section",L,[t("div",P,[t("div",M,[n(f,{class:"sm:hidden md:block absolute inset-0 h-250",ref:"map",style:{filter:"grayscale(1) contrast(1.5) opacity(0.4)","min-height":"250px","min-width":"300px"},"use-global-leaflet":!1,zoom:o.zoom,"onUpdate:zoom":c[0]||(c[0]=u=>o.zoom=u),center:[45.790699127440185,20.12923110967009]},{default:l(()=>[n(m,{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png","layer-type":"base",name:"OpenStreetMap"}),n(_,{"lat-lng":[45.790699127440185,20.12923110967009]},{default:l(()=>[n(d,null,{default:l(()=>[t("p",null,e(a.$t("school_name")),1)]),_:1})]),_:1})]),_:1},8,["zoom"]),t("div",N,[t("div",V,[t("h2",E,e(a.$t("address")),1),t("p",S,e(o.contact.address)+", "+e(o.contact.city)+" "+e(o.contact.country),1)]),t("div",j,[t("h2",D,e(a.$t("email")),1),t("a",{href:"mailto:"+o.contact.email,class:"text-sky-500 leading-relaxed"},e(o.contact.email),9,G),t("h2",O,e(a.$t("phone")),1),t("p",T,e(o.contact.phone1),1)])])]),p.showContactUs?(r(),U(h,{key:0,class:"m-5"})):i("",!0),i("",!0)])])}const I=x(B,[["render",q]]);export{I as default};
