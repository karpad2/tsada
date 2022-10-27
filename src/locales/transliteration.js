/* eslint-disable */ 
const latToCyrMap = {
    "A": "А",
    "B": "Б",
    "V": "В",
    "G": "Г",
    "D": "Д",
    "Đ": "Ђ",
    "Ð": "Ђ",
    "DJ": "Ђ",
    "Dj": "Ђ",
    "E": "Е",
    "Ž": "Ж",
    "Ž": "Ж", // Z with caron
    "Z": "З",
    "I": "И",
    "J": "Ј",
    "K": "К",
    "L": "Л",
    "LJ": "Љ",
    "Ǉ": "Љ",
    "Lj": "Љ",
    "M": "М",
    "N": "Н",
    "NJ": "Њ",
    "Ǌ": "Њ",
    "Nj": "Њ",
    "O": "О",
    "P": "П",
    "R": "Р",
    "S": "С",
    "T": "Т",
    "Ć": "Ћ",
    "Ć": "Ћ", // C with acute accent
    "U": "У",
    "F": "Ф",
    "H": "Х",
    "C": "Ц",
    "Č": "Ч",
    "Č": "Ч", // C with caron
    "DŽ": "Џ",
    "Ǆ": "Џ",
    "DŽ": "Џ", // D + Z with caron
    //"DZ": "Џ",
    "Dž": "Џ",
    "Dž": "Џ", // D + z with caron
    "Dz": "Џ",
    "Š": "Ш",
    "Š": "Ш", // S with caron
    "a": "а",
    "b": "б",
    "v": "в",
    "g": "г",
    "d": "д",
    "đ": "ђ",
    "dj": "ђ",
    "e": "е",
    "ž": "ж",
    "ž": "ж", // z with caron
    "z": "з",
    "i": "и",
    "ĳ": "иј",
    "j": "ј",
    "k": "к",
    "l": "л",
    "lj": "љ",
    "ǉ": "љ",
    "m": "м",
    "n": "н",
    "nj": "њ",
    "ǌ": "њ",
    "o": "о",
    "œ": "ое",
    "p": "п",
    "r": "р",
    "s": "с",
    "ﬆ": "ст",
    "t": "т",
    "ć": "ћ",
    "ć": "ћ", // c with acute accent
    "u": "у",
    "f": "ф",
    "ﬁ": "фи",
    "ﬂ": "фл",
    "h": "х",
    "c": "ц",
    "č": "ч",
    "č": "ч", // c with caron
    "dž": "џ",
    "ǆ": "џ",
    "dž": "џ", // d + z with caron
    //"dz": "џ",
    "š": "ш",
    "š": "ш", // s with caron
};

const cyrToLatMap = {
    "А": "A",
    "Б": "B",
    "В": "V",
    "Г": "G",
    "Д": "D",
    "Ђ": "Đ",
    "Е": "E",
    "Ж": "Ž",
    "З": "Z",
    "И": "I",
    "Ј": "J",
    "К": "K",
    "Л": "L",
    "Љ": "LJ",
    "М": "M",
    "Н": "N",
    "Њ": "NJ",
    "О": "O",
    "П": "P",
    "Р": "R",
    "С": "S",
    "Ш": "Š",
    "Т": "T",
    "Ћ": "Ć",
    "У": "U",
    "Ф": "F",
    "Х": "H",
    "Ц": "C",
    "Ч": "Č",
    "Џ": "DŽ",
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "ђ": "đ",
    "е": "e",
    "ж": "ž",
    "з": "z",
    "и": "i",
    "ј": "j",
    "к": "k",
    "л": "l",
    "љ": "lj",
    "м": "m",
    "н": "n",
    "њ": "nj",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
    "ш": "š",
    "т": "t",
    "ћ": "ć",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "c",
    "ч": "č",
    "џ": "dž",
    "Ња": "Nja",
    "Ње": "Nje",
    "Њи": "Nji",
    "Њо": "Njo",
    "Њу": "Nju",
    "Ља": "Lja",
    "Ље": "Lje",
    "Љи": "Lji",
    "Љо": "Ljo",
    "Љу": "Lju",
    "Џа": "Dža",
    "Џе": "Dže",
    "Џи": "Dži",
    "Џо": "Džo",
    "Џу": "Džu"
};

