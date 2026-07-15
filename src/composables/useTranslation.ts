import { ref } from 'vue';

interface TranslationResult {
  success: boolean;
  translations: Record<string, string>;
  error?: string;
}

export function useTranslation() {
  const isTranslating = ref(false);
  const translationProgress = ref(0);

  /**
   * LibreTranslate - Ingyenes, AI-alapú, nyílt forráskódú fordító
   * Legjobb minőség, de lehet lassú
   */
  const translateWithLibreTranslate = async (
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> => {
    try {
      const url = 'https://libretranslate.de/translate';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: mapLanguageCode(sourceLang),
          target: mapLanguageCode(targetLang),
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error('LibreTranslate API error');
      }

      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('LibreTranslate error:', error);
      throw error;
    }
  };

  /**
   * MyMemory API - Jó minőség, 1000 fordítás/nap ingyenes
   */
  const translateWithMyMemory = async (
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> => {
    const langPair = `${mapLanguageCode(sourceLang)}|${mapLanguageCode(targetLang)}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    throw new Error('MyMemory translation failed');
  };

  /**
   * Google Translate - Gyors, stabil fallback
   */
  const translateWithGoogle = async (
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${mapLanguageCode(sourceLang)}&tl=${mapLanguageCode(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data[0]) {
      let translatedText = '';
      for (const item of data[0]) {
        if (item[0]) {
          translatedText += item[0];
        }
      }
      return translatedText;
    }

    throw new Error('Google translation failed');
  };

  /**
   * HTML tagek, képek és URL-ek védése fordítás alatt
   * Placeholder-ekkel helyettesíti a HTML tageket, majd visszarakja fordítás után
   * FONTOS: A placeholder csak számokat és speciális karaktereket használ,
   * hogy a fordítók ne fordítsák le őket!
   */
  const protectHtmlTags = (text: string): { cleanText: string; htmlMap: Map<string, string> } => {
    const htmlMap = new Map<string, string>();
    let counter = 0;

    // HTML tagek, entitások, URL-ek és speciális karakterek védelme
    const patterns = [
      // URL-ek és képek elsőként (hogy ne törjék el őket a HTML tag pattern)
      /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,  // Teljes URL-ek: http://..., https://...
      /www\.[^\s<>"{}|\\^`\[\]]+/gi,        // www. kezdetű URL-ek
      /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,}/gi, // Email címek

      // HTML tagek (különös figyelem a képekre és linkekre)
      /<img[^>]*>/gi,         // Kép tagek teljes egészében
      /<a[^>]*>.*?<\/a>/gi,   // Link tagek tartalommal együtt
      /<[^>]+>/g,             // Összes többi HTML tag

      // HTML entitások
      /&[a-zA-Z]+;/g,         // Névvel rendelkező entitások: &nbsp;, &amp;, stb.
      /&#\d+;/g,              // Numerikus entitások: &#8217;
      /&#x[0-9a-fA-F]+;/g,    // Hex entitások: &#x1F600;

      // Template és speciális szintaxis
      /\{\{[^}]+\}\}/g,       // Mustache double: {{variable}}
      /\{[^}]+\}/g,           // Mustache single: {variable}
      /\[\[.*?\]\]/g,         // Wiki stílusú linkek: [[link]]
      /<%-?\s*.*?\s*-?%>/g,   // EJS template tagek: <%= %>, <%- %>

      // Markdown képek és linkek
      /!\[.*?\]\(.*?\)/g,     // Markdown képek: ![alt](url)
      /\[.*?\]\(.*?\)/g,      // Markdown linkek: [text](url)
    ];

    let cleanText = text;

    // Patterns alkalmazása sorrendben (URL-ek és képek először!)
    patterns.forEach(pattern => {
      cleanText = cleanText.replace(pattern, (match) => {
        // Translation-proof placeholder: speciális Unicode karakterek + számok
        // A ⟪⟫ zárójelek matematikai szimbólumok, nem fordíthatók
        const placeholder = `⟪${counter}⟫`;
        htmlMap.set(placeholder, match);
        counter++;
        return placeholder;
      });
    });

    return { cleanText, htmlMap };
  };

  /**
   * HTML tagek visszarakása a lefordított szövegbe
   * FONTOS: A ⟪N⟫ formátum matematikai Unicode karaktereket használ,
   * amelyeket a fordítók sosem fordítanak le!
   */
  const restoreHtmlTags = (translatedText: string, htmlMap: Map<string, string>): string => {
    let restoredText = translatedText;

    htmlMap.forEach((originalTag, placeholder) => {
      // A ⟪⟫ Unicode karaktereket is escapeljük a biztonság kedvéért
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Global replace - az összes előfordulást helyettesítjük
      const regex = new RegExp(escapedPlaceholder, 'g');
      restoredText = restoredText.replace(regex, originalTag);

    });

    return restoredText;
  };

  /**
   * Intelligens AI fordító - Több szolgáltatást próbál fallback sorrendben
   * 1. LibreTranslate (AI-alapú, legjobb minőség)
   * 2. MyMemory (jó minőség, gyors)
   * 3. Google Translate (fallback, mindig működik)
   *
   * FONTOS: Megvédi a HTML tageket a fordítás alatt!
   */
  const translateWithAI = async (
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<string> => {
    // Skip translation if source and target are the same
    if (mapLanguageCode(sourceLang) === mapLanguageCode(targetLang)) {
      return text;
    }

    // Védelem: HTML tagek kigyűjtése és placeholder-ekkel helyettesítése
    const { cleanText, htmlMap } = protectHtmlTags(text);

    const providers = [
      {
        name: 'LibreTranslate (AI)',
        fn: () => translateWithLibreTranslate(cleanText, sourceLang, targetLang)
      },
      {
        name: 'MyMemory',
        fn: () => translateWithMyMemory(cleanText, sourceLang, targetLang)
      },
      {
        name: 'Google Translate',
        fn: () => translateWithGoogle(cleanText, sourceLang, targetLang)
      }
    ];

    for (const provider of providers) {
      try {
        const result = await provider.fn();
        if (result && result !== cleanText) {
          // HTML tagek visszarakása a lefordított szövegbe
          const restoredResult = restoreHtmlTags(result, htmlMap);

          return restoredResult;
        }
      } catch (error) {
        console.warn(`❌ ${provider.name} translation failed, trying next provider...`);
        continue;
      }
    }

    // All providers failed, return original text
    console.warn('⚠️ All translation providers failed, using original text');
    return text;
  };

  /**
   * Szöveg fordítása több nyelvre egyszerre
   */
  const translateToMultipleLanguages = async (
    text: string,
    sourceLang: string,
    targetLangs: string[]
  ): Promise<TranslationResult> => {
    isTranslating.value = true;
    translationProgress.value = 0;

    try {
      const translations: Record<string, string> = {};
      const totalSteps = targetLangs.length;

      for (let i = 0; i < targetLangs.length; i++) {
        const targetLang = targetLangs[i];

        try {
          const translated = await translateWithAI(text, sourceLang, targetLang);
          translations[targetLang] = translated;
        } catch (error) {
          console.error(`Translation error for ${targetLang}:`, error);
          translations[targetLang] = text; // Fallback to original
        }

        translationProgress.value = ((i + 1) / totalSteps) * 100;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return {
        success: true,
        translations
      };
    } catch (error: any) {
      console.error('Translation error:', error);
      return {
        success: false,
        translations: {},
        error: error.message || 'Translation failed'
      };
    } finally {
      isTranslating.value = false;
      translationProgress.value = 0;
    }
  };

  /**
   * Dokumentum név fordítása minden nyelvre
   */
  const translateDocumentName = async (
    fileName: string,
    sourceLang: string = 'en'
  ): Promise<Record<string, string>> => {
    // Remove file extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

    const targetLangs = ['en', 'hu', 'sr'];
    const result = await translateToMultipleLanguages(nameWithoutExt, sourceLang, targetLangs);

    if (result.success) {
      // Add extension back to translations
      const translatedNames: Record<string, string> = {};
      for (const [lang, translatedName] of Object.entries(result.translations)) {
        translatedNames[lang] = translatedName + extension;
      }
      return translatedNames;
    }

    // Fallback: return original name for all languages
    return {
      en: fileName,
      hu: fileName,
      sr: fileName
    };
  };

  /**
   * Language code mapper (ISO 639-1)
   */
  const mapLanguageCode = (code: string): string => {
    const mapping: Record<string, string> = {
      'rs': 'sr', // Serbian (Cyrillic)
      'sr': 'sr', // Serbian
      'hu': 'hu', // Hungarian
      'en': 'en'  // English
    };
    return mapping[code.toLowerCase()] || code.toLowerCase();
  };

  return {
    // State
    isTranslating,
    translationProgress,

    // Methods
    translateWithAI,
    translateToMultipleLanguages,
    translateDocumentName,
    translateWithLibreTranslate,
    translateWithMyMemory,
    translateWithGoogle,
    mapLanguageCode
  };
}
