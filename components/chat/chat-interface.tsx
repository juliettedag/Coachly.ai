"use client";

import { useState, useRef, useEffect } from 'react';
import { useAI } from '@/components/providers/ai-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/components/providers/language-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodRecognition } from '@/components/meals/food-recognition';
import { requestNotificationPermission, sendNotification } from '@/lib/notifications';
import { Textarea } from '@/components/ui/textarea';
import { storage } from '@/lib/storage';
import { UserProfile, WeightEntry, MealEntry, Message } from '@/lib/types';

export function ChatInterface() {
  const {
    messages,
    processMessage,
    isProcessing,
    clearChat,
    tone,
    setTone,
  } = useAI();
  const { t, language } = useLanguage();
  const [input, setInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    requestNotificationPermission();

    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        setTranscribedText(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopRecording();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const message = input;
    setInput('');

    // Check for tone change commands
    if (message.toLowerCase().includes('sois plus')) {
      const newTone = message.toLowerCase().includes('sérieux') ? 'serious' :
                     message.toLowerCase().includes('détendu') ? 'casual' :
                     message.toLowerCase().includes('drôle') ? 'funny' : tone;
      if (newTone !== tone) {
        setTone(newTone);
        return;
      }
    }

    // Extract weight updates
    const weightMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?)/i);
    if (weightMatch) {
      const weight = parseFloat(weightMatch[1]);
      const existingEntries = storage.get<WeightEntry[]>('weightEntries') || [];
      const newEntry: WeightEntry = {
        date: new Date(),
        weight,
        notes: message,
      };
      storage.set('weightEntries', [...existingEntries, newEntry]);

      // Update current weight in goals
      const goals = storage.get('fitnessGoals');
      if (goals) {
        storage.set('fitnessGoals', { ...goals, currentWeight: weight });
      }
    }

    await processMessage(message);
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      setShowVoiceDialog(true);
      setTranscribedText('');
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceSubmit = async () => {
    if (transcribedText.trim()) {
      setShowVoiceDialog(false);
      await processMessage(transcribedText);
    }
  };

  const handleFoodIdentified = async (foods: any[]) => {
    setShowCamera(false);
    const foodList = foods.map(food => food.name).join(', ');
    await processMessage(`J'ai mangé ${foodList}`);

    const existingMeals = storage.get<MealEntry[]>('mealEntries') || [];
    const newMeal: MealEntry = {
      id: crypto.randomUUID(),
      date: new Date(),
      mealType: 'snack', // Default to snack, AI will update based on time
      foods,
      totalNutrition: foods.reduce(
        (total, food) => ({
          calories: total.calories + food.nutrition.calories,
          protein: total.protein + food.nutrition.protein,
          carbs: total.carbs + food.nutrition.carbs,
          fat: total.fat + food.nutrition.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    };
    storage.set('mealEntries', [...existingMeals, newMeal]);

    sendNotification(t('mealLoggedSuccess'), {
      body: `${t('added')} ${foods.length} ${t('foodItems')}`,
    });
  };

  return (
    <div className="flex flex-col h-[600px] md:h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          {t('aiCoach')}
        </h2>
      </div>

      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex flex-col mb-4",
                message.type === 'user' ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl p-4",
                  message.type === 'user'
                    ? "chat-message-user"
                    : "chat-message-ai"
                )}
              >
                <p className="text-sm">{message.content}</p>
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {format(new Date(message.timestamp), 'HH:mm')}
              </span>
            </motion.div>
          ))}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-100"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('typeMessage')}
          disabled={isProcessing}
          className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 focus-visible:ring-2 focus-visible:ring-emerald-500"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isProcessing}
          size="icon"
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Send className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCamera(true)}
          className="border-2 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white transition-all duration-300"
        >
          <Camera className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startRecording}
          className={cn(
            "border-2 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 hover:text-white transition-all duration-300",
            isRecording && "bg-red-100 dark:bg-red-900"
          )}
        >
          {isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      </form>

      <Dialog open={showVoiceDialog} onOpenChange={(open) => {
        if (!open) {
          stopRecording();
          setShowVoiceDialog(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('voiceInput')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder={t('speakNow')}
                className="min-h-[100px] pr-8"
              />
              <div className="absolute top-2 right-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isRecording ? "bg-red-500 animate-pulse" : "bg-gray-300"
                )} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isRecording ? t('recording') : t('editMessage')}
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                stopRecording();
                setShowVoiceDialog(false);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={() => {
                stopRecording();
                handleVoiceSubmit();
              }}
              disabled={!transcribedText.trim()}
            >
              {t('send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showCamera && (
        <FoodRecognition onFoodIdentified={handleFoodIdentified} />
      )}
    </div>
  );
}