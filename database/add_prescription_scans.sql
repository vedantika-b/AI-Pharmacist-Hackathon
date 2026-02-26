-- ============================================================================
-- PRESCRIPTION SCANS TABLE - Migration
-- ============================================================================
-- Stores OCR results from prescription image processing
-- Run this in Supabase SQL Editor after the main schema
-- ============================================================================

-- ============================================================================
-- PRESCRIPTION SCANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prescription_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User tracking
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Image data
    image_url TEXT,
    image_filename VARCHAR(255),
    
    -- OCR Results
    extracted_text TEXT,
    medications JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Quality metrics
    confidence DECIMAL(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    image_quality VARCHAR(20) DEFAULT 'unknown' CHECK (image_quality IN ('good', 'fair', 'poor', 'unknown')),
    has_handwriting BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'processed' CHECK (status IN ('pending', 'processed', 'failed', 'verified')),
    
    -- Prescription details extracted
    prescription_date DATE,
    doctor_name VARCHAR(255),
    patient_name VARCHAR(255),
    
    -- Processing info
    processing_time_ms INTEGER,
    ocr_engine VARCHAR(50) DEFAULT 'easyocr',
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.prescription_scans IS 'OCR results from prescription image processing';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_prescription_scans_user_id ON public.prescription_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_scans_status ON public.prescription_scans(status);
CREATE INDEX IF NOT EXISTS idx_prescription_scans_created ON public.prescription_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescription_scans_date ON public.prescription_scans(prescription_date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS set_updated_at ON public.prescription_scans;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prescription_scans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.prescription_scans ENABLE ROW LEVEL SECURITY;

-- Users can view their own prescription scans
CREATE POLICY "Users can view own prescription scans"
    ON public.prescription_scans
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own prescription scans
CREATE POLICY "Users can insert own prescription scans"
    ON public.prescription_scans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own prescription scans
CREATE POLICY "Users can update own prescription scans"
    ON public.prescription_scans
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own prescription scans
CREATE POLICY "Users can delete own prescription scans"
    ON public.prescription_scans
    FOR DELETE
    USING (auth.uid() = user_id);

-- Pharmacists and admins can view all prescription scans
CREATE POLICY "Staff can view all prescription scans"
    ON public.prescription_scans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            JOIN public.roles r ON up.role_id = r.id
            WHERE up.id = auth.uid()
            AND r.name IN ('admin', 'pharmacist')
        )
    );

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================
-- INSERT INTO public.prescription_scans (
--     user_id, 
--     extracted_text, 
--     medications, 
--     metadata, 
--     confidence, 
--     status
-- ) VALUES (
--     NULL,  -- Anonymous scan
--     'Sample prescription text from OCR',
--     '[{"name": "Paracetamol", "dosage": "500mg", "frequency": "twice daily", "duration": "5 days"}]'::jsonb,
--     '{"prescription_date": "2025-01-15", "doctor_name": "Dr. Smith"}'::jsonb,
--     0.85,
--     'processed'
-- );
