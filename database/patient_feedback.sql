-- ============================================================================
-- PATIENT FEEDBACK TABLE
-- ============================================================================
-- Stores patient feedback about medicines with AI analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patient_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User information
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_name VARCHAR(255),
    phone_number VARCHAR(20),
    medicine_name VARCHAR(255),
    
    -- Feedback content
    feedback_text TEXT NOT NULL,
    
    -- AI Analysis Results
    health_status TEXT,
    relief_status TEXT,
    side_effects TEXT,
    emergency_risk TEXT,
    patient_doubts TEXT,
    app_suggestions TEXT,
    ai_response TEXT,
    
    -- Metadata
    analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraints
    CONSTRAINT feedback_text_min_length CHECK (char_length(feedback_text) >= 10)
);

-- Comments
COMMENT ON TABLE public.patient_feedback IS 'Patient feedback about medicine usage with AI-powered health analysis';
COMMENT ON COLUMN public.patient_feedback.feedback_text IS 'Raw patient feedback text';
COMMENT ON COLUMN public.patient_feedback.health_status IS 'AI assessment of patient health status';
COMMENT ON COLUMN public.patient_feedback.relief_status IS 'Whether medicine provided relief';
COMMENT ON COLUMN public.patient_feedback.side_effects IS 'Detected side effects from feedback';
COMMENT ON COLUMN public.patient_feedback.emergency_risk IS 'Emergency symptom detection';
COMMENT ON COLUMN public.patient_feedback.patient_doubts IS 'Patient questions extracted from feedback';
COMMENT ON COLUMN public.patient_feedback.app_suggestions IS 'Suggestions to improve the app';
COMMENT ON COLUMN public.patient_feedback.ai_response IS 'AI-generated empathetic response to patient';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_feedback_user_id ON public.patient_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_created_at ON public.patient_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_feedback_medicine_name ON public.patient_feedback(medicine_name);

-- Enable Row Level Security
ALTER TABLE public.patient_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
    ON public.patient_feedback
    FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
    ON public.patient_feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
    ON public.patient_feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.roles
                WHERE roles.id = user_profiles.role_id
                AND roles.name IN ('admin', 'super_admin')
            )
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_patient_feedback_timestamp()
RETURNS TRIGGER AS $$   
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_patient_feedback_timestamp
    BEFORE UPDATE ON public.patient_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_patient_feedback_timestamp();
