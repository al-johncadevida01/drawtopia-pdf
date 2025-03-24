
import React from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const colors = [
  { value: '#000000', label: 'Black' },
  { value: '#FF0000', label: 'Red' },
  { value: '#FF9500', label: 'Orange' },
  { value: '#FFCC00', label: 'Yellow' },
  { value: '#4CD964', label: 'Green' },
  { value: '#5AC8FA', label: 'Light Blue' },
  { value: '#007AFF', label: 'Blue' },
  { value: '#5856D6', label: 'Purple' },
];

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="flex items-center space-x-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
        {colors.map((color) => (
          <button
            key={color.value}
            className={cn(
              "color-swatch transform transition-all duration-200",
              selectedColor === color.value && "active scale-110"
            )}
            style={{ backgroundColor: color.value }}
            onClick={() => onColorChange(color.value)}
            title={color.label}
            aria-label={`Select ${color.label} color`}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;
