import hu from "./hu.json";
import en from "./en.json";
import rs from "./rs.json";
import {convertWordToCyrillic} from "./transliteration.js";

let sr = {};


for (let key in rs) {
    if (rs.hasOwnProperty(key)) {
        // Perform any transformation or operation you need here
        // For example, we'll just copy the key-value pair as it is
        sr[key] = convertWordToCyrillic(rs[key]);
    }
}
//console.log(sr);

/*
rs.forEach(element => {
    sr.push(convertWordToCyrillic(element));
});*/

function convertifserbian(word)
{
    if(localStorage.getItem('lang') == 'sr'){
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
//this.$i18n.locale 

const messages={
    hu,en,rs,sr    
}
export  { messages,convertifserbian};