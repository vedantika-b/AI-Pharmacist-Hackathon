-- Prescription Scans Table for Storing OCR and AI Processed Data
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS prescription_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Image storage
    image_url TEXT NOT NULL,
    
    -- OCR results
    raw_ocr_text TEXT,
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    
    -- Extracted medicines (JSONB for flexibility)
    extracted_medicines JSONB DEFAULT '[]'::jsonb,
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'needs_review', 'failed')),
    
    -- Metadata
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescription_user_id ON prescription_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_status ON prescription_scans(status);
CREATE INDEX IF NOT EXISTS idx_prescription_created ON prescription_scans(created_at DESC);

-- Enable Row Level Security
ALTER TABLE prescription_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own prescriptions
CREATE POLICY "Users can view own prescriptions"
    ON prescription_scans
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own prescriptions
CREATE POLICY "Users can insert own prescriptions"
    ON prescription_scans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own prescriptions
CREATE POLICY "Users can update own prescriptions"
    ON prescription_scans
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own prescriptions
CREATE POLICY "Users can delete own prescriptions"
    ON prescription_scans
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create storage bucket for prescription images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-images', 'prescription-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for prescription images
CREATE POLICY "Users can upload prescription images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'prescription-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view prescription images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'prescription-images');

CREATE POLICY "Users can delete own prescription images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'prescription-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Comments for documentation
COMMENT ON TABLE prescription_scans IS 'Stores prescription images, OCR text, and AI-extracted medicine data';
COMMENT ON COLUMN prescription_scans.raw_ocr_text IS 'Raw text extracted from prescription image using Google Vision API';
COMMENT ON COLUMN prescription_scans.extracted_medicines IS 'JSON array of medicines extracted by AI: [{"name": "...", "dosage": "..."}]';
COMMENT ON COLUMN prescription_scans.confidence_score IS 'OCR confidence score (0-100). Prescriptions below 60 need manual review';

SELECT 'Prescription scans table and storage created successfully!' AS status;
