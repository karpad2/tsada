import hu from "./hu.json";
import en from "./en.json";
import rs from "./rs.json";
import {convertWordToCyrillic} from "./transliteration.js";
import {useLoadingStore} from "../stores/loading";
let sr = {};

/*
for (let key in rs) {
    if (rs.hasOwnProperty(key)) {
        // Perform any transformation or operation you need here
        // For example, we'll just copy the key-value pair as it is
        sr[key] = convertWordToCyrillic(rs[key]);
    }
}*/
sr=rs;

function convertifserbian(word)
{
    const cc=useLoadingStore();
    if(cc.language == 'sr'){
    try{
        return convertWordToCyrillic(word); 
        }
    
    catch(e){
        return word;
    }
    }
    else
        return word;

}

function getStatus()
{
    const cc=useLoadingStore();
    if(cc.language == 'sr'||cc.language == 'rs'){
    return "isSerbian";
    }
    else if(cc.language == 'hu'){
        return "isHungarian";
    }
    else if(cc.language == 'en') {
        return "isEnglish";
    }
    else  {

    }
}
//this.$i18n.locale 

const messages={
    hu,en,rs,sr    
}
export  { messages,getStatus,convertifserbian};