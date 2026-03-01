'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PrescriptionReview from '@/components/prescription/PrescriptionReview';
import { createClient } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Medicine {
  name: string;
  dosage: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  price: number;
}

export default function PrescriptionReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prescriptionId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);

  // Get current user (adjust based on your auth implementation)
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const loadPrescription = async () => {
      if (!prescriptionId) {
        setError('No prescription ID provided');
        setLoading(false);
        return;
      }

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        setUserId(user.id);

        // Fetch prescription data
        const { data, error: fetchError } = await supabase
          .from('prescription_scans')
          .select('*')
          .eq('id', prescriptionId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('Prescription not found');
          return;
        }

        setPrescriptionData(data);
      } catch (err) {
        console.error('Error loading prescription:', err);
        setError(err instanceof Error ? err.message : 'Failed to load prescription');
      } finally {
        setLoading(false);
      }
    };

    loadPrescription();
  }, [prescriptionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (error || !prescriptionData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error || 'Failed to load prescription'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <PrescriptionReview
      prescriptionId={prescriptionData.id}
      imageUrl={prescriptionData.image_url}
      extractedMedicines={prescriptionData.extracted_medicines || []}
      userId={userId}
    />
  );
}
