import { useState } from 'react';

interface Medicine {
  name: string;
  dosage: string;
}

interface PrescriptionUploadResult {
  success: boolean;
  prescriptionId?: string;
  medicines?: Medicine[];
  confidence?: number;
  rawText?: string;
  error?: string;
  warning?: string;
}

interface UsePrescriptionUploadReturn {
  upload: (file: File, userId: string) => Promise<PrescriptionUploadResult>;
  uploading: boolean;
  progress: number;
  error: string | null;
  result: PrescriptionUploadResult | null;
  reset: () => void;
}

/**
 * Hook for uploading and processing prescription images
 * 
 * @example
 * ```tsx
 * const { upload, uploading, result, error } = usePrescriptionUpload();
 * 
 * const handleFileSelect = async (file: File) => {
 *   const result = await upload(file, currentUser.id);
 *   if (result.success) {
 *     console.log('Medicines:', result.medicines);
 *   }
 * };
 * ```
 */
export function usePrescriptionUpload(): UsePrescriptionUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionUploadResult | null>(null);

  const upload = async (
    file: File,
    userId: string
  ): Promise<PrescriptionUploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Validate file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload JPG or PNG only.');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      setProgress(20);

      // Create form data
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', userId);

      setProgress(40);

      // Upload
      const response = await fetch('/api/prescription/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      const data: PrescriptionUploadResult = await response.json();

      setProgress(100);

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setResult(null);
  };

  return {
    upload,
    uploading,
    progress,
    error,
    result,
    reset,
  };
}
