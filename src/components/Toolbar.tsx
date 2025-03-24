
import React from 'react';
import { cn } from '@/lib/utils';
import { DrawingTool } from '@/utils/drawingUtils';
import { 
  MousePointer, 
  Hand, 
  Pencil, 
  Highlighter, 
  Square, 
  Ruler, 
  Hash, 
  Circle, 
  FileText, 
  FileUp, 
  Save, 
  Download,
  FilePlus2,
  Trash
} from 'lucide-react';

interface ToolbarProps {
  activeTool: DrawingTool | null;
  onToolSelect: (tool: DrawingTool) => void;
  onUploadClick: () => void;
  onClearClick: () => void;
  onSaveClick: () => void;
  canSave: boolean;
  hasPdf: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onToolSelect,
  onUploadClick,
  onClearClick,
  onSaveClick,
  canSave,
  hasPdf
}) => {
  const tools = [
    { id: 'cursor' as DrawingTool, icon: <MousePointer size={20} />, label: 'Cursor' },
    { id: 'pan' as DrawingTool, icon: <Hand size={20} />, label: 'Pan' },
    { id: 'pen' as DrawingTool, icon: <Pencil size={20} />, label: 'Pen' },
    { id: 'marker' as DrawingTool, icon: <Highlighter size={20} />, label: 'Marker' },
    { id: 'area' as DrawingTool, icon: <Square size={20} />, label: 'Area' },
    { id: 'perimeter' as DrawingTool, icon: <Ruler size={20} strokeWidth={1.5} />, label: 'Perimeter' },
    { id: 'length' as DrawingTool, icon: <Ruler size={20} />, label: 'Length' },
    { id: 'counter' as DrawingTool, icon: <Hash size={20} />, label: 'Counter' },
    { id: 'angle' as DrawingTool, icon: <Circle size={20} />, label: 'Angle' },
    { id: 'note' as DrawingTool, icon: <FileText size={20} />, label: 'Note' },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-10 flex justify-center p-2 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
      <div className="flex items-center space-x-1 p-1 rounded-lg bg-gray-50 border border-gray-200">
        {/* File Actions */}
        <div className="flex items-center mr-2 pr-2 border-r border-gray-200">
          <button
            className="tool-button"
            onClick={onUploadClick}
            title="Upload PDF"
          >
            <FileUp size={20} />
            <span className="tool-button-label">Upload</span>
          </button>
          
          <button
            className={cn("tool-button", !canSave && "opacity-50 cursor-not-allowed")}
            onClick={onSaveClick}
            disabled={!canSave}
            title="Save Annotations"
          >
            <Save size={20} />
            <span className="tool-button-label">Save</span>
          </button>
          
          <button
            className={cn("tool-button", !hasPdf && "opacity-50 cursor-not-allowed")}
            onClick={onClearClick}
            disabled={!hasPdf}
            title="Clear All"
          >
            <Trash size={20} />
            <span className="tool-button-label">Clear</span>
          </button>
        </div>
        
        {/* Drawing Tools */}
        <div className="flex items-center flex-wrap justify-center">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={cn(
                "tool-button", 
                activeTool === tool.id && "active animate-tool-bounce"
              )}
              onClick={() => onToolSelect(tool.id)}
              disabled={!hasPdf}
              aria-pressed={activeTool === tool.id}
              title={tool.label}
            >
              {tool.icon}
              <span className="tool-button-label">{tool.label}</span>
            </button>
          ))}
          
          {/* Export to PDF button */}
          <button
            className={cn(
              "tool-button ml-2 border-l border-gray-200 pl-2",
              !hasPdf && "opacity-50 cursor-not-allowed"
            )}
            disabled={!hasPdf}
            onClick={() => {/* Export to PDF logic */}}
            title="Export to PDF"
          >
            <Download size={20} />
            <span className="tool-button-label">Export PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