const anyToAsciiMap = {
    "А": "A",
    "Б": "B",
    "В": "V",
    "Г": "G",
    "Д": "D",
    "Ђ": "DJ",
    "Е": "E",
    "Ж": "Z",
    "З": "Z",
    "И": "I",
    "Ј": "J",
    "К": "K",
    "Л": "L",
    "Љ": "LJ",
    "М": "M",
    "Н": "N",
    "Њ": "NJ",
    "О": "O",
    "П": "P",
    "Р": "R",
    "С": "S",
    
    "Т": "T",
    "Ћ": "C",
    "У": "U",
    "Ф": "F",
    "Х": "H",
    "Ц": "C",
    "Ч": "C",
    "Џ": "DZ",
    "а": "a",
    "б": "b",
    "в": "v",
    "г": "g",
    "д": "d",
    "ђ": "dj",
    "е": "e",
    "ж": "z",
    "з": "z",
    "и": "i",
    "ј": "j",
    "к": "k",
    "л": "l",
    "љ": "lj",
    "м": "m",
    "н": "n",
    "њ": "nj",
    "о": "o",
    "п": "p",
    "р": "r",
    "с": "s",
   
    "т": "t",
    "ћ": "c",
    "у": "u",
    "ф": "f",
    "х": "h",
    "ц": "c",
    "ч": "c",
    "џ": "dz",
    "ш": "s",
    "Ња": "Nja",
    "Ње": "Nje",
    "Њи": "Nji",
    "Њо": "Njo",
    "Њу": "Nju",
    "Ља": "Lja",
    "Ље": "Lje",
    "Љи": "Lji",
    "Љо": "Ljo",
    "Љу": "Lju",
    "Џа": "Dza",
    "Џе": "Dze",
    "Џи": "Dzi",
    "Џо": "Dzo",
    "Џу": "Dzu",
    "Č": "C",
    "Ć": "C",
    "Đ": "DJ",
    "Š": "S",
    "Ž": "Z",
    "č": "c",
    "ć": "c",
    "đ": "dj",
    "š": "s",
    "ž": "z"
};

var serbianWordsWithForeignCharacterCombinations = [
    "aparthejd",
    "ddor",
    "dss",
    "dvadesettrog",
    "epp",
    "gss",
    "interreakc",
    "interresor",
    "kss",
    "mmf",
    "ommetar",
    "poddirektor",
    "poddres",
    "posthumn",
    "posttrans",
    "posttraum",
    "pothranj",
    "prethod",
    "ptt",
    "sbb",
    "sssr",
    "superračun",
    "transseks",
    "transsibir",
    "tridesettrog",
    "urla",
    "urli"
];

var commonForeignWords = [
    "administration",
    "adobe",
    "advanced",
    "advertising",
    "alpha",
    "autocad",
    "bluetooth",
    "book",
    "boot",
    "bosch",
    "canon",
    "carlsberg",
    "chat",
    "chevrolet",
    "chrome",
    "cisco",
    "clio",
    "cloud",
    "coca-col",
    "conditions",
    "cookie",
    "cooking",
    "cool",
    "covid",
    "cpu",
    "dacia",
    "default",
    "developer",
    "cookies",
    "e-mail",
    "edge",
    "electronics",
    "email",
    "english",
    "facebook",
    "fashion",
    "food",
    "foundation",
    "gaming",
    "ghz",
    "github",
    "gmail",
    "gmbh",
    "gmt",
    "good",
    "google",
    "hdmi",
    "iphon",
    "ipod",
    "javascript",
    "joomla",
    "khz",
    "league",
    "like",
    "linkedin",
    "login",
    "look",
    "macbook",
    "mail",
    "maps",
    "mastercard",
    "mercator",
    "mhz",
    "microsoft",
    "mitsubishi",
    "notebook",
    "nvidia",
    "online",
    "outlook",
    "panasonic",
    "peugeot",
    "podcast",
    "porsche",
    "postpaid",
    "printscreen",
    "procredit",
    "renault",
    "school",
    "selfie",
    "share",
    "shift",
    "shop",
    "smartphone",
    "space",
    "ssd",
    "steam",
    "subscrib",
    "tech",
    "technology",
    "terms",
    "the",
    "thinkpad",
    "thread",
    "tool",
    "topic",
    "trailer",
    "unicredit",
    "url",
    "username",
    "viber",
    "viii",
    "visa",
];

