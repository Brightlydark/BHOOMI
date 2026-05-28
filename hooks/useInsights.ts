// hooks/useInsights.ts
import { useState, useEffect, useCallback } from 'react';
import { Insight } from '../types/insight';
import { Farm } from '../types/farm';
import { fetchInsights } from '../services/farmService';
import { loadUserInsights } from '../services/insightStore';

interface UseInsightsReturn {
  insights: Insight[];
  loading: boolean;
  error: string | null;
  refreshInsights: () => Promise<void>;
  getInsightsByType: (type: Insight['type']) => Insight[];
  criticalCount: number;
}

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

const mergeAndSort = (base: Insight[], user: Insight[]): Insight[] => {
  const seenIds = new Set<string>();
  const combined: Insight[] = [];
  for (const ins of [...user, ...base]) {
    if (!seenIds.has(ins.id)) {
      seenIds.add(ins.id);
      combined.push(ins);
    }
  }
  return combined.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
};

export const useInsights = (farms: Farm[], region?: string): UseInsightsReturn => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    if (farms.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const [base, user] = await Promise.all([
        fetchInsights(farms, region),
        loadUserInsights(),
      ]);
      setInsights(mergeAndSort(base, user));
    } catch (err) {
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [farms.length, region]);

  const refreshInsights = useCallback(async () => {
    if (farms.length === 0) return;
    setLoading(true);
    try {
      const [base, user] = await Promise.all([
        fetchInsights(farms, region, false), // skip cache
        loadUserInsights(),
      ]);
      setInsights(mergeAndSort(base, user));
    } catch (err) {
      setError('Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [farms, region]);

  const getInsightsByType = useCallback(
    (type: Insight['type']) => insights.filter((i) => i.type === type),
    [insights]
  );

  const criticalCount = insights.filter(
    (i) => i.severity === 'critical' || i.severity === 'high'
  ).length;

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  return { insights, loading, error, refreshInsights, getInsightsByType, criticalCount };
};
