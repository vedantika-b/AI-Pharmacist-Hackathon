'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { CheckCircle2, Edit2, X, ShoppingCart, AlertCircle, Plus, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Medicine {
  id?: string;
  name: string;
  dosage: string;
  frequency?: string;
  duration?: string;
  quantity: number;
  price: number;
  editing?: boolean;
}

interface PrescriptionReviewProps {
  prescriptionId: string;
  imageUrl: string;
  extractedMedicines: Medicine[];
  userId: string;
  ocrConfidence?: number;
}

export default function PrescriptionReview({
  prescriptionId,
  imageUrl,
  extractedMedicines,
  userId,
  ocrConfidence = 100,
}: PrescriptionReviewProps) {
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>(
    extractedMedicines.map((med, index) => ({
      ...med,
      id: med.id || `temp-${index}`,
      quantity: med.quantity || 1,
      price: med.price || 0,
      editing: false,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newMedicine, setNewMedicine] = useState<Medicine>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: 1,
    price: 0,
  });

  const lowConfidence = ocrConfidence < 50;

  const handleEdit = (index: number) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, editing: true } : med))
    );
  };

  const handleSave = (index: number) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, editing: false } : med))
    );
  };

  const handleChange = (index: number, field: keyof Medicine, value: any) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const handleRemove = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNew = () => {
    if (!newMedicine.name || !newMedicine.dosage) {
      setError('Please enter at least medicine name and dosage');
      return;
    }

    const medicineToAdd = {
      ...newMedicine,
      id: `temp-${Date.now()}`,
      editing: false,
    };

    setMedicines((prev) => [...prev, medicineToAdd]);
    setNewMedicine({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      price: 0,
    });
    setIsAddingNew(false);
    setError(null);
  };

  const calculateTotal = () => {
    return medicines.reduce((sum, med) => sum + med.price * med.quantity, 0);
  };

  const handleConfirm = async () => {
    if (medicines.length === 0) {
      setError('Please add at least one medicine');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create order
      const orderNumber = `ORD-${Date.now()}`;
      const totalAmount = calculateTotal();

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: userId,
          status: 'pending',
          total_amount: totalAmount,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = medicines.map((med) => ({
        order_id: orderData.id,
        medicine_id: med.id?.startsWith('temp-') ? null : med.id,
        medicine_name: med.name,
        dosage: med.dosage,
        quantity: med.quantity,
        unit_price: med.price,
        total_price: med.price * med.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // If order items fail, delete the order
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw itemsError;
      }

      // 3. Update prescription status
      await supabase
        .from('prescription_scans')
        .update({ status: 'processed', order_id: orderData.id })
        .eq('id', prescriptionId);

      setSuccess(true);

      // Redirect to order confirmation after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/orders/${orderData.id}`);
      }, 2000);
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Order Confirmed!
          </h2>
          <p className="text-green-700">
            Your prescription order has been created successfully.
          </p>
          <p className="text-sm text-green-600 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Review Prescription
        </h1>
        <p className="text-gray-600">
          Verify and edit the extracted medicines before confirming your order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Prescription Image */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Prescription Image</h2>
          <div className="relative aspect-[3/4] w-full bg-gray-100 rounded-lg overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Prescription"
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">No image available</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Extracted Medicines */}
        <div className="space-y-4">
          {/* OCR Confidence Warning */}
          {lowConfidence && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800">
                    Low OCR Confidence ({ocrConfidence}%)
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    The extracted medicines may be incorrect. Please review carefully
                    and manually add or edit if needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Extracted Medicines ({medicines.length})
            </h2>

            {medicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No medicines extracted</p>
              </div>
            ) : (
              <div className="space-y-3">
                {medicines.map((medicine, index) => (
                  <div
                    key={medicine.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    {medicine.editing ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medicine Name
                          </label>
                          <input
                            type="text"
                            value={medicine.name}
                            onChange={(e) =>
                              handleChange(index, 'name', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dosage
                            </label>
                            <input
                              type="text"
                              value={medicine.dosage}
                              onChange={(e) =>
                                handleChange(index, 'dosage', e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={medicine.quantity}
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  'quantity',
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleSave(index)}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleRemove(index)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {medicine.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Dosage:</span> {medicine.dosage}
                          </p>
                          {medicine.frequency && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Frequency:</span>{' '}
                              {medicine.frequency}
                            </p>
                          )}
                          {medicine.duration && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Duration:</span>{' '}
                              {medicine.duration}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Quantity:</span>{' '}
                            {medicine.quantity}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Medicine Button/Form */}
            {!isAddingNew ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Medicine Manually
              </button>
            ) : (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Add New Medicine</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={newMedicine.name}
                      onChange={(e) =>
                        setNewMedicine({ ...newMedicine, name: e.target.value })
                      }
                      placeholder="e.g., Paracetamol"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        value={newMedicine.dosage}
                        onChange={(e) =>
                          setNewMedicine({ ...newMedicine, dosage: e.target.value })
                        }
                        placeholder="e.g., 500mg"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={newMedicine.quantity}
                        onChange={(e) =>
                          setNewMedicine({
                            ...newMedicine,
                            quantity: parseInt(e.target.value) || 1,
                          })
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={newMedicine.frequency || ''}
                        onChange={(e) =>
                          setNewMedicine({ ...newMedicine, frequency: e.target.value })
                        }
                        placeholder="e.g., Twice daily"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={newMedicine.price}
                        onChange={(e) =>
                          setNewMedicine({
                            ...newMedicine,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddNew}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                      Add Medicine
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewMedicine({
                          name: '',
                          dosage: '',
                          frequency: '',
                          duration: '',
                          quantity: 1,
                          price: 0,
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Total Items:</span>
                <span className="font-medium">{medicines.length}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Quantity:</span>
                <span className="font-medium">
                  {medicines.reduce((sum, med) => sum + med.quantity, 0)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={loading || medicines.length === 0}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="w-6 h-6" />
                Confirm Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