var foreignCharacterCombinations = [
    'q',
    'w',
    'x',
    'y',
    'ü',
    'ö',
    'ä',
    'ø',
    'ß',
    '&',
    '@',
    '#',
    'bb',
    'cc',
    'dd',
    'ff',
    'gg',
    'hh',
    'kk',
    'll',
    'mm',
    'nn',
    'pp',
    'rr',
    'ss',
    'tt',
    'zz',
    'ch',
    'gh',
    'th',
    '\'s',
    '\'t',
    '.com',
    '.net',
    '.info',
    '.rs',
    '.org'
];

var digraphExceptions = {
    "dj": [
        "adjektiv",
        "adjunkt",
        "bazdje",
        "bdje",
        "bezdje",
        "blijedje",
        "bludje",
        "bridjе",
        "vidje",
        "vindjakn",
        "višenedje",
        "vrijedje",
        "gdje",
        "gudjer",
        "gudje",
        "gdjir",
        "daždje",
        "dvonedje",
        "devetonedje",
        "desetonedje",
        "djev",
        "djed",
        "djejstv",
        "djel",
        "djenem",
        "djeneš",
        //"djene" rare (+ Дјене (town)), but it would colide with ђене-ђене, ђеневљанка, ђенерал итд.
        "djenu",
        "djet",
        "djec",
        "dječ",
        "djuar",
        "djubison",
        "djubouz",
        "djuer",
        "djui",
        // "djuk", djuk (engl. Duke) косило би се нпр. са Djukanović
        "djuks",
        "djulej",
        "djumars",
        "djupont",
        "djurant",
        "djusenberi",
        "djuharst",
        "djuherst",
        "dovdje",
        "dogrdje",
        "dodjel",
        "dodjelj",
        "drvodje",
        "drugdje",
        "elektrosnabdje",
        "žudje",
        "zabludje",
        "zavidje",
        "zavrijedje",
        "zagudje",
        "zadjev",
        "zadjen",
        "zalebdje",
        "zaludje",
        "zaodje",
        "zapodje",
        "zarudje",
        "zasjedje",
        "zasmrdje",
        "zastidje",
        "zaštedje",
        "zdje",
        "zlodje",
        "igdje",
        "izbledje",
        "izblijedje",
        "izvidje",
        "izdjejst",
        "izdjelj",
        "izludje",
        "isprdje",
        "jednonedje",
        "kojegdje",
        "kudjelj",
        "lebdje",
        "ludje",
        "makfadjen",
        "marmadjuk",
        "međudjel",
        "nadjaha",
        "nadjača",
        "nadjeb",
        "nadjev",
        "nadjen",
        "negdje",
        "nedjel",
        "nadjunač",
        "nenavidje",
        "neodje",
        "nepodjarm",
        "nerazdje",
        "nigdje",
        "obdjel",
        "obnevidje",
        "ovdje",
        "ovdje-ondje",
        "odjav",
        "odjah",
        "odjaš",
        "odjeb",
        "odjev",
        "odjed",
        "odjezd",
        "odjek",
        "odjel",
        "odjen",
        "odjeć",
        "odjec",
        "odjur",
        "odsjed",
        "odsjedje",
        "ondje",
        "opredje",
        "osijedje",
        "osmonedje",
        "pardju",
        "perdju",
        "petonedje",
        "poblijedje",
        "povidje",
        "pogdjegdje",
        "pogdje",
        "podjamč",
        "podjemč",
        "podjar",
        "podjeb",
        "podjebrad",
        "podjed",
        "podjezič",
        "podjel",
        "podjen",
        "podjet",
        "pododjel",
        "pozavidje",
        "poludje",
        "poljodjel",
        "ponegdje",
        "ponedjelj",
        "porazdje",
        "posijedje",
        "posjedje",
        "postidje",
        "potpodjel",
        "poštedje",
        "pradjed",
        "prdje",
        "preblijedje",
        "previdje",
        "predvidje",
        "predjel",
        "preodjen",
        "preraspodje",
        "presjedje",
        "pridjev",
        "pridjen",
        "prismrdje",
        "prištedje",
        "probdje",
        "problijedje",
        "prodjen",
        "prolebdje",
        "prosijedje",
        "prosjedje",
        "protivdjel",
        "prošlonedje",
        "razvidje",
        "razdjev",
        "razdjel",
        "razodje",
        "raspodje",
        "rasprdje",
        "remekdjel",
        "rudje",
        "sadje",
        "svagdje",
        "svidje",
        "svugdje",
        "sedmonedjelj",
        "sijedje",
        "sjedje",
        "smrdje",
        "snabdje",
        "snovidje",
        "starosjedje",
        "stidje",
        "studje",
        "sudjel",
        "tronedje",
        "ublijedje",
        "uvidje",
        "udjel",
        "udjen",
        "uprdje",
        "usidjel",
        "usjedje",
        "usmrdje",
        "uštedje",
        "cjelonedje",
        "četvoronedje",
        "čukundjed",
        "šestonedjelj",
        "štedje",
        "štogdje",
        "šukundjed",
    ],
    "dž": [
        "feldžandarm",
        "nadžanj",
        "nadždrel",
        "nadžel",
        "nadžeo",
        "nadžet",
        "nadživ",
        "nadžinj",
        "nadžnj",
        "nadžrec",
        "nadžup",
        "odžali",
        "odžari",
        "odžel",
        "odžive",
        "odživljava",
        "odžubor",
        "odžvaka",
        "odžval",
        "odžvać",
        "podžanr",
        "podžel",
        "podže",
        "podžig",
        "podžiz",
        "podžil",
        "podžnje",
        "podžupan",
        "predželu",
        "predživot",
    ],
    "nj": [
        "anjon",
        "injaric",
        "injekc",
        "injekt",
        "injicira",
        "injurij",
        "kenjon",
        "konjug",
        "konjunk",
        "nekonjug",
        "nekonjunk",
        "ssrnj",
        "tanjug",
        "vanjezičk",
    ],
};

