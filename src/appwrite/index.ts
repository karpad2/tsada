import { Client,Account } from 'appwrite';
import config from './config.json';
const appw = new Client();


import {useLoadingStore} from "@/stores/loading";

appw
    .setEndpoint('https://appwrite.tsada.edu.rs/v1')
    .setProject('659ea7f886cf55d4528a');


const user=new Account(appw);
async function check()
{

const loading=useLoadingStore();
let loggedIn=false;
//console.log(user.get());
const promise = user.get();
let accountloaded;

promise.then(function (response) {

        console.log(response); // Success
        if(response.status==true){
           accountloaded=response; 
            loading.setUserLoggedin(true);
        }
        else
        loggedIn= false;
    }, function (error) {
        console.log(error); // Failure
        loading.setUserLoggedin(false);
    });
}
function randomIntFromInterval(min:number, max:number):number { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

export {appw,config,user,check,randomIntFromInterval};