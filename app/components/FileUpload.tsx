"use client";
import React, { useState, useRef } from "react";
import * as tf from "@tensorflow/tfjs";

// Import Google Font Poppins via Tailwind config or CDN link in _app or index.html
// Jika belum, bisa ditambahkan di <head> aplikasi: 
// <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet" />

const diseaseInfo: Record<string, { description: string; solution: string }> = {
  "Black Rot": {
    description: "Penyakit jamur yang menyebabkan bercak hitam pada daun dan buah.",
    solution: "Pangkas daun yang terinfeksi dan gunakan fungisida sesuai anjuran.",
  },
  "Black Measles": {
    description: "Penyakit yang menyebabkan bercak hitam dan nekrosis.",
    solution: "Terapkan sanitasi kebun dan kontrol kelembapan.",
  },
  "Leaf Blight": {
    description: "Infeksi yang menyebabkan daun kering dan rontok.",
    solution: "Hindari kelembaban berlebih dan semprot fungisida preventif.",
  },
  Healthy: {
    description: "Daun dalam kondisi sehat tanpa gejala penyakit.",
    solution: "Lanjutkan perawatan secara berkala untuk mencegah penyakit.",
  },
};

const FileUpload: React.FC = () => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const segmentedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResult("");
      setImage(file);
    }
  };

  const segmentImage = (imgElement: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    ctx.drawImage(imgElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        delta = max - min;
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

      if (!(h >= 60 && h <= 180 && s >= 25 && v >= 25)) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const classifyImage = async () => {
    if (!image) return alert("Please upload an image first.");
    setLoading(true);
    setResult("");

    const model = await tf.loadGraphModel("/models/model.json");
    const imgElement = new Image();
    imgElement.src = URL.createObjectURL(image);

    imgElement.onload = async () => {
      if (originalCanvasRef.current) {
        const ctx = originalCanvasRef.current.getContext("2d");
        if (ctx) {
          originalCanvasRef.current.width = imgElement.width;
          originalCanvasRef.current.height = imgElement.height;
          ctx.clearRect(0, 0, imgElement.width, imgElement.height);
          ctx.drawImage(imgElement, 0, 0);
        }
      }

      const segmentedCanvas = segmentImage(imgElement);

      if (segmentedCanvasRef.current) {
        const ctx = segmentedCanvasRef.current.getContext("2d");
        if (ctx) {
          segmentedCanvasRef.current.width = segmentedCanvas.width;
          segmentedCanvasRef.current.height = segmentedCanvas.height;
          ctx.clearRect(0, 0, segmentedCanvas.width, segmentedCanvas.height);
          ctx.drawImage(segmentedCanvas, 0, 0);
        }
      }

      const tensor = tf.browser
        .fromPixels(segmentedCanvas)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .expandDims();

      const prediction = model.predict(tensor) as tf.Tensor;
      const scores = prediction.dataSync();
      const classes = ["Black Rot", "Black Measles", "Leaf Blight", "Healthy"];
      const maxIndex = scores.indexOf(Math.max(...scores));

      setResult(classes[maxIndex]);
      setLoading(false);
    };
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between bg-gray-50 font-poppins"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Header */}
      <header className="flex items-center bg-white shadow-md px-6 py-4">
        <img
          src="/grape.png"
          alt="Grapevine"
          className="w-12 h-12 mr-4 object-contain"
        />
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Skripsi: Klasifikasi Penyakit Daun Anggur Menggunakan Model Hybrid CNN Dan SVM

          </h1>
          <p className="text-sm text-gray-600">Teknik Informatika - Tanri Abeng University</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center gap-6 p-6 max-w-xl mx-auto flex-grow">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-2 w-full text-gray-700 text-sm
            file:bg-blue-600 file:text-white file:px-5 file:py-2 file:rounded-lg
            file:cursor-pointer file:border-0 file:hover:bg-blue-700 transition-colors"
        />

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg shadow-lg font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full"
          onClick={classifyImage}
          disabled={loading}
        >
          {loading ? "Loading..." : "Classify Image"}
        </button>

        {result && (
          <div className="bg-white rounded-xl shadow-xl p-6 w-full mt-6 border border-blue-200">
            <h2 className="text-2xl font-semibold mb-4 text-center text-blue-700">
              Prediction: <span className="text-green-600">{result}</span>
            </h2>
            <p className="text-md mb-3 text-gray-700">
              <strong>Deskripsi:</strong> {diseaseInfo[result].description}
            </p>
            <p className="text-md text-gray-700">
              <strong>Solusi:</strong> {diseaseInfo[result].solution}
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6 mt-8 w-full justify-center">
          <div className="flex-1">
            <p className="text-center mb-2 font-semibold text-gray-700">Original Image</p>
            <canvas
              ref={originalCanvasRef}
              className="border border-gray-300 rounded-lg w-full max-h-60 object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-center mb-2 font-semibold text-gray-700">Segmented Image</p>
            <canvas
              ref={segmentedCanvasRef}
              className="border border-gray-300 rounded-lg w-full max-h-60 object-contain"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner text-center py-4 mt-8 border-t border-gray-200">
        <p className="text-gray-600 text-sm">
          Nama: Deni Febriyanto | NIM: 06021013 | Dosen Pembimbing: Adithya Kusuma Whardana, S.Kom.,M.Kom.
        </p>
      </footer>
    </div>
  );
};

export default FileUpload;
