import {collection, doc, setDoc, query, where, getDocs,getDoc,limit,  } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {convertWordToCyrillic} from "./transliteration"
//import { firestore } from "firebase-admin";

const english= require("./en.json");
const hungarian= require("./hu.json");
const serbian= require("./rs.json");

function  gettext(indicator)
{   let text="";
    let code="en-EN";
    let signed_in=!(getAuth().currentUser==null);

    code=localStorage.getItem("language");
    if(code==null)
    {
        localStorage.setItem("language",get_defaultlanguage());
        
    }
    else if(code==null &&!signed_in)
    {
        code="rs-RS";
        localStorage.setItem("language",code);
    }

    //console.log(code);
    switch(code)
    {
        case "en-EN":{text=contains_the_array(english,indicator);} break;
        case "hu-HU":{text=contains_the_array(hungarian,indicator);} break;
        case "rs-RS":{text=contains_the_array(serbian,indicator);} break;
        case "sr-SR":{
            try{
            text=convertWordToCyrillic(contains_the_array(serbian,indicator));
            }
            catch(ex)
            {
                console.log(ex);
                text=contains_the_array(serbian,indicator);
            }
        } break;
    }
    return text
}
function get_title()
{
    return gettext("title");
}
function contains_the_array(array,word)
{
 if(word=="") return ;
    if(array[word]==undefined)
      { console.log(word);
        
        if(localStorage.getItem("language")=="hr-HR")
        {
            if(serbian[word]==undefined)
            {
                return word;
            }
            else return contains_the_array(serbian,word);
        }
        else return word;

        //logerror(`Language error language code:${localStorage.getItem("language")} err word missing,word:'${word}'`);
         
        //return english[word];
      }
    else 
        return array[word];

}

function title_page(a,type="")
{   
    try
    {let b=a;
    if(a=="undefined"||a==undefined) b="";
    return `${b} ${gettext(type)==undefined?"":gettext(type).slice(0,1).toUpperCase()+gettext(type).slice(1,gettext(type).length)} » ${gettext("app-title")}`;
    }
    catch{
        return "";
    }
}

const languages =[
    {
        code:"sr-SR",
        name:convertWordToCyrillic("Srpski")
    },
    {
        code:"rs-RS",
        name:"Srpski"
    },
    
    {
        code:"hu-HU",
        name:"Magyar"
    },
    {
        code:"hr-HR",
        name:"Hrvatski"
    },
    {
        code:"en-EN",
        name:"English"
    }];


function get_defaultlanguage()
{
    return languages[0].code;
}
function replace_white(i="")
{
    let k=i.replaceAll(' ','_');
    k=k.replaceAll('#','[sharp]');
    k=k.replaceAll('/','[slash]');
    return k;
}
function replace_under(i="")
{
    return i.replaceAll('_',' ');
}
function get_text_by_language(a,b)
{
    let l="";
    let code="en-EN";
    let signed_in=!(getAuth().currentUser==null);

    code=localStorage.getItem("language");
    if(code==null)
    {
        localStorage.setItem("language",get_defaultlanguage());
        
    }

    switch(code)
    {
        case "en-EN":{l=`${gettext(a)} ${gettext(b)}`;} break;
        case "hu-HU":{l=`${gettext(b)} ${gettext(a)}`;} break;
        case "rs-RS":{l=`${gettext(a)} ${gettext(b)}`;} break;
        case "sr-SR":{l=`${gettext(a)} ${gettext(b)}`;} break;
        case "hr-HR":{l=`${gettext(a)} ${gettext(b)}`;} break;
    }
    return l;

}
export
{
    gettext,
    get_title,
    languages,
    title_page,
    get_defaultlanguage,
    replace_white,
    replace_under,
    get_text_by_language
}