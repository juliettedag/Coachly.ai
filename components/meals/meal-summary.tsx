"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MealEntry } from '@/lib/types';
import { storage } from '@/lib/storage';
import { format, isToday, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { useLanguage } from '@/components/providers/language-provider';
import { CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { generateMealFeedback, generateDailyFeedback, generateWeeklyFeedback } from '@/lib/openai';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = {
  protein: '#2E7D32',
  carbs: '#FBBF24',
  fat: '#3B82F6',
  calories: '#EF4444'
};

export function MealSummary() {
  const [activeTab, setActiveTab] = useState('byMeal');
  const { t, language } = useLanguage();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [mealFeedback, setMealFeedback] = useState<{ [key: string]: string }>({});
  const [dailyFeedback, setDailyFeedback] = useState<string>('');
  const [weeklyFeedback, setWeeklyFeedback] = useState<string>('');

  useEffect(() => {
    const storedMeals = storage.get<MealEntry[]>('mealEntries') || [];
    setMeals(storedMeals);

    const todayMeals = storedMeals.filter(meal => isToday(new Date(meal.date)));
    
    todayMeals.forEach(async (meal) => {
      try {
        const feedback = await generateMealFeedback(meal, language);
        setMealFeedback(prev => ({ ...prev, [meal.id]: feedback }));
      } catch (error) {
        console.error('Error generating meal feedback:', error);
      }
    });

    if (todayMeals.length > 0) {
      generateDailyFeedback(todayMeals, language)
        .then(feedback => setDailyFeedback(feedback))
        .catch(error => console.error('Error generating daily feedback:', error));
    }

    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    const weekMeals = storedMeals.filter(meal => {
      const mealDate = new Date(meal.date);
      return mealDate >= weekStart && mealDate <= weekEnd;
    });

    if (weekMeals.length > 0) {
      generateWeeklyFeedback(weekMeals, language)
        .then(feedback => setWeeklyFeedback(feedback))
        .catch(error => console.error('Error generating weekly feedback:', error));
    }
  }, [language]);

  const todayMeals = meals.filter(meal => isToday(new Date(meal.date)));
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weekMeals = meals.filter(meal => {
    const mealDate = new Date(meal.date);
    return mealDate >= weekStart && mealDate <= weekEnd;
  });

  const dailyTotals = todayMeals.reduce(
    (total, meal) => ({
      calories: total.calories + meal.totalNutrition.calories,
      protein: total.protein + meal.totalNutrition.protein,
      carbs: total.carbs + meal.totalNutrition.carbs,
      fat: total.fat + meal.totalNutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const macroData = [
    { name: t('protein'), value: dailyTotals.protein, color: COLORS.protein },
    { name: t('carbs'), value: dailyTotals.carbs, color: COLORS.carbs },
    { name: t('fat'), value: dailyTotals.fat, color: COLORS.fat },
  ];

  const weeklyData = weekMeals.map(meal => ({
    date: meal.date,
    ...meal.totalNutrition
  }));

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="byMeal">{t('byMeal')}</TabsTrigger>
          <TabsTrigger value="byDay">{t('byDay')}</TabsTrigger>
          <TabsTrigger value="byWeek">{t('byWeek')}</TabsTrigger>
        </TabsList>

        <TabsContent value="byMeal" className="space-y-4">
          {todayMeals.length > 0 ? (
            todayMeals.map((meal) => (
              <Card key={meal.id} className="p-4 bg-white dark:bg-gray-800">
                <h3 className="font-semibold text-lg mb-2">
                  {t(`mealType.${meal.mealType}`)}
                </h3>
                {meal.foods.map((food, index) => (
                  <div key={index} className="text-sm space-y-1">
                    <p className="font-medium">{food.name}</p>
                    <p className="text-muted-foreground">
                      {Math.round(food.nutrition.calories)} cal • {Math.round(food.nutrition.protein)}g {t('protein')} •{' '}
                      {Math.round(food.nutrition.carbs)}g {t('carbs')} • {Math.round(food.nutrition.fat)}g {t('fat')}
                    </p>
                  </div>
                ))}
                {mealFeedback[meal.id] && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm text-emerald-800 dark:text-emerald-200">
                        {mealFeedback[meal.id]}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-4 text-center text-muted-foreground">
              {t('noMealsToday')}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="byDay">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-4">{t('dailyTotals')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-sm text-muted-foreground">{t('calories')}</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.round(dailyTotals.calories)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-sm text-muted-foreground">{t('protein')}</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.round(dailyTotals.protein)}g
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-sm text-muted-foreground">{t('carbs')}</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.round(dailyTotals.carbs)}g
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-sm text-muted-foreground">{t('fat')}</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.round(dailyTotals.fat)}g
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {dailyFeedback && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold">{t('dailyInsights')}</h3>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  {dailyFeedback}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="byWeek">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">{t('weeklyTrends')}</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => format(new Date(date), 'EEE')}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => format(new Date(date), 'PPP')}
                    formatter={(value) => Math.round(Number(value))}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    name={t('calories')}
                    stroke={COLORS.calories}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="protein"
                    name={t('protein')}
                    stroke={COLORS.protein}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="carbs"
                    name={t('carbs')}
                    stroke={COLORS.carbs}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="fat"
                    name={t('fat')}
                    stroke={COLORS.fat}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {weeklyFeedback && (
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-semibold">{t('weeklyInsights')}</h3>
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  {weeklyFeedback}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}