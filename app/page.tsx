"use client";

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { WeightChart } from '@/components/weight/weight-chart';
import { ChatInterface } from '@/components/chat/chat-interface';
import { MealSummary } from '@/components/meals/meal-summary';
import { WeightGoal } from '@/lib/types';
import { storage } from '@/lib/storage';
import { useLanguage } from '@/components/providers/language-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Logo } from '@/components/ui/logo';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { motion } from 'framer-motion';
import { GoalsCalculator } from '@/components/goals/goals-calculator';
import { Reminders } from '@/components/goals/reminders';
import { ActivityTracker } from '@/components/progress/activity-tracker';

export default function Home() {
  const [activeTab, setActiveTab] = useState('coach');
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const goal = storage.get<WeightGoal>('weightGoal');
    setWeightGoal(goal);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'coach':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-card">
              <ChatInterface />
            </Card>
          </motion.div>
        );
      case 'progress':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card className="p-6 bg-card">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                {t('weightProgress')}
              </h2>
              <WeightChart />
            </Card>
            <ActivityTracker />
          </motion.div>
        );
      case 'meals':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <MealSummary />
          </motion.div>
        );
      case 'goals':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <GoalsCalculator />
            <Reminders />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <LanguageSwitcher />
        </div>

        <div className="flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center gap-4">
              <Logo size="lg" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {t('appName')}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('tagline')}
            </p>
          </motion.div>

          {renderContent()}
        </div>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}