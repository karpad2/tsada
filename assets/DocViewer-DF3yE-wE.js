import{_ as t,q as a,S as l,b as r,d as i,c as n,a as c,o as d}from"./index-CAZ1nnMG.js";const f={components:{},data(){return{pdf_file:"https://example.com/sample.pdf",loading:!0,config:{toolbar:{toolbarViewerLeft:{previous:!1}},pdf_link:null,numOfPages:a(0)}}},mounted(){console.log("started loading docviewer"),console.log(this.$route.params.id),this.loadpdf()},methods:{async loadpdf(){let e=await new l(r).getFileView(i.documents_storage,this.$route.params.id);this.pdf_file=e.href,console.log(this.pdf_file),console.log(e),this.loading=!1}}},p={class:"w-3/4 m-auto pb-8",style:{height:"100vh"}},_=["src"];function m(o,e,u,g,s,h){return d(),n("div",p,[c("iframe",{class:"h-full w-full",src:s.pdf_file},null,8,_)])}const $=t(f,[["render",m]]);export{$ as default};
