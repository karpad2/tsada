if(!self.define){let s,e={};const l=(l,r)=>(l=new URL(l+".js",r).href,e[l]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()})).then((()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s})));self.define=(r,i)=>{const n=s||("document"in self?document.currentScript.src:"")||location.href;if(e[n])return;let u={};const t=s=>l(s,n),o={module:{uri:n},exports:u,require:t};e[n]=Promise.all(r.map((s=>o[s]||t(s)))).then((s=>(i(...s),u)))}}define(["./workbox-3e911b1d"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"assets/AboutView-C6Dx7pxG.css",revision:null},{url:"assets/AboutView-CPGUHp0-.js",revision:null},{url:"assets/Album-Blwrp7dK.js",revision:null},{url:"assets/Birthday-CTw0kMYS.js",revision:null},{url:"assets/ClassEditor-CzjzmaIu.js",revision:null},{url:"assets/ClassList-DQpKiRDn.js",revision:null},{url:"assets/Contact-BDTXpHbm.js",revision:null},{url:"assets/Contact-DgPfIotL.css",revision:null},{url:"assets/ContentEditor-BcftGQY1.js",revision:null},{url:"assets/DocumentEditor-BWCuW1pm.js",revision:null},{url:"assets/Documents-Cts_6U-d.js",revision:null},{url:"assets/DocViewer-_tWW4mjk.js",revision:null},{url:"assets/DocViewer-CIQnP9qd.css",revision:null},{url:"assets/EducationProfile-BaYuFYfw.js",revision:null},{url:"assets/EducationProfiles-K7_CaiBW.js",revision:null},{url:"assets/ErasmusApplies-DrglCDVM.js",revision:null},{url:"assets/ErasmusApply-ZkcUklm7.js",revision:null},{url:"assets/ErDocViewer-P96YhAmf.js",revision:null},{url:"assets/Gallery-CqjeRkvR.js",revision:null},{url:"assets/GalleryEditor-Brtrw-Kp.js",revision:null},{url:"assets/index-BnY49HUv.css",revision:null},{url:"assets/index-BpqW_Tlj.js",revision:null},{url:"assets/leaflet-src-CuHg2EX4.js",revision:null},{url:"assets/leaflet-src.esm-HdBnhJze.js",revision:null},{url:"assets/Login-C3UTXTuK.js",revision:null},{url:"assets/marker-icon-2x-D4k_ikNW.js",revision:null},{url:"assets/marker-icon-C2eJqgqv.js",revision:null},{url:"assets/marker-shadow-DU6CIJ0p.js",revision:null},{url:"assets/MDRenderer-CXn0lSj8.js",revision:null},{url:"assets/Message-_uoXPEaz.js",revision:null},{url:"assets/Messages-C3VD88YE.js",revision:null},{url:"assets/MissingPage-BhWBBw4m.js",revision:null},{url:"assets/moment-with-locales-C0hj9byS.js",revision:null},{url:"assets/Presentation-CKh7WESk.js",revision:null},{url:"assets/StudentDocumentEditor-Btpzn96z.js",revision:null},{url:"assets/StudentDocuments-C28IloVf.js",revision:null},{url:"assets/Timetable-DxSV2zbD.js",revision:null},{url:"assets/WorkerEditor-DTGD0Zum.js",revision:null},{url:"assets/Workers-B_SY1GJM.css",revision:null},{url:"assets/Workers-C-C0l5Da.js",revision:null},{url:"assets/WorkersTimetable-BoTTEJV3.js",revision:null},{url:"index.html",revision:"c81e0c844f67977304dbe589a8ae82ef"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"manifest.webmanifest",revision:"001c580521cb85910aaca3260ff4315a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
