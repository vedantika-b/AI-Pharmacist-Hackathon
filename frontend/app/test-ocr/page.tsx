'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export default function TestOCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const testBackendOCR = async () => {
    if (!file) return;

    setLoading(true);
    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(file);
      });

      // Call backend OCR
      const formData = new FormData();
      formData.append('image', base64);
      formData.append('filename', file.name);

      const response = await fetch('http://localhost:8000/api/v1/prescriptions/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🧪 Test OCR System</h1>

      <div className="space-y-6">
        {/* Upload Box */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="ocr-test-file"
          />
          <label htmlFor="ocr-test-file" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Click to upload prescription image</p>
            {file && (
              <p className="mt-2 text-sm text-green-600">
                ✅ Selected: {file.name}
              </p>
            )}
          </label>
        </div>

        {/* Test Button */}
        {file && (
          <button
            onClick={testBackendOCR}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? '🔄 Processing...' : '🚀 Test Backend OCR'}
          </button>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              OCR Results
            </h2>

            {result.error ? (
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <p className="text-red-700">❌ Error: {result.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded">
                  <p className="font-semibold">Status: {result.status}</p>
                  <p className="text-sm">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                </div>

                {result.medications && result.medications.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Extracted Medicines:</h3>
                    {result.medications.map((med: any, i: number) => (
                      <div key={i} className="bg-gray-50 p-3 rounded mb-2">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-600">
                          Dosage: {med.dosage} | Frequency: {med.frequency}
                        </p>
                        {med.duration && (
                          <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {result.extracted_text && (
                  <details className="bg-gray-50 p-4 rounded">
                    <summary className="cursor-pointer font-medium">Raw OCR Text</summary>
                    <pre className="mt-2 text-xs whitespace-pre-wrap">{result.extracted_text}</pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ OCR Status:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>✅ Backend OCR: Ready (EasyOCR)</li>
          <li>📍 Endpoint: http://localhost:8000/api/v1/prescriptions/upload</li>
          <li>🔧 Make sure backend is running on port 8000</li>
        </ul>
      </div>
    </div>
  );
}
