// services/insightStore.ts
// Persist and retrieve user-farm insights via AsyncStorage.
// The insights screen's useInsights hook uses fetchInsights which already
// handles caching — this module provides a supplementary layer so that
// insights generated for user-added farms survive across sessions.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Insight } from '../types/insight';

const USER_INSIGHTS_KEY = '@bhoomi_user_farm_insights_v1';

/**
 * Read all stored user-farm insights from AsyncStorage.
 */
export const loadUserInsights = async (): Promise<Insight[]> => {
  try {
    const raw = await AsyncStorage.getItem(USER_INSIGHTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Insight[];
    // Re-hydrate Date objects
    return parsed.map((ins) => ({
      ...ins,
      createdAt: new Date(ins.createdAt),
    }));
  } catch {
    return [];
  }
};

/**
 * Append insights for a newly added farm to the user insights store.
 * De-duplicates by insight id.
 */
export const saveInsightsForFarm = async (
  _farmId: string,
  newInsights: Insight[]
): Promise<void> => {
  try {
    const existing = await loadUserInsights();
    const existingIds = new Set(existing.map((i) => i.id));
    const merged = [
      ...newInsights.filter((i) => !existingIds.has(i.id)),
      ...existing,
    ];
    await AsyncStorage.setItem(USER_INSIGHTS_KEY, JSON.stringify(merged));
  } catch {
    // Silently fail — insights will still be generated in-memory
  }
};

/**
 * Remove all insights associated with a specific farm id.
 */
export const removeInsightsForFarm = async (farmId: string): Promise<void> => {
  try {
    const existing = await loadUserInsights();
    const filtered = existing.filter((i) => i.farmId !== farmId);
    await AsyncStorage.setItem(USER_INSIGHTS_KEY, JSON.stringify(filtered));
  } catch {}
};

/**
 * Clear all user farm insights.
 */
export const clearUserInsights = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_INSIGHTS_KEY);
  } catch {}
};
