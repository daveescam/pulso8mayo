'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceReviewList } from '@/components/performance/review-list';
import { GoalsList } from '@/components/performance/goals-list';
import { PerformanceChart } from '@/components/performance/performance-chart';
import { Plus, BarChart3, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PerformanceDashboardProps {
  companyId: string;
  userId: string;
  userRole: string;
}

export function PerformanceDashboard({ companyId, userId, userRole }: PerformanceDashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalReviews: 0,
    completedReviews: 0,
    pendingReviews: 0,
    totalGoals: 0,
    completedGoals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [reviewsRes, goalsRes] = await Promise.all([
          fetch(`/api/performance/reviews?companyId=${companyId}`),
          fetch(`/api/performance/goals?companyId=${companyId}`),
        ]);

        const reviewsData = await reviewsRes.json();
        const goalsData = await goalsRes.json();

        setStats({
          totalReviews: reviewsData.pagination?.total || 0,
          completedReviews: reviewsData.reviews?.filter((r: any) => r.status === 'COMPLETED').length || 0,
          pendingReviews: reviewsData.reviews?.filter((r: any) => r.status === 'IN_PROGRESS' || r.status === 'DRAFT').length || 0,
          totalGoals: goalsData.pagination?.total || 0,
          completedGoals: goalsData.goals?.filter((g: any) => g.status === 'COMPLETED').length || 0,
        });
      } catch (error) {
        console.error('Error fetching performance stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [companyId]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Management</h1>
          <p className="text-muted-foreground">
            Track employee performance, reviews, and goals
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/performance/reviews/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Review
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedReviews} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              In progress or draft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedGoals} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalReviews > 0 ? Math.round((stats.completedReviews / stats.totalReviews) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Review completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <PerformanceReviewList companyId={companyId} userId={userId} userRole={userRole} />
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <GoalsList companyId={companyId} userId={userId} userRole={userRole} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                View performance trends and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart companyId={companyId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
