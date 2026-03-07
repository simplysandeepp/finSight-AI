// frontend/src/components/CSVUpload.jsx
import { useState, useRef } from "react";

export default function CSVUpload({ onResult }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      setError("Please upload a .csv file");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("as_of_date", new Date().toISOString().split("T")[0]);

    try {
      const res = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "error") {
        setError(data.message);
      } else {
        onResult(data);
      }
    } catch (e) {
      setError("Upload failed. Make sure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
        ${dragging ? "border-teal-400 bg-teal-900/20" : "border-slate-600 hover:border-teal-500"}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => fileRef.current.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      
      <div className="text-4xl mb-3">📂</div>
      <p className="text-slate-300 font-medium">
        {loading ? "Analyzing your data..." : "Drop your CSV here or click to upload"}
      </p>
      <p className="text-slate-500 text-sm mt-1">
        Required columns: date, revenue — Optional: ebitda, net_income, eps
      </p>
      
      {/* Sample CSV download hint */}
      <p className="text-teal-400 text-xs mt-3">
        📥 Not sure about the format?{" "}
        <a
          href="/sample_upload.csv"
          onClick={(e) => e.stopPropagation()}
          className="underline hover:text-teal-300"
        >
          Download sample CSV
        </a>
      </p>
      
      {error && (
        <p className="text-red-400 text-sm mt-3 bg-red-900/20 p-2 rounded-lg">{error}</p>
      )}
    </div>
  );
}
