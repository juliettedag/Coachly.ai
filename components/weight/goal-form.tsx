"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { storage } from '@/lib/storage';
import { WeightGoal } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/components/providers/language-provider';

const goalFormSchema = z.object({
  currentWeight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Please enter a valid weight",
  }),
  targetWeight: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Please enter a valid target weight",
  }),
  deadline: z.date({
    required_error: "Please select a deadline",
  }),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

export function GoalForm() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
  });

  const onSubmit = async (data: GoalFormValues) => {
    setIsSubmitting(true);
    try {
      const goal: WeightGoal = {
        currentWeight: parseFloat(data.currentWeight),
        targetWeight: parseFloat(data.targetWeight),
        deadline: data.deadline,
      };

      storage.set('weightGoal', goal);

      toast({
        title: t('goalSetSuccess'),
        description: `${t('target')}: ${data.targetWeight}kg ${t('by')} ${format(data.deadline, 'PPP')}`,
      });

      form.reset();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToSetGoal'),
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
          <DialogTitle>{t('setGoal')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              type="number"
              step="0.1"
              placeholder={t('currentWeight')}
              {...form.register('currentWeight')}
            />
            {form.formState.errors.currentWeight && (
              <p className="text-sm text-red-500 mt-1">
                {t('enterValidWeight')}
              </p>
            )}
          </div>
          <div>
            <Input
              type="number"
              step="0.1"
              placeholder={t('targetWeight')}
              {...form.register('targetWeight')}
            />
            {form.formState.errors.targetWeight && (
              <p className="text-sm text-red-500 mt-1">
                {t('enterValidWeight')}
              </p>
            )}
          </div>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("deadline") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("deadline") ? format(form.watch("deadline"), "PPP") : <span>{t('pickDeadline')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("deadline")}
                  onSelect={(date) => form.setValue("deadline", date as Date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.deadline && (
              <p className="text-sm text-red-500 mt-1">
                {t('selectDeadline')}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {t('setGoal')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}