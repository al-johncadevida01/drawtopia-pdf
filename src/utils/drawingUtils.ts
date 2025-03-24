
import { PDFDocument } from 'pdf-lib';
import { toast } from 'sonner';
import { fabric } from 'fabric';

// Tool types
export type DrawingTool = 
  | 'cursor' 
  | 'pan'
  | 'pen' 
  | 'marker' 
  | 'area' 
  | 'perimeter' 
  | 'length' 
  | 'counter' 
  | 'angle' 
  | 'note';

// Drawing data structure
export interface DrawingData {
  tool: DrawingTool;
  color: string;
  width: number;
  opacity: number;
  path?: fabric.Path;
}

// Function to download the PDF with annotations
export const downloadPDF = async (pdfUrl: string, fabricObjects: fabric.Object[], fileName: string = 'annotated.pdf') => {
  try {
    // Fetch the PDF
    const pdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Convert fabric objects to PDF annotations
    // This is a simplified version - in a real app, you'd need to convert 
    // each fabric object to the appropriate PDF annotation
    
    // Save the document
    const annotatedPdfBytes = await pdfDoc.save();
    
    // Create a blob from the PDF data
    const blob = new Blob([annotatedPdfBytes], { type: 'application/pdf' });
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('PDF downloaded successfully');
  } catch (error) {
    console.error('Error downloading PDF:', error);
    toast.error('Failed to download PDF');
  }
};

// Function to calculate area of a polygon
export const calculateArea = (points: { x: number, y: number }[]): number => {
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area / 2);
};

// Function to calculate perimeter of a polygon
export const calculatePerimeter = (points: { x: number, y: number }[]): number => {
  let perimeter = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  
  return perimeter;
};

// Function to calculate length between two points
export const calculateLength = (p1: { x: number, y: number }, p2: { x: number, y: number }): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Function to calculate angle between three points
export const calculateAngle = (
  p1: { x: number, y: number }, 
  p2: { x: number, y: number }, 
  p3: { x: number, y: number }
): number => {
  const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
  const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
  let angle = Math.abs((angle1 - angle2) * 180 / Math.PI);
  
  if (angle > 180) {
    angle = 360 - angle;
  }
  
  return angle;
};
