import React from 'react';
import { ViewportCoordinates } from '../../types';

interface BoundingBoxHighlightProps {
  coordinates: ViewportCoordinates;
  isSelected?: boolean;
}

export const BoundingBoxHighlight: React.FC<BoundingBoxHighlightProps> = ({
  coordinates,
  isSelected = false,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${coordinates.x}px`,
        top: `${coordinates.y}px`,
        width: `${coordinates.width}px`,
        height: `${coordinates.height}px`,
        border: `2px solid ${isSelected ? '#ff0000' : '#00ff00'}`,
        backgroundColor: isSelected ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)',
        pointerEvents: 'none',
        zIndex: isSelected ? 10 : 5,
        transition: 'all 0.2s ease',
      }}
    />
  );
};

