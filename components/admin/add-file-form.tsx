"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddFileFormProps {
  userId: string
  onSuccess?: () => void
}

export function AddFileForm({ userId, onSuccess }: AddFileFormProps) {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (!file) {
      setError("Please upload a data file")
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title || file.name)

      const response = await fetch(`/api/admin/users/${userId}/file`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file")
      }

      setSuccess("File uploaded successfully")
      // Reset form
      setTitle("")
      setFile(null)
      // Call onSuccess callback if provided
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-zinc-200">File Title (Optional)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for the file"
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file" className="text-zinc-200">Upload Data (CSV/Excel)</Label>
        <Input
          id="file"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
          className="bg-zinc-800 border-zinc-700 text-white file:bg-zinc-700 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 hover:file:bg-zinc-600"
        />
        <p className="text-sm text-zinc-400">Upload a CSV or Excel file with the data to be displayed</p>
      </div>
      
      {file && (
        <div className="mt-4 p-3 bg-zinc-800 rounded-md border border-zinc-700">
          <div className="flex items-start gap-3">
            <FileText className="h-8 w-8 text-blue-400 mt-1" />
            <div className="flex-1">
              <p className="font-medium text-white break-all">{file.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                <span>Type: {file.type || file.name.split('.').pop()?.toUpperCase() || 'Unknown'}</span>
                <span>Size: {formatFileSize(file.size)}</span>
                <span>Last modified: {new Date(file.lastModified).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Upload File"
        )}
      </Button>
    </form>
  )
} 