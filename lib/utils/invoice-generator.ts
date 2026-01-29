/**
 * Utility functions for generating invoice PDF and images
 */

/**
 * Convert image URL to data URL to avoid CORS issues
 */
async function convertImageToDataURL(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(image, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } else {
          resolve(null);
        }
      } catch (_error) {
        // If CORS fails, try without crossOrigin
        const fallbackImage = new Image();
        fallbackImage.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = fallbackImage.naturalWidth || fallbackImage.width;
            canvas.height = fallbackImage.naturalHeight || fallbackImage.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(fallbackImage, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              resolve(dataUrl);
            } else {
              resolve(null);
            }
          } catch (_e) {
            resolve(null);
          }
        };
        fallbackImage.onerror = () => resolve(null);
        fallbackImage.src = url;
      }
    };

    image.onerror = () => resolve(null);
    image.src = url;

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!image.complete) {
        resolve(null);
      }
    }, 10000);
  });
}

/**
 * Clone element and convert all images to data URLs to avoid CORS issues
 */
async function cloneElementWithDataURLImages(element: HTMLElement): Promise<HTMLElement> {
  const clone = element.cloneNode(true) as HTMLElement;
  const promises: Promise<void>[] = [];

  // Find all SVG image elements and convert them
  const svgImages = clone.querySelectorAll('image[href], image[xlink\\:href]');
  svgImages.forEach((img) => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');
    if (href && !href.startsWith('data:')) {
      const promise = convertImageToDataURL(href).then((dataUrl) => {
        if (dataUrl) {
          img.setAttribute('href', dataUrl);
          if (img.hasAttribute('xlink:href')) {
            img.setAttribute('xlink:href', dataUrl);
          }
        }
      });
      promises.push(promise);
    }
  });

  // Find all regular img elements and convert them
  const imgElements = clone.querySelectorAll('img[src]');
  imgElements.forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
      const promise = convertImageToDataURL(src).then((dataUrl) => {
        if (dataUrl) {
          img.setAttribute('src', dataUrl);
        }
      });
      promises.push(promise);
    }
  });

  await Promise.allSettled(promises);

  // Temporarily append clone to DOM (hidden) so html2canvas can access it
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '-9999px';
  document.body.appendChild(clone);

  // Wait a bit for images to render
  await new Promise(resolve => setTimeout(resolve, 300));

  return clone;
}


/**
 * Generate an image from an SVG element
 */
export async function generateInvoiceImage(
  svgElement: SVGSVGElement,
  _invoiceNumber: string,
): Promise<{ blob: Blob; base64: string }> {
  // Convert SVG to canvas using html2canvas-like approach
  // Since we're using SVG, we can use a simpler approach
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw white background
      ctx.fillStyle = '#040B14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the SVG image
      ctx.drawImage(img, 0, 0);

      // Convert to blob and base64
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        const base64 = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve({ blob, base64: base64.split(',')[1] }); // Remove data:image/png;base64, prefix
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };
    img.src = url;
  });
}

/**
 * Generate a PDF from an SVG element using browser print API
 */
export async function generateInvoicePDF(
  containerElement: HTMLElement,
  invoiceNumber: string,
): Promise<{ blob: Blob; base64: string }> {
  // Use browser's print to PDF functionality
  // Create a hidden iframe or window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  return new Promise((resolve) => {
    // Clone the container and its styles
    const clonedElement = containerElement.cloneNode(true) as HTMLElement;

    // Get all stylesheets
    const stylesheets = Array.from(document.styleSheets);
    let cssText = '';

    stylesheets.forEach((stylesheet) => {
      try {
        const rules = Array.from(stylesheet.cssRules || stylesheet.rules);
        rules.forEach((rule) => {
          cssText += rule.cssText + '\n';
        });
      } catch (_e) {
        // Cross-origin stylesheets can't be accessed
      }
    });

    // Write content to print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNumber}</title>
          <style>
            ${cssText}
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            .invoice-container {
              width: 100%;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .invoice-page {
              width: 210mm;
              height: 297mm;
            }
          </style>
        </head>
        <body>
          ${clonedElement.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        // Use browser print dialog
        printWindow.print();
        // Close the window after a delay
        setTimeout(() => {
          printWindow.close();
          // For now, resolve with empty data since we can't capture PDF from print dialog
          // In production, you might want to use jsPDF or puppeteer for server-side generation
          resolve({
            blob: new Blob([], { type: 'application/pdf' }),
            base64: '',
          });
        }, 1000);
      }, 500);
    };
  });
}

/**
 * Generate PDF using html2canvas + jsPDF (if available)
 * This is a better approach that doesn't require print dialog
 */
