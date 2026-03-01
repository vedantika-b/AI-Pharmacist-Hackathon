'use client';

import { useState } from 'react';
import { usePrescriptionUpload } from '@/hooks/usePrescriptionUpload';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Medicine {
  name: string;
  dosage: string;
}

export default function PrescriptionUploadComponent() {
  const { upload, uploading, progress, error, result, reset } = usePrescriptionUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get user ID from auth context (adjust based on your auth setup)
  const userId = 'current-user-id'; // Replace with actual user ID from context

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Please select a JPG or PNG image');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    reset(); // Reset previous results
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const uploadResult = await upload(selectedFile, userId);

    if (uploadResult.success) {
      console.log('Upload successful:', uploadResult);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Upload Prescription
        </h2>

        {/* File Upload Area */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              id="prescription-file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="prescription-file"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="text-gray-600">
                Click to upload prescription image
              </span>
              <span className="text-sm text-gray-400">
                JPG or PNG, max 10MB
              </span>
            </label>
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Prescription preview"
                className="max-h-64 mx-auto rounded-lg border"
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && !result && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing... {progress}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Process
                </>
              )}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Warning Message */}
        {result?.warning && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Low Confidence</h3>
              <p className="text-yellow-700 text-sm mt-1">{result.warning}</p>
              {result.rawText && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    View raw OCR text
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                    {result.rawText}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        {/* Success Message & Results */}
        {result?.success && result.medicines && result.medicines.length > 0 && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800">
                  Processing Complete
                </h3>
                <p className="text-green-700 text-sm mt-1">
                  Confidence: {result.confidence}% | Prescription ID: {result.prescriptionId}
                </p>
              </div>
            </div>

            {/* Extracted Medicines */}
            <div className="bg-white rounded-md p-4">
              <h4 className="font-semibold mb-3">Extracted Medicines:</h4>
              <div className="space-y-2">
                {result.medicines.map((medicine, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-md border"
                  >
                    <span className="font-medium">{medicine.name}</span>
                    <span className="text-gray-600 text-sm">{medicine.dosage}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
            >
              Upload Another Prescription
            </button>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
        <ol className="list-decimal list-inside text-blue-700 text-sm space-y-1">
          <li>Upload a clear image of your prescription (JPG/PNG)</li>
          <li>Google Vision API extracts text from the image</li>
          <li>OpenAI GPT identifies medicine names and dosages</li>
          <li>Results are stored securely in your account</li>
        </ol>
        <p className="text-blue-600 text-xs mt-3">
          ⚠️ If confidence is below 60%, manual review may be required
        </p>
      </div>
    </div>
  );
}
