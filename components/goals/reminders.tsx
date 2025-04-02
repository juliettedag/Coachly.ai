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
import { scheduleNotification } from '@/lib/notifications';

const reminderSchema = z.object({
  type: z.enum(['weight', 'meal']),
  time: z.string(),
});

type ReminderValues = z.infer<typeof reminderSchema>;

export function Reminders() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [reminders, setReminders] = useState<ReminderValues[]>([]);

  const form = useForm<ReminderValues>({
    resolver: zodResolver(reminderSchema),
  });

  const onSubmit = (data: ReminderValues) => {
    setReminders([...reminders, data]);

    // Schedule the notification
    const [hours, minutes] = data.time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const delay = reminderTime.getTime() - now.getTime();
    const title = language === 'fr' 
      ? `Rappel : ${data.type === 'weight' ? 'Pesée' : 'Repas'}`
      : `Reminder: ${data.type === 'weight' ? 'Weight' : 'Meal'} logging`;
    
    scheduleNotification(title, {
      body: language === 'fr'
        ? "N'oubliez pas d'enregistrer vos données !"
        : "Don't forget to log your data!",
    }, delay);

    toast({
      title: t('reminderSet'),
      description: `${t('reminderFor')} ${data.time}`,
    });

    form.reset();
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
        {t('reminders')}
      </h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            onValueChange={(value) => form.setValue('type', value as 'weight' | 'meal')}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('selectReminderType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weight">{t('weightLogging')}</SelectItem>
              <SelectItem value="meal">{t('mealLogging')}</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="time"
            {...form.register('time')}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
        >
          {t('setReminder')}
        </Button>
      </form>

      {reminders.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">{t('activeReminders')}</h3>
          <div className="space-y-2">
            {reminders.map((reminder, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-muted rounded-lg"
              >
                <span>{t(reminder.type === 'weight' ? 'weightLogging' : 'mealLogging')}</span>
                <span>{reminder.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}