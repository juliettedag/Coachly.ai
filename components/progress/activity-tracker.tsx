"use client";

import { useState } from 'react';
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

const activitySchema = z.object({
  type: z.enum(['walking', 'running', 'cycling', 'weightlifting']),
  duration: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Please enter a valid duration",
  }),
  intensity: z.enum(['light', 'moderate', 'intense']),
});

type ActivityValues = z.infer<typeof activitySchema>;

const CALORIES_PER_MINUTE = {
  walking: { light: 3, moderate: 4, intense: 5 },
  running: { light: 8, moderate: 10, intense: 12 },
  cycling: { light: 5, moderate: 7, intense: 9 },
  weightlifting: { light: 4, moderate: 6, intense: 8 },
};

export function ActivityTracker() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [caloriesBurned, setCaloriesBurned] = useState<number | null>(null);

  const form = useForm<ActivityValues>({
    resolver: zodResolver(activitySchema),
  });

  const calculateCalories = (activity: ActivityValues) => {
    const duration = parseInt(activity.duration);
    return duration * CALORIES_PER_MINUTE[activity.type][activity.intensity];
  };

  const onSubmit = (data: ActivityValues) => {
    const calories = calculateCalories(data);
    setCaloriesBurned(calories);

    const activity = {
      ...data,
      calories,
      date: new Date(),
    };

    const activities = storage.get<typeof activity[]>('activities') || [];
    storage.set('activities', [...activities, activity]);

    toast({
      title: t('activityLogged'),
      description: `${t('caloriesBurned')}: ${calories}`,
    });

    form.reset();
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        {t('activityTracker')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            onValueChange={(value) => form.setValue('type', value as ActivityValues['type'])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectActivityType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walking">{t('walking')}</SelectItem>
              <SelectItem value="running">{t('running')}</SelectItem>
              <SelectItem value="cycling">{t('cycling')}</SelectItem>
              <SelectItem value="weightlifting">{t('weightlifting')}</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder={t('durationMinutes')}
            {...form.register('duration')}
          />

          <Select
            onValueChange={(value) => form.setValue('intensity', value as ActivityValues['intensity'])}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectIntensity')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{t('light')}</SelectItem>
              <SelectItem value="moderate">{t('moderate')}</SelectItem>
              <SelectItem value="intense">{t('intense')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
        >
          {t('logActivity')}
        </Button>
      </form>

      {caloriesBurned && (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-lg font-semibold">
            {t('estimatedCaloriesBurned')}: <span className="text-emerald-600 dark:text-emerald-400">{caloriesBurned}</span>
          </p>
        </div>
      )}
    </Card>
  );
}