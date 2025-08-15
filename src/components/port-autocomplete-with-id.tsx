"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface Port {
  id: string
  name: string
  country: string
  unloc: string
  code?: string
}

interface PortAutocompleteWithIdProps {
  value: string
  onChange: (portName: string, portId: string) => void
  placeholder?: string
  className?: string
}

export function PortAutocompleteWithId({ value, onChange, placeholder = "Search ports...", className = "" }: PortAutocompleteWithIdProps) {
  const [ports, setPorts] = useState<Port[]>([])
  const [filteredPorts, setFilteredPorts] = useState<Port[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPorts()
  }, [])

  useEffect(() => {
    if (!value || value.trim() === "") {
      setFilteredPorts([])
      setIsOpen(false)
      return
    }

    const filtered = ports.filter(port =>
      port.name.toLowerCase().includes(value.toLowerCase()) ||
      port.country.toLowerCase().includes(value.toLowerCase()) ||
      port.unloc.toLowerCase().includes(value.toLowerCase()) ||
      (port.code && port.code.toLowerCase().includes(value.toLowerCase()))
    ).slice(0, 10) // Limit to 10 results

    setFilteredPorts(filtered)
    setIsOpen(filtered.length > 0)
  }, [value, ports])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchPorts = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/ports")
      const data = await response.json()
      setPorts(data)
    } catch (error) {
      console.error("Error fetching ports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPort = (port: Port) => {
    onChange(port.name, port.id)
    setIsOpen(false)
  }

  const formatPortDisplay = (port: Port) => {
    return `${port.name}, ${port.country} (${port.unloc})`
  }

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value, "")} // Pass empty ID when typing
          onFocus={() => {
            if (filteredPorts.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
        />
      </div>
      
      {isOpen && (
        <Card 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg"
        >
          <div className="p-2">
            {filteredPorts.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                No ports found
              </div>
            ) : (
              filteredPorts.map((port) => (
                <div
                  key={port.id}
                  className="p-2 hover:bg-muted cursor-pointer rounded text-sm transition-colors"
                  onClick={() => handleSelectPort(port)}
                >
                  <div className="font-medium">{port.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {port.country} • {port.unloc}
                    {port.code && ` • ${port.code}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}