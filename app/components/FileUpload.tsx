"use client";
import React, { useState, useRef } from "react";
import * as tf from "@tensorflow/tfjs";

const FileUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const segmentedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const segmentImage = (imgElement: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // HSV Thresholding
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert RGB to HSV
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      const delta = max - min;
      const v = max;
      const s = max === 0 ? 0 : (delta / max) * 255;
      let h = 0;

      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h *= 60;
        if (h < 0) h += 360;
      }

      // Threshold for green color
      if (h >= 60 && h <= 180 && s >= 25 && v >= 25) {
        // Keep green pixels
        continue;
      } else {
        // Set other pixels to black
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const classifyImage = async () => {
    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    const model = await tf.loadGraphModel("/models/model.json");
    const imgElement = new Image();
    imgElement.src = URL.createObjectURL(image);

    imgElement.onload = async () => {
      // Visualize original image
      if (originalCanvasRef.current) {
        const ctx = originalCanvasRef.current.getContext("2d");
        if (ctx) {
          originalCanvasRef.current.width = imgElement.width;
          originalCanvasRef.current.height = imgElement.height;
          ctx.drawImage(imgElement, 0, 0);
        }
      }

      // Perform segmentation
      const segmentedCanvas = segmentImage(imgElement);

      // Visualize segmented image
      if (segmentedCanvasRef.current) {
        const ctx = segmentedCanvasRef.current.getContext("2d");
        if (ctx) {
          segmentedCanvasRef.current.width = segmentedCanvas.width;
          segmentedCanvasRef.current.height = segmentedCanvas.height;
          ctx.drawImage(segmentedCanvas, 0, 0);
        }
      }

      // Convert segmented canvas to tensor
      const tensor = tf.browser.fromPixels(segmentedCanvas)
        .resizeNearestNeighbor([224, 224]) // Match input size of the model
        .toFloat()
        .expandDims();

      // Predict with the model
      const prediction = model.predict(tensor) as tf.Tensor;
      const scores = prediction.dataSync();
      const classes = ["Black Rot", "Black Measles", "Leaf Blight", "Healthy"];
      const maxIndex = scores.indexOf(Math.max(...scores));

      setResult(classes[maxIndex]);
    };
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={classifyImage}
      >
        Classify Image
      </button>
      {result && <p className="text-lg font-bold">Prediction: {result}</p>}
      <div className="flex gap-4 mt-4">
        <div>
          <p className="text-center">Original Image</p>
          <canvas ref={originalCanvasRef} className="border" />
        </div>
        <div>
          <p className="text-center">Segmented Image</p>
          <canvas ref={segmentedCanvasRef} className="border" />
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
