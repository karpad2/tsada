if(!self.define){let s,e={};const l=(l,i)=>(l=new URL(l+".js",i).href,e[l]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()})).then((()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s})));self.define=(i,r)=>{const n=s||("document"in self?document.currentScript.src:"")||location.href;if(e[n])return;let u={};const t=s=>l(s,n),o={module:{uri:n},exports:u,require:t};e[n]=Promise.all(i.map((s=>o[s]||t(s)))).then((s=>(r(...s),u)))}}define(["./workbox-3e911b1d"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"assets/AboutView-C6Dx7pxG.css",revision:null},{url:"assets/AboutView-CvTNbJBJ.js",revision:null},{url:"assets/Album-C55sSXvj.js",revision:null},{url:"assets/AlbumViewer-CIx7_ZlN.js",revision:null},{url:"assets/Birthday-C_ZQVtVh.js",revision:null},{url:"assets/ClassEditor-BfVHiVgx.js",revision:null},{url:"assets/ClassList-BCg1Z0mm.js",revision:null},{url:"assets/Contact-DgPfIotL.css",revision:null},{url:"assets/Contact-Kobm8KRp.js",revision:null},{url:"assets/ContentEditor-CTTy_ovd.js",revision:null},{url:"assets/DocumentEditor-CLF7Z8R4.js",revision:null},{url:"assets/Documents-DYVyigX6.js",revision:null},{url:"assets/DocViewer-CIQnP9qd.css",revision:null},{url:"assets/DocViewer-CxJFDO1Z.js",revision:null},{url:"assets/EducationProfile-BiZRZsH1.js",revision:null},{url:"assets/EducationProfiles-DK1ThrEg.js",revision:null},{url:"assets/ErasmusApplies-xFPO1siJ.js",revision:null},{url:"assets/ErasmusApply-BOHjyt1K.js",revision:null},{url:"assets/ErasmusApplyEdit-DXfV6a4c.js",revision:null},{url:"assets/ErasmusList-BYcEuDGO.js",revision:null},{url:"assets/ErDocViewer-C3VZAbRv.js",revision:null},{url:"assets/Gallery-Dt38CCOx.js",revision:null},{url:"assets/GalleryEditor-C32Jj_Jx.js",revision:null},{url:"assets/index-CLdBBsh4.js",revision:null},{url:"assets/index-DLIzYZmY.css",revision:null},{url:"assets/index.es-D_CcerRv.js",revision:null},{url:"assets/leaflet-src-DmcjYpr1.js",revision:null},{url:"assets/leaflet-src.esm-HdBnhJze.js",revision:null},{url:"assets/Login-Dyf54q4x.js",revision:null},{url:"assets/marker-icon-2x-D4k_ikNW.js",revision:null},{url:"assets/marker-icon-C2eJqgqv.js",revision:null},{url:"assets/marker-shadow-DU6CIJ0p.js",revision:null},{url:"assets/MDRenderer-DVSM7sHi.js",revision:null},{url:"assets/Message-B8KIXMOP.js",revision:null},{url:"assets/Messages-CZbKQoSM.js",revision:null},{url:"assets/MissingPage-DzPYUHHy.js",revision:null},{url:"assets/moment-with-locales-DOtI4qHN.js",revision:null},{url:"assets/ParentVisiting-Dg0FY-y0.js",revision:null},{url:"assets/Presentation-CKR-1iUv.js",revision:null},{url:"assets/purify.es-DGIRlouP.js",revision:null},{url:"assets/StudentDocumentEditor-DmiVoUBr.js",revision:null},{url:"assets/StudentDocuments-cnkOHbAJ.js",revision:null},{url:"assets/TextDocumentEditor-BElTSCGZ.js",revision:null},{url:"assets/Timetable-Cu_D4p_H.js",revision:null},{url:"assets/WorkerEditor-D5wxcBfM.js",revision:null},{url:"assets/Workers-BzyF0qcJ.css",revision:null},{url:"assets/Workers-D8nyShy3.js",revision:null},{url:"assets/WorkersTimetable-B_SY1GJM.css",revision:null},{url:"assets/WorkersTimetable-Ch7PyRBb.js",revision:null},{url:"index.html",revision:"e141c8e4183834d53827a920cd286b92"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"manifest.webmanifest",revision:"001c580521cb85910aaca3260ff4315a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
