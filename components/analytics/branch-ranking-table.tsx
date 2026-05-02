"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { useEffect, useState } from "react";

interface RankingItem {
  rank: number;
  branchId: string;
  branchName: string;
  performanceIndex: number;
}

const rankIcons = [Trophy, Medal, Award];

export function BranchRankingTable({ period }: { period: string }) {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/branch-performance?period=${period}`)
      .then(res => res.json())
      .then(data => {
        setRanking(data.ranking || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) {
    return <Card><CardContent className="p-6"><div className="text-center text-muted-foreground py-8">Cargando ranking...</div></CardContent></Card>;
  }

  if (ranking.length === 0) {
    return <Card><CardContent className="p-6"><div className="text-center text-muted-foreground py-8">Sin datos</div></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Sucursales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ranking.map((item) => {
            const RankIcon = item.rank <= 3 ? rankIcons[item.rank - 1] : null;
            const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
            return (
              <div key={item.branchId} className="flex items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  {RankIcon ? (
                    <RankIcon className={`h-5 w-5 ${medalColors[item.rank - 1] || 'text-muted-foreground'}`} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">#{item.rank}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.branchName}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{item.performanceIndex.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Índice de Performance</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
