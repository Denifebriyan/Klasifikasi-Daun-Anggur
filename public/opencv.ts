import cv from "@techstark/opencv-js";

/**
 * Load OpenCV and return a promise that resolves once OpenCV is ready.
 */
export const loadOpenCV = async (): Promise<void> => {
  return new Promise((resolve) => {
    cv["onRuntimeInitialized"] = () => {
      resolve();
    };
  });
};

/**
 * Perform image segmentation using OpenCV's HSV thresholding.
 */
export const segmentImageWithOpenCV = (imgElement: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }
  
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);
  
    const src = cv.imread(canvas); // Read the image from the canvas
    const dst = new cv.Mat();
    const low = new cv.Mat(src.rows, src.cols, src.type(), [30, 40, 40, 0]); // Lower HSV bound
    const high = new cv.Mat(src.rows, src.cols, src.type(), [80, 255, 255, 0]); // Upper HSV bound
  
    try {
      cv.cvtColor(src, dst, cv.COLOR_RGB2HSV, 0); // Convert to HSV
      cv.inRange(dst, low, high, dst); // Apply threshold
      cv.imshow(canvas, dst); // Render the result to canvas
    } catch (error) {
      console.error("Error during OpenCV operations:", error);
    } finally {
      src.delete();
      dst.delete();
      low.delete();
      high.delete();
    }
  
    return canvas;
  };
  
