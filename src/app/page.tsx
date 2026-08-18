"use client";

import { useEffect } from 'react';
import Header from '../components/Header';
import LeftConfigPanel from '../components/LeftConfigPanel';
import FloorplanCanvas from '../components/FloorplanCanvas';
import RightScorecardPanel from '../components/RightScorecardPanel';
import { useRoomStore } from '../store/useRoomStore';

export default function Home() {
  const { selectedId, removeFurniture, furniture, updateFurniture } = useRoomStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removeFurniture(selectedId);
      }

      if ((e.key === 'r' || e.key === 'R') && selectedId) {
        const item = furniture.find(f => f.id === selectedId);
        if (item) {
          const newRotation = (item.rotation + 90) % 360;
          updateFurniture(selectedId, { rotation: newRotation });
        }
      }

      if (e.key === 'Escape') {
        useRoomStore.getState().setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, furniture, removeFurniture, updateFurniture]);

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <LeftConfigPanel />
        <FloorplanCanvas />
        <RightScorecardPanel />
      </div>
    </div>
  );
}
