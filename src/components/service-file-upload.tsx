"use client"

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ParsedService {
  name: string
  carrierName: string
  partnerServices?: string
  routes: Array<{
    routeName?: string
    pol: string
    pod: string
    transitTime: string
  }>
}

interface ValidationResult {
  success: boolean
  data?: ParsedService[]
  errors?: string[]
  warnings?: string[]
  summary?: {
    totalServices: number
    totalRoutes: number
  }
}

interface ServiceFileUploadProps {
  onUploadComplete?: (services: ParsedService[]) => void
}

export function ServiceFileUpload({ onUploadComplete }: ServiceFileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [creating, setCreating] = useState(false)
  const [creationResult, setCreationResult] = useState<any>(null)
  const { toast } = useToast()

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setValidationResult(null)
      setCreationResult(null)
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setValidationResult(null)
      setCreationResult(null)
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) return

    setUploading(true)
    setValidationResult(null)
    setCreationResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/services/upload', {
        method: 'POST',
        body: formData,
      })

      const result: ValidationResult = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload file')
      }

      setValidationResult(result)

      if (result.success) {
        toast({
          title: 'File uploaded successfully',
          description: `Found ${result.summary?.totalServices} services with ${result.summary?.totalRoutes} routes`,
        })
      } else {
        toast({
          title: 'Validation failed',
          description: `Found ${result.errors?.length} errors that need to be fixed`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }, [file, toast])

  const handleCreateServices = useCallback(async () => {
    if (!validationResult?.data) return

    setCreating(true)
    setCreationResult(null)

    try {
      const response = await fetch('/api/services/upload/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationResult.data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create services')
      }

      setCreationResult(result)

      toast({
        title: 'Services created successfully',
        description: `Created ${result.summary.createdServices} of ${result.summary.totalServices} services`,
      })

      if (onUploadComplete && validationResult.data) {
        onUploadComplete(validationResult.data)
      }
    } catch (error) {
      toast({
        title: 'Creation failed',
        description: error instanceof Error ? error.message : 'Failed to create services',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }, [validationResult, toast, onUploadComplete])

  const downloadTemplate = useCallback(async (format: 'excel' | 'csv') => {
    try {
      const response = await fetch(`/api/services/upload/template?format=${format}`)
      
      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `service-template.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Template downloaded',
        description: `Service template downloaded in ${format.toUpperCase()} format`,
      })
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Failed to download template',
        variant: 'destructive',
      })
    }
  }, [toast])

  const resetUpload = useCallback(() => {
    setFile(null)
    setValidationResult(null)
    setCreationResult(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* Template Download Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => downloadTemplate('excel')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Download Excel Template
            </Button>
            <Button 
              variant="outline" 
              onClick={() => downloadTemplate('csv')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Download CSV Template
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Download a template to ensure your data is in the correct format.
          </p>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Service Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports Excel (.xlsx, .xls), CSV (.csv), and JSON (.json) files
              </p>
              <Input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button variant="outline">Choose File</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetUpload}>
                    Remove
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload & Validate'}
                  </Button>
                </div>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <Progress value={75} className="w-full" />
                  <p className="text-sm text-center text-gray-500">
                    Uploading and validating file...
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationResult.summary?.totalServices || 0}
                  </div>
                  <div className="text-sm text-blue-600">Services</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.summary?.totalRoutes || 0}
                  </div>
                  <div className="text-sm text-green-600">Routes</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {validationResult.warnings?.length || 0}
                  </div>
                  <div className="text-sm text-orange-600">Warnings</div>
                </div>
              </div>

              {/* Errors */}
              {validationResult.errors && validationResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Errors found:</strong>
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">• {error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Warnings */}
              {validationResult.warnings && validationResult.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Warnings:</strong>
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="text-sm">• {warning}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Data Preview */}
              {validationResult.data && validationResult.data.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Preview</h3>
                  <Tabs defaultValue="services" className="w-full">
                    <TabsList>
                      <TabsTrigger value="services">Services</TabsTrigger>
                      <TabsTrigger value="routes">Routes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="services">
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Service Name</TableHead>
                              <TableHead>Carrier</TableHead>
                              <TableHead>Partner Services</TableHead>
                              <TableHead>Routes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationResult.data.map((service, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{service.name}</TableCell>
                                <TableCell>{service.carrierName}</TableCell>
                                <TableCell>{service.partnerServices || '-'}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    {service.routes.length} routes
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    <TabsContent value="routes">
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Service</TableHead>
                              <TableHead>Route Name</TableHead>
                              <TableHead>POL</TableHead>
                              <TableHead>POD</TableHead>
                              <TableHead>Transit Time</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {validationResult.data.flatMap((service) =>
                              service.routes.map((route, routeIndex) => (
                                <TableRow key={`${service.name}-${routeIndex}`}>
                                  <TableCell className="font-medium">{service.name}</TableCell>
                                  <TableCell>{route.routeName || '-'}</TableCell>
                                  <TableCell>{route.pol}</TableCell>
                                  <TableCell>{route.pod}</TableCell>
                                  <TableCell>{route.transitTime}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button variant="outline" onClick={resetUpload}>
                  Upload Different File
                </Button>
                {validationResult.success && (
                  <Button 
                    onClick={handleCreateServices} 
                    disabled={creating}
                  >
                    {creating ? 'Creating Services...' : 'Create Services'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Creation Results */}
      {creationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Creation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {creationResult.summary.totalServices}
                  </div>
                  <div className="text-sm text-blue-600">Total Services</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {creationResult.summary.createdServices}
                  </div>
                  <div className="text-sm text-green-600">Created</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {creationResult.summary.errorServices}
                  </div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
              </div>

              {creationResult.results && creationResult.results.some((r: any) => !r.success) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong>Some services failed to create:</strong>
                      {creationResult.results
                        .filter((r: any) => !r.success)
                        .map((result: any, index: number) => (
                          <div key={index} className="text-sm">
                            • {result.errors.join(', ')}
                          </div>
                        ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button onClick={resetUpload}>
                  Upload More Services
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}