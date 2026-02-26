"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Loader2, AlertCircle, CheckCircle2, FileText, Save, Database } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { t } from "@/lib/translations"

export default function OCRDemoPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string; id?: string } | null>(null)
  const { language } = useLanguage()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const processImage = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      setError(null)
      setResult(null)
      setSaveStatus(null)

      // Convert to base64
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string

          // Call real OCR endpoint (uses the OCR model service)
          const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")
          const response = await fetch(
            `${apiBase}/api/v1/prescriptions/analyze`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                image_base64: base64,
                filename: selectedFile.name,
              }),
            }
          )

          // Attempt to parse JSON body for error details even when response is not ok
          let data: any = null
          try {
            data = await response.json()
          } catch (e) {
            // Ignore JSON parse errors
          }

          if (!response.ok) {
            // Prefer common patterns: `detail`, `error`, or top-level message
            const detail = data?.detail || data?.error || data?.message || "Failed to process image"
            setError(typeof detail === "string" ? detail : JSON.stringify(detail))
            setLoading(false)
            return
          }

          setResult(data)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to process image")
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(selectedFile)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image")
      setLoading(false)
    }
  }

  const saveToDB = async () => {
    if (!result) return

    try {
      setSaving(true)
      setSaveStatus(null)

      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "")
      
      // Prepare save request
      const saveData = {
        extracted_text: result.extracted_text || "",
        medications: result.medications || [],
        metadata: result.metadata || {},
        confidence: result.confidence || 0,
        image_quality: result.metadata?.image_quality || "unknown",
        has_handwriting: result.metadata?.has_handwriting || false,
        prescription_date: result.metadata?.prescription_date || null,
        doctor_name: result.metadata?.doctor_name || null,
        image_filename: selectedFile?.name || null,
        // user_id can be added when authentication is implemented
      }

      const response = await fetch(`${apiBase}/api/v1/prescriptions/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveData),
      })

      const data = await response.json()

      if (data.status === "success") {
        setSaveStatus({
          success: true,
          message: `Prescription saved successfully! ID: ${data.id}`,
          id: data.id
        })
      } else {
        setSaveStatus({
          success: false,
          message: data.error || "Failed to save prescription"
        })
      }
    } catch (err) {
      setSaveStatus({
        success: false,
        message: err instanceof Error ? err.message : "Failed to save prescription"
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">📋 Prescription OCR</h1>
        <p className="text-muted-foreground">
          Upload a prescription image and our AI will extract medication details automatically
        </p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Prescription Image</CardTitle>
          <CardDescription>Supports JPG, PNG, and PDF files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4 hover:bg-muted/50 transition">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium mb-2">Drop your prescription here</p>
              <p className="text-sm text-muted-foreground mb-4">or</p>
              <label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" asChild className="cursor-pointer">
                  <span>Select File</span>
                </Button>
              </label>
            </div>
          </div>

          {selectedFile && (
            <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-medium truncate">{selectedFile.name}</span>
              </div>
              <Button
                onClick={processImage}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Process
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Card */}
      {result && (
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Analysis Results</CardTitle>
                <Badge
                  variant={
                    result.status === "success"
                      ? "default"
                      : result.status === "partial"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {result.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  {result.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Confidence */}
              <div>
                <p className="text-sm font-medium mb-2">
                  OCR Confidence: {(result.confidence * 100).toFixed(1)}%
                </p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Metadata */}
              {result.metadata && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Image Quality</p>
                    <p className="font-medium capitalize">
                      {result.metadata.image_quality}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {result.metadata.prescription_date || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                    <p className="font-medium">
                      {result.metadata.doctor_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Handwriting</p>
                    <p className="font-medium">
                      {result.metadata.has_handwriting ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          {result.medications && result.medications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Medications</CardTitle>
                <CardDescription>
                  Found {result.medications.length} medication(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.medications.map((med: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-lg">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {(med.confidence * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Frequency</p>
                          <p className="font-medium">{med.frequency || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{med.duration || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Extracted Text (optional) */}
          {result.extracted_text && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Raw Extracted Text</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg max-h-32 overflow-auto">
                  {result.extracted_text}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Save to Database Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Save to Database
              </CardTitle>
              <CardDescription>
                Store this prescription scan for future reference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={saveToDB}
                disabled={saving || saveStatus?.success}
                className="w-full gap-2"
                variant={saveStatus?.success ? "secondary" : "default"}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : saveStatus?.success ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Prescription
                  </>
                )}
              </Button>

              {saveStatus && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-2 ${
                    saveStatus.success
                      ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200"
                      : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200"
                  }`}
                >
                  {saveStatus.success ? (
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-sm">{saveStatus.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
