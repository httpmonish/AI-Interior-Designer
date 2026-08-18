import html2canvas from 'html2canvas';
import { RoomState } from '../types/room';

export const exportCanvasToPNG = async (elementId: string, filename: string = 'room-blueprint.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export canvas to PNG:', error);
  }
};

export const exportStateToJSON = (state: RoomState, filename: string = 'room-config.json') => {
  try {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export state to JSON:', error);
  }
};
