if(!self.define){let s,e={};const l=(l,r)=>(l=new URL(l+".js",r).href,e[l]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()})).then((()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s})));self.define=(r,i)=>{const n=s||("document"in self?document.currentScript.src:"")||location.href;if(e[n])return;let u={};const t=s=>l(s,n),o={module:{uri:n},exports:u,require:t};e[n]=Promise.all(r.map((s=>o[s]||t(s)))).then((s=>(i(...s),u)))}}define(["./workbox-3e911b1d"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"assets/AboutView-Bv6wdeHN.js",revision:null},{url:"assets/AboutView-C6Dx7pxG.css",revision:null},{url:"assets/Album-BHtJlG4m.js",revision:null},{url:"assets/AlbumViewer-Bvljqxd1.js",revision:null},{url:"assets/Birthday-Dxjou30V.js",revision:null},{url:"assets/ClassEditor-CmRQ0_y3.js",revision:null},{url:"assets/ClassList-NojYtWRS.js",revision:null},{url:"assets/Contact-CM0sW3PZ.js",revision:null},{url:"assets/Contact-DgPfIotL.css",revision:null},{url:"assets/ContentEditor-CL6ERSi0.js",revision:null},{url:"assets/DocumentEditor-Fq982Iq_.js",revision:null},{url:"assets/Documents-BQLrbiSN.js",revision:null},{url:"assets/DocViewer-CIQnP9qd.css",revision:null},{url:"assets/DocViewer-cNweIjnU.js",revision:null},{url:"assets/EducationProfile-DvjCYOoa.js",revision:null},{url:"assets/EducationProfiles-B9xNzV0d.js",revision:null},{url:"assets/ErasmusApplies-BdD-ftTi.js",revision:null},{url:"assets/ErasmusApply-tSA7KeJe.js",revision:null},{url:"assets/ErasmusApplyEdit-DyGCQblQ.js",revision:null},{url:"assets/ErasmusList-DF4fHe3Z.js",revision:null},{url:"assets/ErDocViewer-BkmGC5hZ.js",revision:null},{url:"assets/Gallery-DPl5PrYs.js",revision:null},{url:"assets/GalleryEditor-J38qsS48.js",revision:null},{url:"assets/index-DLIzYZmY.css",revision:null},{url:"assets/index.es-DM1djmrm.js",revision:null},{url:"assets/leaflet-src-DJuymrwo.js",revision:null},{url:"assets/leaflet-src.esm-HdBnhJze.js",revision:null},{url:"assets/Login-jHTfnoHp.js",revision:null},{url:"assets/marker-icon-2x-D4k_ikNW.js",revision:null},{url:"assets/marker-icon-C2eJqgqv.js",revision:null},{url:"assets/marker-shadow-DU6CIJ0p.js",revision:null},{url:"assets/MDRenderer-COBmwjTt.js",revision:null},{url:"assets/Message-DryUX4L1.js",revision:null},{url:"assets/Messages-Hgrlsv4r.js",revision:null},{url:"assets/MissingPage-vgceGSp1.js",revision:null},{url:"assets/moment-with-locales-CrxKoMuB.js",revision:null},{url:"assets/ParentVisiting-CUwQcaXA.js",revision:null},{url:"assets/Presentation-BOJpkKSs.js",revision:null},{url:"assets/purify.es-DGIRlouP.js",revision:null},{url:"assets/StudentDocumentEditor-D6nXHP4p.js",revision:null},{url:"assets/StudentDocuments-D0ZpPsMV.js",revision:null},{url:"assets/TextDocumentEditor-Ce0ezOcM.js",revision:null},{url:"assets/Timetable-CVadKh4e.js",revision:null},{url:"assets/WorkerEditor-CXGiN7L6.js",revision:null},{url:"assets/Workers-BzyF0qcJ.css",revision:null},{url:"assets/Workers-TOdJKW2T.js",revision:null},{url:"assets/WorkersTimetable-B_SY1GJM.css",revision:null},{url:"assets/WorkersTimetable-Bhn43-_v.js",revision:null},{url:"index.html",revision:"c8600970fb038b1e6563915d3ea56331"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"manifest.webmanifest",revision:"001c580521cb85910aaca3260ff4315a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
