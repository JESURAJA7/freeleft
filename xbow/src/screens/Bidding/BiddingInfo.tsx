import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon,
  GlobeAltIcon,
  PhoneIcon,
  ClockIcon,
  TruckIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/common/CustomButton';

interface BiddingInfoProps {
  onBack: () => void;
}

type Language = 'english' | 'hindi' | 'telugu' | 'kannada' | 'malayalam' | 'tamil';
type ViewMode = 'normal' | 'policy';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'tamil', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'english', name: 'English', nativeName: 'English' },
  { code: 'hindi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'telugu', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'malayalam', name: 'Malayalam', nativeName: 'മലയാളം' },
];

const content = {
  english: {
    greeting: "Hello!",
    intro: "XBOW Logistics Pvt. Ltd. has developed a competitive bidding system to fulfill your transport requirements easily, at the lowest cost, and on time.",
    subtitle: "In this system, you can choose the transporter who offers the best price and quickest delivery for your goods.",
    processTitle: "Process:",
    steps: [
      "Post the details of your load.",
      "Once posted, your load will be listed in the Bidding Option.",
      "You can also mention the expected delivery time.",
      "Transporters who wish to take your load will post their time and charges.",
      "The bidding will be valid for 24 hours.",
      "If you don't find a suitable vehicle/price within 24 hours, you can extend the bidding for another 24 hours.",
      "Vehicle owners can keep updating their quotes.",
      "Once you find the right vehicle, price, and time, you can accept the offer.",
      "After acceptance, your goods will be delivered at the lowest price, within your expected time, and with the desired service."
    ],
    noteTitle: "Note:",
    notePoints: [
      "Post your load at least 48 hours in advance.",
      "Once accepted, the vehicle will arrive at your location for loading."
    ],
    thanks: "Thanks for understanding,",
    admin: "Admin",
    company: "XBOW Logistics Pvt. Ltd.",
    whatsapp: "WhatsApp: 9176622222"
  },
  hindi: {
    greeting: "नमस्ते!",
    intro: "XBOW Logistics Pvt. Ltd. ने एक प्रतिस्पर्धी बोली प्रणाली विकसित की है, जिससे आपके परिवहन की आवश्यकता आसानी से, कम कीमत में और समय पर पूरी हो सके।",
    subtitle: "इस प्रणाली में, आप उस ट्रांसपोर्टर को चुन सकते हैं जो आपकी सामग्री को सबसे कम कीमत और कम समय में पहुंचाए।",
    processTitle: "प्रक्रिया:",
    steps: [
      "अपने लोड का विवरण पोस्ट करें।",
      "पोस्ट करते ही आपका लोड बिडिंग ऑप्शन में जुड़ जाएगा।",
      "आप अपेक्षित समय भी बता सकते हैं।",
      "जो ट्रांसपोर्टर आपका लोड लेना चाहते हैं, वे अपना समय और शुल्क पोस्ट करेंगे।",
      "यह बोली 24 घंटे तक मान्य रहेगी।",
      "अगर 24 घंटे में आपको उपयुक्त वाहन/कीमत नहीं मिलती, तो आप बोली को अगले 24 घंटे के लिए बढ़ा सकते हैं।",
      "वाहन मालिक अपने किराए को अपडेट कर सकते हैं।",
      "आपको सही वाहन, कीमत और समय मिलने पर ऑफर स्वीकार कर सकते हैं।",
      "स्वीकृति के बाद, आपका माल कम कीमत, समय पर और अच्छी सेवा के साथ पहुंचा दिया जाएगा।"
    ],
    noteTitle: "नोट:",
    notePoints: [
      "अपना लोड कम से कम 48 घंटे पहले पोस्ट करें।",
      "स्वीकृति के बाद वाहन आपके स्थान पर लोडिंग के लिए पहुंच जाएगा।"
    ],
    thanks: "धन्यवाद,",
    admin: "एडमिन",
    company: "XBOW Logistics Pvt. Ltd.",
    whatsapp: "WhatsApp: 9176622222"
  },
  telugu: {
    greeting: "నమస్కారం!",
    intro: "XBOW Logistics Pvt. Ltd. మీ రవాణా అవసరాలను సులభంగా, తక్కువ ధరలో, సమయానికి తీర్చడానికి పోటీ బిడ్డింగ్ సిస్టమ్‌ను అభివృద్ధి చేసింది.",
    subtitle: "ఈ విధానంలో, మీ సరుకును తక్కువ ధరకు మరియు తక్కువ సమయంలో చేరవేసే ట్రాన్స్‌పోర్టర్‌ను మీరు ఎంచుకోవచ్చు.",
    processTitle: "విధానం:",
    steps: [
      "మీ లోడ్ వివరాలను పోస్ట్ చేయండి।",
      "పోస్ట్ చేసిన వెంటనే, మీ లోడ్ బిడ్డింగ్ ఆప్షన్‌లో చేరుతుంది।",
      "మీరు ఆశించే డెలివరీ సమయాన్ని కూడా పేర్కొనవచ్చు।",
      "లోడ్ తీసుకెళ్లదలచిన ట్రాన్స్‌పోర్టర్లు తమ సమయం మరియు ఛార్జీలను పోస్ట్ చేస్తారు।",
      "ఈ బిడ్డింగ్ 24 గంటలపాటు మాత్రమే చెల్లుతుంది।",
      "24 గంటల్లో సరైన వాహనం/ధర లభించకపోతే, మీరు బిడ్డింగ్‌ను మరో 24 గంటలు పొడిగించవచ్చు।",
      "వాహన యజమానులు తమ రేట్లను అప్డేట్ చేస్తారు।",
      "మీకు సరిపోయే వాహనం, ధర, సమయం లభిస్తే, ఆ ఆఫర్‌ను అంగీకరించండి।",
      "అంగీకరించిన తర్వాత, మీ సరుకును తక్కువ ధరలో, సమయానికి, మంచి సేవతో చేరవేస్తారు।"
    ],
    noteTitle: "గమనిక:",
    notePoints: [
      "మీ లోడ్‌ను కనీసం 48 గంటల ముందు పోస్ట్ చేయండి।",
      "అంగీకరించిన వెంటనే వాహనం మీ లొకేషన్‌కి వచ్చి లోడింగ్ చేస్తుంది।"
    ],
    thanks: "ధన్యవాదాలు,",
    admin: "అడ్మిన్",
    company: "XBOW Logistics Pvt. Ltd.",
    whatsapp: "WhatsApp: 9176622222"
  },
  kannada: {
    greeting: "ನಮಸ್ಕಾರ!",
    intro: "XBOW Logistics Pvt. Ltd. ನಿಮ್ಮ ಸಾರಿಗೆ ಅಗತ್ಯಗಳನ್ನು ಸುಲಭವಾಗಿ, ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ, ಸಮಯಕ್ಕೆ ತಲುಪಿಸಲು ಸ್ಪರ್ಧಾತ್ಮಕ ಬಿಡ್ ವ್ಯವಸ್ಥೆಯನ್ನು ಅಭಿವೃದ್ಧಿಪಡಿಸಿದೆ.",
    subtitle: "ಈ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ, ನಿಮ್ಮ ಸರಕುಗಳನ್ನು ಕಡಿಮೆ ಬೆಲೆಯಲ್ಲಿ ಹಾಗೂ ಕಡಿಮೆ ಸಮಯದಲ್ಲಿ ತಲುಪಿಸುವ ಟ್ರಾನ್ಸ್‌ಪೋರ್ಟರ್ ಅನ್ನು ನೀವು ಆಯ್ಕೆ ಮಾಡಬಹುದು.",
    processTitle: "ವಿಧಾನ:",
    steps: [
      "ನಿಮ್ಮ ಲೋಡ್ ವಿವರಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ।",
      "ಪೋಸ್ಟ್ ಮಾಡಿದ ಕೂಡಲೇ ನಿಮ್ಮ ಲೋಡ್ ಬಿಡ್ಡಿಂಗ್ ಆಯ್ಕೆಗೆ ಸೇರುತ್ತದೆ।",
      "ನೀವು ನಿರೀಕ್ಷಿಸುವ ಸಮಯವನ್ನು ಕೂಡ ಸೂಚಿಸಬಹುದು।",
      "ಲೋಡ್ ಸಾಗಿಸಲು ಬಯಸುವ ಟ್ರಾನ್ಸ್‌ಪೋರ್ಟರ್‌ಗಳು ತಮ್ಮ ಸಮಯ ಮತ್ತು ಶುಲ್ಕವನ್ನು ಪೋಸ್ಟ್ ಮಾಡುತ್ತಾರೆ।",
      "ಈ ಬಿಡ್ಡಿಂಗ್ 24 ಗಂಟೆಗಳವರೆಗೆ ಮಾತ್ರ ಮಾನ್ಯ।",
      "24 ಗಂಟೆಗಳಲ್ಲಿ ಸೂಕ್ತ ವಾಹನ/ಬೆಲೆ ದೊರಕದಿದ್ದರೆ, ನೀವು ಬಿಡ್ಡಿಂಗ್ ಅನ್ನು ಇನ್ನೂ 24 ಗಂಟೆಗಳ ಕಾಲ ವಿಸ್ತರಿಸಬಹುದು।",
      "ವಾಹನ ಮಾಲೀಕರು ತಮ್ಮ ದರಗಳನ್ನು ನವೀಕರಿಸುತ್ತಾರೆ।",
      "ನಿಮಗೆ ಸೂಕ್ತವಾದ ವಾಹನ, ಬೆಲೆ, ಸಮಯ ದೊರೆತರೆ, ಆ ಆಫರ್ ಅನ್ನು ಸ್ವೀಕರಿಸಬಹುದು।",
      "ಸ್ವೀಕರಿಸಿದ ನಂತರ, ನಿಮ್ಮ ಸರಕುಗಳನ್ನು ಕಡಿಮೆ ವೆಚ್ಚದಲ್ಲಿ, ಸಮಯಕ್ಕೆ, ಉತ್ತಮ ಸೇವೆಯೊಂದಿಗೆ ತಲುಪಿಸಲಾಗುತ್ತದೆ।"
    ],
    noteTitle: "ಸೂಚನೆ:",
    notePoints: [
      "ನಿಮ್ಮ ಲೋಡ್ ಅನ್ನು ಕನಿಷ್ಠ 48 ಗಂಟೆಗಳ ಮುಂಚಿತವಾಗಿ ಪೋಸ್ಟ್ ಮಾಡಿ।",
      "ಸ್ವೀಕರಿಸಿದ ಕೂಡಲೇ ವಾಹನ ನಿಮ್ಮ ಸ್ಥಳಕ್ಕೆ ಬಂದು ಲೋಡ್ ತೆಗೆದುಕೊಂಡು ಹೋಗುತ್ತದೆ।"
    ],
    thanks: "ಧನ್ಯವಾದಗಳು,",
    admin: "ಅಡ್ಮಿನ್",
    company: "XBOW Logistics Pvt. Ltd.",
    whatsapp: "WhatsApp: 9176622222"
  },
  malayalam: {
    greeting: "നമസ്കാരം!",
    intro: "XBOW Logistics Pvt. Ltd. നിങ്ങളുടെ ഗതാഗത ആവശ്യങ്ങൾ എളുപ്പത്തിൽ, കുറഞ്ഞ വിലയിൽ, സമയത്ത് നിറവേറ്റാൻ ഒരു മത്സരാധിഷ്ഠിത ബിഡ്ഡിംഗ് സംവിധാനം വികസിപ്പിച്ചിട്ടുണ്ട്.",
    subtitle: "ഈ രീതിയിൽ, കുറഞ്ഞ വിലക്കും കുറഞ്ഞ സമയത്തും നിങ്ങളുടെ ചരക്ക് എത്തിക്കുന്ന ട്രാൻസ്പോർട്ടറെ നിങ്ങൾ തിരഞ്ഞെടുക്കാം.",
    processTitle: "പ്രക്രിയ:",
    steps: [
      "നിങ്ങളുടെ ലോഡിന്റെ വിശദാംശങ്ങൾ പോസ്റ്റ് ചെയ്യുക।",
      "പോസ്റ്റ് ചെയ്ത ഉടൻ നിങ്ങളുടെ ലോഡ് ബിഡ്ഡിംഗ് ഓപ്ഷനിൽ ഉൾപ്പെടും।",
      "നിങ്ങൾ പ്രതീക്ഷിക്കുന്ന സമയവും വ്യക്തമാക്കാം।",
      "ലോഡ് കൊണ്ടുപോകാൻ ആഗ്രഹിക്കുന്ന ട്രാൻസ്പോർട്ടർമാർ അവരുടെ സമയം, നിരക്ക് എന്നിവ പോസ്റ്റ് ചെയ്യും।",
      "ഈ ബിഡ്ഡിംഗ് 24 മണിക്കൂർ സാധുവായിരിക്കും।",
      "24 മണിക്കൂറിനുള്ളിൽ അനുയോജ്യമായ വാഹനം/വില ലഭ്യമാകാത്ത പക്ഷം, നിങ്ങൾക്ക് ബിഡ്ഡിംഗ് 24 മണിക്കൂർ കൂടി നീട്ടാം।",
      "വാഹന ഉടമകൾ അവരുടെ നിരക്ക് പുതുക്കും।",
      "അനുയോജ്യമായ വാഹനം, വില, സമയം ലഭിച്ചാൽ ഓഫർ സ്വീകരിക്കാം।",
      "സ്വീകരിച്ച ശേഷം, നിങ്ങളുടെ ചരക്ക് കുറഞ്ഞ വിലയിൽ, സമയത്ത്, മികച്ച സേവനത്തോടെ എത്തിക്കും।"
    ],
    noteTitle: "കുറിപ്പ്:",
    notePoints: [
      "നിങ്ങളുടെ ലോഡ് കുറഞ്ഞത് 48 മണിക്കൂർ മുമ്പ് പോസ്റ്റ് ചെയ്യുക।",
      "സ്വീകരിച്ച ഉടൻ വാഹനം നിങ്ങളുടെ സ്ഥലത്തെത്തി ലോഡുചെയ്യും।"
    ],
    thanks: "നന്ദി,",
    admin: "അഡ്മിൻ",
    company: "XBOW Logistics Pvt. Ltd.",
    whatsapp: "WhatsApp: 9176622222"
  },
  tamil: {
    greeting: "வணக்கம்!",
    intro: "XBOW Logistics Pvt. Ltd. உங்கள் டிரான்ஸ்போர்ட் தேவைகளை எளிதாக, குறைந்த விலையில், சரியான நேரத்தில் நிறைவேற்றுவதற்காக ஒரு போட்டி முறையை உருவாக்கியுள்ளது.",
    subtitle: "இந்த முறையில், குறைந்த விலையும் குறைந்த நேரமும் வழங்கும் டிரான்ஸ்போர்டரை நீங்கள் தேர்வு செய்யலாம்.",
    processTitle: "முறை:",
    steps: [
      "உங்கள் லோடு தொடர்பான விவரங்களை பதிவிடுங்கள்.",
      "பதிவிட்டவுடன், உங்கள் லோடு Bidding Option-ல் சேர்க்கப்படும்.",
      "நீங்கள் எதிர்பார்க்கும் நேரத்தையும் குறிப்பிடலாம்.",
      "லோடு எடுத்து செல்ல விரும்பும் டிரான்ஸ்போர்டர்கள் தங்களின் நேரத்தையும் கட்டணத்தையும் பதிவிடுவார்கள்.",
      "இந்த பிட்டிங் 24 மணி நேரத்திற்கு செல்லுபடியாகும்.",
      "24 மணி நேரத்தில் உங்களுக்கு பொருத்தமான வாகனம்/விலை கிடைக்காவிட்டால், மேலும் 24 மணி நேரம் நீட்டிக்கலாம்.",
      "வாகன உரிமையாளர்கள் தங்களின் வாடகையை தொடர்ந்து புதுப்பிக்கலாம்.",
      "உங்களுக்கு பொருத்தமான வாகனம், விலை, நேரம் கிடைத்தவுடன் அதை ஏற்றுக்கொள்ளலாம்.",
      "ஏற்றுக்கொண்டதும், குறைந்த வாடகையில், உங்கள் எதிர்பார்ப்புக்கு ஏற்ப, பொருள் சேர்க்கப்படும்."
    ],
    noteTitle: "குறிப்பு:",
    notePoints: [
      "உங்கள் லோட்டை குறைந்தது 48 மணி நேரத்திற்கு முன் பதிவிடுங்கள்.",
      "ஏற்றுக்கொண்ட உடனே, வண்டி உங்கள் இடத்திற்கு வந்து பொருளை ஏற்றிச் செல்லும்."
    ],
    thanks: "நன்றி,",
    admin: "நிர்வாகம்",
    company: "XBOW Logistics Pvt. Ltd.",
    whatsapp: "WhatsApp: 9176622222"
  }
};

