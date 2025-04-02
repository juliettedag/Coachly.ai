"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/components/providers/language-provider';
import { storage } from '@/lib/storage';

const calculatorSchema = z.object({
  age: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Please enter a valid age",
  }),
  gender: z.enum(['male', 'female']),
  weight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Please enter a valid weight",
  }),
  targetWeight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Please enter a valid target weight",
  }),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
});

type CalculatorValues = z.infer<typeof calculatorSchema>;

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function GoalsCalculator() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);

  const form = useForm<CalculatorValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      activityLevel: 'moderate',
    },
  });

  useEffect(() => {
    const savedGoals = storage.get('fitnessGoals');
    if (savedGoals) {
      form.reset(savedGoals);
      calculateCalories(savedGoals);
    }
  }, []);

  const calculateBMR = (values: CalculatorValues) => {
    const weight = parseFloat(values.weight);
    const age = parseInt(values.age);
    
    // Mifflin-St Jeor Formula
    if (values.gender === 'male') {
      return (10 * weight) + (6.25 * 170) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * 170) - (5 * age) - 161;
    }
  };

  const calculateCalories = (values: CalculatorValues) => {
    const bmr = calculateBMR(values);
    const tdee = bmr * ACTIVITY_MULTIPLIERS[values.activityLevel];
    
    const currentWeight = parseFloat(values.weight);
    const targetWeight = parseFloat(values.targetWeight);
    const weightDiff = targetWeight - currentWeight;
    
    // Adjust calories (500 cal deficit/surplus per day = 1 lb per week)
    const adjustment = weightDiff > 0 ? 500 : -500;
    return Math.round(tdee + adjustment);
  };

  const onSubmit = (data: CalculatorValues) => {
    const dailyCalories = calculateCalories(data);
    setCalorieGoal(dailyCalories);
    
    // Save goals to storage
    storage.set('fitnessGoals', {
      ...data,
      dailyCalories,
      updatedAt: new Date().toISOString(),
    });
    
    toast({
      title: t('calorieGoalSet'),
      description: `${t('dailyCalorieGoal')}: ${dailyCalories} ${t('calories')}`,
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        {t('calorieCalculator')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Input
              type="number"
              placeholder={t('age')}
              {...form.register('age')}
            />
            {form.formState.errors.age && (
              <p className="text-sm text-red-500">{t('enterValidAge')}</p>
            )}
          </div>

          <Select
            onValueChange={(value) => form.setValue('gender', value as 'male' | 'female')}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectGender')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t('male')}</SelectItem>
              <SelectItem value="female">{t('female')}</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            step="0.1"
            placeholder={t('currentWeight')}
            {...form.register('weight')}
          />

          <Input
            type="number"
            step="0.1"
            placeholder={t('targetWeight')}
            {...form.register('targetWeight')}
          />

          <Select
            onValueChange={(value) => form.setValue('activityLevel', value as CalculatorValues['activityLevel'])}
            defaultValue="moderate"
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectActivityLevel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">{t('activityLevel.sedentary')}</SelectItem>
              <SelectItem value="light">{t('activityLevel.light')}</SelectItem>
              <SelectItem value="moderate">{t('activityLevel.moderate')}</SelectItem>
              <SelectItem value="active">{t('activityLevel.active')}</SelectItem>
              <SelectItem value="very_active">{t('activityLevel.veryActive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
        >
          {t('calculateGoal')}
        </Button>
      </form>

      {calorieGoal && (
        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">{t('yourGoal')}</h3>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {calorieGoal} {t('caloriesPerDay')}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('goalDescription')}
          </p>
        </div>
      )}
    </Card>
  );
}