export async function generateInvoicePDFAdvanced(
  containerElement: HTMLElement,
  invoiceNumber: string,
): Promise<{ blob: Blob; base64: string }> {
  // Dynamic import to avoid bundling if not available
  let clonedElement: HTMLElement | null = null;

  try {
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    // Clone element and convert images to data URLs to avoid CORS issues
    clonedElement = await cloneElementWithDataURLImages(containerElement);

    // Find the actual invoice pages to get content dimensions
    const invoicePages = clonedElement.querySelectorAll('.invoice-page');
    if (invoicePages.length === 0) {
      throw new Error('No invoice pages found');
    }

    // Calculate content dimensions using offsetTop/offsetLeft (relative to parent)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    invoicePages.forEach((page) => {
      const element = page as HTMLElement;
      const x = element.offsetLeft;
      const y = element.offsetTop;
      const width = element.offsetWidth || element.scrollWidth;
      const height = element.offsetHeight || element.scrollHeight;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Calculate content dimensions
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Generate canvas from the cloned container (with data URL images)
    // Use higher scale for better quality
    const canvas = await html2canvas(clonedElement, {
      scale: 3, // Increased from 2 to 3 for better quality
      useCORS: true,
      allowTaint: false, // Can use false now since images are data URLs
      logging: false,
      backgroundColor: '#040B14',
      imageTimeout: 30000,
      width: clonedElement.scrollWidth,
      height: clonedElement.scrollHeight,
    });

    // Crop canvas to actual content area
    // Coordinates are already relative to clonedElement, so we can use them directly
    const cropX = Math.round(minX * 3); // scale factor
    const cropY = Math.round(minY * 3);
    const cropWidth = Math.round(contentWidth * 3);
    const cropHeight = Math.round(contentHeight * 3);

    // Create a new canvas with just the content
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const ctx = croppedCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    ctx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = croppedCanvas.toDataURL('image/png', 1.0); // Highest quality
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm

    // Calculate the image dimensions in PDF units (mm)
    const imgWidthInMM = pdfWidth;
    const imgHeightInMM = (croppedCanvas.height * pdfWidth) / croppedCanvas.width;

    // Calculate how many pages we need
    const totalPages = Math.ceil(imgHeightInMM / pdfHeight);

    // Add image to PDF, splitting across pages if needed
    if (imgHeightInMM <= pdfHeight) {
      // Single page - image fits
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidthInMM, imgHeightInMM);
    } else {
      // Multiple pages - split the image
      let remainingHeight = imgHeightInMM;
      let sourceY = 0;

      for (let i = 0; i < totalPages && remainingHeight > 0; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Calculate how much of the image fits on this page
        const pageImgHeight = Math.min(pdfHeight, remainingHeight);

        // Calculate source crop for this page (in pixels)
        const sourceYPx = (sourceY / imgHeightInMM) * croppedCanvas.height;
        const sourceHeightPx = (pageImgHeight / imgHeightInMM) * croppedCanvas.height;

        // Create a temporary canvas for this page's portion
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = croppedCanvas.width;
        pageCanvas.height = Math.ceil(sourceHeightPx);
        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          pageCtx.drawImage(
            croppedCanvas,
            0, Math.round(sourceYPx), croppedCanvas.width, Math.round(sourceHeightPx),
            0, 0, croppedCanvas.width, Math.round(sourceHeightPx)
          );
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidthInMM, pageImgHeight);
        }

        sourceY += pageImgHeight;
        remainingHeight -= pageImgHeight;
      }
    }

    // Generate blob and base64
    const pdfBlob = pdf.output('blob');
    const pdfBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });

    return {
      blob: pdfBlob,
      base64: pdfBase64,
    };
  } catch (_error) {
    // Fallback to print method if libraries not available
    console.warn('Advanced PDF generation not available, falling back to print method');
    return generateInvoicePDF(containerElement, invoiceNumber);
  } finally {
    // Clean up cloned element
    if (clonedElement && clonedElement.parentNode) {
      clonedElement.parentNode.removeChild(clonedElement);
    }
  }
}

/**
 * Generate image using html2canvas (if available)
 */
export async function generateInvoiceImageAdvanced(
  containerElement: HTMLElement,
  invoiceNumber: string,
): Promise<{ blob: Blob; base64: string }> {
  let clonedElement: HTMLElement | null = null;

  try {
    const html2canvas = (await import('html2canvas')).default;

    // Clone element and convert images to data URLs to avoid CORS issues
    clonedElement = await cloneElementWithDataURLImages(containerElement);

    // Find the actual invoice pages to get content dimensions
    const invoicePages = clonedElement.querySelectorAll('.invoice-page');
    if (invoicePages.length === 0) {
      throw new Error('No invoice pages found');
    }

    // Calculate content dimensions using offsetTop/offsetLeft (relative to parent)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    invoicePages.forEach((page) => {
      const element = page as HTMLElement;
      const x = element.offsetLeft;
      const y = element.offsetTop;
      const width = element.offsetWidth || element.scrollWidth;
      const height = element.offsetHeight || element.scrollHeight;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // Calculate content dimensions
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Generate canvas from the cloned container (with data URL images)
    // Use higher scale for better quality
    const canvas = await html2canvas(clonedElement, {
      scale: 3, // Increased from 2 to 3 for better quality
      useCORS: true,
      allowTaint: false, // Can use false now since images are data URLs
      logging: false,
      backgroundColor: '#040B14',
      imageTimeout: 30000,
      width: clonedElement.scrollWidth,
      height: clonedElement.scrollHeight,
    });

    // Crop canvas to actual content area
    // Coordinates are already relative to clonedElement, so we can use them directly
    const cropX = Math.round(minX * 3); // scale factor
    const cropY = Math.round(minY * 3);
    const cropWidth = Math.round(contentWidth * 3);
    const cropHeight = Math.round(contentHeight * 3);

    // Create a new canvas with just the content
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    const ctx = croppedCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    ctx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }

        const base64 = croppedCanvas.toDataURL('image/png', 1.0).split(',')[1]; // Highest quality
        resolve({ blob, base64 });
      }, 'image/png', 1.0); // Highest quality
    });
  } catch (_error) {
    // Fallback to SVG method
    const svgElement = containerElement.querySelector('svg');
    if (svgElement) {
      return generateInvoiceImage(svgElement, invoiceNumber);
    }
    throw new Error('Failed to generate invoice image');
  } finally {
    // Clean up cloned element
    if (clonedElement && clonedElement.parentNode) {
      clonedElement.parentNode.removeChild(clonedElement);
    }
  }
}

