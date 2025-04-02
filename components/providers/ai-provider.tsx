"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Message, OnboardingState, UserProfile } from '@/lib/types';
import { storage } from '@/lib/storage';
import { useLanguage } from './language-provider';
import { analyzeFood } from '@/lib/edamam';
import { generateAIResponse } from '@/lib/openai';
import { sendNotification } from '@/lib/notifications';

type Tone = 'casual' | 'serious' | 'funny';

interface AIContextType {
  messages: Message[];
  processMessage: (message: string) => Promise<void>;
  isProcessing: boolean;
  clearChat: () => void;
  onboardingState: OnboardingState | null;
  tone: Tone;
  setTone: (tone: Tone) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [tone, setTone] = useState<Tone>('casual');
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    const userProfile = storage.get<UserProfile>('userProfile');
    
    if (!userProfile) {
      setOnboardingState({
        step: 'name',
        data: {}
      });
      
      setMessages([{
        id: '1',
        content: t('aiGreeting'),
        type: 'ai',
        timestamp: new Date(),
      }]);
    } else {
      setMessages([{
        id: '1',
        content: `${t('aiWelcomeBack')} ${userProfile.name}!`,
        type: 'ai',
        timestamp: new Date(),
      }]);
    }
  }, [t, language]);

  const processMessage = async (message: string): Promise<void> => {
    setIsProcessing(true);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      type: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      let response: string;

      if (message.toLowerCase().includes('mangé') || message.toLowerCase().includes('pris') ||
          message.toLowerCase().includes('had') || message.toLowerCase().includes('ate')) {
        const nutritionInfo = await analyzeFood(message);
        if (nutritionInfo) {
          response = language === 'fr'
            ? `J'ai analysé votre repas. Il contient environ ${nutritionInfo.calories} calories, ${nutritionInfo.protein}g de protéines, ${nutritionInfo.carbs}g de glucides et ${nutritionInfo.fat}g de lipides.`
            : `I've analyzed your meal. It contains approximately ${nutritionInfo.calories} calories, ${nutritionInfo.protein}g protein, ${nutritionInfo.carbs}g carbs, and ${nutritionInfo.fat}g fat.`;
        } else {
          response = language === 'fr'
            ? "Je n'ai pas pu analyser le contenu nutritionnel de votre repas. Pourriez-vous me donner plus de détails ?"
            : "I couldn't analyze the nutritional content of your meal. Could you please provide more details?";
        }
      } else if (onboardingState && onboardingState.step !== 'complete') {
        const newState = processOnboardingInput(message, onboardingState);
        setOnboardingState(newState);
        response = generateOnboardingResponse(newState, t);

        if (newState.step === 'complete') {
          storage.set('userProfile', newState.data);
        }
      } else {
        response = await generateAIResponse([...messages, userMessage], language, tone);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        type: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      toast({
        title: t('error'),
        description: t('messageProcessError'),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = () => {
    const userProfile = storage.get<UserProfile>('userProfile');
    setMessages([{
      id: Date.now().toString(),
      content: userProfile ? `${t('aiWelcomeBack')} ${userProfile.name}!` : t('aiGreeting'),
      type: 'ai',
      timestamp: new Date(),
    }]);
  };

  return (
    <AIContext.Provider
      value={{
        messages,
        processMessage,
        isProcessing,
        clearChat,
        onboardingState,
        tone,
        setTone,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

function processOnboardingInput(message: string, state: OnboardingState): OnboardingState {
  const newState = { ...state };
  
  switch (state.step) {
    case 'name':
      newState.data.name = message;
      newState.step = 'gender';
      break;
    case 'gender':
      newState.data.gender = message.toLowerCase() as UserProfile['gender'];
      newState.step = 'age';
      break;
    case 'age':
      newState.data.age = parseInt(message);
      newState.step = 'activity';
      break;
    case 'activity':
      newState.data.activityLevel = message.toLowerCase() as UserProfile['activityLevel'];
      newState.step = 'goals';
      break;
    case 'goals':
      newState.step = 'dietary';
      break;
    case 'dietary':
      newState.data.dietaryPreferences = message.split(',').map(p => p.trim());
      newState.step = 'complete';
      break;
  }

  return newState;
}

function generateOnboardingResponse(state: OnboardingState, t: (key: string) => string): string {
  switch (state.step) {
    case 'name':
      return t('aiGreeting');
    case 'gender':
      return `${t('aiAskGender')} ${state.data.name}!`;
    case 'age':
      return t('aiAskAge');
    case 'activity':
      return t('aiAskActivity');
    case 'goals':
      return t('aiAskGoals');
    case 'dietary':
      return t('aiAskDietary');
    case 'complete':
      return t('aiOnboardingComplete');
    default:
      return t('aiError');
  }
}