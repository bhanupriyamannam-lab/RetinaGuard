import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LanguageCode } from '../types';

export interface Translations {
  appName: string;
  appSubtitle: string;
  navOverview: string;
  navScreening: string;
  navPatients: string;
  navTriage: string;
  navReferrals: string;
  navFollowUps: string;
  navAnalytics: string;
  navHealthCamp: string;
  navDemoMode: string;
  navSettings: string;
  greetingDoctor: string;
  todayOverview: string;
  patientsScreened: string;
  highRisk: string;
  referrals: string;
  followUpsDue: string;
  pendingSync: string;
  unsyncedCases: string;
  priorityTriage: string;
  viewFullTriageQueue: string;
  screeningVolume: string;
  analyzeRetina: string;
  imageQuality: string;
  clinicalConfirmationNotice: string;
  retinalHealthJourney: string;
  riskTrajectory: string;
  compareScans: string;
  possibleProgression: string;
  whoNeedsAttentionFirst: string;
  referralCenter: string;
  followUpRadar: string;
  offlineBanner: string;
  syncNow: string;
  healthy: string;
  moderate: string;
  urgent: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    appName: 'RetinaGuard',
    appSubtitle: 'AI-assisted retinal screening',
    navOverview: 'Overview',
    navScreening: 'New Screening',
    navPatients: 'Patient 360',
    navTriage: 'Triage Queue',
    navReferrals: 'Referrals',
    navFollowUps: 'Follow-ups',
    navAnalytics: 'Analytics',
    navHealthCamp: 'Health Camp',
    navDemoMode: 'Demo Scenarios',
    navSettings: 'Settings',
    greetingDoctor: 'Good morning, Dr. Meera',
    todayOverview: "Here is today's retinal screening overview.",
    patientsScreened: 'Patients screened',
    highRisk: 'High risk',
    referrals: 'Referrals',
    followUpsDue: 'Follow-ups due',
    pendingSync: 'Pending sync',
    unsyncedCases: 'Unsynced offline scans',
    priorityTriage: 'Priority Triage Queue',
    viewFullTriageQueue: 'View Full Triage Queue',
    screeningVolume: 'Screening Volume',
    analyzeRetina: 'Analyze Retina',
    imageQuality: 'Image Quality',
    clinicalConfirmationNotice: 'AI-assisted screening result. Clinical confirmation is required.',
    retinalHealthJourney: 'Retinal Health Journey',
    riskTrajectory: 'Risk Trajectory',
    compareScans: 'Compare Retinal Scans',
    possibleProgression: 'Possible Progression Detected',
    whoNeedsAttentionFirst: 'Who needs attention first?',
    referralCenter: 'Referral Center',
    followUpRadar: 'Follow-up Radar',
    offlineBanner: 'Offline screening enabled. Data saved locally.',
    syncNow: 'Sync Cases Now',
    healthy: 'No Apparent DR',
    moderate: 'Moderate DR',
    urgent: 'Urgent Action Required'
  },
  te: {
    appName: 'రెటీనాగార్డ్',
    appSubtitle: 'ఏఐ ఆధారిత నేత్ర స్క్రీనింగ్',
    navOverview: 'డాష్‌బోర్డ్',
    navScreening: 'కొత్త స్క్రీనింగ్',
    navPatients: 'రోగి పూర్తి వివరాలు',
    navTriage: 'ప్రాధాన్యత జాబితా',
    navReferrals: 'రిఫరల్స్',
    navFollowUps: 'ఫాలో-అప్‌లు',
    navAnalytics: 'గణాంకాలు',
    navHealthCamp: 'గ్రామీణ శిబిరం',
    navDemoMode: 'డెమో మోడ్',
    navSettings: 'సెట్టింగ్‌లు',
    greetingDoctor: 'శుభోదయం, డాక్టర్ మీరా',
    todayOverview: 'ఈరోజు రెటీనా స్క్రీనింగ్ సమగ్ర సమాచారం.',
    patientsScreened: 'తనిఖీ చేసిన రోగులు',
    highRisk: 'అధిక ప్రమాదం',
    referrals: 'రిఫరల్స్',
    followUpsDue: 'పెండింగ్ ఫాలో-అప్‌లు',
    pendingSync: 'సింక్ కావలసినవి',
    unsyncedCases: 'ఆఫ్‌లైన్ స్కాన్లు',
    priorityTriage: 'ప్రాధాన్యత తనిఖీ జాబితా',
    viewFullTriageQueue: 'మొత్తం జాబితా చూడండి',
    screeningVolume: 'స్క్రీనింగ్ సంఖ్య',
    analyzeRetina: 'రెటీనాను విశ్లేషించండి',
    imageQuality: 'చిత్ర నాణ్యత',
    clinicalConfirmationNotice: 'ఏఐ సహాయక స్క్రీనింగ్ ఫలితం. వైద్యుడి ధృవీకరణ అవసరం.',
    retinalHealthJourney: 'రెటీనా ఆరోగ్య ప్రయాణం',
    riskTrajectory: 'ప్రమాద తీవ్రత రేఖాపటం',
    compareScans: 'స్కాన్‌ల పోలిక',
    possibleProgression: 'వ్యాధి వ్యాప్తి సంకేతం గుర్తించబడింది',
    whoNeedsAttentionFirst: 'ఎవరికి తక్షణ శ్రద్ధ అవసరం?',
    referralCenter: 'రిఫరల్ కేంద్రం',
    followUpRadar: 'ఫాలో-అప్ రాడార్',
    offlineBanner: 'ఆఫ్‌లైన్ స్క్రీనింగ్ ప్రారంభించబడింది. డేటా సేవ్ చేయబడింది.',
    syncNow: 'సింక్ చేయండి',
    healthy: 'సాధారణం (ఎటువంటి వ్యాధి లేదు)',
    moderate: 'మితమైన డయాబెటిక్ రెటినోపతి',
    urgent: 'అత్యవసర చర్య అవసరం'
  },
  hi: {
    appName: 'रेटिनागार्ड',
    appSubtitle: 'एआई-सहायक रेटिना जांच प्रणाली',
    navOverview: 'अवलोकन',
    navScreening: 'नई जांच',
    navPatients: 'रोगी 360',
    navTriage: 'प्राथमिकता क्रम',
    navReferrals: 'रेफरल केंद्र',
    navFollowUps: 'फॉलो-अप',
    navAnalytics: 'विश्लेषण',
    navHealthCamp: 'स्वास्थ्य शिविर',
    navDemoMode: 'डेमो मोड',
    navSettings: 'सेटिंग्स',
    greetingDoctor: 'सुप्रभात, डॉ. मीरा',
    todayOverview: 'आज की रेटिनल स्क्रीनिंग का अवलोकन।',
    patientsScreened: 'जांचे गए मरीज',
    highRisk: 'उच्च जोखिम',
    referrals: 'रेफरल',
    followUpsDue: 'लंबित फॉलो-अप',
    pendingSync: 'सिंक लंबित',
    unsyncedCases: 'ऑफ़लाइन मामले',
    priorityTriage: 'प्राथमिकता ट्राइएज कतार',
    viewFullTriageQueue: 'पूरी कतार देखें',
    screeningVolume: 'स्क्रीनिंग मात्रा',
    analyzeRetina: 'रेटिना का विश्लेषण करें',
    imageQuality: 'छवि गुणवत्ता',
    clinicalConfirmationNotice: 'एआई-सहायक स्क्रीनिंग परिणाम। चिकित्सकीय पुष्टि आवश्यक है।',
    retinalHealthJourney: 'रेटिनल स्वास्थ्य यात्रा',
    riskTrajectory: 'जोखिम प्रक्षेपवक्र',
    compareScans: 'स्कैन की तुलना करें',
    possibleProgression: 'रोग वृद्धि की संभावना',
    whoNeedsAttentionFirst: 'किसे पहले ध्यान देने की आवश्यकता है?',
    referralCenter: 'रेफरल केंद्र',
    followUpRadar: 'फॉलो-अप रडार',
    offlineBanner: 'ऑफ़लाइन स्क्रीनिंग सक्षम। डेटा सुरक्षित है।',
    syncNow: 'अभी सिंक करें',
    healthy: 'सामान्य स्थिति',
    moderate: 'मध्यम डायबिटिक रेटिनोपैथी',
    urgent: 'तत्काल कार्रवाई आवश्यक'
  },
  ta: {
    appName: 'ரெட்டினாகார்ட்',
    appSubtitle: 'AI விழித்திரை பரிசோதனை',
    navOverview: 'மேலோட்டம்',
    navScreening: 'புதிய பரிசோதனை',
    navPatients: 'நோயாளி விவரம்',
    navTriage: 'முன்னுரிமை வரிசை',
    navReferrals: 'பரிந்துரைகள்',
    navFollowUps: 'தொடர் கண்காணிப்பு',
    navAnalytics: 'பகுப்பாய்வு',
    navHealthCamp: 'மருத்துவ முகாம்',
    navDemoMode: 'டெமோ பயன்முறை',
    navSettings: 'அமைப்புகள்',
    greetingDoctor: 'காலை வணக்கம், டாக்டர் மீரா',
    todayOverview: 'இன்றைய விழித்திரை பரிசோதனை நிலவரம்.',
    patientsScreened: 'பரிசோதிக்கப்பட்டவர்கள்',
    highRisk: 'அதிக ஆபத்து',
    referrals: 'பரிந்துரைகள்',
    followUpsDue: 'நிலுவை கண்காணிப்பு',
    pendingSync: 'ஒத்திசைவு நிலுவை',
    unsyncedCases: 'ஆஃப்லைன் பதிவுகள்',
    priorityTriage: 'முன்னுரிமை வரிசை',
    viewFullTriageQueue: 'முழு வரிசையைக் காண்க',
    screeningVolume: 'பரிசோதனை அளவு',
    analyzeRetina: 'விழித்திரையை ஆய்வு செய்',
    imageQuality: 'படத்தின் தரம்',
    clinicalConfirmationNotice: 'AI-உதவி பரிசோதனை முடிவு. மருத்துவர் உறுதிப்படுத்தல் அவசியம்.',
    retinalHealthJourney: 'விழித்திரை நலப் பயணம்',
    riskTrajectory: 'ஆபத்து வளர்ச்சிப் பாதை',
    compareScans: 'ஸ்கேன்களை ஒப்பிடு',
    possibleProgression: 'நோய் அதிகரிப்பு சாத்தியம்',
    whoNeedsAttentionFirst: 'யாருக்கு உடனடி கவனம் தேவை?',
    referralCenter: 'பரிந்துரை மையம்',
    followUpRadar: 'கண்காணிப்பு ரேடார்',
    offlineBanner: 'ஆஃப்லைன் பரிசோதனை இயக்கத்தில் உள்ளது.',
    syncNow: 'இப்போதே ஒத்திசைக்கவும்',
    healthy: 'இயல்பு நிலை',
    moderate: 'மிதமான விழித்திரை பாதிப்பு',
    urgent: 'அவசர சிகிச்சை தேவை'
  }
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('en');

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
