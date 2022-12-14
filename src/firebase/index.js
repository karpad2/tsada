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
import {firebaseCredentials} from './credentials';

//console.log(firebaseCredentials)
const app = initializeApp(firebaseCredentials);
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

//const user_data = child(dbRef, `users/${FirebaseAuth._currentUser.uid}`);



export {
	FirebaseAuth,
	storage,
	FireDb,
	firestore,
	isAdmin
}
