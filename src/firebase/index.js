import {getAuth,setPersistence,inMemoryPersistence,browserSessionPersistence,browserLocalPersistence} from 'firebase/auth';
const { initializeAppCheck, ReCaptchaV3Provider } = require("firebase/app-check");
import {getDatabase,ref,set, onValue,onDisconnect,child} from 'firebase/database';
import { initializeApp } from "firebase/app";
import { getMessaging,getToken,onMessage } from "firebase/messaging";
import { onBackgroundMessage } from "firebase/messaging/sw";
import { getPerformance } from "firebase/performance";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getStorage,getDownloadURL } from "firebase/storage";
import Vue from 'vue';
import axios from "axios";
import { getFunctions, httpsCallable } from "firebase/functions";
import {enableIndexedDbPersistence, getFirestore,doc,getDoc,collection,updateDoc,update,setDoc,getDocFromServer,CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import firebaseCredentials from './credentials';
const app = initializeApp(firebaseCredentials.firebaseCredentials);
const appCheck = initializeAppCheck(app, {
	provider: new ReCaptchaV3Provider("6Lc1oroiAAAAALhEIYK44ipKin-OQdEGCQL0F18s"),
  
	// Optional argument. If true, the SDK automatically refreshes App Check
	// tokens as needed.
	isTokenAutoRefreshEnabled: true
  });



const messaging = getMessaging(app);
const perf = getPerformance(app);
const storage = getStorage(app);
const firestore = getFirestore(app);
const analytics = getAnalytics(app);
const functions = getFunctions(app);

logEvent(analytics, 'notification_received');




//window.console = _console;



onMessage(messaging, (payload) => {
	console.log('Message received. ', payload);
	// ...
  });

 
  
// key for recatchpa3 
//const appcheck=firebase.appCheck()


// Request Permission of Notifications

async function isAdmin()
{
	let l= await getDoc(doc(collection(firestore,"users"),getAuth().currentUser.uid));
	return l.data().admin==null?false:true;
}
async function get_user_language()
{
	let l= await getDoc(doc(collection(firestore,"users"),getAuth().currentUser.uid));
	let k ="";
	if(l.data().language==null)
	{
		k="rs-RS"
	}
	else 
	{
		k=l.data().language;
	}

	return k;
}


//appcheck.setTokenAutoRefreshEnabled();
const FirebaseAuth = getAuth();
setPersistence(FirebaseAuth,browserLocalPersistence);
//const Firebase = firebase;
const FireDb = getDatabase();


const presenceRef = ref(FireDb, "disconnectmessage");
onDisconnect(presenceRef).set("I disconnected!");


const connectedRef = ref(FireDb, ".info/connected");
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
	///Connected
  } else {
    ///Not connected
  }
});



let userId = null;
let auth = null;
let user=null;
let user_email_verified= null;
let user_is_admin= null;
(async () => {
    auth = await getAuth();
	user= auth.currentUser;
	user_email_verified= user==null? true : user.emailVerified;
	user_is_admin= user==null?false: await getDocFromServer(`users/${FirebaseAuth.currentUser.uid}`,"admin");
    // all of the script.... 

})();
//const user_data = child(dbRef, `users/${FirebaseAuth._currentUser.uid}`);
let user_data ="";
const change_Theme_Fb= async (value)=>{
	const userId = FirebaseAuth.currentUser.uid;
	if( localStorage.getItem("userTheme")===null) localStorage.userTheme = "light";
	if (localStorage.userTheme=="light")
	{ localStorage.userTheme = "dark";
	await setDoc(doc(firestore,"users",FirebaseAuth.currentUser.uid),{theme:localStorage.userTheme},{merge:true});
	//set(ref(FireDb,`users/${userId}/user_profile_color`),"dark");
	}
	else
	{
		localStorage.userTheme = "light";
		await	setDoc(doc(firestore,"users",FirebaseAuth.currentUser.uid),{theme:localStorage.userTheme},{merge:true});
	}
};

async function loadimage(link)
{
	let ref_thumbnail=ref(storage,link);
    let image=await getDownloadURL(ref_thumbnail);
	return image;

}

async function libraryuser()
{
	if(FirebaseAuth.currentUser!=null)
	{
	return await FirebaseAuth.currentUser.email==firebaseCredentials.public_profile.u;
	}
	else return false;
}

 async function logerror(b)
{
	await axios.post(firebaseCredentials.bugreportwebhook,{username:getAuth().currentUser.displayName,avatar_url:getAuth().currentUser.photoURL,content:b.replace(/<[^>]*>?/gm, '')});
	// logEvent(analytics,"exception",b);
}
async function missingword(lang,word)
{
	await axios.post(firebaseCredentials.bugreportwebhook,{username:"Language error",avatar_url:getAuth().currentUser.photoURL,content:`Lang error: missing keyword language:${lang}, keyword:'${word}'`});
}

async function loginerror(word,code)
{
	await axios.post(firebaseCredentials.bugreportwebhook,{username:"Login error",avatar_url:"",content:`Login error: message:'${word}',code:'${code}',platform:'${navigator.userAgent}'`});
}


export {
	FirebaseAuth,
	libraryuser,
	storage,
	FireDb,
	firestore,
	change_Theme_Fb,
	loginerror,
	user,
	logerror,
	userId,
	get_user_language,
	isAdmin,
	functions,
	user_is_admin,
	user_email_verified,
	loadimage,
	missingword
}

