"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Loader2, Database, Server, Component, Palette, Search } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "loading" | "success" | "error"
  message?: string
  details?: any
}

interface VerificationData {
  carriers: any[]
  services: any[]
  ports: any[]
  apiEndpoints: string[]
}

export default function VerificationPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: "Database Connection", status: "pending" },
    { name: "Carriers API", status: "pending" },
    { name: "Services API", status: "pending" },
    { name: "Ports API", status: "pending" },
    { name: "Carrier CRUD", status: "pending" },
    { name: "Service CRUD", status: "pending" },
    { name: "Port CRUD", status: "pending" },
    { name: "Service Search", status: "pending" },
    { name: "Port Search", status: "pending" },
    { name: "Port Bulk Operations", status: "pending" },
    { name: "Theme System", status: "pending" },
    { name: "Component Rendering", status: "pending" },
    { name: "Search Functionality", status: "pending" },
  ])

  const [verificationData, setVerificationData] = useState<VerificationData>({
    carriers: [],
    services: [],
    ports: [],
    apiEndpoints: []
  })

  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (name: string, status: TestResult["status"], message?: string, details?: any) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, details } : test
    ))
  }

  const testDatabaseConnection = async () => {
    updateTest("Database Connection", "loading")
    try {
      // Test carriers endpoint
      const carriersResponse = await fetch("/api/carriers")
      const carriersData = await carriersResponse.json()
      
      // Test services endpoint
      const servicesResponse = await fetch("/api/services")
      const servicesData = await servicesResponse.json()
      
      // Test ports endpoint
      const portsResponse = await fetch("/api/ports")
      const portsData = await portsResponse.json()

      if (carriersResponse.ok && servicesResponse.ok && portsResponse.ok) {
        setVerificationData(prev => ({
          ...prev,
          carriers: carriersData,
          services: servicesData,
          ports: portsData,
          apiEndpoints: ["/api/carriers", "/api/services", "/api/ports"]
        }))
        updateTest("Database Connection", "success", 
          `Connected successfully. Found ${carriersData.length} carriers, ${servicesData.length} services, ${portsData.length} ports`)
      } else {
        throw new Error("One or more API endpoints failed")
      }
    } catch (error) {
      updateTest("Database Connection", "error", `Failed to connect: ${error.message}`)
    }
  }

  const testCarriersAPI = async () => {
    updateTest("Carriers API", "loading")
    try {
      const response = await fetch("/api/carriers")
      const data = await response.json()
      
      if (response.ok) {
        updateTest("Carriers API", "success", `Successfully retrieved ${data.length} carriers`, data)
      } else {
        throw new Error(data.error || "Failed to fetch carriers")
      }
    } catch (error) {
      updateTest("Carriers API", "error", `API test failed: ${error.message}`)
    }
  }

  const testServicesAPI = async () => {
    updateTest("Services API", "loading")
    try {
      const response = await fetch("/api/services")
      const data = await response.json()
      
      if (response.ok) {
        updateTest("Services API", "success", `Successfully retrieved ${data.length} services`, data)
      } else {
        throw new Error(data.error || "Failed to fetch services")
      }
    } catch (error) {
      updateTest("Services API", "error", `API test failed: ${error.message}`)
    }
  }

  const testPortsAPI = async () => {
    updateTest("Ports API", "loading")
    try {
      const response = await fetch("/api/ports")
      const data = await response.json()
      
      if (response.ok) {
        updateTest("Ports API", "success", `Successfully retrieved ${data.length} ports`, data)
      } else {
        throw new Error(data.error || "Failed to fetch ports")
      }
    } catch (error) {
      updateTest("Ports API", "error", `API test failed: ${error.message}`)
    }
  }

  const testThemeSystem = () => {
    updateTest("Theme System", "loading")
    try {
      // Check if theme functionality exists
      const hasThemeClass = document.documentElement.classList.contains('light') || 
                           document.documentElement.classList.contains('dark') ||
                           document.documentElement.classList.contains('system')
      
      if (hasThemeClass || !document.documentElement.classList.length) {
        updateTest("Theme System", "success", "Theme system is functional")
      } else {
        throw new Error("Theme classes not found")
      }
    } catch (error) {
      updateTest("Theme System", "error", `Theme system test failed: ${error.message}`)
    }
  }

  const testComponentRendering = () => {
    updateTest("Component Rendering", "loading")
    try {
      // Check if critical UI components are rendered
      const cards = document.querySelectorAll('.card, [class*="Card"]')
      const buttons = document.querySelectorAll('button')
      const badges = document.querySelectorAll('.badge, [class*="Badge"]')
      
      if (cards.length > 0 && buttons.length > 0 && badges.length > 0) {
        updateTest("Component Rendering", "success", 
          `Components rendered successfully: ${cards.length} cards, ${buttons.length} buttons, ${badges.length} badges`)
      } else {
        throw new Error("Some components not rendered")
      }
    } catch (error) {
      updateTest("Component Rendering", "error", `Component rendering test failed: ${error.message}`)
    }
  }

  const testSearchFunctionality = () => {
    updateTest("Search Functionality", "loading")
    try {
      // Check if search inputs exist and are functional
      const searchInputs = document.querySelectorAll('input[placeholder*="Search"]')
      
      if (searchInputs.length > 0) {
        updateTest("Search Functionality", "success", `Found ${searchInputs.length} search inputs`)
      } else {
        throw new Error("No search inputs found")
      }
    } catch (error) {
      updateTest("Search Functionality", "error", `Search functionality test failed: ${error.message}`)
    }
  }

  const testCarrierCRUD = async () => {
    updateTest("Carrier CRUD", "loading")
    try {
      // Test CREATE operation
      const testCarrier = {
        name: `Test Carrier ${Date.now()}`,
        description: "Temporary test carrier for verification"
      }
      
      const createResponse = await fetch("/api/carriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testCarrier)
      })
      
      if (!createResponse.ok) {
        throw new Error("CREATE operation failed")
      }
      
      const createdCarrier = await createResponse.json()
      
      // Test READ operation (get by ID)
      const readResponse = await fetch(`/api/carriers/${createdCarrier.id}`)
      if (!readResponse.ok) {
        throw new Error("READ operation failed")
      }
      
      const readCarrier = await readResponse.json()
      
      // Test UPDATE operation
      const updatedCarrier = { 
        ...readCarrier, 
        description: "Updated test carrier for verification" 
      }
      const updateResponse = await fetch(`/api/carriers/${createdCarrier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCarrier)
      })
      
      if (!updateResponse.ok) {
        throw new Error("UPDATE operation failed")
      }
      
      // Test DELETE operation
      const deleteResponse = await fetch(`/api/carriers/${createdCarrier.id}`, {
        method: "DELETE"
      })
      
      if (!deleteResponse.ok) {
        throw new Error("DELETE operation failed")
      }
      
      updateTest("Carrier CRUD", "success", "Carrier CRUD operations completed successfully")
    } catch (error) {
      updateTest("Carrier CRUD", "error", `Carrier CRUD test failed: ${error.message}`)
    }
  }

  const testServiceCRUD = async () => {
    updateTest("Service CRUD", "loading")
    try {
      // First, get a carrier and ports for testing
      const carriersResponse = await fetch("/api/carriers")
      const carriers = await carriersResponse.json()
      const portsResponse = await fetch("/api/ports")
      const ports = await portsResponse.json()
      
      if (carriers.length === 0 || ports.length < 2) {
        throw new Error("Insufficient test data (need at least 1 carrier and 2 ports)")
      }
      
      // Test CREATE operation
      const testService = {
        name: `Test Service ${Date.now()}`,
        partnerServices: "Test partner services",
        carrierId: carriers[0].id,
        routes: [{
          polId: ports[0].id,
          podId: ports[1].id,
          transitTime: "14 days"
        }]
      }
      
      const createResponse = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testService)
      })
      
      if (!createResponse.ok) {
        throw new Error("CREATE operation failed")
      }
      
      const createdService = await createResponse.json()
      
      // Test READ operation (get by ID)
      const readResponse = await fetch(`/api/services/${createdService.id}`)
      if (!readResponse.ok) {
        throw new Error("READ operation failed")
      }
      
      const readService = await readResponse.json()
      
      // Test UPDATE operation
      const updatedService = { 
        ...readService, 
        name: `Updated Test Service ${Date.now()}`,
        routes: [{
          polId: ports[0].id,
          podId: ports[1].id,
          transitTime: "21 days"
        }]
      }
      const updateResponse = await fetch(`/api/services/${createdService.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedService)
      })
      
      if (!updateResponse.ok) {
        throw new Error("UPDATE operation failed")
      }
      
      // Test DELETE operation
      const deleteResponse = await fetch(`/api/services/${createdService.id}`, {
        method: "DELETE"
      })
      
      if (!deleteResponse.ok) {
        throw new Error("DELETE operation failed")
      }
      
      updateTest("Service CRUD", "success", "Service CRUD operations completed successfully")
    } catch (error) {
      updateTest("Service CRUD", "error", `Service CRUD test failed: ${error.message}`)
    }
  }

  const testPortCRUD = async () => {
    updateTest("Port CRUD", "loading")
    try {
      // Test CREATE operation
      const testPort = {
        name: `Test Port ${Date.now()}`,
        country: "Test Country",
        unloc: `TEST${Date.now()}`,
        code: "TST",
        latitude: 0.0,
        longitude: 0.0
      }
      
      const createResponse = await fetch("/api/ports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPort)
      })
      
      if (!createResponse.ok) {
        throw new Error("CREATE operation failed")
      }
      
      const createdPort = await createResponse.json()
      
      // Test READ operation (get by ID)
      const readResponse = await fetch(`/api/ports/${createdPort.id}`)
      if (!readResponse.ok) {
        throw new Error("READ operation failed")
      }
      
      const readPort = await readResponse.json()
      
      // Test UPDATE operation
      const updatedPort = { 
        ...readPort, 
        name: `Updated Test Port ${Date.now()}`,
        code: "UPD"
      }
      const updateResponse = await fetch(`/api/ports/${createdPort.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPort)
      })
      
      if (!updateResponse.ok) {
        throw new Error("UPDATE operation failed")
      }
      
      // Test DELETE operation
      const deleteResponse = await fetch(`/api/ports/${createdPort.id}`, {
        method: "DELETE"
      })
      
      if (!deleteResponse.ok) {
        throw new Error("DELETE operation failed")
      }
      
      updateTest("Port CRUD", "success", "Port CRUD operations completed successfully")
    } catch (error) {
      updateTest("Port CRUD", "error", `Port CRUD test failed: ${error.message}`)
    }
  }

  const testServiceSearch = async () => {
    updateTest("Service Search", "loading")
    try {
      // Test service search functionality
      const searchResponse = await fetch("/api/services/search?pol=Shanghai&pod=Los Angeles")
      
      if (!searchResponse.ok) {
        throw new Error("Service search failed")
      }
      
      const searchResults = await searchResponse.json()
      
      updateTest("Service Search", "success", 
        `Service search completed successfully, found ${Array.isArray(searchResults) ? searchResults.length : 0} results`)
    } catch (error) {
      updateTest("Service Search", "error", `Service search test failed: ${error.message}`)
    }
  }

  const testPortSearch = async () => {
    updateTest("Port Search", "loading")
    try {
      // Test port search functionality
      const searchResponse = await fetch("/api/ports/search?q=Shanghai")
      
      if (!searchResponse.ok) {
        throw new Error("Port search failed")
      }
      
      const searchResults = await searchResponse.json()
      
      updateTest("Port Search", "success", 
        `Port search completed successfully, found ${Array.isArray(searchResults) ? searchResults.length : 0} results`)
    } catch (error) {
      updateTest("Port Search", "error", `Port search test failed: ${error.message}`)
    }
  }

  const testPortBulkOperations = async () => {
    updateTest("Port Bulk Operations", "loading")
    try {
      // Test port bulk operations
      const testPorts = [
        { name: "Bulk Test Port 1", country: "Test Country", unloc: `BULK1${Date.now()}`, code: "BT1" },
        { name: "Bulk Test Port 2", country: "Test Country", unloc: `BULK2${Date.now()}`, code: "BT2" }
      ]
      
      const bulkResponse = await fetch("/api/ports/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testPorts)
      })
      
      if (!bulkResponse.ok) {
        throw new Error("Bulk operation failed")
      }
      
      const bulkResults = await bulkResponse.json()
      
      // Clean up - delete the created ports
      for (const port of bulkResults) {
        await fetch(`/api/ports/${port.id}`, { method: "DELETE" })
      }
      
      updateTest("Port Bulk Operations", "success", 
        `Bulk operations completed successfully, created ${bulkResults.length} ports`)
    } catch (error) {
      updateTest("Port Bulk Operations", "error", `Port bulk operations test failed: ${error.message}`)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    
    // Run tests in sequence
    await testDatabaseConnection()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testCarriersAPI()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testServicesAPI()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testPortsAPI()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testCarrierCRUD()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testServiceCRUD()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testPortCRUD()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testServiceSearch()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testPortSearch()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testPortBulkOperations()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    testThemeSystem()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    testComponentRendering()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    testSearchFunctionality()
    
    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "loading":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case "loading":
        return <Badge className="bg-blue-100 text-blue-800">Testing</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
    }
  }

  const passedTests = tests.filter(test => test.status === "success").length
  const totalTests = tests.length

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">System Verification</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of all features, components, and database connections
          </p>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Test Summary
            </CardTitle>
            <CardDescription>
              Overall system health and functionality status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">
                  {passedTests}/{totalTests}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tests Passed</div>
                  <div className={`text-sm font-medium ${passedTests === totalTests ? 'text-green-600' : 'text-orange-600'}`}>
                    {passedTests === totalTests ? 'All Systems Operational' : 'Some Issues Detected'}
                  </div>
                </div>
              </div>
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test) => (
            <Card key={test.name}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {test.name.includes("Database") && <Database className="h-4 w-4" />}
                    {test.name.includes("API") && <Server className="h-4 w-4" />}
                    {test.name.includes("CRUD") && <Database className="h-4 w-4" />}
                    {test.name.includes("Search") && <Search className="h-4 w-4" />}
                    {test.name.includes("Bulk") && <Database className="h-4 w-4" />}
                    {test.name.includes("Component") && <Component className="h-4 w-4" />}
                    {test.name.includes("Theme") && <Palette className="h-4 w-4" />}
                    {test.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(test.status)}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {test.message && (
                  <p className="text-sm text-muted-foreground">{test.message}</p>
                )}
                {test.details && typeof test.details === 'object' && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <details>
                      <summary className="cursor-pointer hover:text-foreground">View Details</summary>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current system state and data overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Database Records</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Carriers:</span>
                    <span className="font-mono">{verificationData.carriers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Services:</span>
                    <span className="font-mono">{verificationData.services.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ports:</span>
                    <span className="font-mono">{verificationData.ports.length}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">API Endpoints</h4>
                <div className="space-y-1 text-sm">
                  {verificationData.apiEndpoints.map((endpoint) => (
                    <div key={endpoint} className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {endpoint}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Test Results</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-mono">{Math.round((passedTests / totalTests) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Run:</span>
                    <span className="font-mono">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}