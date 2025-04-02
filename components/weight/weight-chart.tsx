"use client";

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { WeightEntry } from '@/lib/types';
import { storage } from '@/lib/storage';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function WeightChart() {
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);

  useEffect(() => {
    const entries = storage.get<WeightEntry[]>('weightEntries') || [];
    setWeightEntries(entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  }, []);

  const data = {
    labels: weightEntries.map(entry => format(new Date(entry.date), 'MMM d')),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightEntries.map(entry => entry.weight),
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="h-[300px] w-full">
      {weightEntries.length > 0 ? (
        <Line data={data} options={options} />
      ) : (
        <div className="flex h-full items-center justify-center text-gray-500">
          No weight entries yet
        </div>
      )}
    </div>
  );
}