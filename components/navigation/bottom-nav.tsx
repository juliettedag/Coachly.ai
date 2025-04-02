"use client";

import { Bot, LineChart, UtensilsCrossed, Target } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'coach', icon: Bot, label: t('aiCoach') },
    { id: 'progress', icon: LineChart, label: t('progress') },
    { id: 'meals', icon: UtensilsCrossed, label: t('meals') },
    { id: 'goals', icon: Target, label: t('goals') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2 px-4 flex justify-around items-center z-50">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            'flex flex-col items-center gap-1 text-sm transition-colors duration-200',
            activeTab === id
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'
          )}
        >
          <Icon className="h-6 w-6" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}