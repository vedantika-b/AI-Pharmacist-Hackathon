'use client';

import { useState } from 'react';
import { Plus, X, Check, AlertTriangle } from 'lucide-react';

interface Medicine {
  id?: string;
  name: string;
  dosage: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  price: number;
}

interface ManualMedicineEntryProps {
  ocrConfidence: number;
  extractedMedicines: Medicine[];
  onMedicinesUpdate: (medicines: Medicine[]) => void;
  showWarning?: boolean;
}

export default function ManualMedicineEntry({
  ocrConfidence,
  extractedMedicines,
  onMedicinesUpdate,
  showWarning = true
}: ManualMedicineEntryProps) {
  const [medicines, setMedicines] = useState<Medicine[]>(
    extractedMedicines.length > 0 ? extractedMedicines : []
  );
  const [newMedicine, setNewMedicine] = useState<Medicine>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: 1,
    price: 0
  });
  const [isAdding, setIsAdding] = useState(false);

  const lowConfidence = ocrConfidence < 50;

  const handleAddMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage) {
      alert('Please enter at least medicine name and dosage');
      return;
    }

    const medicineToAdd = {
      ...newMedicine,
      id: `med_${Date.now()}`
    };

    const updatedMedicines = [...medicines, medicineToAdd];
    setMedicines(updatedMedicines);
    onMedicinesUpdate(updatedMedicines);

    // Reset form
    setNewMedicine({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      price: 0
    });
    setIsAdding(false);
  };

  const handleRemoveMedicine = (index: number) => {
    const updatedMedicines = medicines.filter((_, i) => i !== index);
    setMedicines(updatedMedicines);
    onMedicinesUpdate(updatedMedicines);
  };

  const handleEditMedicine = (index: number, field: keyof Medicine, value: any) => {
    const updatedMedicines = [...medicines];
    updatedMedicines[index] = {
      ...updatedMedicines[index],
      [field]: value
    };
    setMedicines(updatedMedicines);
    onMedicinesUpdate(updatedMedicines);
  };

  return (
    <div className="space-y-4">
      {/* Low Confidence Warning */}
      {showWarning && lowConfidence && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800">
                Low OCR Confidence ({ocrConfidence}%)
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                The extracted medicines may be incorrect. Please review and manually edit if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Medicines List */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">
          Extracted Medicines ({medicines.length})
        </h3>

        {medicines.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">
              No medicines extracted. Click "Add Medicine" to enter manually.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {medicines.map((med, index) => (
              <div
                key={med.id || index}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Medicine Name</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => handleEditMedicine(index, 'name', e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => handleEditMedicine(index, 'dosage', e.target.value)}
                        placeholder="e.g., 500mg, 10ml"
                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency || ''}
                        onChange={(e) => handleEditMedicine(index, 'frequency', e.target.value)}
                        placeholder="e.g., Twice daily"
                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Duration</label>
                      <input
                        type="text"
                        value={med.duration || ''}
                        onChange={(e) => handleEditMedicine(index, 'duration', e.target.value)}
                        placeholder="e.g., 5 days"
                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Quantity</label>
                      <input
                        type="number"
                        value={med.quantity}
                        onChange={(e) => handleEditMedicine(index, 'quantity', parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Price (₹)</label>
                      <input
                        type="number"
                        value={med.price}
                        onChange={(e) => handleEditMedicine(index, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveMedicine(index)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Remove medicine"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Medicine */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Medicine Manually
        </button>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">Add New Medicine</h4>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-700">Medicine Name *</label>
              <input
                type="text"
                value={newMedicine.name}
                onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                placeholder="e.g., Paracetamol"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700">Dosage *</label>
              <input
                type="text"
                value={newMedicine.dosage}
                onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                placeholder="e.g., 500mg"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700">Frequency</label>
              <input
                type="text"
                value={newMedicine.frequency || ''}
                onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
                placeholder="e.g., Twice daily"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700">Duration</label>
              <input
                type="text"
                value={newMedicine.duration || ''}
                onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                placeholder="e.g., 5 days"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700">Quantity</label>
              <input
                type="number"
                value={newMedicine.quantity}
                onChange={(e) => setNewMedicine({ ...newMedicine, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700">Price (₹)</label>
              <input
                type="number"
                value={newMedicine.price}
                onChange={(e) => setNewMedicine({ ...newMedicine, price: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddMedicine}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              <Check className="w-4 h-4" />
              Add Medicine
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewMedicine({
                  name: '',
                  dosage: '',
                  frequency: '',
                  duration: '',
                  quantity: 1,
                  price: 0
                });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {medicines.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            ✓ {medicines.length} medicine(s) ready to submit
          </p>
        </div>
      )}
    </div>
  );
}
