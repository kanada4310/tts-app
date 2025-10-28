/**
 * BookmarkList
 * ブックマーク一覧
 */

import React, { useState, useMemo } from 'react'
import { BookmarkService } from '@/services/learning'
import type { Bookmark, BookmarkFilter } from '@/types/learning'
import './styles.css'

interface BookmarkListProps {
  onClose: () => void
  onPlayBookmarks?: (sentences: string[]) => void
}

export const BookmarkList: React.FC<BookmarkListProps> = ({ onClose, onPlayBookmarks }) => {
  const [filter, setFilter] = useState<BookmarkFilter>({
    masteryLevel: undefined,
    sortBy: 'addedAt',
    sortOrder: 'desc',
  })

  const [editingBookmark, setEditingBookmark] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')

  const bookmarks = useMemo(() => BookmarkService.filterBookmarks(filter), [filter])

  // 習得度を更新
  const handleMasteryChange = (bookmarkId: string, level: 1 | 2 | 3 | 4 | 5) => {
    BookmarkService.updateBookmark(bookmarkId, { masteryLevel: level })
    // 再レンダリングのためフィルターを更新
    setFilter({ ...filter })
  }

  // ブックマークを削除
  const handleDelete = (bookmarkId: string) => {
    if (confirm('このブックマークを削除しますか？')) {
      BookmarkService.removeBookmark(bookmarkId)
      setFilter({ ...filter })
    }
  }

  // メモを編集開始
  const handleEditNote = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark.bookmarkId)
    setEditNote(bookmark.note)
  }

  // メモを保存
  const handleSaveNote = (bookmarkId: string) => {
    BookmarkService.updateBookmark(bookmarkId, { note: editNote })
    setEditingBookmark(null)
    setFilter({ ...filter })
  }

  // メモ編集をキャンセル
  const handleCancelEdit = () => {
    setEditingBookmark(null)
    setEditNote('')
  }

  // ブックマークした文を再生
  const handlePlayAll = () => {
    if (onPlayBookmarks && bookmarks.length > 0) {
      const sentences = bookmarks.map((b) => b.sentenceText)
      onPlayBookmarks(sentences)
      onClose()
    }
  }

  // 習得度でフィルタ
  const handleMasteryFilter = (level: 1 | 2 | 3 | 4 | 5 | null) => {
    setFilter({
      ...filter,
      masteryLevel: level ? [level] : undefined,
    })
  }

  return (
    <div className="bookmark-list-overlay" onClick={onClose}>
      <div className="bookmark-list-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bookmark-list-header">
          <h2>⭐ ブックマーク</h2>
          <button className="close-button" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="bookmark-list-content">
          {/* ツールバー */}
          <div className="bookmark-toolbar">
            <div className="bookmark-filters">
              <button
                className={`filter-button ${!filter.masteryLevel ? 'active' : ''}`}
                onClick={() => handleMasteryFilter(null)}
              >
                すべて
              </button>
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  className={`filter-button ${
                    filter.masteryLevel?.includes(level as 1 | 2 | 3 | 4 | 5) ? 'active' : ''
                  }`}
                  onClick={() => handleMasteryFilter(level as 1 | 2 | 3 | 4 | 5)}
                >
                  {'⭐'.repeat(level)}
                </button>
              ))}
            </div>

            {bookmarks.length > 0 && onPlayBookmarks && (
              <button className="play-all-button" onClick={handlePlayAll}>
                🔊 すべて再生
              </button>
            )}
          </div>

          {/* ソート */}
          <div className="bookmark-sort">
            <select
              value={filter.sortBy}
              onChange={(e) =>
                setFilter({ ...filter, sortBy: e.target.value as BookmarkFilter['sortBy'] })
              }
            >
              <option value="addedAt">追加日</option>
              <option value="lastPracticedAt">最終練習日</option>
              <option value="practiceCount">練習回数</option>
              <option value="masteryLevel">習得度</option>
            </select>
            <button
              className="sort-order-button"
              onClick={() =>
                setFilter({ ...filter, sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc' })
              }
            >
              {filter.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* ブックマークリスト */}
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <p>ブックマークがありません</p>
              <p>文リストで星マーク☆をタップしてブックマークを追加しましょう</p>
            </div>
          ) : (
            <div className="bookmarks-grid">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.bookmarkId} className="bookmark-card">
                  <div className="bookmark-card-header">
                    <div className="bookmark-mastery">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          className={`mastery-star ${
                            bookmark.masteryLevel >= level ? 'active' : ''
                          }`}
                          onClick={() =>
                            handleMasteryChange(bookmark.bookmarkId, level as 1 | 2 | 3 | 4 | 5)
                          }
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(bookmark.bookmarkId)}
                      aria-label="削除"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="bookmark-sentence">{bookmark.sentenceText}</div>

                  <div className="bookmark-stats">
                    <span>🔊 {bookmark.practiceCount}回</span>
                    {bookmark.lastPracticedAt && (
                      <span>
                        📅 {new Date(bookmark.lastPracticedAt).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>

                  {/* メモ */}
                  {editingBookmark === bookmark.bookmarkId ? (
                    <div className="bookmark-note-edit">
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="メモを入力..."
                        rows={3}
                      />
                      <div className="note-edit-buttons">
                        <button onClick={() => handleSaveNote(bookmark.bookmarkId)}>保存</button>
                        <button onClick={handleCancelEdit}>キャンセル</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bookmark-note">
                      {bookmark.note ? (
                        <div className="note-content" onClick={() => handleEditNote(bookmark)}>
                          💭 {bookmark.note}
                        </div>
                      ) : (
                        <button
                          className="add-note-button"
                          onClick={() => handleEditNote(bookmark)}
                        >
                          + メモを追加
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
