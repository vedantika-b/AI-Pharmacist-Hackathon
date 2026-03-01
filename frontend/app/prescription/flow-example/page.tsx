/**
 * Integration Example: Upload → Review → Order
 * 
 * This shows how to connect the prescription upload flow
 * to the review page and order creation.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrescriptionUpload } from '@/hooks/usePrescriptionUpload';
import { Upload, CheckCircle, ArrowRight } from 'lucide-react';

export default function PrescriptionFlowExample() {
  const router = useRouter();
  const { upload, uploading, result, error } = usePrescriptionUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Assume we have current user ID from auth context
    const userId = 'current-user-id'; // Replace with actual user ID

    const uploadResult = await upload(selectedFile, userId);

    if (uploadResult.success && uploadResult.prescriptionId) {
      // SUCCESS! Now redirect to review page
      router.push(`/prescription/review?id=${uploadResult.prescriptionId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload Prescription</h1>

      {/* Step 1: Upload */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <h2 className="text-xl font-semibold">Upload Image</h2>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="mb-4 w-full"
        />

        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploading ? 'Processing...' : 'Upload & Extract Medicines'}
          </button>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Step 2: Review (shown after upload) */}
      {result && result.medicines && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold">OCR Complete!</h2>
          </div>

          <p className="text-gray-600 mb-4">
            Found {result.medicines.length} medicine(s)
          </p>

          <button
            onClick={() =>
              router.push(`/prescription/review?id=${result.prescriptionId}`)
            }
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
          >
            Review & Confirm Order
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Flow Diagram */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-4">Complete Flow:</h3>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-center gap-2">
            <span className="font-bold">1.</span>
            <Upload className="w-4 h-4" />
            <span>Upload prescription image</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">2.</span>
            <span>↓</span>
            <span>OCR extracts medicines</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">3.</span>
            <span>↓</span>
            <span>Redirect to /prescription/review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">4.</span>
            <span>↓</span>
            <span>User edits medicines if needed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">5.</span>
            <span>↓</span>
            <span>Click "Confirm Order"</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">6.</span>
            <CheckCircle className="w-4 h-4" />
            <span>Order created successfully!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
