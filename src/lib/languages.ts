/**
 * Language information.
 * @property {string} languageName - The name of the language.
 * @property {string} threeLetterCode - The three-letter language code.
 * @property {string} twoLetterCode - The two-letter language code.
 * @property {string} localeName - The locale name of the language.
 */
type LanguageInfo = {
    languageName: string;
    threeLetterCode: string;
    twoLetterCode: string;
    localeName: string;
};

/**
 * Language data.
 * @type {Record<string, LanguageInfo>}
 * @property {string} languageCode - The language code.
 * @property {LanguageInfo} languageInfo - The language information.
 */
const languageData: Record<string, LanguageInfo> = {
    af: {
        languageName: 'Afrikaans',
        threeLetterCode: 'afr',
        twoLetterCode: 'af',
        localeName: 'Afrikaans'
    },
    am: {
        languageName: 'Amharic',
        threeLetterCode: 'amh',
        twoLetterCode: 'am',
        localeName: 'አማርኛ'
    },
    ar: {
        languageName: 'Arabic',
        threeLetterCode: 'ara',
        twoLetterCode: 'ar',
        localeName: 'العربية'
    },
    bg: {
        languageName: 'Bulgarian',
        threeLetterCode: 'bul',
        twoLetterCode: 'bg',
        localeName: 'български'
    },
    bn: {
        languageName: 'Bengali',
        threeLetterCode: 'ben',
        twoLetterCode: 'bn',
        localeName: 'বাংলা'
    },
    ca: {
        languageName: 'Catalan',
        threeLetterCode: 'cat',
        twoLetterCode: 'ca',
        localeName: 'català'
    },
    cs: {
        languageName: 'Czech',
        threeLetterCode: 'ces',
        twoLetterCode: 'cs',
        localeName: 'čeština'
    },
    cy: {
        languageName: 'Welsh',
        threeLetterCode: 'wel',
        twoLetterCode: 'cy',
        localeName: 'Cymraeg'
    },
    da: {
        languageName: 'Danish',
        threeLetterCode: 'dan',
        twoLetterCode: 'da',
        localeName: 'dansk'
    },
    de: {
        languageName: 'German',
        threeLetterCode: 'deu',
        twoLetterCode: 'de',
        localeName: 'Deutsch'
    },
    el: {
        languageName: 'Greek',
        threeLetterCode: 'ell',
        twoLetterCode: 'el',
        localeName: 'Ελληνικά'
    },
    en: {
        languageName: 'English',
        threeLetterCode: 'eng',
        twoLetterCode: 'en',
        localeName: 'English'
    },
    eo: {
        languageName: 'Esperanto',
        threeLetterCode: 'epo',
        twoLetterCode: 'eo',
        localeName: 'Esperanto'
    },
    es: {
        languageName: 'Spanish',
        threeLetterCode: 'spa',
        twoLetterCode: 'es',
        localeName: 'español'
    },
    et: {
        languageName: 'Estonian',
        threeLetterCode: 'est',
        twoLetterCode: 'et',
        localeName: 'eesti'
    },
    eu: {
        languageName: 'Basque',
        threeLetterCode: 'eus',
        twoLetterCode: 'eu',
        localeName: 'euskara'
    },
    fi: {
        languageName: 'Finnish',
        threeLetterCode: 'fin',
        twoLetterCode: 'fi',
        localeName: 'suomi'
    },
    fr: {
        languageName: 'French',
        threeLetterCode: 'fra',
        twoLetterCode: 'fr',
        localeName: 'français'
    },
    ga: {
        languageName: 'Irish',
        threeLetterCode: 'gle',
        twoLetterCode: 'ga',
        localeName: 'Gaeilge'
    },
    gu: {
        languageName: 'Gujarati',
        threeLetterCode: 'guj',
        twoLetterCode: 'gu',
        localeName: 'ગુજરાતી'
    },
    hi: {
        languageName: 'Hindi',
        threeLetterCode: 'hin',
        twoLetterCode: 'hi',
        localeName: 'हिन्दी'
    },
    hmn: {
        languageName: 'Hmong',
        threeLetterCode: 'hmn',
        twoLetterCode: 'hm',
        localeName: 'Hmong'
    },
    hr: {
        languageName: 'Croatian',
        threeLetterCode: 'hrv',
        twoLetterCode: 'hr',
        localeName: 'hrvatski'
    },
    ht: {
        languageName: 'Haitian Creole',
        threeLetterCode: 'hat',
        twoLetterCode: 'ht',
        localeName: 'Kreyòl Ayisyen'
    },
    hu: {
        languageName: 'Hungarian',
        threeLetterCode: 'hun',
        twoLetterCode: 'hu',
        localeName: 'magyar'
    },
    hy: {
        languageName: 'Armenian',
        threeLetterCode: 'arm',
        twoLetterCode: 'hy',
        localeName: 'հայերեն'
    },
    id: {
        languageName: 'Indonesian',
        threeLetterCode: 'ind',
        twoLetterCode: 'id',
        localeName: 'Indonesia'
    },
    is: {
        languageName: 'Icelandic',
        threeLetterCode: 'isl',
        twoLetterCode: 'is',
        localeName: 'íslenska'
    },
    it: {
        languageName: 'Italian',
        threeLetterCode: 'ita',
        twoLetterCode: 'it',
        localeName: 'italiano'
    },
    ja: {
        languageName: 'Japanese',
        threeLetterCode: 'jpn',
        twoLetterCode: 'ja',
        localeName: '日本語'
    },
    jv: {
        languageName: 'Javanese',
        threeLetterCode: 'jav',
        twoLetterCode: 'jv',
        localeName: 'Jawa'
    },
    ka: {
        languageName: 'Georgian',
        threeLetterCode: 'geo',
        twoLetterCode: 'ka',
        localeName: 'ქართული'
    },
    km: {
        languageName: 'Khmer',
        threeLetterCode: 'khm',
        twoLetterCode: 'km',
        localeName: 'ភាសាខ្មែរ'
    },
    kn: {
        languageName: 'Kannada',
        threeLetterCode: 'kan',
        twoLetterCode: 'kn',
        localeName: 'ಕನ್ನಡ'
    },
    ko: {
        languageName: 'Korean',
        threeLetterCode: 'kor',
        twoLetterCode: 'ko',
        localeName: '한국어'
    },
    ku: {
        languageName: 'Kurdish',
        threeLetterCode: 'kur',
        twoLetterCode: 'ku',
        localeName: 'Kurdî'
    },
    lo: {
        languageName: 'Lao',
        threeLetterCode: 'lao',
        twoLetterCode: 'lo',
        localeName: 'ລາວ'
    },
    lt: {
        languageName: 'Lithuanian',
        threeLetterCode: 'lit',
        twoLetterCode: 'lt',
        localeName: 'lietuvių'
    },
    lv: {
        languageName: 'Latvian',
        threeLetterCode: 'lav',
        twoLetterCode: 'lv',
        localeName: 'latviešu'
    },
    mk: {
        languageName: 'Macedonian',
        threeLetterCode: 'mac',
        twoLetterCode: 'mk',
        localeName: 'македонски'
    },
    ml: {
        languageName: 'Malayalam',
        threeLetterCode: 'mal',
        twoLetterCode: 'ml',
        localeName: 'മലയാളം'
    },
    mr: {
        languageName: 'Marathi',
        threeLetterCode: 'mar',
        twoLetterCode: 'mr',
        localeName: 'मराठी'
    },
    ms: {
        languageName: 'Malay',
        threeLetterCode: 'may',
        twoLetterCode: 'ms',
        localeName: 'Melayu'
    },
    mt: {
        languageName: 'Maltese',
        threeLetterCode: 'mlt',
        twoLetterCode: 'mt',
        localeName: 'Malti'
    },
    my: {
        languageName: 'Burmese',
        threeLetterCode: 'bur',
        twoLetterCode: 'my',
        localeName: 'မြန်မာ'
    },
    ne: {
        languageName: 'Nepali',
        threeLetterCode: 'nep',
        twoLetterCode: 'ne',
        localeName: 'नेपाली'
    },
    nl: {
        languageName: 'Dutch',
        threeLetterCode: 'nld',
        twoLetterCode: 'nl',
        localeName: 'Nederlands'
    },
    no: {
        languageName: 'Norwegian',
        threeLetterCode: 'nor',
        twoLetterCode: 'no',
        localeName: 'Norsk'
    },
    or: {
        languageName: 'Odia',
        threeLetterCode: 'ori',
        twoLetterCode: 'or',
        localeName: 'ଓଡ଼ିଆ'
    },
    pa: {
        languageName: 'Punjabi',
        threeLetterCode: 'pan',
        twoLetterCode: 'pa',
        localeName: 'ਪੰਜਾਬੀ'
    },
    pl: {
        languageName: 'Polish',
        threeLetterCode: 'pol',
        twoLetterCode: 'pl',
        localeName: 'polski'
    },
    pt: {
        languageName: 'Portuguese',
        threeLetterCode: 'por',
        twoLetterCode: 'pt',
        localeName: 'português'
    },
    qu: {
        languageName: 'Quechua',
        threeLetterCode: 'que',
        twoLetterCode: 'qu',
        localeName: 'Runa Simi'
    },
    ro: {
        languageName: 'Romanian',
        threeLetterCode: 'ron',
        twoLetterCode: 'ro',
        localeName: 'română'
    },
    ru: {
        languageName: 'Russian',
        threeLetterCode: 'rus',
        twoLetterCode: 'ru',
        localeName: 'русский'
    },
    rw: {
        languageName: 'Kinyarwanda',
        threeLetterCode: 'kin',
        twoLetterCode: 'rw',
        localeName: 'Kinyarwanda'
    },
    si: {
        languageName: 'Sinhala',
        threeLetterCode: 'sin',
        twoLetterCode: 'si',
        localeName: 'සිංහල'
    },
    sk: {
        languageName: 'Slovak',
        threeLetterCode: 'slk',
        twoLetterCode: 'sk',
        localeName: 'slovenčina'
    },
    sq: {
        languageName: 'Albanian',
        threeLetterCode: 'alb',
        twoLetterCode: 'sq',
        localeName: 'shqip'
    },
    sr: {
        languageName: 'Serbian',
        threeLetterCode: 'srp',
        twoLetterCode: 'sr',
        localeName: 'српски'
    },
    sv: {
        languageName: 'Swedish',
        threeLetterCode: 'swe',
        twoLetterCode: 'sv',
        localeName: 'svenska'
    },
    sw: {
        languageName: 'Swahili',
        threeLetterCode: 'swa',
        twoLetterCode: 'sw',
        localeName: 'Kiswahili'
    },
    te: {
        languageName: 'Telugu',
        threeLetterCode: 'tel',
        twoLetterCode: 'te',
        localeName: 'తెలుగు'
    },
    th: {
        languageName: 'Thai',
        threeLetterCode: 'tha',
        twoLetterCode: 'th',
        localeName: 'ไทย'
    },
    tl: {
        languageName: 'Tagalog',
        threeLetterCode: 'tgl',
        twoLetterCode: 'tl',
        localeName: 'Tagalog'
    },
    tr: {
        languageName: 'Turkish',
        threeLetterCode: 'tur',
        twoLetterCode: 'tr',
        localeName: 'Türkçe'
    },
    uz: {
        languageName: 'Uzbek',
        threeLetterCode: 'uzb',
        twoLetterCode: 'uz',
        localeName: 'O‘zbek'
    },
    vi: {
        languageName: 'Vietnamese',
        threeLetterCode: 'vie',
        twoLetterCode: 'vi',
        localeName: 'Tiếng Việt'
    },
    xh: {
        languageName: 'Xhosa',
        threeLetterCode: 'xho',
        twoLetterCode: 'xh',
        localeName: 'isiXhosa'
    },
    zh: {
        languageName: 'Chinese',
        threeLetterCode: 'zho',
        twoLetterCode: 'zh',
        localeName: '中文'
    },
    zu: {
        languageName: 'Zulu',
        threeLetterCode: 'zul',
        twoLetterCode: 'zu',
        localeName: 'isiZulu'
    }
};

/**
 * Gets the language information for a given language code.
 * @param languageCode - The language code to get the information for.
 * @returns {LanguageInfo | null} The language information or null if not found.
 */
export default function getLanguageInfo(languageCode: string): LanguageInfo | null {
    const language = languageData[languageCode.toLowerCase()];
    
    // If the language is not found, try to find it by the three-letter code
    if (!language) {
        for (const key in languageData) {
            if (languageData[key].threeLetterCode === languageCode.toLowerCase()) {
                return languageData[key];
            }
        }
    }

    // If the language is still not found, try to find it by the language name
    if (!language) {
        for (const key in languageData) {
            if (languageData[key].languageName.toLowerCase() === languageCode.toLowerCase()) {
                return languageData[key];
            }
        }
    }

    return language || null;
}