// See: https://en.wikipedia.org/wiki/Zero-width_non-joiner
var digraphReplacements = {
    "dj": {
        "dj": "d\u200Cj",
        "Dj": "D\u200Cj",
        "DJ": "D\u200CJ",
    },
    "dž": {
        "dž": "d\u200Cž",
        "Dž": "D\u200Cž",
        "DŽ": "D\u200CŽ",
    },
    "nj": {
        "nj": "n\u200Cj",
        "Nj": "N\u200Cj",
        "NJ": "N\u200CJ",
    }
};

function buildTrie(map) {
    let trie = {};
    let currentNode;

    for (let key in map) {
        currentNode = trie;

        for (let char of key) {
            currentNode[char] = currentNode[char] || {};
            currentNode = currentNode[char];
        }

        currentNode.value = map[key];
    }

    return trie;
}

function replaceUsingTrie(str, trie) {
    let result = '';

    for (let i = 0, length = str.length; i < length; i++) {
        if (!trie[str[i]]) {
            result += str[i];
            continue;
        }

        // Search trie
        let currentNode = trie[str[i]];
        let currentDepth = 0;
        let valueDepth = 0;
        let value = '';

        while (true) {
            if (currentNode.value) {
                value = currentNode.value;
                valueDepth = currentDepth;
            }

            if (currentNode[str[i + currentDepth + 1]]) {
                currentDepth++;
                currentNode = currentNode[str[i + currentDepth]];
            } else {
                break;
            }
        }

        // Insert original text if match is incomplete
        result += value || str.substr(i, valueDepth + 1);
        i += valueDepth;
    }

    return result;
}

