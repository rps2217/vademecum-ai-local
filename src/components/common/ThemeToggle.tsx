import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    const systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && systemLight)) {
      setIsLight(true);
      document.documentElement.classList.add('light');
    } else {
      setIsLight(false);
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    setIsLight(!isLight);
    if (!isLight) {
      document.documentElement.classList.add('light');
      localStorage.setItem('app-theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('app-theme', 'dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl border transition-all ${
        isLight 
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' 
          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
      }`}
      title={isLight ? "Modo Oscuro" : "Modo Claro"}
    >
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
