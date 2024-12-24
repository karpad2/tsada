import { notify } from '@kyvg/vue3-notification';
import { Client,Account,Storage,ID  } from 'appwrite';
//import config from './config.json';

async function  fileupload(storage:Storage,bucket:string,path:string,File)
{
    
   const promise=storage.createFile(bucket,ID.unique(),File)

   promise.then((success)=>{
    console.info("File Uploaded"+success);
   },(error)=>{
    console.error("File is not uploaded and error"+error)
   }

)
}
export {
    fileupload
}

