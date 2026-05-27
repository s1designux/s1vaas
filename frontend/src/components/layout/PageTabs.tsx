import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import styles from './PageTabs.module.css';

export function PageTabs() {
  const openTabs    = useUIStore((s) => s.openTabs);
  const activeTabId = useUIStore((s) => s.activeTabId);
  const activateTab = useUIStore((s) => s.activateTab);
  const closeTab    = useUIStore((s) => s.closeTab);
  const reorderTabs = useUIStore((s) => s.reorderTabs);
  const navigate    = useNavigate();

  // Tab bar drag
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Settings popup
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [popupPos, setPopupPos]         = useState({ top: 0, right: 0 });
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const popupRef       = useRef<HTMLDivElement>(null);

  // Popup list drag
  const popupDragRef = useRef<number | null>(null);
  const [popupDragOver, setPopupDragOver] = useState<number | null>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    function onOutside(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        settingsBtnRef.current && !settingsBtnRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [settingsOpen]);

  function openSettings() {
    if (settingsBtnRef.current) {
      const rect = settingsBtnRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setSettingsOpen((v) => !v);
  }

  // Tab bar drag handlers
  function handleDragStart(e: React.DragEvent, i: number) {
    dragIndexRef.current = i;
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(i);
  }
  function handleDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndexRef.current !== null && dragIndexRef.current !== i) {
      reorderTabs(dragIndexRef.current, i);
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }
  function handleDragEnd() {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  // Popup list drag handlers
  function handlePopupDragStart(e: React.DragEvent, i: number) {
    popupDragRef.current = i;
    e.dataTransfer.effectAllowed = 'move';
  }
  function handlePopupDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setPopupDragOver(i);
  }
  function handlePopupDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (popupDragRef.current !== null && popupDragRef.current !== i) {
      reorderTabs(popupDragRef.current, i);
    }
    popupDragRef.current = null;
    setPopupDragOver(null);
  }
  function handlePopupDragEnd() {
    popupDragRef.current = null;
    setPopupDragOver(null);
  }

  function handleCloseTab(id: string) {
    const nextPath = closeTab(id);
    if (nextPath) navigate(nextPath);
  }

  return (
    <>
      <div className={styles.pageTabs}>
        <ul>
          {openTabs.map((tab, i) => {
            const isActive = tab.id === activeTabId;
            const cls = [
              isActive ? styles.active : '',
              dragOverIndex === i && dragIndexRef.current !== i ? styles.dragOver : '',
            ].filter(Boolean).join(' ') || undefined;

            return (
              <li
                key={tab.id}
                className={cls}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
              >
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    activateTab(tab.id);
                    navigate(tab.path);
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.cameraCnt !== undefined && (
                    <span className={styles.camCount}>({tab.cameraCnt})</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Settings icon — pushed to right edge */}
        <button
          ref={settingsBtnRef}
          type="button"
          className={[styles.settingsBtn, settingsOpen ? styles.settingsBtnOpen : ''].filter(Boolean).join(' ')}
          aria-label="탭 편집"
          onClick={openSettings}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Tab edit popup — fixed to escape overflow:hidden ancestors */}
      {settingsOpen && (
        <div
          ref={popupRef}
          className={styles.settingsPopup}
          style={{ top: popupPos.top, right: popupPos.right }}
        >
          <div className={styles.settingsHeader}>
            <span className={styles.settingsTitle}>탭 편집</span>
            <button
              type="button"
              className={styles.settingsClose}
              onClick={() => setSettingsOpen(false)}
              aria-label="닫기"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ul className={styles.settingsList}>
            {openTabs.map((tab, i) => (
              <li
                key={tab.id}
                className={[
                  styles.settingsItem,
                  popupDragOver === i && popupDragRef.current !== i ? styles.settingsItemDragOver : '',
                ].filter(Boolean).join(' ')}
                draggable
                onDragStart={(e) => handlePopupDragStart(e, i)}
                onDragOver={(e) => handlePopupDragOver(e, i)}
                onDrop={(e) => handlePopupDrop(e, i)}
                onDragEnd={handlePopupDragEnd}
              >
                <span className={styles.dragHandle} aria-hidden>
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden>
                    <circle cx="3" cy="2"  r="1.1" />
                    <circle cx="7" cy="2"  r="1.1" />
                    <circle cx="3" cy="6"  r="1.1" />
                    <circle cx="7" cy="6"  r="1.1" />
                    <circle cx="3" cy="10" r="1.1" />
                    <circle cx="7" cy="10" r="1.1" />
                  </svg>
                </span>
                <span className={styles.settingsItemLabel}>
                  {tab.label}
                  {tab.cameraCnt !== undefined && (
                    <span className={styles.settingsItemCount}> ({tab.cameraCnt})</span>
                  )}
                </span>
                <button
                  type="button"
                  className={styles.settingsItemRemove}
                  onClick={() => handleCloseTab(tab.id)}
                  aria-label={`${tab.label} 탭 삭제`}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
