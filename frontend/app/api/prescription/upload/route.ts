import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Types
interface Medicine {
  name: string;
  dosage: string;
}

interface PrescriptionResponse {
  success: boolean;
  data?: {
    medicines: Medicine[];
    confidence: number;
    prescriptionId: string;
    rawText?: string;
  };
  error?: string;
  warning?: string;
}

// Google Vision API OCR
async function extractTextWithVision(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
  const { ImageAnnotatorClient } = require('@google-cloud/vision');
  
  const client = new ImageAnnotatorClient({
    credentials: JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS || '{}'),
  });

  try {
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return { text: '', confidence: 0 };
    }

    const fullText = detections[0].description || '';
    
    // Calculate average confidence from all detected text blocks
    const confidenceScores = result.fullTextAnnotation?.pages?.[0]?.blocks?.map(
      (block: any) => block.confidence || 0
    ) || [];
    
    const avgConfidence = confidenceScores.length > 0
      ? (confidenceScores.reduce((a: number, b: number) => a + b, 0) / confidenceScores.length) * 100
      : 50;

    return {
      text: fullText,
      confidence: Math.round(avgConfidence),
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error('Failed to extract text from image');
  }
}

// OpenAI GPT extraction
async function extractMedicinesWithGPT(rawText: string): Promise<Medicine[]> {
  const prompt = `You are a medical prescription parser. Extract ONLY medicine names and dosages from the following prescription text.

Rules:
- Return ONLY valid medicines with clear dosages
- Ignore patient info, doctor names, dates, clinic names
- Standardize medicine names (use generic names when possible)
- Format dosage clearly (e.g., "500mg", "10ml", "1 tablet")
- If no dosage is mentioned, use "As prescribed"
- Return empty array if no medicines found

Prescription text:
${rawText}

Return a JSON array of objects with this exact format:
[
  { "name": "Medicine Name", "dosage": "500mg twice daily" }
]

IMPORTANT: Return ONLY the JSON array, no additional text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a medical prescription parser that extracts medicine information accurately. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = completion.choices[0].message.content || '[]';
    
    // Extract JSON from response (in case GPT adds extra text)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : '[]';
    
    const medicines = JSON.parse(jsonString);

    // Validate structure
    if (!Array.isArray(medicines)) {
      throw new Error('Invalid response format from GPT');
    }

    return medicines.filter((med: any) => 
      med.name && typeof med.name === 'string' && med.name.trim().length > 0
    );
  } catch (error) {
    console.error('GPT extraction error:', error);
    throw new Error('Failed to extract medicines with AI');
  }
}

// Store in Supabase
async function storePrescriptionData(
  userId: string,
  imageUrl: string,
  rawText: string,
  medicines: Medicine[],
  confidence: number
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('prescription_scans')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        raw_ocr_text: rawText,
        extracted_medicines: medicines,
        confidence_score: confidence,
        status: confidence >= 60 ? 'processed' : 'needs_review',
        processed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error('Supabase storage error:', error);
    throw new Error('Failed to store prescription data');
  }
}

// Upload image to Supabase Storage
async function uploadImageToStorage(
  file: File,
  userId: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${userId}/${timestamp}_${file.name}`;

  const { data, error } = await supabase.storage
    .from('prescription-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('prescription-images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// Main API handler
export async function POST(request: NextRequest): Promise<NextResponse<PrescriptionResponse>> {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const userId = formData.get('userId') as string;

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPG and PNG allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Max 10MB allowed.' },
        { status: 400 }
      );
    }

    // Step 1: Upload image to Supabase Storage
    const imageUrl = await uploadImageToStorage(file, userId);

    // Step 2: Extract text using Google Vision API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { text: rawText, confidence } = await extractTextWithVision(buffer);

    // Check confidence threshold
    if (confidence < 60) {
      // Still store but mark as needs review
      const prescriptionId = await storePrescriptionData(
        userId,
        imageUrl,
        rawText,
        [],
        confidence
      );

      return NextResponse.json({
        success: true,
        warning: 'Low OCR confidence. Please review the prescription manually or upload a clearer image.',
        data: {
          medicines: [],
          confidence,
          prescriptionId,
          rawText,
        },
      });
    }

    // Step 3: Extract medicines using OpenAI GPT
    const medicines = await extractMedicinesWithGPT(rawText);

    // Step 4: Store in Supabase
    const prescriptionId = await storePrescriptionData(
      userId,
      imageUrl,
      rawText,
      medicines,
      confidence
    );

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        medicines,
        confidence,
        prescriptionId,
        rawText: process.env.NODE_ENV === 'development' ? rawText : undefined,
      },
    });

  } catch (error) {
    console.error('Prescription processing error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process prescription',
      },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET() {
  return NextResponse.json({
    message: 'Prescription Upload API',
    version: '1.0.0',
    endpoints: {
      POST: '/api/prescription/upload',
    },
  });
}
