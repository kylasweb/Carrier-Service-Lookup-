"use client"

import Image from "next/image"
import Link from "next/link"

interface SwenlogLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function SwenlogLogo({ className = "", size = "md", showText = true }: SwenlogLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  }

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${sizeClasses[size]} glass-card p-1 rounded-lg`}>
        <Image
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9cUA-E6LA4UnhbhGmNq6fSgMhyctQUtQFWg&s"
          alt="SWENLOG"
          fill
          className="object-contain rounded-lg"
          sizes="(max-width: 768px) 32px, (max-width: 1200px) 40px, 48px"
        />
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-pastel-blue to-pastel-purple bg-clip-text text-transparent`}>
          SWENLOG
        </span>
      )}
    </Link>
  )
}