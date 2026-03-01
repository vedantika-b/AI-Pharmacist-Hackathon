'use client';

import PrescriptionReview from '@/components/prescription/PrescriptionReview';

// Demo data for testing
const demoMedicines = [
  {
    id: 'demo-1',
    name: 'Paracetamol',
    dosage: '500mg',
    frequency: 'Twice daily',
    duration: '5 days',
    quantity: 10,
    price: 5.0,
  },
  {
    id: 'demo-2',
    name: 'Amoxicillin',
    dosage: '250mg',
    frequency: 'Three times daily',
    duration: '7 days',
    quantity: 21,
    price: 8.0,
  },
  {
    id: 'demo-3',
    name: 'Cetirizine',
    dosage: '10mg',
    frequency: 'Once daily',
    duration: '10 days',
    quantity: 10,
    price: 3.0,
  },
];

export default function DemoPrescriptionReview() {
  return (
    <div>
      <div className="bg-yellow-50 border-b border-yellow-200 p-4">
        <p className="text-center text-yellow-800 font-semibold">
          🧪 DEMO MODE - Using sample prescription data
        </p>
      </div>
      <PrescriptionReview
        prescriptionId="demo-prescription-123"
        imageUrl="/prescription-sample.jpg"
        extractedMedicines={demoMedicines}
        userId="demo-user-id"
      />
    </div>
  );
}
