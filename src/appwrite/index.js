import { Client,Account } from 'appwrite';
import config from './config.json';
const appw = new Client();
appw
    .setEndpoint('https://appwrite.tsada.edu.rs/v1')
    .setProject('659ea7f886cf55d4528a');
const user=new Account(appw);
let loggedIn=false;
//console.log(user.get());
const promise = user.get();
let accountloaded;
promise.then(function (response) {

        console.log(response); // Success
        if(response.status==true){
           accountloaded=response; 
            loggedIn= true;
        }
        else
        loggedIn= false;
    }, function (error) {
        console.log(error); // Failure
        loggedIn=false;
    });

function checkUser(){
    return loggedIn;
}
export {appw,config,user,checkUser};