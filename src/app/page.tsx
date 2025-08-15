"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Search, Ship } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Navigation } from "@/components/navigation"
import { PortAutocomplete } from "@/components/port-autocomplete"

interface Carrier {
  id: string
  name: string
  description?: string
  logoUrl?: string
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
  pol: string
  pod: string
  via?: string  // Optional via port
  transitTime: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [pol, setPol] = useState("")
  const [pod, setPod] = useState("")
  const [selectedCarrier, setSelectedCarrier] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (status !== "loading") {
      fetchCarriers()
    }
  }, [status])

  useEffect(() => {
    if (hasSearched) {
      filterServices()
    }
  }, [services, selectedCarrier, hasSearched])

  const fetchCarriers = async () => {
    try {
      const response = await fetch("/api/carriers")
      const data = await response.json()
      setCarriers(data)
    } catch (error) {
      console.error("Error fetching carriers:", error)
    }
  }

  const filterServices = () => {
    let filtered = services

    if (selectedCarrier !== "all") {
      filtered = filtered.filter(service => service.carrier.id === selectedCarrier)
    }

    setFilteredServices(filtered)
  }

  const handleSearch = async () => {
    if (!pol || !pod) {
      toast({
        title: "Missing Information",
        description: "Please enter both Port of Loading (POL) and Port of Discharge (POD)",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/services/search?pol=${encodeURIComponent(pol)}&pod=${encodeURIComponent(pod)}`)
      const data = await response.json()
      
      let filtered = data
      if (selectedCarrier !== "all") {
        filtered = filtered.filter((service: Service) => service.carrier.id === selectedCarrier)
      }
      
      setServices(data)
      setFilteredServices(filtered)
      setHasSearched(true)
    } catch (error) {
      console.error("Error searching services:", error)
      toast({
        title: "Search Error",
        description: "Failed to search for services",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (service: Service, route?: ServiceRoute) => {
    let text = `Carrier: ${service.carrier.name}, Service: ${service.name}`
    
    if (route) {
      text += `, Transit: ${route.transitTime}`
    } else {
      // Copy all routes transit times
      const transitTimes = service.routes.map(r => r.transitTime)
      text += `, Transit: ${transitTimes.join(", ")}`
    }
    
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "Service details have been copied to your clipboard"
      })
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-blue/10 via-pastel-purple/10 to-pastel-pink/10">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pastel-blue to-pastel-purple bg-clip-text text-transparent">
            Carrier Service Lookup
          </h1>
          <p className="text-muted-foreground">Find carrier services operating between specific port pairs</p>
        </div>

        <Card className="mb-8 glass-card hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pastel-purple">
              <Ship className="h-5 w-5 text-pastel-blue" />
              Search Services
            </CardTitle>
            <CardDescription>
              Enter your port of loading and discharge to find available carrier services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-pastel-purple">Port of Loading (POL)</label>
                <PortAutocomplete
                  value={pol}
                  onChange={setPol}
                  placeholder="e.g., Shanghai"
                  className="glass-input border-pastel-blue/30 focus:border-pastel-blue"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-pastel-purple">Port of Discharge (POD)</label>
                <PortAutocomplete
                  value={pod}
                  onChange={setPod}
                  placeholder="e.g., Long Beach"
                  className="glass-input border-pastel-green/30 focus:border-pastel-green"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-pastel-purple">Filter by Carrier</label>
                <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                  <SelectTrigger className="glass-input border-pastel-yellow/30 focus:border-pastel-yellow">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="w-full glass-button bg-gradient-to-r from-pastel-blue to-pastel-purple hover:from-pastel-blue/80 hover:to-pastel-purple/80 text-white font-medium"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-pastel-green to-pastel-mint bg-clip-text text-transparent">
            Available Services
          </h2>
          
          {!hasSearched ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ship className="h-12 w-12 text-pastel-purple mb-4" />
                <p className="text-muted-foreground text-center">
                  Enter Port of Loading (POL) and Port of Discharge (POD) to search for available services.
                </p>
              </CardContent>
            </Card>
          ) : filteredServices.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ship className="h-12 w-12 text-pastel-purple mb-4" />
                <p className="text-muted-foreground text-center">
                  No services found for the specified route.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <Card key={service.id} className="glass-card hover:shadow-xl hover:scale-105 transition-all duration-300 glass-animate">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {service.carrier.logoUrl ? (
                          <div className="w-10 h-10 glass-card p-1 rounded-lg">
                            <img
                              src={service.carrier.logoUrl}
                              alt={service.carrier.name}
                              className="w-full h-full object-contain rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-pastel-blue to-pastel-purple rounded-lg flex items-center justify-center glass-card">
                            <Ship className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg bg-gradient-to-r from-pastel-purple to-pastel-pink bg-clip-text text-transparent">
                            {service.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{service.carrier.name}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(service)}
                        className="p-2 h-8 w-8 hover:bg-pastel-yellow/20"
                      >
                        <Copy className="h-4 w-4 text-pastel-orange" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-pastel-purple">Transit Time:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-pastel-blue">
                            {service.routes[0]?.transitTime || "N/A"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(service)}
                            className="p-1 h-6 w-6 hover:bg-pastel-pink/20"
                          >
                            <Copy className="h-3 w-3 text-pastel-orange" />
                          </Button>
                        </div>
                      </div>
                      
                      {service.partnerServices && (
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-pastel-purple">Partner Services:</span>
                          <p className="text-sm text-muted-foreground">{service.partnerServices}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-white/20">
                        <span className="text-xs text-muted-foreground">
                          {service.routes.length} route{service.routes.length !== 1 ? 's' : ''} available
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(service)}
                          className="text-xs glass-button hover:bg-pastel-green/20"
                        >
                          Copy All
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}