var latToCyrTrie = buildTrie(latToCyrMap);
var cyrToLatTrie = buildTrie(cyrToLatMap);
var anyToAsciiTrie = buildTrie(anyToAsciiMap);

// Recursively process text within descendent text nodes.
function processText(parentNode, mode) {
    if (parentNode.nodeType === 3) {
        processTextNode(parentNode, mode);
    }

    if (/SCRIPT|STYLE/.test(parentNode.nodeName)) {
        return;
    }

    for (let node of parentNode.childNodes) {
        switch (node.nodeType) {
            case 1:    // Element node
                processAttribute(node, 'title', mode);
                processAttribute(node, 'placeholder', mode);
                processAttribute(node, 'data-variants', mode);

            case 11:   // Document fragment node
                if (!/SCRIPT|STYLE/.test(node.nodeName)) {
                    processText(node, mode);
                }

                break;
            case 3:    // Text node
                processTextNode(node, mode);
        }
    }
}

function processTextNode(node, mode) {
    node.nodeValue = convertText(node.nodeValue, mode);
}

function processAttribute(node, attribute, mode) {
    if (node.getAttribute(attribute) === null) {
        return;
    }

    node.originalAttributes = node.originalAttributes || {};
    node.setAttribute(attribute, convertText(node.getAttribute(attribute), mode));
}

function convertText(text, mode) {
    if (mode === 'ascii') {
        return replaceUsingTrie(text, anyToAsciiTrie);
    }

    if (mode === 'latin') {
        return replaceUsingTrie(text, cyrToLatTrie);
    }

    if (text.trim().length === 0) {
        return text;
    }

    let words = text.split(' ');
    for (let i = 0, length = words.length; i < length; i++) {
        if (!looksLikeForeignWord(words[i])) {
            words[i] = convertWordToCyrillic(words[i]);
        }
    }

    return words.join(' ');
}

function looksLikeForeignWord(word) {
    word = word.trim().toLowerCase();
    if (word === "") {
        return false;
    }

    if (wordStartsWith(word, serbianWordsWithForeignCharacterCombinations)) {
        return false;
    }

    if (wordInArray(word, foreignCharacterCombinations)) {
        return true;
    }

    if (wordStartsWith(word, commonForeignWords)) {
        return true;
    }

    return false;
}

function convertWordToCyrillic(str) {
    str = splitDigraphs(str);

    return replaceUsingTrie(str, latToCyrTrie);
}

function splitDigraphs(str) {
    const lowercaseStr = str.trim().toLowerCase();

    for (const digraph in digraphExceptions) {
        if (!lowercaseStr.includes(digraph)) {
            continue;
        }

        for (const word of digraphExceptions[digraph]) {
            if (!lowercaseStr.startsWith(word)) {
                continue;
            }

            // Split all possible occurrences, regardless of case.
            for (const key in digraphReplacements[digraph]) {
                str = str.replace(key, digraphReplacements[digraph][key]);
            }

            break;
        }
    }

    return str;
}

function wordStartsWith(word, array) {
    for (let arrayWord of array) {
        if (word.startsWith(arrayWord)) {
            return true;
        }
    }

    return false;
}

function wordInArray(word, array) {
    for (let arrayWord of array) {
        if (word.includes(arrayWord)) {
            return true;
        }
    }

    return false;
}
export{
    convertWordToCyrillic
}