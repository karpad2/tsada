import { notify } from '@kyvg/vue3-notification';
import { Client,Account,Storage,ID  } from 'appwrite';
//import config from './config.json';
import { yapping } from "@/uwu";
async function  fileupload(storage:Storage,bucket:string,path:string,File)
{
    
   const promise=storage.createFile(bucket,ID.unique(),File)

   promise.then((success)=>{
    yapping("File Uploaded"+success);
   },(error)=>{
    yapping("File is not uploaded and error"+error)
   }

)
}
export {
    fileupload
}

