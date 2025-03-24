import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from 'sonner';
import ColorPicker from './ColorPicker';
import { DrawingTool, downloadPDF } from '@/utils/drawingUtils';
import { cn } from '@/lib/utils';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string | null;
  activeTool: DrawingTool | null;
  onPdfLoaded: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl, activeTool, onPdfLoaded }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [loading, setLoading] = useState(false);

  // Initialize fabric canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        isDrawingMode: false,
        selection: true,
        width: containerRef.current?.clientWidth || 800,
        height: containerRef.current?.clientHeight || 600,
      });
      
      setFabricCanvas(canvas);
      
      return () => {
        canvas.dispose();
      };
    }
  }, [canvasRef, fabricCanvas]);

  // Load PDF document when URL changes
  useEffect(() => {
    if (!pdfUrl) return;
    
    const loadPdf = async () => {
      try {
        setLoading(true);
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        onPdfLoaded();
        
        // Render the first page
        renderPage(pdf, 1, scale);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast.error('Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };
    
    loadPdf();
  }, [pdfUrl, onPdfLoaded]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (fabricCanvas && containerRef.current) {
        fabricCanvas.setWidth(containerRef.current.clientWidth);
        fabricCanvas.setHeight(containerRef.current.clientHeight);
        fabricCanvas.renderAll();
        
        // Re-render current page on resize
        if (pdfDocument) {
          renderPage(pdfDocument, currentPage, scale);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fabricCanvas, pdfDocument, currentPage, scale]);

  // Update canvas drawing mode when active tool changes
  useEffect(() => {
    if (!fabricCanvas) return;
    
    fabricCanvas.isDrawingMode = activeTool === 'pen' || activeTool === 'marker';
    
    if (fabricCanvas.isDrawingMode) {
      fabricCanvas.freeDrawingBrush.color = selectedColor;
      fabricCanvas.freeDrawingBrush.width = activeTool === 'marker' ? 12 : 2;
      
      // Set opacity for marker - needs to be set on objects since BaseBrush doesn't have opacity
      if (activeTool === 'marker') {
        // For marker tool we'll set opacity on newly created objects instead
        fabricCanvas.on('path:created', (e) => {
          if (e.path) {
            e.path.set('opacity', 0.5);
            fabricCanvas.renderAll();
          }
        });
      } else {
        // Remove listener when not using marker
        fabricCanvas.off('path:created');
      }
    }
    
    fabricCanvas.selection = activeTool === 'cursor';
    
    // Set appropriate cursor based on tool
    if (containerRef.current) {
      switch (activeTool) {
        case 'cursor':
          containerRef.current.style.cursor = 'default';
          break;
        case 'pan':
          containerRef.current.style.cursor = 'grab';
          break;
        case 'pen':
        case 'marker':
          containerRef.current.style.cursor = 'crosshair';
          break;
        default:
          containerRef.current.style.cursor = 'default';
      }
    }
  }, [activeTool, fabricCanvas, selectedColor]);

  // Update drawing color
  useEffect(() => {
    if (fabricCanvas && fabricCanvas.isDrawingMode) {
      fabricCanvas.freeDrawingBrush.color = selectedColor;
    }
  }, [selectedColor, fabricCanvas]);

  // Function to render a PDF page
  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number, pageScale: number) => {
    if (!fabricCanvas) return;
    
    try {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: pageScale });
      
      // Adjust canvas size to fit the page
      fabricCanvas.setWidth(viewport.width);
      fabricCanvas.setHeight(viewport.height);
      
      // Add background for the page
      const pageBackground = new fabric.Rect({
        left: 0,
        top: 0,
        width: viewport.width,
        height: viewport.height,
        fill: 'white',
        selectable: false,
        evented: false,
      });
      
      fabricCanvas.clear();
      fabricCanvas.add(pageBackground);
      
      // Create a temporary canvas for PDF rendering
      const tempCanvas = document.createElement('canvas');
      const context = tempCanvas.getContext('2d');
      tempCanvas.width = viewport.width;
      tempCanvas.height = viewport.height;
      
      if (context) {
        const renderContext = {
          canvasContext: context,
          viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Create fabric image from rendered PDF - fixed for Fabric.js v6
        const imgElement = new Image();
        imgElement.src = tempCanvas.toDataURL();
        imgElement.onload = () => {
          const fabricImage = new fabric.Image(imgElement, {
            left: 0,
            top: 0,
            selectable: false,
            evented: false
          });
          fabricCanvas.add(fabricImage);
          fabricCanvas.renderAll();
        };
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      toast.error(`Failed to render page ${pageNumber}`);
    }
  };

  // Navigate to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1 && pdfDocument) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      renderPage(pdfDocument, newPage, scale);
    }
  };

  // Navigate to next page
  const goToNextPage = () => {
    if (currentPage < numPages && pdfDocument) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      renderPage(pdfDocument, newPage, scale);
    }
  };

  // Zoom in
  const zoomIn = () => {
    const newScale = Math.min(scale + 0.2, 3.0);
    setScale(newScale);
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage, newScale);
    }
  };

  // Zoom out
  const zoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage, newScale);
    }
  };

  // Clear all annotations
  const clearAnnotations = () => {
    if (fabricCanvas && pdfDocument) {
      // Keep only the background and PDF page
      const objects = fabricCanvas.getObjects();
      if (objects.length > 2) {
        fabricCanvas.remove(...objects.slice(2));
        fabricCanvas.renderAll();
        toast.success('All annotations cleared');
      }
    }
  };

  // Save the current canvas as image
  const saveCanvas = () => {
    if (fabricCanvas) {
      try {
        const dataURL = fabricCanvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1
        });
        
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `annotated-page-${currentPage}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Canvas saved as image');
      } catch (error) {
        console.error('Error saving canvas:', error);
        toast.error('Failed to save canvas');
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full loading-dot"></div>
            <div className="w-3 h-3 bg-primary rounded-full loading-dot"></div>
            <div className="w-3 h-3 bg-primary rounded-full loading-dot"></div>
          </div>
        </div>
      ) : pdfUrl ? (
        <div 
          ref={containerRef} 
          className={cn(
            "pdf-canvas-container flex-grow",
            isDrawing && "canvas-container drawing"
          )}
        >
          <canvas ref={canvasRef} className="w-full h-full" />
          
          {pdfDocument && (
            <div className="pdf-controls animate-fade-in">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className={cn(
                  "p-2 rounded-full hover:bg-gray-100 transition-colors",
                  currentPage <= 1 && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Previous page"
              >
                ←
              </button>
              
              <span className="mx-2 text-sm font-medium">
                {currentPage} / {numPages}
              </span>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                className={cn(
                  "p-2 rounded-full hover:bg-gray-100 transition-colors",
                  currentPage >= numPages && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Next page"
              >
                →
              </button>
              
              <div className="mx-2 h-4 border-r border-gray-300"></div>
              
              <button
                onClick={zoomOut}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Zoom out"
              >
                -
              </button>
              
              <span className="mx-1 text-sm font-medium">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={zoomIn}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-8 animate-fade-in">
          <div className="text-gray-400 mb-4">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M12 18v-6"></path>
              <path d="M9 15h6"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No PDF Loaded</h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Upload a PDF to start annotating or drawing on it
          </p>
        </div>
      )}
      
      {activeTool && (activeTool === 'pen' || activeTool === 'marker') && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <ColorPicker selectedColor={selectedColor} onColorChange={setSelectedColor} />
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
