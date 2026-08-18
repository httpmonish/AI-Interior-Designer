import { useRoomStore } from '../store/useRoomStore';
import TopToolbar from '../components/layout/TopToolbar';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightSidebar from '../components/layout/RightSidebar';
import FloatingControls from '../components/layout/FloatingControls';
import Scene3D from '../components/3d/Scene3D';
import FloorPlan2D from '../components/2d/FloorPlan2D';

export default function Designer() {
  const viewMode = useRoomStore(s => s.viewMode);
  const leftSidebarOpen = useRoomStore(s => s.leftSidebarOpen);
  const rightSidebarOpen = useRoomStore(s => s.rightSidebarOpen);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopToolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {leftSidebarOpen && <LeftSidebar />}
        <div className="viewport-container">
          {viewMode === '3d' ? <Scene3D /> : <FloorPlan2D />}
          <FloatingControls />
        </div>
        {rightSidebarOpen && <RightSidebar />}
      </div>
    </div>
  );
}
