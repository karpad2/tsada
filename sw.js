if(!self.define){let s,e={};const l=(l,r)=>(l=new URL(l+".js",r).href,e[l]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()})).then((()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s})));self.define=(r,i)=>{const n=s||("document"in self?document.currentScript.src:"")||location.href;if(e[n])return;let u={};const t=s=>l(s,n),o={module:{uri:n},exports:u,require:t};e[n]=Promise.all(r.map((s=>o[s]||t(s)))).then((s=>(i(...s),u)))}}define(["./workbox-3e911b1d"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"assets/AboutView-C6Dx7pxG.css",revision:null},{url:"assets/AboutView-DToQipdo.js",revision:null},{url:"assets/Album-1RRAY2WY.js",revision:null},{url:"assets/AlbumViewer-BTnNuPaD.js",revision:null},{url:"assets/Birthday-e30qNyTa.js",revision:null},{url:"assets/ClassEditor-CJ6bTIM1.js",revision:null},{url:"assets/ClassList-Cf7O1hIb.js",revision:null},{url:"assets/Contact-DgPfIotL.css",revision:null},{url:"assets/Contact-tJK6VllO.js",revision:null},{url:"assets/ContentEditor-CrmfsCzi.js",revision:null},{url:"assets/DocumentEditor-BuktkeNa.js",revision:null},{url:"assets/Documents-iu8sNirt.js",revision:null},{url:"assets/DocViewer-CIQnP9qd.css",revision:null},{url:"assets/DocViewer-shChpm3c.js",revision:null},{url:"assets/EducationProfile-B4V2xcq3.js",revision:null},{url:"assets/EducationProfiles-B9KcQ-B9.js",revision:null},{url:"assets/ErasmusApplies-D209G4hZ.js",revision:null},{url:"assets/ErasmusApply-LrqoyWM8.js",revision:null},{url:"assets/ErasmusApplyEdit-BAFV_nz0.js",revision:null},{url:"assets/ErasmusList-D1HRDiIl.js",revision:null},{url:"assets/ErDocViewer-CIznp6-Y.js",revision:null},{url:"assets/Gallery-D-5_F5ZZ.js",revision:null},{url:"assets/GalleryEditor-fvgX_69q.js",revision:null},{url:"assets/index-B3lBaLLu.js",revision:null},{url:"assets/index-Df2elAfM.css",revision:null},{url:"assets/leaflet-src-BfAyHOT_.js",revision:null},{url:"assets/leaflet-src.esm-HdBnhJze.js",revision:null},{url:"assets/Login-CkVk1sXc.js",revision:null},{url:"assets/marker-icon-2x-D4k_ikNW.js",revision:null},{url:"assets/marker-icon-C2eJqgqv.js",revision:null},{url:"assets/marker-shadow-DU6CIJ0p.js",revision:null},{url:"assets/MDRenderer-D22rJNKe.js",revision:null},{url:"assets/Message-CvnbNAq3.js",revision:null},{url:"assets/Messages-Djz6eai2.js",revision:null},{url:"assets/MissingPage-B8jUrWRu.js",revision:null},{url:"assets/moment-with-locales-Cp1x5ChN.js",revision:null},{url:"assets/ParentVisiting-Drrju7Qe.js",revision:null},{url:"assets/Presentation-Bt2zyz2y.js",revision:null},{url:"assets/StudentDocumentEditor-PykavxN5.js",revision:null},{url:"assets/StudentDocuments-BMpBmt2e.js",revision:null},{url:"assets/TextDocumentEditor-Cz8YPeWe.js",revision:null},{url:"assets/Timetable-Cr8tuv83.js",revision:null},{url:"assets/WorkerEditor-DixmTIMp.js",revision:null},{url:"assets/Workers-B_SY1GJM.css",revision:null},{url:"assets/Workers-BUWfs6Kr.js",revision:null},{url:"assets/WorkersTimetable-QIXvgBSW.js",revision:null},{url:"index.html",revision:"777d2cc8f2ad0504eb08689c804d9f70"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"manifest.webmanifest",revision:"001c580521cb85910aaca3260ff4315a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
