import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(number: number): string {
  return new Intl.NumberFormat().format(number);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
  }).format(date);
}

export function calculateBMI(weight: number, height: number): number {
  return weight / ((height / 100) ** 2);
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function calculateCaloriesBurned(
  weight: number,
  duration: number,
  met: number
): number {
  return (met * 3.5 * weight * duration) / 200;
}

export function triggerConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10B981', '#3B82F6', '#F59E0B'],
  });
}

export function shareProgress(message: string) {
  if (navigator.share) {
    navigator.share({
      title: 'MyFitCoach.AI Progress',
      text: message,
      url: window.location.href,
    }).catch((error) => console.error('Error sharing:', error));
  }
}

export function calculateStreak(dates: Date[]): number {
  if (!dates.length) return 0;

  const sortedDates = dates
    .map(d => new Date(d).setHours(0, 0, 0, 0))
    .sort((a, b) => b - a);

  let streak = 1;
  const today = new Date().setHours(0, 0, 0, 0);
  let currentDate = sortedDates[0];

  if (currentDate < today - 86400000) return 0;

  for (let i = 1; i < sortedDates.length; i++) {
    if (currentDate - sortedDates[i] === 86400000) {
      streak++;
      currentDate = sortedDates[i];
    } else {
      break;
    }
  }

  return streak;
}

export function calculateLevel(points: number): number {
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

export function calculatePointsToNextLevel(points: number): number {
  const currentLevel = calculateLevel(points);
  const nextLevelPoints = (currentLevel ** 2) * 100;
  return nextLevelPoints - points;
}

export function generateAchievement(
  title: string,
  description: string,
  points: number
) {
  return {
    title,
    description,
    points,
    earned: false,
    earnedDate: null,
  };
}