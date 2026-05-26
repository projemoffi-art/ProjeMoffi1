'use client';

/**
 * DEPRECATED: Bu dosya artık kullanılmıyor.
 * Yeni sistem: src/context/QuestEngineContext.tsx
 * 
 * Geriye dönük uyumluluk için boş bırakıldı.
 */

// Re-export yeni sistemden — eski import'lar kırılmasın
export { useQuestEngine as useDailyQuest, QuestEngineProvider as DailyQuestProvider } from './QuestEngineContext';
export type { Quest as DailyQuest } from './QuestEngineContext';
