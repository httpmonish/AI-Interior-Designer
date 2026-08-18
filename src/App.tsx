import { useEffect } from 'react';
import { useRoomStore } from './store/useRoomStore';
import { useAuthStore } from './store/useAuthStore';
import Auth from './pages/Auth';
import Landing from './pages/Landing';
import Designer from './pages/Designer';

import RoomSetup from './components/panels/RoomSetup';

export default function App() {
  const currentPage = useRoomStore(s => s.currentPage);
  const { user, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      {currentPage === 'landing' && <Landing />}
      {currentPage === 'setup' && <RoomSetup />}
      {(currentPage === 'designer' || currentPage === 'dashboard') && <Designer />}
    </>
  );
}
