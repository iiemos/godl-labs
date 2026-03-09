import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import WalletConnect from './WalletConnect.jsx';
import i18n from '../i18n/index.js';

function Header({ isOpen, toggleMenu }) {
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: "简体中文" },
    { code: 'ja', name: "日本語" },
    { code: 'ko', name: "한국어" },
    { code: 'pl', name: "Polski" },
    { code: 'vi', name: "Tiếng Việt" },
    { code: 'th', name: "ไทย" },
  ];

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    setIsLanguageMenuOpen(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 dark:bg-background-dark" style={{ zIndex: 9999 }}>
      <header className="flex items-center justify-between border-b border-border-dark px-6 py-4 glass sticky top-0 z-50 glass-panel">
          <div className="button-aside lg:hidden">
            <div className="menu-icon flex items-center gap-4  text-slate-900 dark:text-white cursor-pointer" onClick={toggleMenu}>
            <Icon icon={isOpen ? "mdi:close" : "mdi:menu"} className="text-3xl" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* <img src="/img/coin.png" alt="GODL LABS Logo" className="size-12" /> */}
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              Godl<span className="text-primary">.io</span>
            </h2>
          </div>
        <div className="flex items-center gap-6">
          <WalletConnect />
          <div className="relative">
            <button 
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
            >
              <Icon icon="mdi:earth" className="text-3xl" />
            </button>
            {isLanguageMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 animate-fade-in">
                <div className="py-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`w-full text-left px-4 py-2 hover:bg-white/10 transition-colors ${currentLanguage === lang.code ? 'bg-white/10 font-medium' : ''}`}
                      onClick={() => handleLanguageChange(lang.code)}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}

export default Header;
