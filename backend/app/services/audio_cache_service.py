"""音声キャッシュサービス（Supabase Storage統合）"""
from typing import List, Optional, Dict, Any
import hashlib
import os
from datetime import datetime
from app.core.supabase import get_supabase_admin, get_storage_bucket, is_supabase_configured
from app.services.openai_service import OpenAIService


class AudioCacheService:
    """音声キャッシュサービス（全ユーザー共有でコスト削減）"""

    def __init__(self):
        """Initialize audio cache service"""
        self.openai_service = OpenAIService()
        self.supabase_configured = is_supabase_configured()

    def generate_cache_key(
        self,
        text: str,
        sentences: List[str],
        voice: str,
        format: str
    ) -> str:
        """
        キャッシュキー生成（SHA-256ハッシュ）

        Args:
            text: 全文テキスト
            sentences: 文の配列
            voice: 音声（alloy, nova等）
            format: 音声形式（mp3, opus等）

        Returns:
            SHA-256ハッシュ（64文字）
        """
        # キャッシュキー = SHA-256(text + sentences + voice + format)
        # sentencesも含めることで、同じtextでも文分割が異なる場合は別キャッシュとする
        sentences_str = '||'.join(sentences)
        data = f"{text}||{sentences_str}||{voice}||{format}"
        return hashlib.sha256(data.encode('utf-8')).hexdigest()

    async def get_cached_audio(
        self,
        text: str,
        sentences: List[str],
        voice: str,
        format: str
    ) -> Optional[Dict[str, Any]]:
        """
        キャッシュ検索

        Args:
            text: 全文テキスト
            sentences: 文の配列
            voice: 音声
            format: 音声形式

        Returns:
            キャッシュヒット時: {
                'segment_urls': [...],
                'durations': [...],
                'total_duration': float,
                'sentences': [...]
            }
            キャッシュミス時: None
        """
        if not self.supabase_configured:
            return None

        try:
            cache_key = self.generate_cache_key(text, sentences, voice, format)
            supabase = get_supabase_admin()

            # audio_cacheテーブルから検索
            response = supabase.table('audio_cache') \
                .select('*') \
                .eq('text_hash', cache_key) \
                .single() \
                .execute()

            if response.data:
                # キャッシュヒット
                cache_data = response.data

                # アクセスカウント更新
                supabase.table('audio_cache') \
                    .update({
                        'access_count': cache_data['access_count'] + 1,
                        'last_accessed_at': datetime.utcnow().isoformat()
                    }) \
                    .eq('id', cache_data['id']) \
                    .execute()

                return {
                    'segment_urls': cache_data['segment_urls'],
                    'durations': cache_data['durations'],
                    'total_duration': cache_data['total_duration'],
                    'sentences': cache_data['sentences']
                }

            return None
        except Exception as e:
            print(f"[AudioCache] キャッシュ検索エラー: {e}")
            return None

    async def save_to_cache(
        self,
        text: str,
        sentences: List[str],
        voice: str,
        format: str,
        audio_blobs: List[bytes],
        durations: List[float],
        total_duration: float
    ) -> bool:
        """
        音声をSupabase Storageに保存し、キャッシュに登録

        Args:
            text: 全文テキスト
            sentences: 文の配列
            voice: 音声
            format: 音声形式
            audio_blobs: 音声バイナリ配列
            durations: 各文の長さ（秒）
            total_duration: 合計長さ（秒）

        Returns:
            保存成功: True
            保存失敗: False
        """
        if not self.supabase_configured:
            return False

        try:
            cache_key = self.generate_cache_key(text, sentences, voice, format)
            supabase = get_supabase_admin()
            bucket = get_storage_bucket('audio-files')

            # Supabase Storageに各文の音声をアップロード
            segment_urls = []
            total_size = 0

            for i, audio_blob in enumerate(audio_blobs):
                # ファイル名: {cache_key}_segment_{i}.{format}
                file_path = f"cache/{cache_key}_segment_{i}.{format}"

                # Supabase Storageにアップロード
                bucket.upload(
                    file_path,
                    audio_blob,
                    file_options={
                        "content-type": f"audio/{format}",
                        "cache-control": "max-age=31536000"  # 1年間キャッシュ
                    }
                )

                # 公開URL取得
                public_url = bucket.get_public_url(file_path)
                segment_urls.append(public_url)
                total_size += len(audio_blob)

            # audio_cacheテーブルに保存
            supabase.table('audio_cache').insert({
                'text_hash': cache_key,
                'segment_urls': segment_urls,
                'durations': durations,
                'sentences': sentences,
                'format': format,
                'voice': voice,
                'total_duration': total_duration,
                'file_size_bytes': total_size,
                'access_count': 1,
                'created_at': datetime.utcnow().isoformat(),
                'last_accessed_at': datetime.utcnow().isoformat()
            }).execute()

            print(f"[AudioCache] キャッシュ保存成功: {cache_key} ({len(segment_urls)} segments, {total_size} bytes)")
            return True

        except Exception as e:
            print(f"[AudioCache] キャッシュ保存エラー: {e}")
            return False

    async def generate_or_get_cached(
        self,
        text: str,
        sentences: List[str],
        voice: str,
        format: str
    ) -> Dict[str, Any]:
        """
        キャッシュ検索 → ヒット時は返却、ミス時は生成して保存

        Args:
            text: 全文テキスト
            sentences: 文の配列
            voice: 音声
            format: 音声形式

        Returns:
            {
                'from_cache': bool,  # キャッシュヒット時True
                'audio_urls': [...],  # 音声URL配列（Supabase Storage）
                'durations': [...],
                'total_duration': float,
                'sentences': [...]
            }
        """
        # 1. キャッシュ検索
        cached_data = await self.get_cached_audio(text, sentences, voice, format)

        if cached_data:
            # キャッシュヒット
            return {
                'from_cache': True,
                'audio_urls': cached_data['segment_urls'],
                'durations': cached_data['durations'],
                'total_duration': cached_data['total_duration'],
                'sentences': cached_data['sentences']
            }

        # 2. キャッシュミス → OpenAI TTS生成
        print(f"[AudioCache] キャッシュミス → TTS生成開始")

        # 文ごとにTTS生成（既存のOpenAIService使用）
        audio_blobs = []
        durations = []

        for sentence in sentences:
            audio_bytes = self.openai_service.generate_speech(sentence, voice, format)
            audio_blobs.append(audio_bytes)

            # 長さ測定（pydub使用）
            # FIXME: pydubで正確な長さ測定（現在は概算）
            # 仮: mp3形式で128kbps想定 → 約16KB/秒
            duration_estimate = len(audio_bytes) / (16 * 1024)
            durations.append(duration_estimate)

        total_duration = sum(durations)

        # 3. Supabaseキャッシュに保存
        await self.save_to_cache(text, sentences, voice, format, audio_blobs, durations, total_duration)

        # 4. 保存後、公開URLを再取得（キャッシュから）
        cached_data = await self.get_cached_audio(text, sentences, voice, format)

        if cached_data:
            return {
                'from_cache': False,  # 初回生成
                'audio_urls': cached_data['segment_urls'],
                'durations': cached_data['durations'],
                'total_duration': cached_data['total_duration'],
                'sentences': cached_data['sentences']
            }

        # フォールバック（キャッシュ保存失敗時）
        # Supabase未設定時は、バイナリを直接返す（後方互換性）
        return {
            'from_cache': False,
            'audio_blobs': audio_blobs,  # バイナリデータ
            'durations': durations,
            'total_duration': total_duration,
            'sentences': sentences
        }