const biddingPolicyContent = {
  tamil: {
    title: "பிட் கொள்கை (Bidding Policy)",
    sections: [
      {
        title: "1. டெப்பாசிட் கட்டணம் (Deposit Payment)",
        icon: <BanknotesIcon className="h-6 w-6" />,
        content: [
          "பிடிங்கில் (Bidding) பங்கேற்க, ரூ.5,000 திருப்பிச் செலுத்தக்கூடிய டெப்பாசிட் கட்டாயம் செலுத்தப்பட வேண்டும்.",
          "இது வாகன உரிமையாளர்கள் (Vehicle Owners) மற்றும் வாகனம் தேவைப்படுவோர் (Load Providers) இருவருக்கும் பொருந்தும்."
        ]
      },
      {
        title: "2. பிட் அங்கீகாரம் / நிராகரம் (Bid Approval / Rejection)",
        icon: <CheckCircleIcon className="h-6 w-6" />,
        content: [
          "வாகனம் தேவைப்படுவோர் (Load Provider):",
          "• பிட் செய்து வாகனம் எடுத்தாலும், வாகனத்திற்கான தொகையில் இருந்து டெப்பாசிட் தொகையை கழிக்க இயலாது.",
          "• பிட் செய்தும், வாகனம் கிடைக்கவில்லை என்றாலும், எந்தவித கட்டணமும் டெப்பாசிட் தொகையில் இருந்து கழிக்கப்படாது.",
          "",
          "வாகன உரிமையாளர்கள் (Vehicle Owners):",
          "• பிட் செய்தும், அவர்களுடைய வாகனம் அங்கீகரிக்கப்படாத நிலையிலும், எந்தவித கட்டணமும் டெப்பாசிட் தொகையில் இருந்து எடுக்கப்படாது.",
          "",
          "• டெப்பாசிட் தொகை முழுமையாக Freeleft தளத்தில் பாதுகாப்பாக இருக்கும்.",
          "• பங்கேற்பாளர் அடுத்தடுத்து தினசரி பிடிங்கில் கலந்து கொள்ள, இதே டெப்பாசிட் தொகை தொடர்ந்து பயன்படும்."
        ]
      },
      {
        title: "3. டெப்பாசிட் திருப்பிச் செலுத்தல் (Deposit Refund)",
        icon: <CurrencyRupeeIcon className="h-6 w-6" />,
        content: [
          "வெட்டிங் (Withdrawal) தேவையான நிலையில், பங்கேற்பாளர் அதிகாரப்பூர்வமாக (Officially) இமெயில் மூலம் விண்ணப்பிக்க வேண்டும்.",
          "விண்ணப்பம் அங்கீகரிக்கப்பட்ட பின், டெப்பாசிட் தொகை 3 வேலை நாட்களுக்குள் (72 மணி நேரத்தில்), RC புத்தக உரிமையாளர் அல்லது அந்த நிறுவனத்தின் பெயரில் உள்ள வங்கிக் கணக்கில் மட்டுமே வரவு வைக்கப்படும்.",
          "Google Pay, UPI, அல்லது இதுபோன்ற முறைகள் மூலம் பணத்தை திருப்பி அனுப்ப இயலாது.",
          "இந்த தொகையை வாகன வாடகை, வண்டி அட்வான்ஸ் அல்லது பிற செலவுகளுக்காக கழித்து பயன்படுத்த இயலாது."
        ]
      },
      {
        title: "4. டெப்பாசிட் திருப்பி பெற்ற பின் தகுதி (Eligibility After Refund)",
        icon: <CalendarDaysIcon className="h-6 w-6" />,
        content: [
          "ஒருமுறை டெப்பாசிட் தொகை திருப்பிச் செலுத்தப்பட்ட பிறகு, அந்த நபர் அடுத்த 180 நாட்கள் பிடிங்கில் பங்கேற்க தகுதி இல்லை."
        ]
      },
      {
        title: "5. வாகன பங்கேற்பு விதிகள் (Vehicle Participation Rules)",
        icon: <TruckIcon className="h-6 w-6" />,
        content: [
          "ஒவ்வொரு வாகன உரிமையாளரும் ரூ.5,000 டெப்பாசிட் செலுத்திய பின், அவரது அக்கவுண்டில் சேர்க்கப்பட்ட அனைத்து வாகனங்களும் பிடிங்கில் பங்கேற்க அனுமதிக்கப்படும்.",
          "ஒரே நபர், ஒரே டெப்பாசிட் மூலம், மற்றவர்களின் வாகனங்களைப் பதிவு செய்து பிடிங்கில் கலந்து கொள்ள அனுமதிக்கப்படமாட்டார்."
        ]
      }
    ]
  },
  english: {
    title: "Bidding Policy",
    sections: [
      {
        title: "1. Deposit Payment",
        icon: <BanknotesIcon className="h-6 w-6" />,
        content: [
          "To participate in bidding, a refundable deposit of ₹5,000 must be paid.",
          "This applies to both Vehicle Owners and Load Providers."
        ]
      },
      {
        title: "2. Bid Approval / Rejection",
        icon: <CheckCircleIcon className="h-6 w-6" />,
        content: [
          "Load Providers:",
          "• Even if a vehicle is taken through bidding, the deposit amount cannot be adjusted against the vehicle hire charges.",
          "• If no vehicle is allotted after bidding, no deductions will be made from the deposit.",
          "",
          "Vehicle Owners:",
          "• If a vehicle is not approved in the bidding process, no deductions will be made from the deposit.",
          "",
          "• The deposit will remain safely with the Freeleft platform.",
          "• The same deposit will be valid for daily participation in future biddings."
        ]
      },
      {
        title: "3. Deposit Refund",
        icon: <CurrencyRupeeIcon className="h-6 w-6" />,
        content: [
          "In case of withdrawal, participants must submit an official request via email.",
          "Upon approval, the deposit will be refunded within 3 working days (72 hours) to the bank account of the RC book holder or the registered company account.",
          "Refunds cannot be made via Google Pay, UPI, or similar methods — only through bank transfer.",
          "The deposit cannot be adjusted towards vehicle rent, advance, or any other expenses."
        ]
      },
      {
        title: "4. Eligibility After Refund",
        icon: <CalendarDaysIcon className="h-6 w-6" />,
        content: [
          "Once the deposit is refunded, the participant will not be eligible to participate in bidding for the next 180 days."
        ]
      },
      {
        title: "5. Vehicle Participation Rules",
        icon: <TruckIcon className="h-6 w-6" />,
        content: [
          "After paying the ₹5,000 deposit, a vehicle owner can list all vehicles registered under their account for bidding.",
          "A single deposit cannot be used to register or support vehicles belonging to other individuals."
        ]
      }
    ]
  }
};

