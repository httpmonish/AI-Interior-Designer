"use client";

import { useEffect } from 'react';
import Header from '../components/Header';
import LeftConfigPanel from '../components/LeftConfigPanel';
import FloorplanCanvas from '../components/FloorplanCanvas';
import RightScorecardPanel from '../components/RightScorecardPanel';
import { useRoomStore } from '../store/useRoomStore';

export default function Home() {
  const { selectedId, removeFurniture, furniture, updateFurniture, setSelectedId } = useRoomStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input / textarea / select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        removeFurniture(selectedId);
        setSelectedId(null);
      }

      if ((e.key === 'r' || e.key === 'R') && selectedId) {
        e.preventDefault();
        const item = furniture.find(f => f.id === selectedId);
        if (item) {
          updateFurniture(selectedId, { rotation: (item.rotation + 90) % 360 });
        }
      }

      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, furniture, removeFurniture, updateFurniture, setSelectedId]);

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftConfigPanel />
        <FloorplanCanvas />
        <RightScorecardPanel />
      </div>
    </div>
  );
}
