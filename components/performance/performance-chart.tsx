'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformanceChartProps {
  companyId: string;
}

export function PerformanceChart({ companyId }: PerformanceChartProps) {
  // Mock data for now - should be fetched from API
  const data = [
    {
      name: 'Q1 2026',
      averageRating: 3.5,
      completedReviews: 15,
    },
    {
      name: 'Q2 2026',
      averageRating: 3.8,
      completedReviews: 18,
    },
    {
      name: 'Q3 2026',
      averageRating: 4.0,
      completedReviews: 20,
    },
    {
      name: 'Q4 2026',
      averageRating: 4.2,
      completedReviews: 22,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageRating" fill="#8884d8" name="Average Rating" />
            <Bar dataKey="completedReviews" fill="#82ca9d" name="Completed Reviews" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-sm text-muted-foreground text-center">
        Performance trends over time
      </div>
    </div>
  );
}
