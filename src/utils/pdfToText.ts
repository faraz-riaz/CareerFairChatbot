import * as pdfjs from 'pdfjs-dist';

// Initialize the worker with the correct path for version 3.11.174
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Converts a PDF file to text using pdf.js
 * @param file The PDF file to convert
 * @returns The extracted text from the PDF
 */
export async function pdfToText(file: File): Promise<string> {
  try {
    // For non-PDF files, use the simple approach
    if (file.type !== 'application/pdf') {
      const text = await file.text();
      if (text.trim()) {
        return text;
      }
      throw new Error('Could not extract text from this file');
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    if (!fullText.trim()) {
      throw new Error('No text could be extracted from the PDF');
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('Error processing file:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
    throw new Error('Failed to process PDF file');
  }
}