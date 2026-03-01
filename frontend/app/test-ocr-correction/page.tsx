'use client';

import { useState } from 'react';
import Image from 'next/image';
import ManualMedicineEntry from '@/components/prescription/ManualMedicineEntry';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PrescriptionOCRTest() {
  // Your actual OCR result from the image you uploaded
  const ocrResult = {
    confidence: 28.0,
    imageQuality: 'fair',
    hasHandwriting: true,
    rawText: `TOr1TIT, ciuft 713, frn13, 9GI fdclfold 9 {u,19ia (rtTG; Si. f4urT &, faar st . 31fiveas fa. farar eryde & 1Ra fhfvfryv 3ryde 4 uRar ffof1z, Fof Rf8.1-33917-E rfer T.1-84214-A qri2d 719 6: 14/210 26 R 7_ Tex (2 @ Atlefra 7- 2157 ) ?r 45,S0l0 2 e paeimcl 68o aymuf} HiJ} 4dTT fk fadt raa 3ruird} " 3lfefl4 = TTaaUnT cafa SiteriTT +erd ai biBdict 315 uoert Eeiar, fuib. Nggc n0h Dem V0 67 { afweeulr M (goqRruit e`,
    extractedMedicines: [] // OCR failed to extract medicines
  };

  // What medicines SHOULD have been extracted (based on manual reading)
  const actualMedicines = [
    {
      name: 'Fexo Allegra',
      dosage: '120mg',
      frequency: 'As needed',
      duration: '',
      quantity: 2,
      price: 85
    },
    {
      name: 'Wysolone',
      dosage: '',
      frequency: 'As prescribed',
      duration: '',
      quantity: 3,
      price: 120
    },
    {
      name: 'Preimol 650',
      dosage: '650mg',
      frequency: 'As needed',
      duration: '',
      quantity: 2,
      price: 30
    }
  ];

  const [correctedMedicines, setCorrectedMedicines] = useState(actualMedicines);
  const [showRawText, setShowRawText] = useState(false);

  const handleMedicinesUpdate = (medicines: any[]) => {
    setCorrectedMedicines(medicines);
    console.log('Updated medicines:', medicines);
  };

  const handleSubmit = () => {
    console.log('Submitting corrected prescription:', correctedMedicines);
    alert(`Successfully submitted ${correctedMedicines.length} medicines!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prescription OCR Test
        </h1>
        <p className="text-gray-600 mb-6">
          Test case: Low confidence OCR result with manual correction
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Prescription Image & OCR Analysis */}
          <div className="space-y-6">
            {/* Prescription Image */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-gray-800 mb-3">
                Uploaded Prescription
              </h2>
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <p className="text-sm text-gray-500 mb-2 text-center">
                  Sample prescription image (श्रद्धा क्लिनिक)
                </p>
                <div className="bg-white p-4 rounded border border-gray-300 text-sm">
                  <p className="font-semibold text-red-600 mb-2">श्रद्धा क्लिनिक</p>
                  <p className="text-xs text-gray-500 mb-3">Date: 14/2/2026</p>
                  <p className="mb-1">℞</p>
                  <p className="ml-4 mb-1">1. Fexo Allegra (120) - (2)</p>
                  <p className="ml-4 mb-1">2. Wysolone - (3)</p>
                  <p className="ml-4 mb-1">3. Preimol 650 - (2)</p>
                </div>
              </div>
            </div>

            {/* OCR Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-gray-800 mb-3">
                OCR Analysis Results
              </h2>

              <div className="space-y-3">
                {/* Confidence */}
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-800">OCR Confidence</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {ocrResult.confidence}%
                  </span>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-xs text-gray-500">Image Quality</p>
                    <p className="font-medium capitalize">{ocrResult.imageQuality}</p>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    <p className="text-xs text-gray-500">Handwriting</p>
                    <p className="font-medium">{ocrResult.hasHandwriting ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {/* Raw Text Toggle */}
                <div>
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    {showRawText ? 'Hide' : 'Show'} Raw OCR Text
                  </button>

                  {showRawText && (
                    <div className="mt-2 p-3 bg-gray-900 text-gray-300 rounded font-mono text-xs overflow-auto max-h-40">
                      {ocrResult.rawText}
                    </div>
                  )}
                </div>

                {/* Problems Detected */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Why OCR Failed:
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Handwritten text (harder to recognize)</li>
                    <li>Mixed languages (Marathi + English)</li>
                    <li>Low image quality (lighting/angle)</li>
                    <li>Confidence below 50% threshold</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Manual Correction */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="font-semibold text-gray-800 mb-4">
                Manual Medicine Entry
              </h2>

              <ManualMedicineEntry
                ocrConfidence={ocrResult.confidence}
                extractedMedicines={actualMedicines}
                onMedicinesUpdate={handleMedicinesUpdate}
                showWarning={true}
              />

              {correctedMedicines.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Corrected Prescription
                  </button>
                </div>
              )}
            </div>

            {/* Comparison */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                💡 What Should Have Been Extracted:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Fexo Allegra 120mg (allergy medicine)</li>
                <li>✓ Wysolone (steroid)</li>
                <li>✓ Preimol 650mg (Paracetamol)</li>
              </ul>
              <p className="text-xs text-blue-700 mt-3">
                Since OCR failed, you can manually enter or edit the medicines above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
