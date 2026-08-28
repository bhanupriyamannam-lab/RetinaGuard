import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { useDemo } from '../../context/DemoContext';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services';
import { Patient, LanguageCode } from '../../types';
import { 
  Search, 
  Globe, 
  Sparkles, 
  ChevronDown, 
  Menu, 
  ArrowRight,
  RefreshCw,
  LogOut,
  User
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const TopNav: React.FC<{ onOpenMobileMenu?: () => void }> = ({ onOpenMobileMenu }) => {
  const { language, setLanguage } = useLanguage();
  const { unsyncedCases, startSync, isSyncing } = useOffline();
  const { isDemoMode, setDemoMode, setIsDemoModalOpen } = useDemo();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length > 0) {
      patientService.searchPatients(q).then(results => {
        setSearchResults(results);
        setIsSearchOpen(true);
      });
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/patients/${patientId}`);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages: { code: LanguageCode; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' }
  ];

  return (
    <>
      {/* Persistent DEMO MODE top banner */}
      {isDemoMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold shadow-xs border-b border-amber-600/30 relative z-50">
          <div className="flex items-center justify-between max-w-7xl mx-auto gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                DEMO MODE
              </span>
              <span className="hidden sm:inline">
                Sample patient & screening data is being shown. Real database is isolated.
              </span>
              <span className="sm:hidden text-[11px]">Sample dataset</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-2.5 py-0.5 rounded bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 font-bold text-[11px] transition-colors"
              >
                Scenarios
              </button>
              <button
                onClick={() => {
                  setDemoMode(false);
                  window.location.reload();
                }}
                className="px-2.5 py-0.5 rounded bg-slate-950 text-white font-bold text-[11px] hover:bg-slate-900 transition-colors shadow-xs"
              >
                Exit Demo Mode
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Mobile hamburger & logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={onOpenMobileMenu}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <BrandLogo size="sm" />
          </div>

          {/* Global Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
                placeholder={isDemoMode ? "Search demo patient (e.g. Anita, RG-1042)..." : "Search registered patient by name or ID..."}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Live Search Autocomplete Dropdown */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>{isDemoMode ? "Demo Patient Matches" : "Registered Patient Matches"}</span>
                  <span className="text-[10px] text-slate-400 lowercase">{searchResults.length} found</span>
                </div>
                {searchResults.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient.id)}
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-50 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={patient.avatar}
                            alt={patient.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              <span>{patient.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">({patient.displayId})</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {patient.age}y • {patient.gender} • {patient.location}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching patient records found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Unsynced queue button */}
            {unsyncedCases.length > 0 && (
              <button
                onClick={startSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
                title="Click to sync offline records"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isSyncing ? 'Syncing...' : `${unsyncedCases.length} To Sync`}
                </span>
              </button>
            )}

            {/* Language Selector Dropdown */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span className="uppercase font-bold tracking-tight text-[11px]">{language}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-elevated border border-slate-200 p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Select Language
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors ${
                        language === lang.code
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang.native}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Logout Dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-xs font-semibold text-slate-700"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user ? (user.first_name?.[0] || user.email?.[0] || 'D').toUpperCase() : 'D'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-bold text-slate-900 leading-tight">
                    {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Clinical User'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {user?.role || 'DOCTOR'}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-900 text-xs">
                      {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Clinical Specialist'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {user?.email || 'clinician@retinaguard.org'}
                    </div>
                    {user?.organization_name && (
                      <div className="mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                        {user.organization_name}
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Workspace Settings</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
