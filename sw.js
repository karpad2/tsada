if(!self.define){let s,e={};const l=(l,r)=>(l=new URL(l+".js",r).href,e[l]||new Promise((e=>{if("document"in self){const s=document.createElement("script");s.src=l,s.onload=e,document.head.appendChild(s)}else s=l,importScripts(l),e()})).then((()=>{let s=e[l];if(!s)throw new Error(`Module ${l} didn’t register its module`);return s})));self.define=(r,i)=>{const n=s||("document"in self?document.currentScript.src:"")||location.href;if(e[n])return;let u={};const t=s=>l(s,n),o={module:{uri:n},exports:u,require:t};e[n]=Promise.all(r.map((s=>o[s]||t(s)))).then((s=>(i(...s),u)))}}define(["./workbox-3e911b1d"],(function(s){"use strict";self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"assets/AboutView-C6Dx7pxG.css",revision:null},{url:"assets/AboutView-DSDTShLn.js",revision:null},{url:"assets/Album-JibDg_QC.js",revision:null},{url:"assets/AlbumViewer-DLwKWxtY.js",revision:null},{url:"assets/Birthday-DSZxlF3w.js",revision:null},{url:"assets/ClassEditor-Brd3apCF.js",revision:null},{url:"assets/ClassList-Cy8JTWZY.js",revision:null},{url:"assets/Contact-C5sXfXAz.js",revision:null},{url:"assets/Contact-DgPfIotL.css",revision:null},{url:"assets/ContentEditor-m8I7qYkx.js",revision:null},{url:"assets/DocumentEditor-BxnfF7GU.js",revision:null},{url:"assets/Documents-CyEx-G-g.js",revision:null},{url:"assets/DocViewer-CIQnP9qd.css",revision:null},{url:"assets/DocViewer-CqFJ3ZL_.js",revision:null},{url:"assets/EducationProfile-BxrBD-tE.js",revision:null},{url:"assets/EducationProfiles-BFkZtuGP.js",revision:null},{url:"assets/ErasmusApplies-Bsb2mFso.js",revision:null},{url:"assets/ErasmusApply-MBPwlxtX.js",revision:null},{url:"assets/ErDocViewer-EFgeo_Dx.js",revision:null},{url:"assets/Gallery-B1uJcpAR.js",revision:null},{url:"assets/GalleryEditor-DS1P_yVd.js",revision:null},{url:"assets/index-CMFDjqk8.css",revision:null},{url:"assets/index-CZnG6tjm.js",revision:null},{url:"assets/leaflet-src-B7_X8MI3.js",revision:null},{url:"assets/leaflet-src.esm-HdBnhJze.js",revision:null},{url:"assets/Login-Dads8L6c.js",revision:null},{url:"assets/marker-icon-2x-D4k_ikNW.js",revision:null},{url:"assets/marker-icon-C2eJqgqv.js",revision:null},{url:"assets/marker-shadow-DU6CIJ0p.js",revision:null},{url:"assets/MDRenderer-DfyMNQwh.js",revision:null},{url:"assets/Message-C6cY5EGr.js",revision:null},{url:"assets/Messages-BmVmpK70.js",revision:null},{url:"assets/MissingPage-D2Yd9_YM.js",revision:null},{url:"assets/moment-with-locales-OC4L4a83.js",revision:null},{url:"assets/Presentation-BUPppJf8.js",revision:null},{url:"assets/StudentDocumentEditor-B-LhBHdr.js",revision:null},{url:"assets/StudentDocuments-h-lk-iDc.js",revision:null},{url:"assets/TextDocumentEditor-DhPppb43.js",revision:null},{url:"assets/Timetable-BZ95IOGR.js",revision:null},{url:"assets/WorkerEditor-DvKUAbFc.js",revision:null},{url:"assets/Workers-B_SY1GJM.css",revision:null},{url:"assets/Workers-DSk9MLhc.js",revision:null},{url:"assets/WorkersTimetable-CyBh_0s0.js",revision:null},{url:"index.html",revision:"265ca6c20ff3897cba88097b2fed6048"},{url:"registerSW.js",revision:"1872c500de691dce40960bb85481de07"},{url:"manifest.webmanifest",revision:"001c580521cb85910aaca3260ff4315a"}],{}),s.cleanupOutdatedCaches(),s.registerRoute(new s.NavigationRoute(s.createHandlerBoundToURL("index.html")))}));
