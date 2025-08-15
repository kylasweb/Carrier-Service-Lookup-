"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Ship, Settings, Trash2, Edit, AlertCircle, MapPin, Upload, List, Grid, Search, Cog, ChevronDown, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Navigation } from "@/components/navigation"
import { AuthProvider } from "@/components/auth-provider"
import { ViewToggle } from "@/components/view-toggle"
import { PortAutocomplete } from "@/components/port-autocomplete"
import { PortAutocompleteWithId } from "@/components/port-autocomplete-with-id"
import { ServiceFileUpload } from "@/components/service-file-upload"

interface Carrier {
  id: string
  name: string
  description?: string
  logoUrl?: string
  carrierType?: string
  services: Service[]
}

interface Service {
  id: string
  name: string
  partnerServices?: string
  carrierId: string
  carrier: Carrier
  routes: ServiceRoute[]
}

interface ServiceRoute {
  id: string
  polId: string
  podId: string
  pol?: string  // Backward compatibility
  pod?: string  // Backward compatibility
  via?: string  // Optional via port
  transitTime: string
  polPort?: Port
  podPort?: Port
}

interface Port {
  id: string
  name: string
  country: string
  unloc: string
  code?: string
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [ports, setPorts] = useState<Port[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // View state for visual sorting
  const [carriersView, setCarriersView] = useState<"list" | "grid">("list")
  const [servicesView, setServicesView] = useState<"list" | "grid">("list")
  const [portsView, setPortsView] = useState<"list" | "grid">("grid")

  // Search state
  const [carrierSearch, setCarrierSearch] = useState("")
  const [serviceSearch, setServiceSearch] = useState("")
  const [portSearch, setPortSearch] = useState("")

  // Collapsible state for service routes
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())

