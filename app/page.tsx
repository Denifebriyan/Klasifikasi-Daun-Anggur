import React from "react";
import FileUpload from "./components/FileUpload";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Grape Leaf Disease Classification</h1>
      {/* <GrapeLeafSegmentation /> */}
      <FileUpload />
    </div>
  );
}
