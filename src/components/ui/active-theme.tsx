"use client";

import { useEffect, useState } from 'react';

// Supported themes
const SUPPORTED_THEMES = ['default', 'claude'] as const;
type Theme = (typeof SUPPORTED_THEMES)[number] | string;

// Available themes that require body class changes
const THEMES_WITH_CLASSES = ['claude'];

export function useThemeConfig() {
  const [activeTheme, setActiveThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('active-theme') as Theme) || 'default';
      const normalized = SUPPORTED_THEMES.includes(saved as any) ? (saved as Theme) : 'default';
      if (normalized !== saved) {
        localStorage.setItem('active-theme', normalized);
      }
      return normalized;
    }
    return 'default';
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark hydrated after mount; initial state already reflects localStorage
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') {
      return;
    }
    if (typeof window !== 'undefined') {
      // Remove all possible theme classes
      document.body.classList.remove(
        'theme-default', 
        'theme-blue', 
        'theme-green', 
        'theme-amber', 
        'theme-claude',
        'theme-default-scaled', 
        'theme-blue-scaled', 
        'theme-mono-scaled'
      );
      
      // Add the current theme class if it's a theme that needs a class
      if (THEMES_WITH_CLASSES.includes(activeTheme)) {
        document.body.classList.add(`theme-${activeTheme}`);
      }
      
      localStorage.setItem('active-theme', activeTheme);
    }
  }, [activeTheme, isHydrated]);

  const setActiveTheme = (theme: Theme) => {
    const normalized = SUPPORTED_THEMES.includes(theme as any) ? theme : 'default';
    setActiveThemeState(normalized);
  };

  return {
    activeTheme: isHydrated ? activeTheme : 'default',
    setActiveTheme,
    isHydrated,
  };
}

// You can expand this file with more theme-related logic, context providers, etc.
// For example, if you need to apply theme classes to the document body:
/*
import { useEffect } from 'react';

export function useThemeConfig() {
  const [activeTheme, setActiveThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'default';
    }
    return 'default';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.classList.remove('theme-default', 'theme-blue', 'theme-green', 'theme-amber', 'theme-default-scaled', 'theme-blue-scaled', 'theme-mono-scaled'); // Remove all possible theme classes
      document.body.classList.add(`theme-${activeTheme}`);
      localStorage.setItem('theme', activeTheme);
    }
  }, [activeTheme]);

  const setActiveTheme = (theme: Theme) => {
    setActiveThemeState(theme);
  };

  return {
    activeTheme,
    setActiveTheme,
  };
}
*/ 