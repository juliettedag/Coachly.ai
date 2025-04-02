"use client";

const APP_ID = '8dc03375';
const APP_KEY = '02b33225c6c35e2ce027991fe0b42699';

export async function analyzeFood(query: string) {
  const url = `https://api.edamam.com/api/nutrition-data?app_id=${APP_ID}&app_key=${APP_KEY}&ingr=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch nutrition data');
    
    const data = await response.json();
    return {
      calories: data.calories || 0,
      protein: Math.round((data.totalNutrients.PROCNT?.quantity || 0) * 10) / 10,
      carbs: Math.round((data.totalNutrients.CHOCDF?.quantity || 0) * 10) / 10,
      fat: Math.round((data.totalNutrients.FAT?.quantity || 0) * 10) / 10,
    };
  } catch (error) {
    console.error('Error analyzing food:', error);
    return null;
  }
}