'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  size: number
  speed: number
  opacity: number
}

interface StarFieldProps {
  className?: string
}

export function StarField({ className = '' }: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size to match window
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)
    
    // Create stars
    const stars: Star[] = []
    const starCount = Math.floor(canvas.width * canvas.height / 10000) // Adjust density here
    
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.2 + 0.1,
        opacity: Math.random() * 0.8 + 0.2
      })
    }
    
    // Animation loop
    let animationId: number
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i]
        
        // Update position
        star.y += star.speed
        
        // Reset if off screen
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }
        
        // Draw star
        ctx.beginPath()
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // Add occasional shooting star
      if (Math.random() < 0.005) {
        const shootingStar = {
          x: Math.random() * canvas.width,
          y: 0,
          length: Math.random() * 80 + 20,
          angle: Math.PI / 4 + (Math.random() * Math.PI / 4),
          speed: Math.random() * 15 + 10
        }
        
        let progress = 0
        const drawShootingStar = () => {
          ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(shootingStar.x, shootingStar.y)
          
          const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length * progress
          const tailY = shootingStar.y + Math.sin(shootingStar.angle) * shootingStar.length * progress
          
          ctx.lineTo(tailX, tailY)
          ctx.stroke()
          
          shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed
          shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed
          
          progress += 0.02
          if (progress < 1 && 
              shootingStar.x < canvas.width + shootingStar.length && 
              shootingStar.y < canvas.height + shootingStar.length) {
            requestAnimationFrame(drawShootingStar)
          }
        }
        
        drawShootingStar()
      }
      
      animationId = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', setCanvasSize)
      cancelAnimationFrame(animationId)
    }
  }, [])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 -z-10 ${className}`}
      style={{ backgroundColor: 'transparent' }}
    />
  )
}