export const BiddingInfo: React.FC<BiddingInfoProps> = ({ onBack }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [policyLanguage, setPolicyLanguage] = useState<'tamil' | 'english'>('english');
  const currentContent = content[selectedLanguage];
  const currentPolicyContent = biddingPolicyContent[policyLanguage];

  const getStepIcon = (index: number) => {
    const icons = [
      <TruckIcon className="h-5 w-5" />,
      <InformationCircleIcon className="h-5 w-5" />,
      <ClockIcon className="h-5 w-5" />,
      <CurrencyRupeeIcon className="h-5 w-5" />,
      <ClockIcon className="h-5 w-5" />,
      <ClockIcon className="h-5 w-5" />,
      <CurrencyRupeeIcon className="h-5 w-5" />,
      <CheckCircleIcon className="h-5 w-5" />,
      <TruckIcon className="h-5 w-5" />
    ];
    return icons[index] || <InformationCircleIcon className="h-5 w-5" />;
  };

  const handlePolicyClick = (lang: 'tamil' | 'english') => {
    setPolicyLanguage(lang);
    setViewMode('policy');
  };

  const handleBackToNormal = () => {
    setViewMode('normal');
  };

  if (viewMode === 'policy') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <Button
                onClick={handleBackToNormal}
                variant="ghost"
                icon={<ArrowLeftIcon className="h-5 w-5" />}
              >
                Back to Info
              </Button>
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Policy Language</span>
              </div>
            </div>

            {/* Policy Language Selection */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setPolicyLanguage('tamil')}
                  className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 text-center ${
                    policyLanguage === 'tamil'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="font-medium">Bidding Policy Tamil</div>
                  <div className="text-xs text-slate-600 mt-1">பிட் கொள்கை</div>
                </button>
                <button
                  onClick={() => setPolicyLanguage('english')}
                  className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 text-center ${
                    policyLanguage === 'english'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="font-medium">Bidding Policy English</div>
                  
                </button>
              </div>
            </div>
          </motion.div>

          {/* Policy Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={policyLanguage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
            >
              {/* Header Section */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-white opacity-90" />
                  <h1 className="text-3xl font-bold mb-2">{currentPolicyContent.title}</h1>
                  <p className="text-purple-100">Important Terms and Conditions</p>
                </div>
              </div>

              {/* Policy Sections */}
              <div className="p-8">
                <div className="space-y-8">
                  {currentPolicyContent.sections.map((section, sectionIndex) => (
                    <motion.div
                      key={sectionIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sectionIndex * 0.1 }}
                      className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200"
                    >
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="flex-shrink-0 p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl">
                          {section.icon}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 leading-tight">
                          {section.title}
                        </h2>
                      </div>
                      
                      <div className="ml-16 space-y-3">
                        {section.content.map((item, itemIndex) => (
                          <div key={itemIndex}>
                            {item === "" ? (
                              <div className="h-2"></div>
                            ) : item.startsWith("•") ? (
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                                <p className="text-slate-700 leading-relaxed">{item.substring(2)}</p>
                              </div>
                            ) : item.includes(":") && !item.includes("(") ? (
                              <p className="text-slate-800 font-semibold leading-relaxed">{item}</p>
                            ) : (
                              <p className="text-slate-700 leading-relaxed">{item}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Important Notice */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-xl p-6"
                >
                  <div className="flex items-start space-x-4">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-bold text-orange-800 mb-2">
                        {policyLanguage === 'tamil' ? 'முக்கிய அறிவிப்பு' : 'Important Notice'}
                      </h3>
                      <p className="text-orange-700 leading-relaxed">
                        {policyLanguage === 'tamil' 
                          ? 'இந்த கொள்கை விதிமுறைகள் அனைத்து பங்கேற்பாளர்களுக்கும் பொருந்தும். இவற்றை ஒப்புக்கொண்ட பின்னரே பிடிங்கில் பங்கேற்கலாம்.'
                          : 'These policy terms apply to all participants. You can participate in bidding only after agreeing to these terms.'
                        }
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Contact Section */}
                <div className="mt-8 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6">
                  <div className="text-center">
                    <p className="text-slate-700 mb-2">
                      {policyLanguage === 'tamil' ? 'மேலும் விவரங்களுக்கு,' : 'For more details,'}
                    </p>
                    <p className="font-bold text-slate-900 text-lg mb-1">
                      {policyLanguage === 'tamil' ? 'நிர்வாகம்' : 'Admin'}
                    </p>
                    <p className="font-semibold text-emerald-700 text-lg mb-4">XBOW Logistics Pvt. Ltd.</p>
                    
                    <div className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 px-4 py-3 rounded-xl border border-green-200">
                      <PhoneIcon className="h-5 w-5" />
                      <span className="font-medium">WhatsApp: 9176622222</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Button
              onClick={onBack}
              variant="ghost"
              icon={<ArrowLeftIcon className="h-5 w-5" />}
            >
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Bidding Policy</span>
            </div>
          </div>

          {/* Policy Buttons */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handlePolicyClick('tamil')}
                className="px-6 py-4 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-25 transition-all duration-200 text-center group"
              >
                <div className="font-medium group-hover:text-emerald-700">Bidding Policy Tamil</div>
                <div className="text-xs text-slate-600 mt-1 group-hover:text-emerald-600">பிட் கொள்கை</div>
              </button>
              <button
                onClick={() => handlePolicyClick('english')}
                className="px-6 py-4 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-25 transition-all duration-200 text-center group"
              >
                <div className="font-medium group-hover:text-emerald-700">Bidding Policy English</div>
               
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                    selectedLanguage === lang.code
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-25'
                  }`}
                >
                  <div className="font-medium text-sm">{lang.name}</div>
                  <div className="text-xs text-slate-600 mt-1">{lang.nativeName}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedLanguage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">{currentContent.greeting}</h1>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-lg leading-relaxed">{currentContent.intro}</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
              {/* Subtitle */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <p className="text-blue-800 text-lg font-medium leading-relaxed">
                  {currentContent.subtitle}
                </p>
              </div>

              {/* Process Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <InformationCircleIcon className="h-6 w-6 mr-3 text-emerald-600" />
                  {currentContent.processTitle}
                </h2>
                
                <div className="space-y-4">
                  {currentContent.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200"
                    >
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        <div className="text-emerald-600">
                          {getStepIcon(index)}
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed flex-1">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Note Section */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 mr-2" />
                  {currentContent.noteTitle}
                </h3>
                <div className="space-y-3">
                  {currentContent.notePoints.map((point, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <p className="text-orange-700 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Section */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-6">
                <div className="text-center">
                  <p className="text-slate-700 mb-2">{currentContent.thanks}</p>
                  <p className="font-bold text-slate-900 text-lg mb-1">{currentContent.admin}</p>
                  <p className="font-semibold text-emerald-700 text-lg mb-4">{currentContent.company}</p>
                  
                  <div className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 px-4 py-3 rounded-xl border border-green-200">
                    <PhoneIcon className="h-5 w-5" />
                    <span className="font-medium">{currentContent.whatsapp}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BiddingInfo;