  // Settings dialog state
  const [settingsDialog, setSettingsDialog] = useState(false)
  const [siteSettings, setSiteSettings] = useState({
    logoUrl: "",
    siteTitle: "SWENLOG Carrier Service Lookup",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6"
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Filtered data
  const filteredCarriers = carriers.filter(carrier => 
    carrier.name.toLowerCase().includes(carrierSearch.toLowerCase()) ||
    (carrier.description && carrier.description.toLowerCase().includes(carrierSearch.toLowerCase())) ||
    (carrier.carrierType && carrier.carrierType.toLowerCase().includes(carrierSearch.toLowerCase()))
  )

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    service.carrier.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    (service.partnerServices && service.partnerServices.toLowerCase().includes(serviceSearch.toLowerCase())) ||
    service.routes.some(route => 
      (route.pol && route.pol.toLowerCase().includes(serviceSearch.toLowerCase())) ||
      (route.pod && route.pod.toLowerCase().includes(serviceSearch.toLowerCase()))
    )
  )

  const filteredPorts = ports.filter(port => 
    port.name.toLowerCase().includes(portSearch.toLowerCase()) ||
    port.country.toLowerCase().includes(portSearch.toLowerCase()) ||
    port.unloc.toLowerCase().includes(portSearch.toLowerCase()) ||
    (port.code && port.code.toLowerCase().includes(portSearch.toLowerCase()))
  )

  // Carrier form state
  const [carrierForm, setCarrierForm] = useState({
    id: "",
    name: "",
    description: "",
    logoUrl: "",
    carrierType: ""
  })

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    id: "",
    name: "",
    partnerServices: "",
    carrierId: "",
    routes: [
      { pol: "", polId: "", pod: "", podId: "", via: "", viaId: "", transitTime: "" }
    ]
  })

  // Port form state
  const [portForm, setPortForm] = useState({
    id: "",
    name: "",
    country: "",
    unloc: "",
    code: "",
    latitude: "",
    longitude: ""
  })

  // Editing states
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingPort, setEditingPort] = useState<Port | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'carrier' | 'service' | 'port'; id: string; name: string } | null>(null)

  // Form validation state
  const [serviceFormErrors, setServiceFormErrors] = useState({
    name: "",
    carrierId: "",
    routes: [""] as string[]
  })

  // Toggle service routes collapsible
  const toggleServiceRoutes = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  const validateServiceForm = () => {
    const errors = {
      name: "",
      carrierId: "",
      routes: [""] as string[]
    }

    if (!serviceForm.name || !serviceForm.name.trim()) {
      errors.name = "Service name is required"
    }

    if (!serviceForm.carrierId) {
      errors.carrierId = "Carrier selection is required"
    }

    // Validate each route
    serviceForm.routes.forEach((route, index) => {
      if (!route.polId || !route.podId || !route.transitTime || !route.transitTime.trim()) {
        errors.routes[index] = "POL, POD, and Transit Time are required"
      }
    })

    setServiceFormErrors(errors)
    return !errors.name && !errors.carrierId && !errors.routes.some(error => error !== "")
  }

  const handleServiceFormChange = (field: string, value: string) => {
    setServiceForm({ ...serviceForm, [field]: value })
    
    // Clear error when user starts typing
    if (serviceFormErrors[field as keyof typeof serviceFormErrors]) {
      setServiceFormErrors({
        ...serviceFormErrors,
        [field]: ""
      })
    }
  }

  const handleRouteChange = (index: number, field: string, value: string) => {
    const newRoutes = [...serviceForm.routes]
    newRoutes[index] = { ...newRoutes[index], [field]: value }
    setServiceForm({ ...serviceForm, routes: newRoutes })
    
    // Clear route error when user starts typing
    if (serviceFormErrors.routes[index]) {
      const newRouteErrors = [...serviceFormErrors.routes]
      newRouteErrors[index] = ""
      setServiceFormErrors({
        ...serviceFormErrors,
        routes: newRouteErrors
      })
    }
  }

  const handlePortSelect = (index: number, field: 'pol' | 'pod' | 'via', portName: string, portId: string) => {
    const newRoutes = [...serviceForm.routes]
    newRoutes[index] = { 
      ...newRoutes[index], 
      [field]: portName,
      [`${field}Id`]: portId
    }
    setServiceForm({ ...serviceForm, routes: newRoutes })
    
    // Clear route error when user selects a port
    if (serviceFormErrors.routes[index]) {
      const newRouteErrors = [...serviceFormErrors.routes]
      newRouteErrors[index] = ""
      setServiceFormErrors({
        ...serviceFormErrors,
        routes: newRouteErrors
      })
    }
  }

  const addRoute = () => {
    setServiceForm({
      ...serviceForm,
      routes: [...serviceForm.routes, { pol: "", polId: "", pod: "", podId: "", via: "", viaId: "", transitTime: "" }]
    })
    setServiceFormErrors({
      ...serviceFormErrors,
      routes: [...serviceFormErrors.routes, ""]
    })
  }

  const removeRoute = (index: number) => {
    if (serviceForm.routes.length > 1) {
      const newRoutes = serviceForm.routes.filter((_, i) => i !== index)
      const newRouteErrors = serviceFormErrors.routes.filter((_, i) => i !== index)
      setServiceForm({ ...serviceForm, routes: newRoutes })
      setServiceFormErrors({
        ...serviceFormErrors,
        routes: newRouteErrors
      })
    }
  }

  const duplicateRoute = (index: number) => {
    const routeToDuplicate = serviceForm.routes[index]
    setServiceForm({
      ...serviceForm,
      routes: [...serviceForm.routes, { ...routeToDuplicate }]
    })
    setServiceFormErrors({
      ...serviceFormErrors,
      routes: [...serviceFormErrors.routes, ""]
    })
  }

  useEffect(() => {
    fetchCarriers()
    fetchServices()
    fetchPorts()
  }, [])

  const fetchCarriers = async () => {
    try {
      const response = await fetch("/api/carriers")
      const data = await response.json()
      setCarriers(data)
    } catch (error) {
      console.error("Error fetching carriers:", error)
    }
  }

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services")
      const data = await response.json()
      setServices(data)
    } catch (error) {
      console.error("Error fetching services:", error)
    }
  }

  const fetchPorts = async () => {
    try {
      const response = await fetch("/api/ports")
      const data = await response.json()
      setPorts(data)
    } catch (error) {
      console.error("Error fetching ports:", error)
    }
  }

  const handleCreateCarrier = async () => {
    if (!carrierForm.name) {
      toast({
        title: "Validation Error",
        description: "Carrier name is required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const isEditing = !!carrierForm.id
      const url = isEditing ? `/api/carriers/${carrierForm.id}` : "/api/carriers"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(carrierForm)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: isEditing ? "Carrier updated successfully" : "Carrier created successfully"
        })
        resetCarrierForm()
        fetchCarriers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Failed to ${isEditing ? "update" : "create"} carrier`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating/updating carrier:", error)
      toast({
        title: "Error",
        description: `Failed to ${carrierForm.id ? "update" : "create"} carrier`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditCarrier = (carrier: Carrier) => {
    setEditingCarrier(carrier)
    setCarrierForm({
      id: carrier.id,
      name: carrier.name,
      description: carrier.description || "",
      logoUrl: carrier.logoUrl || "",
      carrierType: carrier.carrierType || ""
    })
  }

  const handleDeleteCarrier = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/carriers/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Carrier deleted successfully"
        })
        fetchCarriers()
        fetchServices() // Refresh services since they might be affected
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete carrier",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting carrier:", error)
      toast({
        title: "Error",
        description: "Failed to delete carrier",
        variant: "destructive"
      })
    }
    setDeleteDialog(null)
  }

  const resetCarrierForm = () => {
    setCarrierForm({
      id: "",
      name: "",
      description: "",
      logoUrl: "",
      carrierType: ""
    })
    setEditingCarrier(null)
  }

  const handleCreateService = async () => {
    if (!validateServiceForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const isEditing = !!serviceForm.id
      const url = isEditing ? `/api/services/${serviceForm.id}` : "/api/services"
      const method = isEditing ? "PUT" : "POST"

      // Transform form data to match API expectations
      const apiData = {
        name: serviceForm.name,
        partnerServices: serviceForm.partnerServices,
        carrierId: serviceForm.carrierId,
        routes: serviceForm.routes.map(route => ({
          polId: route.polId,
          podId: route.podId,
          transitTime: route.transitTime
        }))
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: isEditing ? "Service updated successfully" : "Service created successfully"
        })
        resetServiceForm()
        fetchServices()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Failed to ${isEditing ? "update" : "create"} service`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating/updating service:", error)
      toast({
        title: "Error",
        description: `Failed to ${serviceForm.id ? "update" : "create"} service`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      id: service.id,
      name: service.name,
      partnerServices: service.partnerServices || "",
      carrierId: service.carrierId,
      routes: service.routes.map(route => ({
        pol: route.polPort?.name || "",
        polId: route.polId,
        pod: route.podPort?.name || "",
        podId: route.podId,
        via: route.via || "",
        viaId: "",
        transitTime: route.transitTime
      }))
    })
  }

  const handleDeleteService = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Service deleted successfully"
        })
        fetchServices()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete service",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive"
      })
    }
    setDeleteDialog(null)
  }

  const resetServiceForm = () => {
    setServiceForm({ 
      id: "", 
      name: "", 
      partnerServices: "", 
      carrierId: "", 
      routes: [{ pol: "", polId: "", pod: "", podId: "", via: "", viaId: "", transitTime: "" }] 
    })
    setServiceFormErrors({ 
      name: "", 
      carrierId: "", 
      routes: [""] 
    })
    setEditingService(null)
  }

  const handleCreatePort = async () => {
    if (!portForm.name || !portForm.country || !portForm.unloc) {
      toast({
        title: "Validation Error",
        description: "Port name, country, and UNLOC are required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const isEditing = !!portForm.id
      const url = isEditing ? `/api/ports/${portForm.id}` : "/api/ports"
      const method = isEditing ? "PUT" : "POST"

      const portData = {
        name: portForm.name,
        country: portForm.country,
        unloc: portForm.unloc,
        code: portForm.code || undefined,
        latitude: portForm.latitude ? parseFloat(portForm.latitude) : undefined,
        longitude: portForm.longitude ? parseFloat(portForm.longitude) : undefined
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(portData)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: isEditing ? "Port updated successfully" : "Port created successfully"
        })
        resetPortForm()
        fetchPorts()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Failed to ${isEditing ? "update" : "create"} port`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating/updating port:", error)
      toast({
        title: "Error",
        description: `Failed to ${portForm.id ? "update" : "create"} port`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditPort = (port: Port) => {
    setEditingPort(port)
    setPortForm({
      id: port.id,
      name: port.name,
      country: port.country,
      unloc: port.unloc,
      code: port.code || "",
      latitude: port.latitude?.toString() || "",
      longitude: port.longitude?.toString() || ""
    })
  }

  const handleDeletePort = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/ports/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Port deleted successfully"
        })
        fetchPorts()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete port",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting port:", error)
      toast({
        title: "Error",
        description: "Failed to delete port",
        variant: "destructive"
      })
    }
    setDeleteDialog(null)
  }

  const resetPortForm = () => {
    setPortForm({
      id: "",
      name: "",
      country: "",
      unloc: "",
      code: "",
      latitude: "",
      longitude: ""
    })
    setEditingPort(null)
  }

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    try {
      const response = await fetch('/api/ports/bulk', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Bulk Upload Completed",
          description: `Processed ${result.totalProcessed} ports: ${result.successCount} successful, ${result.duplicateCount} duplicates, ${result.errorCount} errors`
        })
        fetchPorts()
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to process bulk upload",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error in bulk upload:", error)
      toast({
        title: "Upload Error",
        description: "Failed to process bulk upload",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      event.target.value = '' // Reset file input
    }
  }

  return (
    <AuthProvider requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-pastel-blue/10 via-pastel-purple/10 to-pastel-pink/10">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Settings className="h-8 w-8 text-pastel-purple" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pastel-purple to-pastel-pink bg-clip-text text-transparent">Admin Panel</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSettingsDialog(true)}
            className="glass-button border-pastel-purple/50 text-pastel-purple hover:bg-pastel-purple/10"
          >
            <Cog className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        <Tabs defaultValue="carriers" className="space-y-6">
          <TabsList className="glass-card p-1">
            <TabsTrigger value="carriers" className="data-[state=active]:glass-button">Carriers</TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:glass-button">Services</TabsTrigger>
            <TabsTrigger value="bulk-upload" className="data-[state=active]:glass-button">Bulk Upload</TabsTrigger>
            <TabsTrigger value="ports" className="data-[state=active]:glass-button">Ports</TabsTrigger>
          </TabsList>

          <TabsContent value="carriers" className="space-y-6">
            <Card className="glass-card hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-pastel-purple">
                  <Plus className="h-5 w-5 text-pastel-blue" />
                  {editingCarrier ? "Edit Carrier" : "Add New Carrier"}
                </CardTitle>
                <CardDescription>
                  {editingCarrier ? "Update carrier information" : "Create a new carrier with name, description, and logo"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carrier-name" className="text-pastel-purple">Carrier Name *</Label>
                    <Input
                      id="carrier-name"
                      placeholder="e.g., Maersk"
                      value={carrierForm.name}
                      onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                      className="glass-input border-pastel-blue/30 focus:border-pastel-blue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carrier-type" className="text-pastel-purple">Carrier Type</Label>
                    <Select value={carrierForm.carrierType} onValueChange={(value) => setCarrierForm({ ...carrierForm, carrierType: value })}>
                      <SelectTrigger className="glass-input border-pastel-green/30 focus:border-pastel-green">
                        <SelectValue placeholder="Select carrier type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MLO">MLO (Main Line Operator)</SelectItem>
                        <SelectItem value="NVOCC">NVOCC (Non-Vessel Operating Common Carrier)</SelectItem>
                        <SelectItem value="Freight Forwarder">Freight Forwarder</SelectItem>
                        <SelectItem value="3PL">3PL (Third-Party Logistics)</SelectItem>
                        <SelectItem value="Customs Broker">Customs Broker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carrier-logo" className="text-pastel-purple">Logo URL</Label>
                    <Input
                      id="carrier-logo"
                      placeholder="https://example.com/logo.png"
                      value={carrierForm.logoUrl}
                      onChange={(e) => setCarrierForm({ ...carrierForm, logoUrl: e.target.value })}
                      className="glass-input border-pastel-green/30 focus:border-pastel-green"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carrier-description">Description</Label>
                  <Textarea
                    id="carrier-description"
                    placeholder="Brief description of the carrier..."
                    value={carrierForm.description}
                    onChange={(e) => setCarrierForm({ ...carrierForm, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateCarrier} disabled={loading} className="glass-button bg-gradient-to-r from-pastel-blue to-pastel-purple hover:from-pastel-blue/80 hover:to-pastel-purple/80 text-white">
                    {loading ? (editingCarrier ? "Updating..." : "Creating...") : (editingCarrier ? "Update Carrier" : "Create Carrier")}
                  </Button>
                  {editingCarrier && (
                    <Button variant="outline" onClick={resetCarrierForm} className="glass-button hover:bg-pastel-pink/20">
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Existing Carriers</CardTitle>
                    <CardDescription>
                      Manage your existing carriers and their services
                    </CardDescription>
                  </div>
                  <ViewToggle view={carriersView} onViewChange={setCarriersView} />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search carriers..."
                      value={carrierSearch}
                      onChange={(e) => setCarrierSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCarriers.length === 0 ? (
                    <p className="text-muted-foreground">
                      {carrierSearch ? "No carriers found matching your search." : "No carriers found. Create your first carrier above."}
                    </p>
                  ) : carriersView === "list" ? (
                    // List View for Carriers
                    <div className="space-y-4">
                      {filteredCarriers.map((carrier) => (
                        <Card key={carrier.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                {carrier.logoUrl ? (
                                  <img
                                    src={carrier.logoUrl}
                                    alt={carrier.name}
                                    className="w-12 h-12 object-contain"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Ship className="h-6 w-6 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="font-semibold">{carrier.name}</h3>
                                  {carrier.description && (
                                    <p className="text-sm text-muted-foreground">{carrier.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary">
                                      {carrier.services.length} services
                                    </Badge>
                                    {carrier.carrierType && (
                                      <Badge variant="outline">
                                        {carrier.carrierType}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditCarrier(carrier)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setDeleteDialog({ type: 'carrier', id: carrier.id, name: carrier.name })}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // Grid View for Carriers
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCarriers.map((carrier) => (
                        <Card key={carrier.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {carrier.logoUrl ? (
                                    <img
                                      src={carrier.logoUrl}
                                      alt={carrier.name}
                                      className="w-10 h-10 object-contain"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                      <Ship className="h-5 w-5 text-primary" />
                                    </div>
                                  )}
                                  <h3 className="font-semibold text-sm">{carrier.name}</h3>
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditCarrier(carrier)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setDeleteDialog({ type: 'carrier', id: carrier.id, name: carrier.name })}
                                    className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              {carrier.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{carrier.description}</p>
                              )}
                              <div className="flex items-center gap-1 flex-wrap">
                                <Badge variant="secondary" className="text-xs">
                                  {carrier.services.length} services
                                </Badge>
                                {carrier.carrierType && (
                                  <Badge variant="outline" className="text-xs">
                                    {carrier.carrierType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  {editingService ? "Edit Service" : "Add New Service"}
                </CardTitle>
                <CardDescription>
                  {editingService ? "Update service information" : "Create a new service for a carrier"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">Service Name *</Label>
                    <Input
                      id="service-name"
                      placeholder="e.g., Pacific South Loop"
                      value={serviceForm.name}
                      onChange={(e) => handleServiceFormChange("name", e.target.value)}
                      className={serviceFormErrors.name ? "border-red-500" : ""}
                    />
                    {serviceFormErrors.name && (
                      <div className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {serviceFormErrors.name}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-carrier">Carrier *</Label>
                    <Select value={serviceForm.carrierId} onValueChange={(value) => handleServiceFormChange("carrierId", value)}>
                      <SelectTrigger className={serviceFormErrors.carrierId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers.map((carrier) => (
                          <SelectItem key={carrier.id} value={carrier.id}>
                            {carrier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {serviceFormErrors.carrierId && (
                      <div className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {serviceFormErrors.carrierId}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Route Information *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRoute}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add Route
                    </Button>
                  </div>
                  
                  {serviceForm.routes.map((route, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Route {index + 1}</span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateRoute(index)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              Copy
                            </Button>
                            {serviceForm.routes.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeRoute(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`service-pol-${index}`} className="text-sm">Port of Loading (POL)</Label>
                            <PortAutocompleteWithId
                              value={route.pol}
                              onChange={(portName, portId) => handlePortSelect(index, "pol", portName, portId)}
                              placeholder="e.g., Shanghai"
                              className={serviceFormErrors.routes[index] ? "border-red-500" : ""}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`service-via-${index}`} className="text-sm">Via Port (Optional)</Label>
                            <PortAutocompleteWithId
                              value={route.via || ""}
                              onChange={(portName, portId) => handlePortSelect(index, "via", portName, portId)}
                              placeholder="e.g., Singapore"
                              className=""
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`service-pod-${index}`} className="text-sm">Port of Discharge (POD)</Label>
                            <PortAutocompleteWithId
                              value={route.pod}
                              onChange={(portName, portId) => handlePortSelect(index, "pod", portName, portId)}
                              placeholder="e.g., Long Beach"
                              className={serviceFormErrors.routes[index] ? "border-red-500" : ""}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`service-transit-${index}`} className="text-sm">Transit Time</Label>
                            <Input
                              id={`service-transit-${index}`}
                              placeholder="e.g., 15 days"
                              value={route.transitTime}
                              onChange={(e) => handleRouteChange(index, "transitTime", e.target.value)}
                              className={serviceFormErrors.routes[index] ? "border-red-500" : ""}
                            />
                          </div>
                        </div>
                        
                        {serviceFormErrors.routes[index] && (
                          <div className="flex items-center gap-1 text-sm text-red-500">
                            <AlertCircle className="h-3 w-3" />
                            {serviceFormErrors.routes[index]}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-partners">Partner Services (Optional)</Label>
                  <Textarea
                    id="service-partners"
                    placeholder="e.g., Rail connections to major US cities, Trucking services throughout Europe..."
                    value={serviceForm.partnerServices}
                    onChange={(e) => handleServiceFormChange("partnerServices", e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe any partner services or additional logistics options available for this route.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Tip:</span> Use autocomplete to search from all available ports
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateService} disabled={loading} className="glass-button bg-gradient-to-r from-pastel-green to-pastel-mint hover:from-pastel-green/80 hover:to-pastel-mint/80 text-white">
                      {loading ? (editingService ? "Updating..." : "Creating...") : (editingService ? "Update Service" : "Create Service")}
                    </Button>
                    {editingService && (
                      <Button variant="outline" onClick={resetServiceForm} className="glass-button hover:bg-pastel-pink/20">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Services</CardTitle>
                    <CardDescription>
                      View and manage all services across carriers
                    </CardDescription>
                  </div>
                  <ViewToggle view={servicesView} onViewChange={setServicesView} />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search services..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredServices.length === 0 ? (
                    <p className="text-muted-foreground">
                      {serviceSearch ? "No services found matching your search." : "No services found. Create your first service above."}
                    </p>
                  ) : servicesView === "list" ? (
                    // List View for Services
                    <div className="space-y-4">
                      {filteredServices.map((service) => (
                        <Card key={service.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{service.name}</h3>
                                  <Badge variant="outline">{service.carrier.name}</Badge>
                                  {service.routes.length === 0 ? (
                                    <Badge variant="destructive" className="text-xs">NO Service updated</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      {service.routes.length} route{service.routes.length !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                                
                                {service.routes.length > 0 ? (
                                  <Collapsible open={expandedServices.has(service.id)} onOpenChange={() => toggleServiceRoutes(service.id)}>
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="sm" className="flex items-center gap-2 p-0 h-auto text-sm font-medium">
                                        {expandedServices.has(service.id) ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                        View Routes
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2">
                                      <div className="space-y-1">
                                        {service.routes.map((route, index) => (
                                          <div key={route.id} className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded">
                                            <div className="flex items-center gap-3">
                                              <span>
                                                {route.pol} 
                                                {route.via && ` → ${route.via}`} 
                                                → {route.pod}
                                              </span>
                                              <div className="flex items-center gap-1">
                                                {route.polPort?.code && (
                                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                                    {route.polPort.code}
                                                  </Badge>
                                                )}
                                                {route.podPort?.code && (
                                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                                    {route.podPort.code}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                              {route.transitTime}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No routes available</p>
                                )}
                                
                                {service.partnerServices && (
                                  <p className="text-sm text-muted-foreground">
                                    Partners: {service.partnerServices}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditService(service)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setDeleteDialog({ type: 'service', id: service.id, name: service.name })}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // Grid View for Services
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredServices.map((service) => (
                        <Card key={service.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm">{service.name}</h3>
                                  <Badge variant="outline" className="text-xs">{service.carrier.name}</Badge>
                                  {service.routes.length === 0 ? (
                                    <Badge variant="destructive" className="text-xs">NO Service updated</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      {service.routes.length} route{service.routes.length !== 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditService(service)}
                                    className="p-1 h-6 w-6"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setDeleteDialog({ type: 'service', id: service.id, name: service.name })}
                                    className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {service.routes.length > 0 ? (
                                <Collapsible open={expandedServices.has(service.id)} onOpenChange={() => toggleServiceRoutes(service.id)}>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center gap-2 p-0 h-auto text-xs font-medium">
                                      {expandedServices.has(service.id) ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                      View Routes
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2">
                                    <div className="space-y-1">
                                      {service.routes.slice(0, 3).map((route, index) => (
                                        <div key={route.id} className="flex items-center justify-between text-xs bg-muted/50 p-1 rounded">
                                          <div className="flex items-center gap-2">
                                            <span className="truncate">
                                              {route.pol} 
                                              {route.via && ` → ${route.via}`} 
                                              → {route.pod}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              {route.polPort?.code && (
                                                <Badge variant="outline" className="text-xs px-1 py-0">
                                                  {route.polPort.code}
                                                </Badge>
                                              )}
                                              {route.podPort?.code && (
                                                <Badge variant="outline" className="text-xs px-1 py-0">
                                                  {route.podPort.code}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          <Badge variant="secondary" className="text-xs">
                                            {route.transitTime}
                                          </Badge>
                                        </div>
                                      ))}
                                      {service.routes.length > 3 && (
                                        <div className="text-xs text-muted-foreground">
                                          +{service.routes.length - 3} more routes
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">No routes available</p>
                              )}
                              
                              {service.partnerServices && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  Partners: {service.partnerServices}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk-upload" className="space-y-6">
            <ServiceFileUpload onUploadComplete={() => {
              fetchServices()
              toast({
                title: "Services Updated",
                description: "Service list has been refreshed with new uploads"
              })
            }} />
          </TabsContent>

          <TabsContent value="ports" className="space-y-6">
            {/* Port Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add/Edit Port Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {editingPort ? "Edit Port" : "Add New Port"}
                  </CardTitle>
                  <CardDescription>
                    {editingPort ? "Update port information" : "Add a new port with name, country, and UNLOC code"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="port-name">Port Name *</Label>
                      <Input
                        id="port-name"
                        placeholder="e.g., Shanghai"
                        value={portForm.name}
                        onChange={(e) => setPortForm({ ...portForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port-country">Country *</Label>
                      <Input
                        id="port-country"
                        placeholder="e.g., China"
                        value={portForm.country}
                        onChange={(e) => setPortForm({ ...portForm, country: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="port-unloc">UNLOC *</Label>
                      <Input
                        id="port-unloc"
                        placeholder="e.g., CNSHA"
                        value={portForm.unloc}
                        onChange={(e) => setPortForm({ ...portForm, unloc: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port-code">Port Code</Label>
                      <Input
                        id="port-code"
                        placeholder="e.g., SHA"
                        value={portForm.code}
                        onChange={(e) => setPortForm({ ...portForm, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port-latitude">Latitude</Label>
                      <Input
                        id="port-latitude"
                        placeholder="e.g., 31.2304"
                        value={portForm.latitude}
                        onChange={(e) => setPortForm({ ...portForm, latitude: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port-longitude">Longitude</Label>
                    <Input
                      id="port-longitude"
                      placeholder="e.g., 121.4737"
                      value={portForm.longitude}
                      onChange={(e) => setPortForm({ ...portForm, longitude: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreatePort} disabled={loading} className="glass-button bg-gradient-to-r from-pastel-yellow to-pastel-orange hover:from-pastel-yellow/80 hover:to-pastel-orange/80 text-white">
                      {loading ? (editingPort ? "Updating..." : "Creating...") : (editingPort ? "Update Port" : "Create Port")}
                    </Button>
                    {editingPort && (
                      <Button variant="outline" onClick={resetPortForm} className="glass-button hover:bg-pastel-pink/20">
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Bulk Upload Ports
                  </CardTitle>
                  <CardDescription>
                    Upload multiple ports from JSON or CSV files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bulk-upload">Upload File</Label>
                      <Input
                        id="bulk-upload"
                        type="file"
                        accept=".json,.csv"
                        onChange={handleBulkUpload}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">File Formats:</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>
                          <strong>JSON:</strong> Array of objects with name, country, unloc fields
                        </div>
                        <div>
                          <strong>CSV:</strong> Columns: name, country, unloc, code, latitude, longitude
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Sample JSON:</h4>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`[
  {
    "name": "Shanghai",
    "country": "China", 
    "unloc": "CNSHA",
    "code": "SHA",
    "latitude": 31.2304,
    "longitude": 121.4737
  }
]`}
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Sample CSV:</h4>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`name,country,unloc,code,latitude,longitude
Shanghai,China,CNSHA,SHA,31.2304,121.4737
Los Angeles,USA,USLAX,LAX,33.9425,-118.4081`}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Existing Ports List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Existing Ports</CardTitle>
                    <CardDescription>
                      Manage your port database ({ports.length} ports)
                    </CardDescription>
                  </div>
                  <ViewToggle view={portsView} onViewChange={setPortsView} />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search ports..."
                      value={portSearch}
                      onChange={(e) => setPortSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPorts.length === 0 ? (
                    <p className="text-muted-foreground">
                      {portSearch ? "No ports found matching your search." : "No ports found. Create your first port or upload a bulk file."}
                    </p>
                  ) : portsView === "list" ? (
                    // List View for Ports
                    <div className="space-y-4">
                      {filteredPorts.map((port) => (
                        <Card key={port.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <h3 className="font-semibold">{port.name}</h3>
                                    <p className="text-sm text-muted-foreground">{port.country}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline">{port.unloc}</Badge>
                                      {port.code && (
                                        <Badge variant="secondary">{port.code}</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {(port.latitude || port.longitude) && (
                                  <div className="text-sm text-muted-foreground">
                                    Coordinates: {port.latitude}, {port.longitude}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditPort(port)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setDeleteDialog({ type: 'port', id: port.id, name: port.name })}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    // Grid View for Ports (already exists, just keeping it)
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPorts.map((port) => (
                        <Card key={port.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold">{port.name}</h3>
                                  <p className="text-sm text-muted-foreground">{port.country}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{port.unloc}</Badge>
                                    {port.code && (
                                      <Badge variant="secondary">{port.code}</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditPort(port)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setDeleteDialog({ type: 'port', id: port.id, name: port.name })}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              {(port.latitude || port.longitude) && (
                                <div className="text-xs text-muted-foreground">
                                  Coordinates: {port.latitude}, {port.longitude}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
                {deleteDialog?.type === 'carrier' && " All services associated with this carrier will also be deleted."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (deleteDialog?.type === 'carrier') {
                    handleDeleteCarrier(deleteDialog.id, deleteDialog.name)
                  } else if (deleteDialog?.type === 'service') {
                    handleDeleteService(deleteDialog.id, deleteDialog.name)
                  } else if (deleteDialog?.type === 'port') {
                    handleDeletePort(deleteDialog.id, deleteDialog.name)
                  }
                }}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
          <DialogContent className="glass-card max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-pastel-purple">
                <Cog className="h-5 w-5" />
                Site Customization
              </DialogTitle>
              <DialogDescription>
                Customize your site appearance and settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-pastel-purple">Site Title</label>
                <Input
                  value={siteSettings.siteTitle}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteTitle: e.target.value })}
                  placeholder="Enter site title"
                  className="glass-input border-pastel-blue/30 focus:border-pastel-blue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-pastel-purple">Logo Upload</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setLogoFile(file)
                        // Create preview URL
                        const url = URL.createObjectURL(file)
                        setSiteSettings({ ...siteSettings, logoUrl: url })
                      }
                    }}
                    className="glass-input border-pastel-green/30 focus:border-pastel-green"
                  />
                </div>
                {siteSettings.logoUrl && (
                  <div className="mt-2">
                    <img
                      src={siteSettings.logoUrl}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain border rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-pastel-purple">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={siteSettings.primaryColor}
                      onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                      className="w-12 h-8 p-0 border-0 bg-transparent"
                    />
                    <Input
                      value={siteSettings.primaryColor}
                      onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                      className="glass-input border-pastel-blue/30 focus:border-pastel-blue"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-pastel-purple">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={siteSettings.secondaryColor}
                      onChange={(e) => setSiteSettings({ ...siteSettings, secondaryColor: e.target.value })}
                      className="w-12 h-8 p-0 border-0 bg-transparent"
                    />
                    <Input
                      value={siteSettings.secondaryColor}
                      onChange={(e) => setSiteSettings({ ...siteSettings, secondaryColor: e.target.value })}
                      className="glass-input border-pastel-green/30 focus:border-pastel-green"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSettingsDialog(false)}
                  className="glass-button border-pastel-gray/50 text-pastel-gray hover:bg-pastel-gray/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    // Save settings logic here
                    toast({
                      title: "Settings Saved",
                      description: "Site customization settings have been saved."
                    })
                    setSettingsDialog(false)
                  }}
                  className="glass-button bg-gradient-to-r from-pastel-blue to-pastel-purple hover:from-pastel-blue/80 hover:to-pastel-purple/80 text-white"
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </AuthProvider>
  )
}