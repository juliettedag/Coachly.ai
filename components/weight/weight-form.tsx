"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { storage } from '@/lib/storage';
import { WeightEntry } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/components/providers/language-provider';

const weightFormSchema = z.object({
  weight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Please enter a valid weight",
  }),
  notes: z.string().optional(),
});

type WeightFormValues = z.infer<typeof weightFormSchema>;

export function WeightForm() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WeightFormValues>({
    resolver: zodResolver(weightFormSchema),
    defaultValues: {
      weight: '',
      notes: '',
    },
  });

  const onSubmit = async (data: WeightFormValues) => {
    setIsSubmitting(true);
    try {
      const newEntry: WeightEntry = {
        date: new Date(),
        weight: parseFloat(data.weight),
        notes: data.notes,
      };

      const existingEntries = storage.get<WeightEntry[]>('weightEntries') || [];
      storage.set('weightEntries', [...existingEntries, newEntry]);

      toast({
        title: t('weightLoggedSuccess'),
        description: `${data.weight}kg`,
      });

      form.reset();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToLogWeight'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('logWeight')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="number"
              step="0.1"
              placeholder={t('enterWeight')}
              {...form.register('weight')}
            />
            {form.formState.errors.weight && (
              <p className="text-sm text-red-500 mt-1">
                {t('enterValidWeight')}
              </p>
            )}
          </div>
          <div>
            <Input
              placeholder={t('addNotes')}
              {...form.register('notes')}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {t('logWeight')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}