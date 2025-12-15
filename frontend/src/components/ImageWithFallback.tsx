import React, { useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  const normalize = (s: any) => {
    if (!s && s !== 0) return s
    try {
      let t = String(s).replace(/\\\//g, '/').trim()
      // strip surrounding quotes
      t = t.replace(/^['"]|['"]$/g, '')
      // protocol-relative
      if (/^\/\//.test(t)) return 'https:' + t
      // already absolute
      if (/^https?:\/\//i.test(t) || /^data:/i.test(t)) return t
      // leading slash -> absolute on same origin
      if (t.startsWith('/')) {
        if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin + t
        return t
      }
      // cloudinary or upload path without protocol
      if (t.includes('res.cloudinary.com') || t.includes('/image/upload/')) {
        return 'https://' + t.replace(/^https?:\/\//i, '')
      }
      return t
    } catch (e) {
      return s
    }
  }

  const normalizedSrc = normalize(src)

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={String(src)} />
      </div>
    </div>
  ) : (
    <img src={normalizedSrc as string | undefined} alt={alt} className={className} style={style} {...rest} onError={handleError} data-original-url={String(src)} />
  )
}
