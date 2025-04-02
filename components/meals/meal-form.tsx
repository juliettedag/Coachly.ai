"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { storage } from '@/lib/storage';
import { MealEntry, FoodItem } from '@/lib/types';
import { Mic, MicOff, Camera, Plus } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { FoodRecognition } from './food-recognition';
import { analyzeFood } from '@/lib/edamam';
import { generateAIResponse } from '@/lib/openai';

const foodItemSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  portion: z.number().min(0.1, "Portion must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
});

type FoodFormValues = z.infer<typeof foodItemSchema>;

export function MealForm() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: {
      mealType: 'breakfast',
      portion: 1,
      unit: 'serving',
    },
  });

  useEffect(() => {
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
  }, [language]);

  const startRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);

      if (transcribedText.trim()) {
        try {
          const aiResponse = await generateAIResponse([
            { type: 'user', content: transcribedText, id: '1', timestamp: new Date() }
          ], language);
          
          const nutritionInfo = await analyzeFood(aiResponse);
          
          if (nutritionInfo) {
            toast({
              title: t('foodAnalyzed'),
              description: `${nutritionInfo.calories} ${t('calories')}, ${nutritionInfo.protein}g ${t('protein')}, ${nutritionInfo.carbs}g ${t('carbs')}, ${nutritionInfo.fat}g ${t('fat')}`,
            });
          }
        } catch (error) {
          console.error('Error processing voice input:', error);
          toast({
            title: t('error'),
            description: t('voiceProcessError'),
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleFoodIdentified = async (foods: FoodItem[]) => {
    setShowCamera(false);
    
    try {
      const existingMeals = storage.get<MealEntry[]>('mealEntries') || [];
      
      const newMeal: MealEntry = {
        id: crypto.randomUUID(),
        date: new Date(),
        mealType: form.getValues('mealType'),
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

      toast({
        title: t('mealLoggedSuccess'),
        description: `${foods.length} ${t('foodItems')} ${t('added')}`,
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToLogMeal'),
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FoodFormValues) => {
    setIsSubmitting(true);
    try {
      const nutritionInfo = await analyzeFood(data.name);
      
      if (!nutritionInfo) throw new Error('Failed to get nutrition info');

      const food: FoodItem = {
        name: data.name,
        portion: data.portion,
        unit: data.unit,
        nutrition: nutritionInfo,
      };

      const existingMeals = storage.get<MealEntry[]>('mealEntries') || [];
      
      const newMeal: MealEntry = {
        id: crypto.randomUUID(),
        date: new Date(),
        mealType: data.mealType,
        foods: [food],
        totalNutrition: nutritionInfo,
      };

      storage.set('mealEntries', [...existingMeals, newMeal]);

      toast({
        title: t('mealLoggedSuccess'),
        description: `${nutritionInfo.calories} ${t('calories')}, ${nutritionInfo.protein}g ${t('protein')}`,
      });

      form.reset();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToLogMeal'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">{t('manual')}</TabsTrigger>
          <TabsTrigger value="voice">{t('voice')}</TabsTrigger>
          <TabsTrigger value="photo">{t('photo')}</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Select
              onValueChange={(value) => form.setValue('mealType', value as FoodFormValues['mealType'])}
              defaultValue={form.getValues('mealType')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('selectMealType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">{t('mealType.breakfast')}</SelectItem>
                <SelectItem value="lunch">{t('mealType.lunch')}</SelectItem>
                <SelectItem value="dinner">{t('mealType.dinner')}</SelectItem>
                <SelectItem value="snack">{t('mealType.snack')}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={t('foodName')}
              {...form.register('name')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                step="0.1"
                placeholder={t('portion')}
                {...form.register('portion', { valueAsNumber: true })}
              />

              <Select
                onValueChange={(value) => form.setValue('unit', value)}
                defaultValue="serving"
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('unit')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="serving">{t('serving')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              disabled={isSubmitting}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('addFoodItem')}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="voice">
          <div className="space-y-4">
            <div className="relative">
              <Input
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                placeholder={t('speakNow')}
                className="pr-12"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={isRecording ? stopRecording : startRecording}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>

            {isRecording && (
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="photo">
          <div className="space-y-4">
            <Button
              onClick={() => setShowCamera(true)}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Camera className="w-4 h-4 mr-2" />
              {t('captureFood')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {showCamera && (
        <FoodRecognition onFoodIdentified={handleFoodIdentified} />
      )}
    </div>
  );
}