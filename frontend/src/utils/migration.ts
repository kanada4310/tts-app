/**
 * localStorage → Supabase 移行ツール
 * 既存の学習データ・ブックマークをSupabaseに移行
 */

import { supabase } from '../services/supabase';
import type { LearningData } from '../types/learning';

const LEARNING_DATA_KEY = 'learning_data';
const MIGRATION_FLAG_KEY = 'migration_completed';

interface MigrationResult {
  success: boolean;
  error?: string;
  stats: {
    materialsCreated: number;
    bookmarksCreated: number;
    sessionsCreated: number;
  };
}

/**
 * 移行が必要かチェック
 */
export function needsMigration(): boolean {
  // 移行済みフラグがtrueなら移行不要
  const migrationCompleted = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrationCompleted === 'true') {
    return false;
  }

  // localStorageにデータがあるかチェック
  const learningDataStr = localStorage.getItem(LEARNING_DATA_KEY);
  if (!learningDataStr) {
    return false;
  }

  try {
    const learningData: LearningData = JSON.parse(learningDataStr);
    // セッションまたはブックマークがあれば移行が必要
    return learningData.sessions.length > 0 || learningData.bookmarks.length > 0;
  } catch {
    return false;
  }
}

/**
 * localStorageからSupabaseへデータ移行
 */
export async function migrateToSupabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    stats: {
      materialsCreated: 0,
      bookmarksCreated: 0,
      sessionsCreated: 0,
    },
  };

  try {
    // 1. ユーザー認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('ユーザーが認証されていません');
    }

    // 2. localStorageからデータ取得
    const learningDataStr = localStorage.getItem(LEARNING_DATA_KEY);
    if (!learningDataStr) {
      throw new Error('移行するデータがありません');
    }

    const learningData: LearningData = JSON.parse(learningDataStr);

    // 3. ブックマークから教材を抽出（materialId → material情報）
    const materialsMap = new Map<string, { text: string; sentences: string[] }>();

    for (const bookmark of learningData.bookmarks) {
      if (!materialsMap.has(bookmark.materialId)) {
        materialsMap.set(bookmark.materialId, {
          text: bookmark.materialText,
          sentences: bookmark.materialSentences,
        });
      }
    }

    // 4. 教材をSupabaseに保存（materials テーブル）
    const materialIdMap = new Map<string, string>(); // old hash → new UUID

    for (const [oldMaterialId, materialData] of materialsMap.entries()) {
      const { data: materialRow, error: materialError } = await supabase
        .from('materials')
        .insert({
          user_id: user.id,
          ocr_text: materialData.text,
          sentences: materialData.sentences,
          source_type: 'ocr',
          title: `教材 ${materialData.text.substring(0, 30)}...`,
        })
        .select('id')
        .single();

      if (materialError) {
        console.error('教材保存エラー:', materialError);
        continue;
      }

      materialIdMap.set(oldMaterialId, materialRow.id);
      result.stats.materialsCreated++;
    }

    // 5. ブックマークをSupabaseに保存（bookmarks テーブル）
    for (const bookmark of learningData.bookmarks) {
      const newMaterialId = materialIdMap.get(bookmark.materialId);
      if (!newMaterialId) {
        console.warn('教材IDが見つかりません:', bookmark.materialId);
        continue;
      }

      const { error: bookmarkError } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        material_id: newMaterialId,
        sentence_index: bookmark.sentenceIndex,
        sentence_text: bookmark.sentenceText,
        mastery_level: bookmark.masteryLevel,
        note: bookmark.note,
        practice_count: bookmark.practiceCount,
        last_practiced_at: bookmark.lastPracticedAt || null,
        created_at: bookmark.addedAt,
      });

      if (bookmarkError) {
        console.error('ブックマーク保存エラー:', bookmarkError);
        continue;
      }

      result.stats.bookmarksCreated++;
    }

    // 6. 学習セッションをSupabaseに保存（learning_sessions テーブル）
    for (const session of learningData.sessions) {
      const { error: sessionError } = await supabase.from('learning_sessions').insert({
        user_id: user.id,
        material_preview: session.materialPreview,
        sentence_count: session.sentenceCount,
        play_count: session.playCount,
        total_duration: session.totalDuration,
        sentence_practice_counts: session.sentencePracticeCounts,
        started_at: session.startTime,
        ended_at: session.endTime || null,
      });

      if (sessionError) {
        console.error('セッション保存エラー:', sessionError);
        continue;
      }

      result.stats.sessionsCreated++;
    }

    // 7. 移行完了フラグを設定
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

    result.success = true;
    return result;
  } catch (err: any) {
    result.error = err.message || '移行中にエラーが発生しました';
    return result;
  }
}

/**
 * 移行完了フラグをリセット（テスト用）
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
}
