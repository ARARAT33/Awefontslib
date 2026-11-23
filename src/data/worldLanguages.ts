import { FontEntry, IsoWorldLanguage, ScriptCode } from '../types/font';
import isoLanguagesRaw from './isoWorldLanguages.json';

export interface WorldLanguageEntry {
  code: string;
  name: string;
  nativeName: string;
  script: ScriptCode;
  region: string;
  direction: 'ltr' | 'rtl';
  sampleSentence: string;
}

export interface StudioCharSet {
  id: string;
  label: string;
  region: string;
  direction: 'ltr' | 'rtl';
  chars: string[];
}

export const WORLD_LANGUAGES: WorldLanguageEntry[] = [
  // Caucasus & Anatolia
  { code: 'hy', name: 'Armenian (Eastern)', nativeName: 'Հայերեն', script: 'armenian', region: 'Armenia / Caucasus', direction: 'ltr', sampleSentence: 'Բնության գեղեցկությունը և մարդկային միտքը ստեղծում են հավերժական գրեր։' },
  { code: 'hyw', name: 'Armenian (Western)', nativeName: 'Արեւմտահայերէն', script: 'armenian', region: 'Armenian Diaspora', direction: 'ltr', sampleSentence: 'Ազատութիւն, լոյս եւ ստեղծագործ միտք հայկական տառարուեստին մէջ։' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', script: 'georgian', region: 'Georgia / Caucasus', direction: 'ltr', sampleSentence: 'ასომთავრული, ნუსხური და მხედრული დამწერლობის ჰარმონია.' },
  { code: 'ab', name: 'Abkhaz', nativeName: 'Аԥсуа бызшәа', script: 'cyrillic', region: 'Caucasus', direction: 'ltr', sampleSentence: 'Бзиа избоит аԥсуа бызшәеи ашәҟәыҩреи.' },
  { code: 'os', name: 'Ossetian', nativeName: 'Ирон æвзаг', script: 'cyrillic', region: 'Caucasus', direction: 'ltr', sampleSentence: 'Ирон фыссынад æмæ аивадон шрифттæ.' },
  { code: 'ce', name: 'Chechen', nativeName: 'Нохчийн мотт', script: 'cyrillic', region: 'North Caucasus', direction: 'ltr', sampleSentence: 'Нохчийн мотт а, исбаьхьа йоза а.' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan dili', script: 'latin', region: 'Caucasus / West Asia', direction: 'ltr', sampleSentence: 'Zəfər, zərif yazı sənəti və müasir tipoqrafiya.' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', script: 'latin', region: 'Anatolia / Europe', direction: 'ltr', sampleSentence: 'Pijamalı hasta yağız şoföre çabucak güvendi — Çağdaş Türkçe yazı sanatı.' },
  { code: 'ku', name: 'Kurdish (Kurmanji)', nativeName: 'Kurdî', script: 'latin', region: 'West Asia', direction: 'ltr', sampleSentence: 'Zimanê kurdî û hunera tîpografiya nûjen.' },
  { code: 'ckb', name: 'Kurdish (Sorani)', nativeName: 'کوردیی ناوەندی', script: 'arabic', region: 'West Asia', direction: 'rtl', sampleSentence: 'هونەری خۆشنووسی و دیزاینی پیتەکانی کوردی.' },

  // Europe (Latin, Cyrillic, Greek)
  { code: 'en', name: 'English', nativeName: 'English', script: 'latin', region: 'Global', direction: 'ltr', sampleSentence: 'Sphinx of black quartz, judge my vow — Universal typography.' },
  { code: 'fr', name: 'French', nativeName: 'Français', script: 'latin', region: 'Europe / Francophonie', direction: 'ltr', sampleSentence: 'Voix ambiguë d’un cœur qui, au zéphyr, préfère les jattes de kiwis.' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', script: 'latin', region: 'Central Europe', direction: 'ltr', sampleSentence: 'Zwölf Boxkämpfer jagen Viktor quer über den großen Sylter Deich.' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', script: 'latin', region: 'Iberia / Americas', direction: 'ltr', sampleSentence: 'El veloz murciélago hindú comía feliz cardillo y kiwi.' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', script: 'latin', region: 'Lusophone World', direction: 'ltr', sampleSentence: 'Luís argüia à Júlia que «brações, fé, chá, óxido, pôr, zângão» eram palavras.' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', script: 'latin', region: 'Southern Europe', direction: 'ltr', sampleSentence: 'Pranzo d’acqua fa volti sghembi — Tradizione tipografica italiana.' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', script: 'latin', region: 'Western Europe', direction: 'ltr', sampleSentence: 'Pa’s wijze lynx bezag vroom het fikse aquaduct.' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', script: 'latin', region: 'Central Europe', direction: 'ltr', sampleSentence: 'Pchnąć w tę łódź jeża lub ośm skrzyń fig — Polska typografia.' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', script: 'latin', region: 'Central Europe', direction: 'ltr', sampleSentence: 'Příliš žluťoučký kůň úpěl ďábelské ódy.' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', script: 'latin', region: 'Central Europe', direction: 'ltr', sampleSentence: 'Kŕdeľ ďatľov učí koňa žrať kôru a moderné písmo.' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', script: 'latin', region: 'Central Europe', direction: 'ltr', sampleSentence: 'Árvíztűrő tükörfúrógép — Magyar tipográfiai harmónia.' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', script: 'latin', region: 'Eastern Europe', direction: 'ltr', sampleSentence: 'Muzicologă în bej vând whisky și tequila, preț fix.' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', script: 'cyrillic', region: 'Eastern Europe / Eurasia', direction: 'ltr', sampleSentence: 'Съешь же ещё этих мягких французских булок, да выпей чаю.' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', script: 'cyrillic', region: 'Eastern Europe', direction: 'ltr', sampleSentence: 'Чуєш їх, доцю, га? Кумедна ж ти, прощайся без ґольфів!' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', script: 'cyrillic', region: 'Eastern Europe', direction: 'ltr', sampleSentence: 'У Іўі худы жвавы чорт у зялёнай камізэльцы пабег па’есці.' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', script: 'cyrillic', region: 'Balkans', direction: 'ltr', sampleSentence: 'Жълтата дюля беше щастлива, че пухът, който цъфна, замръзна като гьон.' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски / Srpski', script: 'cyrillic', region: 'Balkans', direction: 'ltr', sampleSentence: 'Ајшо, лепото и чежњо, за љубав срца мога дођи у Хаџиће на кафу.' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', script: 'latin', region: 'Balkans', direction: 'ltr', sampleSentence: 'Gojazni đačić s biciklom drži hmelj i finu vatu u džepu nošnje.' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', script: 'latin', region: 'Balkans', direction: 'ltr', sampleSentence: 'Fin džip, gluh jež i čvrst konj dođoše u Sarajevo.' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', script: 'latin', region: 'Central Europe', direction: 'ltr', sampleSentence: 'Šerif bo za vajo spet kuhal domače žgance.' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', script: 'cyrillic', region: 'Balkans', direction: 'ltr', sampleSentence: 'Ѕидарски пејзаж: шумадиски џин и ќорав фазанер.' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', script: 'greek', region: 'Greece / Cyprus', direction: 'ltr', sampleSentence: 'Τάχιστη αλώπηξ βαφής ψημένη γη, δρασκελίζει υπέρ νωθρού κυνός.' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', script: 'latin', region: 'Balkans', direction: 'ltr', sampleSentence: 'Gjuha shqipe dhe bukuria e shkronjave moderne.' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', script: 'latin', region: 'Baltic', direction: 'ltr', sampleSentence: 'Įlinkdama fechtuotojo špaga sublykčiojusi pragręžė apvalų arbūzą.' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', script: 'latin', region: 'Baltic', direction: 'ltr', sampleSentence: 'Muļķa hipiji mēģina brīvi nogaršot celofāna žņaudzējčūsku.' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', script: 'latin', region: 'Baltic', direction: 'ltr', sampleSentence: 'Põdur Zagrebi tšellomängija-följetonist Ciqo külmetas kehvas garaažis.' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', script: 'latin', region: 'Nordics', direction: 'ltr', sampleSentence: 'Törkylempijävongahdus — Suomalainen selkeä typografia.' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', script: 'latin', region: 'Nordics', direction: 'ltr', sampleSentence: 'Flygande bäckasiner söka hwila på mjuka tuvor.' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', script: 'latin', region: 'Nordics', direction: 'ltr', sampleSentence: 'Vår sære Zulu fra badeøya spilte jo whist og quickstep i min taxi.' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', script: 'latin', region: 'Nordics', direction: 'ltr', sampleSentence: 'Quizdeltagerne spiste jordbær med fløde, mens cirkusklovnen Walther spillede på xylofon.' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', script: 'latin', region: 'Nordics', direction: 'ltr', sampleSentence: 'Kæmi ný öxi hér ykist þjófum nú bæði víl og ádrepa.' },
  { code: 'fo', name: 'Faroese', nativeName: 'Føroyskt', script: 'latin', region: 'North Atlantic', direction: 'ltr', sampleSentence: 'Føroyskt mál og norrøn skriftlist í nútíðar sniði.' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', script: 'latin', region: 'Ireland', direction: 'ltr', sampleSentence: 'D’fhuascail Íosa Úrmhac na hÓighe Beannaithe pór Éava agus Ádhaimh.' },
  { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig', script: 'latin', region: 'Scotland', direction: 'ltr', sampleSentence: 'Litrichean àrsaidh is clò-bhualadh ùr-nodha na Gàidhlig.' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', script: 'latin', region: 'Wales', direction: 'ltr', sampleSentence: 'Parciais fy jac codi baw hud llawn dŵr ger tŷ Mynwy.' },
  { code: 'br', name: 'Breton', nativeName: 'Brezhoneg', script: 'latin', region: 'Brittany', direction: 'ltr', sampleSentence: 'Lizherenneg ha lizherennerezh ar brezhoneg a-vremañ.' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', script: 'latin', region: 'Basque Country', direction: 'ltr', sampleSentence: 'Euskal tipografia tradizionala eta diseinu garaikidea.' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', script: 'latin', region: 'Catalonia / Iberia', direction: 'ltr', sampleSentence: 'Jove xef, porti whisky amb quinze glaçons d’hidrogen, coi!' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', script: 'latin', region: 'Galicia', direction: 'ltr', sampleSentence: 'A beleza das letras galegas na tipografía moderna.' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', script: 'latin', region: 'Malta', direction: 'ltr', sampleSentence: 'Kienet ħolma sabiħa tal-kitba Maltija u l-ittri moderni.' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', script: 'latin', region: 'International', direction: 'ltr', sampleSentence: 'Eĥoŝanĝo ĉiuĵaŭde — Universala tipografio por ĉiuj lingvoj.' },
  { code: 'la', name: 'Latin (Classical)', nativeName: 'Latina', script: 'latin', region: 'Classical Heritage', direction: 'ltr', sampleSentence: 'Sic gorgiamus allos subjectatos nunc — Scriptura Romana.' },

  // Central Asia & Eurasia
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', script: 'cyrillic', region: 'Central Asia', direction: 'ltr', sampleSentence: 'Қазақ әліпбиі мен заманауи кирилл типографиясы.' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', script: 'cyrillic', region: 'Central Asia', direction: 'ltr', sampleSentence: 'Кыргыз тили жана заманбап тамга чеберчилиги.' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', script: 'latin', region: 'Central Asia', direction: 'ltr', sampleSentence: 'Oʻzbek yozuvi va zamonaviy matbaa sanʼati.' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', script: 'latin', region: 'Central Asia', direction: 'ltr', sampleSentence: 'Türkmen ýazuwy we häzirki zaman şrift sungaty.' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', script: 'cyrillic', region: 'Central Asia', direction: 'ltr', sampleSentence: 'Забони тоҷикӣ ва санъати хушнависии муосир.' },
  { code: 'mn', name: 'Mongolian (Cyrillic)', nativeName: 'Монгол хэл', script: 'cyrillic', region: 'East / Central Asia', direction: 'ltr', sampleSentence: 'Монгол бичиг болон орчин үеийн үсгийн урлаг.' },
  { code: 'mvf', name: 'Mongolian (Traditional)', nativeName: 'ᠮᠣᠩᠭᠣᠯ  бичиг', script: 'global-other', region: 'Mongolia', direction: 'ltr', sampleSentence: 'ᠮᠣᠩᠭᠣᠯ ᠪᠢᠴᠢᠭ ᠤᠨ ᠤᠷᠠᠯᠢᠭ — Traditional Mongolian Script.' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татарча', script: 'cyrillic', region: 'Eurasia', direction: 'ltr', sampleSentence: 'Татар теле һәм заманча шрифт сәнгате.' },
  { code: 'ba', name: 'Bashkir', nativeName: 'Башҡортса', script: 'cyrillic', region: 'Eurasia', direction: 'ltr', sampleSentence: 'Башҡорт теле һәм матур яҙма өлгөләре.' },
  { code: 'cv', name: 'Chuvash', nativeName: 'Чӑвашла', script: 'cyrillic', region: 'Eurasia', direction: 'ltr', sampleSentence: 'Чӑваш чӗлхипе хальхи шрифт ӳнерӗ.' },
  { code: 'sah', name: 'Sakha (Yakut)', nativeName: 'Саха тыла', script: 'cyrillic', region: 'Siberia', direction: 'ltr', sampleSentence: 'Саха тыла уонна аныгы сурук-бичик ускуустубата.' },

  // Middle East & North Africa
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', script: 'arabic', region: 'Middle East / North Africa', direction: 'rtl', sampleSentence: 'أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ — جمال الخط العربي' },
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', script: 'persian', region: 'Iran / Afghanistan / Tajikistan', direction: 'rtl', sampleSentence: 'خط نستعلیق و نسخ در هنر خوشنویسی ایرانی و فارسی' },
  { code: 'prs', name: 'Dari', nativeName: 'دری', script: 'persian', region: 'Afghanistan', direction: 'rtl', sampleSentence: 'هنر خوشنویسی و تایپوگرافی معاصر زبان دری' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', script: 'arabic', region: 'Afghanistan / Pakistan', direction: 'rtl', sampleSentence: 'د پښتو ژبې ښکلی خط او عصري لیکدود.' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'arabic', region: 'Pakistan / India', direction: 'rtl', sampleSentence: 'اردو زبان کی دلکش نستعلیق اور جدید خطاطی۔' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', script: 'arabic', region: 'Pakistan / India', direction: 'rtl', sampleSentence: 'سنڌي ٻولي ۽ خوبصورت عربي خطاطي جو فن.' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە', script: 'arabic', region: 'Central Asia', direction: 'rtl', sampleSentence: 'ئۇيغۇر تىلى ۋە زامانىۋى خەتتاتلىق سەنئىتى.' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', script: 'hebrew', region: 'Israel / Diaspora', direction: 'rtl', sampleSentence: 'דג סקרן שט בים מאוכזב ולפתע מצא חברה — אותיות עבריות' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', script: 'hebrew', region: 'Global Diaspora', direction: 'rtl', sampleSentence: 'ייִדישע ליטעראַטור און מאָדערנע טיפּאָגראַפֿיע.' },
  { code: 'syr', name: 'Syriac / Aramaic', nativeName: 'ܣܘܪܝܝܐ', script: 'global-other', region: 'Mesopotamia / Levant', direction: 'rtl', sampleSentence: 'ܣܦܪܐ ܣܘܪܝܝܐ — Syriac & Aramaic Classical Typography.' },
  { code: 'ber', name: 'Tamazight (Tifinagh)', nativeName: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', script: 'global-other', region: 'North Africa / Sahel', direction: 'ltr', sampleSentence: 'ⵜⵉⴼⵉⵏⴰⵖ ⵏ ⵉⵎⴰⵣⵉⵖⵏ — Neo-Tifinagh World Script.' },
  { code: 'dv', name: 'Dhivehi (Thaana)', nativeName: 'ދިވެހި', script: 'global-other', region: 'Maldives', direction: 'rtl', sampleSentence: 'ދިވެހިބަހާއި ތާނަ އަކުރުގެ ރީތިކަން.' },

  // Sub-Saharan Africa
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', script: 'ethiopic', region: 'Ethiopia', direction: 'ltr', sampleSentence: 'ሰላም ለዓለም — የኢትዮጵያ ፊደላትና ዘመናዊ የጽሑፍ ጥበብ።' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', script: 'ethiopic', region: 'Eritrea / Ethiopia', direction: 'ltr', sampleSentence: 'ሰላምን ፍቕርን — ፊደላት ግዕዝን ዘመናዊ ጽሕፈትን።' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', script: 'latin', region: 'East Africa', direction: 'ltr', sampleSentence: 'Afaan Oromoo fi aartii qubee ammayyaa.' },
  { code: 'so', name: 'Somali', nativeName: 'Af-Soomaali', script: 'latin', region: 'Horn of Africa', direction: 'ltr', sampleSentence: 'Afka Soomaaliga iyo farshaxanka xarfaha casriga ah.' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', script: 'latin', region: 'East Africa', direction: 'ltr', sampleSentence: 'Ulimwengu wa maandishi na uchapaji wa Kiswahili.' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa / هَوُسَ', script: 'latin', region: 'West Africa', direction: 'ltr', sampleSentence: 'Harshen Hausa da fasahar rubutun zamani — ƙ ɓ ɗ.' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', script: 'latin', region: 'West Africa', direction: 'ltr', sampleSentence: 'Èdè Yorùbá àti iṣẹ́ ọnà àtẹ̀jáde ìgbàlódé — ẹ ọ ṣ.' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', script: 'latin', region: 'West Africa', direction: 'ltr', sampleSentence: 'Asụsụ Igbo na nkà nke edemede ọgbara ọhụrụ.' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', script: 'latin', region: 'Southern Africa', direction: 'ltr', sampleSentence: 'Ulimi lwesiZulu nobuciko bokubhala banamuhla.' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', script: 'latin', region: 'Southern Africa', direction: 'ltr', sampleSentence: 'Ulwimi lwesiXhosa nobugcisa bokubhala.' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', script: 'latin', region: 'Southern Africa', direction: 'ltr', sampleSentence: 'Die vinnige bruin jakkals spring oor die lui hond.' },
  { code: 'ff', name: 'Fulani (Adlam)', nativeName: '𞤆𞤵𞤤𞤢𞤪 / Pulaar', script: 'global-other', region: 'West & Central Africa', direction: 'rtl', sampleSentence: '𞤀𞤁𞤂𞤀𞤃 — 𞤅𞤭𞤲𞤣𞤭 𞤢𞤣𞤤𞤢𞤥 𞤫 𞤲𞤢𞤲𞤣𞤫 𞤨𞤵𞤤𞤢𞤪.' },
  { code: 'nqo', name: 'Manding (N’Ko)', nativeName: 'ߒߞߏ', script: 'global-other', region: 'West Africa', direction: 'rtl', sampleSentence: 'ߒߞߏ ߛߓߍߛߎ߲ ߣߌ߫ ߓߌ߬ߟߊ߬ߒߞߐ߬ߣߌ߲.' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof', script: 'latin', region: 'West Africa', direction: 'ltr', sampleSentence: 'Làkku Wolof ak bind bu bees bi ci àdduna bi.' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', script: 'latin', region: 'East / Central Africa', direction: 'ltr', sampleSentence: 'Ururimi rw’Ikinyarwanda n’ubuhanzi bw’inyuguti.' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', script: 'latin', region: 'Madagascar', direction: 'ltr', sampleSentence: 'Ny teny malagasy sy ny kanto amin’ny fanoratana.' },
  { code: 'vai', name: 'Vai', nativeName: 'ꕙꔤ', script: 'global-other', region: 'Liberia / Sierra Leone', direction: 'ltr', sampleSentence: 'ꕙꔤ ꗋꖻ — West African Vai Syllabary.' },

  // South Asia (Indic)
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'devanagari', region: 'India', direction: 'ltr', sampleSentence: 'सत्यमेव जयते — विविध लिपियों और आधुनिक मुद्रण कला का संगम।' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'devanagari', region: 'India / Classical', direction: 'ltr', sampleSentence: 'वसुधैव कुटुम्बकम् — देवनागरी लिपि सौन्दर्यम्।' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'devanagari', region: 'India', direction: 'ltr', sampleSentence: 'मराठी भाषा आणि आधुनिक देवनागरी मुद्रणकला.' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'devanagari', region: 'Nepal / India', direction: 'ltr', sampleSentence: 'नेपाली भाषा र देवनागरी अक्षर कलाको सुन्दरता।' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'bengali', region: 'Bangladesh / India', direction: 'ltr', sampleSentence: 'আমার সোনার বাংলা — আধুনিক বাংলা মুদ্রাক্ষর নকশা।' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'bengali', region: 'Northeast India', direction: 'ltr', sampleSentence: 'অসমীয়া ভাষা আৰু আধুনিক মুদ্ৰণ শিল্প।' },
  { code: 'pa', name: 'Punjabi (Gurmukhi)', nativeName: 'ਪੰਜਾਬੀ', script: 'indic-other', region: 'Punjab / India', direction: 'ltr', sampleSentence: 'ਪੰਜਾਬੀ ਬੋਲੀ ਅਤੇ ਗੁਰਮੁਖੀ ਲਿਪੀ ਦੀ ਸੁੰਦਰਤਾ।' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'indic-other', region: 'Gujarat / India', direction: 'ltr', sampleSentence: 'ગુજરાતી ભાષા અને આધુનિક મુદ્રણ કલા.' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'indic-other', region: 'Odisha / India', direction: 'ltr', sampleSentence: 'ଓଡ଼ିଆ ଭାଷା ଏବଂ ଆଧୁନିକ ମୁଦ୍ରଣ କଳା।' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'tamil', region: 'South India / Sri Lanka / Singapore', direction: 'ltr', sampleSentence: 'யாதும் ஊரே யாவரும் கேளிர் — தமிழ் அச்சுக்கலை.' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'indic-other', region: 'Andhra / Telangana', direction: 'ltr', sampleSentence: 'దేశ భాషలందు తెలుగు లెస్స — ఆధునిక తెలుగు అక్షర కళ.' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'indic-other', region: 'Karnataka / India', direction: 'ltr', sampleSentence: 'ಕನ್ನಡ ನಾಡು ನುಡಿ ಮತ್ತು ಆಧುನਿਕ ಮುದ್ರಣ ಕಲೆ.' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'indic-other', region: 'Kerala / India', direction: 'ltr', sampleSentence: 'മലയാള ഭാഷയും ആധുനിക അക്ഷരകലയും.' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', script: 'indic-other', region: 'Sri Lanka', direction: 'ltr', sampleSentence: 'සිංහල භාෂාව සහ නවීන මුද්‍රණ කලාව.' },
  { code: 'sat', name: 'Santali (Ol Chiki)', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'global-other', region: 'Eastern India', direction: 'ltr', sampleSentence: 'ᱥᱟᱱᱛᱟᱲᱤ ᱯᱟᱹᱨᱥᱤ — Ol Chiki Script.' },

  // East & Southeast Asia
  { code: 'zh-Hans', name: 'Chinese (Simplified)', nativeName: '简体中文', script: 'cjk-sc', region: 'Mainland China / Singapore', direction: 'ltr', sampleSentence: '天地玄黄，宇宙洪荒。现代字体设计与传统书法美学。' },
  { code: 'zh-Hant', name: 'Chinese (Traditional)', nativeName: '繁體中文', script: 'cjk-tc', region: 'Taiwan / Hong Kong / Macau', direction: 'ltr', sampleSentence: '龍騰虎躍，筆墨紙硯。繁體漢字字體工藝與現代排版。' },
  { code: 'yue', name: 'Cantonese', nativeName: '粵語', script: 'cjk-tc', region: 'Hong Kong / Guangdong', direction: 'ltr', sampleSentence: '粵語字體設計與傳統港式排版美學。' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', script: 'japanese', region: 'Japan', direction: 'ltr', sampleSentence: 'いろはにほへと ちりぬるを — 明朝体とゴシック体の調和' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', script: 'korean', region: 'Korea', direction: 'ltr', sampleSentence: '다람쥐 헌 쳇바퀴에 타고파 — 현대 한글 타이포그래피' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', script: 'latin', region: 'Vietnam', direction: 'ltr', sampleSentence: 'Tiếng Việt giàu đẹp với nghệ thuật chữ quốc ngữ hiện đại.' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', script: 'thai', region: 'Thailand', direction: 'ltr', sampleSentence: 'เป็นมนุษย์สุดประเสริฐเลิศคุณค่า — ศิลปะตัวอักษรไทยสมัยใหม่' },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', script: 'global-other', region: 'Laos', direction: 'ltr', sampleSentence: 'ພາສາລາວ ແລະ ສິລະປະການອອກແບບຕົວອັກສອນ.' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', script: 'global-other', region: 'Cambodia', direction: 'ltr', sampleSentence: 'អក្សរខ្មែរ និងសិល្បៈអក្ខរក្រមសម័យទំនើប។' },
  { code: 'my', name: 'Burmese (Myanmar)', nativeName: 'မြန်မာဘာသာ', script: 'global-other', region: 'Myanmar', direction: 'ltr', sampleSentence: 'မြန်မာစာနှင့် ခေတ်မီစာလုံးဒီဇိုင်းအနုပညာ။' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་ཡིག', script: 'global-other', region: 'Tibet / Himalayas', direction: 'ltr', sampleSentence: 'བོད་ཡིག་དང་དེང་རབས་ཡིག་གཟུགས་སྒྱུ་རྩལ།' },
  { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ', script: 'global-other', region: 'Bhutan', direction: 'ltr', sampleSentence: 'རྫོང་ཁའི་ཡི་གུ་དང་དེང་སང་ཡིག་གཟུགས་བཟོ་རིག།' },
  { code: 'tl', name: 'Tagalog / Filipino', nativeName: 'Wikang Filipino', script: 'latin', region: 'Philippines', direction: 'ltr', sampleSentence: 'Wikang Filipino at makabagong sining ng mga titik.' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Sinugboanon', script: 'latin', region: 'Philippines', direction: 'ltr', sampleSentence: 'Sinugboanong pinulongan ug arte sa pag-imprenta.' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', script: 'latin', region: 'Indonesia', direction: 'ltr', sampleSentence: 'Bahasa Indonesia dan seni tipografi Nusantara modern.' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', script: 'latin', region: 'Malaysia / Brunei / Singapore', direction: 'ltr', sampleSentence: 'Bahasa Melayu dan seni reka bentuk huruf moden.' },
  { code: 'jv', name: 'Javanese', nativeName: 'ꦧꦱꦗꦮ / Basa Jawa', script: 'global-other', region: 'Java / Indonesia', direction: 'ltr', sampleSentence: 'ꦲꦤꦕꦫꦏ — Aksara Jawa lan seni tulisan tradisional.' },
  { code: 'su', name: 'Sundanese', nativeName: 'ᮘᮞ ᮞᮥᮔ᮪ᮓ', script: 'global-other', region: 'West Java', direction: 'ltr', sampleSentence: 'ᮃᮊ᮪ᮞᮛ ᮞᮥᮔ᮪ᮓ — Sundanese Traditional Script.' },
  { code: 'ban', name: 'Balinese', nativeName: 'ᬩᬲᬩᬮᬶ', script: 'global-other', region: 'Bali / Indonesia', direction: 'ltr', sampleSentence: 'ᬅᬓ᭄ᬱᬭᬩᬮᬶ — Balinese Palm-Leaf Typography.' },

  // Americas & Oceania
  { code: 'chr', name: 'Cherokee', nativeName: 'ᏣᎳᎩ ᎦᏬᏂᎯᏍᏗ', script: 'global-other', region: 'North America', direction: 'ltr', sampleSentence: 'ᏣᎳᎩ ᎦᏬᏂᎯᏍᏗ — Sequoyah Cherokee Syllabary Typography.' },
  { code: 'iu', name: 'Inuktitut (Syllabics)', nativeName: 'ᐃᓄᒃᑎᑐᑦ', script: 'global-other', region: 'Arctic Canada', direction: 'ltr', sampleSentence: 'ᐃᓄᒃᑎᑐᑦ ᑎᑎᕋᐅᓯᖅ — Canadian Aboriginal Syllabics.' },
  { code: 'cr', name: 'Cree (Syllabics)', nativeName: 'ᓀᐦᐃᔭᐍᐏᐣ', script: 'global-other', region: 'Canada', direction: 'ltr', sampleSentence: 'ᓀᐦᐃᔭᐍᐏᐣ — Plains & Swampy Cree Syllabics.' },
  { code: 'nv', name: 'Navajo', nativeName: 'Diné bizaad', script: 'latin', region: 'North America', direction: 'ltr', sampleSentence: 'Diné bizaad dóó akʼeʼelchííh — Naabeehó.' },
  { code: 'qu', name: 'Quechua', nativeName: 'Runasimi', script: 'latin', region: 'Andes / South America', direction: 'ltr', sampleSentence: 'Runasimi qillqay — Anti suyukunap simin.' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañeʼẽ', script: 'latin', region: 'South America', direction: 'ltr', sampleSentence: 'Avañeʼẽ ha tairenda pyahu — Paraguái.' },
  { code: 'nah', name: 'Nahuatl', nativeName: 'Nāhuatlahtōlli', script: 'latin', region: 'Mesoamerica', direction: 'ltr', sampleSentence: 'Nāhuatlahtōlli īhuān yancuīc tlahtōlcuīcatl.' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', script: 'latin', region: 'Polynesia / Pacific', direction: 'ltr', sampleSentence: 'ʻŌlelo Hawaiʻi — Kahakō me ka ʻokina ma ka paʻi palapala.' },
  { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori', script: 'latin', region: 'Aotearoa / New Zealand', direction: 'ltr', sampleSentence: 'Ko te reo Māori te mauri o te mana Māori.' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Sāmoa', script: 'latin', region: 'Polynesia / Samoa', direction: 'ltr', sampleSentence: 'O le gagana Sāmoa ma le faatufugaga o tusitusiga.' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea faka-Tonga', script: 'latin', region: 'Polynesia / Tonga', direction: 'ltr', sampleSentence: 'Lea faka-Tonga mo e tohi fakaonopooni.' },
  { code: 'fj', name: 'Fijian', nativeName: 'Na Vosa Vakaviti', script: 'latin', region: 'Melanesia / Fiji', direction: 'ltr', sampleSentence: 'Na vosa vakaviti kei na droini ni matanivola.' },

  // Historical, Phonetic & Symbolic
  { code: 'cop', name: 'Coptic', nativeName: 'ⲙⲉⲧⲣⲉⲙⲛ̀ⲭⲏⲙⲓ', script: 'greek', region: 'Egypt / Historical', direction: 'ltr', sampleSentence: 'ⲀⲂⲄⲆⲈⲋⲌⲎⲐ — Coptic Liturgical & Scholarly Script.' },
  { code: 'cu', name: 'Old Church Slavonic', nativeName: 'Словѣньскъ ѩзыкъ', script: 'cyrillic', region: 'Historical Eurasia', direction: 'ltr', sampleSentence: 'Азъ боукы вѣдѣ глаголи добро єсть.' },
  { code: 'ipa', name: 'IPA Phonetic Notation', nativeName: 'ɑ ˈbɛt ə ŋ θ ʃ ʒ', script: 'symbolic', region: 'Universal Linguistics', direction: 'ltr', sampleSentence: '[ˈpæŋɡlɒs taɪp] /tʰiː ɑːr ə ŋ ʃ ʒ ʤ ʔ ʘ/ International Phonetic Alphabet.' },
  { code: 'braille', name: 'Braille Tactile Patterns', nativeName: '⠏⠁⠝⠛⠇⠕⠎⠎', script: 'symbolic', region: 'Universal Tactile', direction: 'ltr', sampleSentence: '⠏⠁⠝⠛⠇⠕⠎⠎ ⠞⠽⠏⠑ — Universal 6- & 8-Dot Braille Patterns.' },
  { code: 'math', name: 'Mathematics & Technical', nativeName: '∀ ∑ ∏ √ ∞ ≠ ≡ λ', script: 'symbolic', region: 'STEM & Computing', direction: 'ltr', sampleSentence: '∀ x ∈ ℝ, ∫₀^∞ e^(-x²) dx = √π / 2 · λ => { 0123456789 }' },
];

export const STUDIO_WORLD_CHARSETS: StudioCharSet[] = [
  {
    id: 'armenian-upper',
    label: 'Armenian Upper (Ա–Ֆ)',
    region: 'Armenia',
    direction: 'ltr',
    chars: Array.from('ԱԲԳԴԵԶԷԸԹԺԻԼԽԾԿՀՁՂՃՄՅՆՇՈՉՊՋՌՍՎՏՐՑՒՓՔՕՖ'),
  },
  {
    id: 'armenian-lower',
    label: 'Armenian Lower (ա–ֆ)',
    region: 'Armenia',
    direction: 'ltr',
    chars: Array.from('աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆև'),
  },
  {
    id: 'armenian-punct',
    label: 'Armenian Punctuation & Dram',
    region: 'Armenia',
    direction: 'ltr',
    chars: Array.from('՚՛՜՝՞՟։֊֏'),
  },
  {
    id: 'latin-upper',
    label: 'Latin Uppercase (A–Z)',
    region: 'Global',
    direction: 'ltr',
    chars: Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
  },
  {
    id: 'latin-lower',
    label: 'Latin Lowercase (a–z)',
    region: 'Global',
    direction: 'ltr',
    chars: Array.from('abcdefghijklmnopqrstuvwxyz'),
  },
  {
    id: 'latin-diacritics',
    label: 'European, African & Vietnamese Latin Ext',
    region: 'Europe / Africa / Vietnam',
    direction: 'ltr',
    chars: Array.from('ÁÀÂÄÃÅÆÇÉÈÊËÍÌÎÏÑÓÒÔÖÕØŒÚÙÛÜÝŸßáàâäãåæçéèêëíìîïñóòôöõøœúùûüýÿŠŽČŘĚŮŁŃŚŹŻĞİŞƏƁƊƘẸỌṢĂĐƠƯ'),
  },
  {
    id: 'georgian-mkhedruli',
    label: 'Georgian Mkhedruli (ა–ჰ)',
    region: 'Georgia',
    direction: 'ltr',
    chars: Array.from('აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰ'),
  },
  {
    id: 'georgian-asomtavruli',
    label: 'Georgian Asomtavruli (Ⴀ–Ⴠ)',
    region: 'Georgia',
    direction: 'ltr',
    chars: Array.from('ႠႡႢႣႤႥႦႧႨႩႪႫႬႭႮႯႰႱႲႳႴႵႶႷႸႹႺႻႼႽႾႿჀ'),
  },
  {
    id: 'cyrillic-upper',
    label: 'Cyrillic Uppercase (А–Я)',
    region: 'Eastern Europe / Eurasia',
    direction: 'ltr',
    chars: Array.from('АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'),
  },
  {
    id: 'cyrillic-ext',
    label: 'Cyrillic Eurasian Ext (ІЇЄҐҚҒҢҮҰҺӨӘЂЉЊЋЏ)',
    region: 'Ukraine / Balkans / Central Asia',
    direction: 'ltr',
    chars: Array.from('ІЇЄҐЎҚҒҢҮҰҺӨӘҶӢӮҒЂЉЊЋЏЅЈ'),
  },
  {
    id: 'greek',
    label: 'Greek Alphabet (Α–Ω, α–ω)',
    region: 'Greece / Cyprus',
    direction: 'ltr',
    chars: Array.from('ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρσςτυφχψω'),
  },
  {
    id: 'coptic',
    label: 'Coptic Alphabet (Ⲁ–Ⲱ)',
    region: 'Egypt / Historical',
    direction: 'ltr',
    chars: Array.from('ⲀⲂⲄⲆⲈⲊⲌⲎⲐⲒⲔⲖⲘⲚⲜⲞⲠⲢⲤⲦⲨⲪⲬⲮⲰ'),
  },
  {
    id: 'arabic',
    label: 'Arabic Abjad (ا–ي)',
    region: 'Middle East / North Africa',
    direction: 'rtl',
    chars: Array.from('ابتثجحخدذرزسشصضطظعغفقكلمنهويءآأؤإئىة٠١٢٣٤٥٦٧٨٩'),
  },
  {
    id: 'persian-urdu',
    label: 'Persian, Pashto & Urdu Ext (پ چ ژ گ ڈ ڑ ے)',
    region: 'Iran / Afghanistan / Pakistan',
    direction: 'rtl',
    chars: Array.from('پچژگکھیٹڈڑںہھئےټځڅډړږګڼ۱۲۳۴۵۶۷۸۹۰'),
  },
  {
    id: 'hebrew',
    label: 'Hebrew & Yiddish Alef-Bet (א–ת)',
    region: 'Israel / Diaspora',
    direction: 'rtl',
    chars: Array.from('אבגדהוזחטיכךלמםנןסעפףצץקרשתװױײ'),
  },
  {
    id: 'syriac',
    label: 'Syriac / Aramaic (ܐ–ܬ)',
    region: 'Mesopotamia',
    direction: 'rtl',
    chars: Array.from('ܐܒܓܕܗܘܙܚܛܝܟܠܡܢܣܥܦܨܩܪܫܬ'),
  },
  {
    id: 'thaana',
    label: 'Thaana / Dhivehi (ހ–ޱ)',
    region: 'Maldives',
    direction: 'rtl',
    chars: Array.from('ހށނރބޅކއވމފދތލގޏސޑޒޓޔޕޖޗ'),
  },
  {
    id: 'devanagari',
    label: 'Devanagari (Hindi / Sanskrit / Marathi)',
    region: 'India / Nepal',
    direction: 'ltr',
    chars: Array.from(new Set(Array.from('अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह०१२३४५६७८९ॐ।'))),
  },
  {
    id: 'bengali',
    label: 'Bengali & Assamese (অ–হ)',
    region: 'Bangladesh / India',
    direction: 'ltr',
    chars: Array.from('অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়০১২৩৪৫৬৭৮৯'),
  },
  {
    id: 'gurmukhi',
    label: 'Gurmukhi Punjabi (ਅ–ਹ)',
    region: 'Punjab',
    direction: 'ltr',
    chars: Array.from('ੳਅੲਸਹਕਖਗਘਙਚਛਜਝਞਟਠਡਢਣਤਥਦਧਨਪਫਬਭਮਯਰਲਵੜ੦੧੨੩੪੫੬੭੮੯'),
  },
  {
    id: 'gujarati',
    label: 'Gujarati (અ–હ)',
    region: 'Gujarat',
    direction: 'ltr',
    chars: Array.from('અઆઇઈઉઊઋએઐઓઔકખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ૦૧૨૩૪૫૬૭૮૯'),
  },
  {
    id: 'odia',
    label: 'Odia (ଅ–ହ)',
    region: 'Odisha',
    direction: 'ltr',
    chars: Array.from('ଅଆଇଈଉଊଋଏଐଓଔକଖଗଘଙଚଛଜଝଞଟଠଡଢଣତଥଦଧନପଫବଭମଯରଲଳଶଷସହ୦୧୨୩୪୫୬୭୮୯'),
  },
  {
    id: 'tamil',
    label: 'Tamil (அ–ன)',
    region: 'Tamil Nadu / Sri Lanka',
    direction: 'ltr',
    chars: Array.from('அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறனஜஷஸஹ௦௧௨௩௪௫௬௭௮௯'),
  },
  {
    id: 'telugu',
    label: 'Telugu (అ–హ)',
    region: 'Andhra / Telangana',
    direction: 'ltr',
    chars: Array.from('అఆఇఈఉఊఋఎఏఐఒఓఔకఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరలవశషసహళ౦౧౨౩౪౫౬౭౮౯'),
  },
  {
    id: 'kannada',
    label: 'Kannada (ಅ–ಹ)',
    region: 'Karnataka',
    direction: 'ltr',
    chars: Array.from('ಅಆಇಈಉಊಋಎಏಐಒಓಔಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹಳ೦೧೨೩೪೫೬೭೮೯'),
  },
  {
    id: 'malayalam',
    label: 'Malayalam (അ–ഹ)',
    region: 'Kerala',
    direction: 'ltr',
    chars: Array.from('അആഇഈഉഊഋഎഏഐഒഓഔകഖഗഘങചഛജਝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹളഴറ൦൧൨൩൪൫൬൭൰'),
  },
  {
    id: 'sinhala',
    label: 'Sinhala (අ–ෆ)',
    region: 'Sri Lanka',
    direction: 'ltr',
    chars: Array.from('අආඇඈඉඊඋඌඑඒඔඕකඛගඝඞචඡජඣඤටඨඩඪණතථදධනපඵබභමයරලවශෂසහළෆ'),
  },
  {
    id: 'thai',
    label: 'Thai Consonants & Digits (ก–ฮ)',
    region: 'Thailand',
    direction: 'ltr',
    chars: Array.from('กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ๐๑๒๓๔๕๖๗๘๙'),
  },
  {
    id: 'lao',
    label: 'Lao Alphabet (ກ–ຮ)',
    region: 'Laos',
    direction: 'ltr',
    chars: Array.from('ກຂຄງຈຊຍດຕຖທນບປຜຝພຟມຢຣລວສຫອຮ໐໑໒໓໔໕໖໗໘໙'),
  },
  {
    id: 'khmer',
    label: 'Khmer Consonants & Vowels (ក–អ)',
    region: 'Cambodia',
    direction: 'ltr',
    chars: Array.from('កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយរលវសហឡអ០១២៣៤៥៦៧៨៩'),
  },
  {
    id: 'myanmar',
    label: 'Burmese / Myanmar (က–အ)',
    region: 'Myanmar',
    direction: 'ltr',
    chars: Array.from('ကခဂဃငစဆဇဈဉဋဌဍဎဏတထဒဓနပဖဗဘမယရလဝသဟဠအ၀၁၂၃၄၅၆၇၈၉'),
  },
  {
    id: 'tibetan',
    label: 'Tibetan Consonants & Digits (ཀ–ཨ)',
    region: 'Tibet / Bhutan',
    direction: 'ltr',
    chars: Array.from('ཀཁགངཅཆཇཉཏཐདནཔཕབམཙཚཛཝཞཟའཡརལཤསཧཨ༠༡༢༣༤༥༦༧༨༩'),
  },
  {
    id: 'ethiopic',
    label: 'Ethiopic Geʽez / Amharic Syllables',
    region: 'Ethiopia / Eritrea',
    direction: 'ltr',
    chars: Array.from('ሀሁሂሃሄህሆለሉሊላሌልሎመሙሚማሜምሞሰሱሲሳሴስሶበቡቢባቤብቦተቱቲታቴትቶነኑኒናኔንኖ'),
  },
  {
    id: 'japanese-kana',
    label: 'Japanese Hiragana & Katakana',
    region: 'Japan',
    direction: 'ltr',
    chars: Array.from('あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほアイウエオカキクケコサシスセソ'),
  },
  {
    id: 'korean-hangul',
    label: 'Korean Hangul Jamo & Syllables',
    region: 'Korea',
    direction: 'ltr',
    chars: Array.from('ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ가나다라마바사아자차카타파하'),
  },
  {
    id: 'cjk-core',
    label: 'CJK Fundamental Radicals & Characters',
    region: 'China / Taiwan / Japan',
    direction: 'ltr',
    chars: Array.from('一二三四五六七八九十人口手足日月水火木金土山川田天地下中外永字書體'),
  },
  {
    id: 'cherokee-syllabics',
    label: 'Cherokee & Canadian Syllabics',
    region: 'North America / Arctic',
    direction: 'ltr',
    chars: Array.from('ᎠᎡᎢᎣᎤᎥᎦᎧᎨᎩᎪᎫᎬᎭᎮᎯᎰᎱᎲᎳᎴᎵᎶᎷᓀᓂᓄᓇᐁᐃᐅᐊᑲᑭᑯᑲ'),
  },
  {
    id: 'african-scripts',
    label: 'Tifinagh, N’Ko & Adlam',
    region: 'North & West Africa',
    direction: 'ltr',
    chars: Array.from('ⴰⴱⴳⴷⴻⴼⴽⵀⵃⵄⵅⵇⵉⵊⵍⵎⵏⵓⵔⵖⵙⵛⵜⵡⵢⵣߒߓߔߕߖߗߘߙߚߛߜߝ'),
  },
  {
    id: 'ipa-symbols',
    label: 'IPA Phonetic, Currency, Math & Digits',
    region: 'Universal STEM & Linguistics',
    direction: 'ltr',
    chars: Array.from('0123456789!?&@#*$%+-=≠≡∞∑∏√λ∂∫€£¥₹₩₽₺ɑɛəɪɔʃθðŋʒʔ'),
  },
];

export function getWorldLanguage(code: string): WorldLanguageEntry | undefined {
  return WORLD_LANGUAGES.find((l) => l.code === code);
}

type CompactIsoTuple = [
  string,
  string,
  'L' | 'E' | 'H' | 'A' | 'C' | 'S',
  string,
  ScriptCode,
  'ltr' | 'rtl',
  string,
  'curated' | 'cldr' | 'historical-rule' | 'latin-fallback'
];

export const ISO_WORLD_LANGUAGES: IsoWorldLanguage[] = (isoLanguagesRaw as CompactIsoTuple[]).map(
  ([id, part1, status, isoScript, appScript, dir, name, confidence]) => ({
    id,
    part1: part1 || undefined,
    status,
    isoScript,
    appScript,
    dir,
    name,
    confidence,
  })
);

export const ISO_LANGUAGE_STATUS_LABELS: Record<IsoWorldLanguage['status'], string> = {
  L: 'Living',
  E: 'Extinct',
  H: 'Historical',
  A: 'Ancient',
  C: 'Constructed',
  S: 'Special',
};

export const ISO_LANGUAGE_STATUS_COUNTS = ISO_WORLD_LANGUAGES.reduce(
  (acc, l) => {
    acc.total++;
    if (l.status === 'L') acc.living++;
    else if (l.status === 'E') acc.extinct++;
    else if (l.status === 'H') acc.historical++;
    else if (l.status === 'A') acc.ancient++;
    else if (l.status === 'C') acc.constructed++;
    else acc.special++;
    return acc;
  },
  { total: 0, living: 0, extinct: 0, historical: 0, ancient: 0, constructed: 0, special: 0 }
);

export function searchIsoLanguages(
  query: string,
  statusFilter: 'all' | 'L' | 'E' | 'H' | 'C' = 'all',
  limit = 60
): IsoWorldLanguage[] {
  const q = query.trim().toLowerCase();
  const out: IsoWorldLanguage[] = [];
  for (let i = 0; i < ISO_WORLD_LANGUAGES.length; i++) {
    const lang = ISO_WORLD_LANGUAGES[i];
    if (statusFilter !== 'all' && lang.status !== statusFilter) continue;
    if (
      q.length === 0 ||
      lang.name.toLowerCase().includes(q) ||
      lang.id === q ||
      lang.part1 === q ||
      lang.isoScript.toLowerCase() === q
    ) {
      out.push(lang);
      if (out.length >= limit) break;
    }
  }
  return out;
}

export function getFontsForIsoLanguage(lang: IsoWorldLanguage, fonts: FontEntry[]): FontEntry[] {
  const exactIso = fonts.filter((f) => f.isoScripts?.includes(lang.isoScript));
  if (exactIso.length > 0) return exactIso;
  return fonts.filter((f) => f.scripts.includes(lang.appScript));
}
