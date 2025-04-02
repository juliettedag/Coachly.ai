import { Message, MealEntry } from '@/lib/types';
import { storage } from '@/lib/storage';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function generateAIResponse(messages: Message[], language: string, tone: string = 'casual'): Promise<string> {
  try {
    const userProfile = storage.get('userProfile');
    const goals = storage.get('fitnessGoals');

    const systemPrompt = `You are a friendly and motivating fitness coach with a ${tone} tone. 
${tone === 'serious' ? 'Keep responses professional and focused on data and facts.' :
  tone === 'funny' ? 'Use humor and emojis to make responses fun and engaging.' :
  'Maintain a casual, encouraging tone.'}
Respond in ${language}.

${userProfile ? `User Profile:
- Name: ${userProfile.name}
- Activity Level: ${userProfile.activityLevel}
${userProfile.dietaryPreferences ? `- Dietary Preferences: ${userProfile.dietaryPreferences.join(', ')}` : ''}` : ''}

${goals ? `Fitness Goals:
- Current Weight: ${goals.currentWeight}kg
- Target Weight: ${goals.targetWeight}kg` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        ],
        temperature: tone === 'serious' ? 0.3 : tone === 'funny' ? 0.8 : 0.6,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI response');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return language === 'fr' 
      ? "Désolé, je n'ai pas pu traiter votre message. Veuillez réessayer."
      : "Sorry, I couldn't process your message. Please try again.";
  }
}

export async function analyzeImage(imageBase64: string, language: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: 'text',
                text: language === 'fr' 
                  ? "Identifie les aliments dans cette image avec leurs portions estimées."
                  : "Identify the foods in this image with estimated portions."
              }
            ]
          }
        ],
        max_tokens: 100
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing image:', error);
    return language === 'fr'
      ? "Désolé, je n'ai pas pu analyser l'image. Veuillez réessayer."
      : "Sorry, I couldn't analyze the image. Please try again.";
  }
}

export async function generateMealFeedback(meal: MealEntry, language: string): Promise<string> {
  try {
    const userProfile = storage.get('userProfile') || {};
    const goals = storage.get('fitnessGoals');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert providing brief feedback in ${language}. Consider the user's profile:
${userProfile.activityLevel ? `- Activity Level: ${userProfile.activityLevel}` : ''}
${userProfile.dietaryPreferences ? `- Dietary Preferences: ${userProfile.dietaryPreferences.join(', ')}` : ''}
${goals?.dailyCalories ? `- Daily Calorie Goal: ${goals.dailyCalories}` : ''}`
          },
          {
            role: 'user',
            content: `Analyze this meal:
Type: ${meal.mealType}
Foods: ${meal.foods.map(f => f.name).join(', ')}
Total Calories: ${meal.totalNutrition.calories}
Protein: ${meal.totalNutrition.protein}g
Carbs: ${meal.totalNutrition.carbs}g
Fat: ${meal.totalNutrition.fat}g`
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate meal feedback');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating meal feedback:', error);
    return language === 'fr'
      ? "Désolé, je n'ai pas pu analyser ce repas. Veuillez réessayer."
      : "Sorry, I couldn't analyze this meal. Please try again.";
  }
}

export async function generateDailyFeedback(meals: MealEntry[], language: string): Promise<string> {
  try {
    const userProfile = storage.get('userProfile') || {};
    const goals = storage.get('fitnessGoals');

    const totalNutrition = meals.reduce(
      (total, meal) => ({
        calories: total.calories + meal.totalNutrition.calories,
        protein: total.protein + meal.totalNutrition.protein,
        carbs: total.carbs + meal.totalNutrition.carbs,
        fat: total.fat + meal.totalNutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert providing daily meal analysis feedback in ${language}. Consider the user's profile:
${userProfile.activityLevel ? `- Activity Level: ${userProfile.activityLevel}` : ''}
${userProfile.dietaryPreferences ? `- Dietary Preferences: ${userProfile.dietaryPreferences.join(', ')}` : ''}
${goals?.dailyCalories ? `- Daily Calorie Goal: ${goals.dailyCalories}` : ''}`
          },
          {
            role: 'user',
            content: `Analyze today's nutrition:
Number of Meals: ${meals.length}
Total Calories: ${totalNutrition.calories}
Total Protein: ${totalNutrition.protein}g
Total Carbs: ${totalNutrition.carbs}g
Total Fat: ${totalNutrition.fat}g

Meal Distribution:
${meals.map(meal => `${meal.mealType}: ${meal.totalNutrition.calories} calories`).join('\n')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate daily feedback');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating daily feedback:', error);
    return language === 'fr'
      ? "Désolé, je n'ai pas pu générer l'analyse quotidienne. Veuillez réessayer."
      : "Sorry, I couldn't generate the daily analysis. Please try again.";
  }
}

export async function generateWeeklyFeedback(meals: MealEntry[], language: string): Promise<string> {
  try {
    const userProfile = storage.get('userProfile') || {};
    const goals = storage.get('fitnessGoals');

    const dailyTotals = meals.reduce((acc, meal) => {
      const date = new Date(meal.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealCount: 0,
        };
      }
      acc[date].calories += meal.totalNutrition.calories;
      acc[date].protein += meal.totalNutrition.protein;
      acc[date].carbs += meal.totalNutrition.carbs;
      acc[date].fat += meal.totalNutrition.fat;
      acc[date].mealCount += 1;
      return acc;
    }, {} as Record<string, { calories: number; protein: number; carbs: number; fat: number; mealCount: number; }>);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert providing weekly meal analysis feedback in ${language}. Consider the user's profile:
${userProfile.activityLevel ? `- Activity Level: ${userProfile.activityLevel}` : ''}
${userProfile.dietaryPreferences ? `- Dietary Preferences: ${userProfile.dietaryPreferences.join(', ')}` : ''}
${goals?.dailyCalories ? `- Daily Calorie Goal: ${goals.dailyCalories}` : ''}`
          },
          {
            role: 'user',
            content: `Analyze this week's nutrition:
Days tracked: ${Object.keys(dailyTotals).length}
Daily averages:
${Object.entries(dailyTotals).map(([date, totals]) => 
  `${date}: ${Math.round(totals.calories)} calories, ${Math.round(totals.protein)}g protein, ${totals.mealCount} meals`
).join('\n')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate weekly feedback');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating weekly feedback:', error);
    return language === 'fr'
      ? "Désolé, je n'ai pas pu générer l'analyse hebdomadaire. Veuillez réessayer."
      : "Sorry, I couldn't generate the weekly analysis. Please try again.";
  }
}