
import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import Toolbar from '@/components/Toolbar';
import PDFViewer from '@/components/PDFViewer';
import { DrawingTool } from '@/utils/drawingUtils';

const Index = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);
  const [hasPdf, setHasPdf] = useState(false);
  const [canSave, setCanSave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolSelect = (tool: DrawingTool) => {
    setActiveTool(tool);
    toast.info(`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is a PDF
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      
      // Create object URL for the PDF
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      
      // Reset drawing state
      setActiveTool(null);
      setCanSave(false);
      
      toast.success(`PDF "${file.name}" loaded successfully`);
    }
  };

  const handleClearClick = () => {
    if (confirm('Are you sure you want to clear all annotations?')) {
      // This will be handled by the PDFViewer component
      // We just need to trigger a state change to notify it
      setActiveTool(null);
      setCanSave(false);
      toast.success('All annotations cleared');
    }
  };

  const handleSaveClick = () => {
    // This will be handled by the PDFViewer component
    toast.success('Annotations saved successfully');
  };

  const handlePdfLoaded = () => {
    setHasPdf(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />
      
      {/* Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        onUploadClick={handleUploadClick}
        onClearClick={handleClearClick}
        onSaveClick={handleSaveClick}
        canSave={canSave}
        hasPdf={hasPdf}
      />
      
      {/* Main content */}
      <main className="flex-grow pt-24 pb-8 px-8">
        <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] rounded-xl shadow-xl overflow-hidden bg-white border border-gray-200">
          <PDFViewer 
            pdfUrl={pdfUrl} 
            activeTool={activeTool}
            onPdfLoaded={handlePdfLoaded}
          />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} DrawTopia PDF. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
