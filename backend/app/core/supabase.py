"""
Supabase統合モジュール

バックエンドでSupabaseを使用するための基本設定
- 認証（JWTトークン検証）
- データベースアクセス
- ストレージアクセス
"""

import os
from typing import Optional
from supabase import create_client, Client
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# Supabase設定
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Supabaseクライアント（サービスロール）
# サービスロールキーはRLS制限を無視できるため、サーバー側のみで使用
supabase_admin: Optional[Client] = None

# Supabaseクライアント（匿名キー）
# 匿名キーはRLS制限が適用される、クライアント側でも使用可能
supabase_anon: Optional[Client] = None

# 環境変数のチェックと初期化
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Supabase管理クライアント初期化成功")
else:
    print("⚠️ Supabase環境変数が設定されていません（SUPABASE_URL, SUPABASE_SERVICE_KEY）")

if SUPABASE_URL and SUPABASE_ANON_KEY:
    supabase_anon = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    print("✅ Supabase匿名クライアント初期化成功")
else:
    print("⚠️ Supabase環境変数が設定されていません（SUPABASE_URL, SUPABASE_ANON_KEY）")


# =====================================================
# 認証ミドルウェア
# =====================================================

# HTTPBearerトークン認証
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    JWTトークンを検証して現在のユーザーを取得

    使用例:
    @router.get("/api/materials")
    async def get_materials(current_user = Depends(get_current_user)):
        user_id = current_user["id"]
        # ...
    """
    if not supabase_admin:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabaseが設定されていません",
        )

    token = credentials.credentials

    try:
        # Supabaseでトークン検証
        user = supabase_admin.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="無効な認証トークン",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user.user
    except Exception as e:
        print(f"❌ トークン検証エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証に失敗しました",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
):
    """
    オプションの認証ミドルウェア

    トークンがある場合はユーザー情報を返し、ない場合はNoneを返す
    認証なしでもアクセス可能なエンドポイントで使用

    使用例:
    @router.get("/api/public-materials")
    async def get_public_materials(current_user = Depends(get_optional_user)):
        if current_user:
            # ログイン済みユーザー向けの処理
        else:
            # 未ログインユーザー向けの処理
    """
    if not credentials:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


# =====================================================
# データベースアクセス用のヘルパー関数
# =====================================================

def get_supabase_admin() -> Client:
    """
    Supabase管理クライアントを取得（RLS無視）

    使用例:
    supabase = get_supabase_admin()
    result = supabase.table("materials").select("*").execute()
    """
    if not supabase_admin:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabaseが設定されていません",
        )
    return supabase_admin


def get_supabase_anon() -> Client:
    """
    Supabase匿名クライアントを取得（RLS適用）

    使用例:
    supabase = get_supabase_anon()
    result = supabase.table("materials").select("*").execute()
    """
    if not supabase_anon:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabaseが設定されていません",
        )
    return supabase_anon


# =====================================================
# ユーティリティ関数
# =====================================================

def is_supabase_configured() -> bool:
    """Supabaseが設定されているかチェック"""
    return supabase_admin is not None


def get_storage_bucket(bucket_name: str):
    """
    Supabase Storageバケットを取得

    使用例:
    bucket = get_storage_bucket("audio-files")
    bucket.upload("file.mp3", file_data)
    """
    if not supabase_admin:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabaseが設定されていません",
        )
    return supabase_admin.storage.from_(bucket_name)
