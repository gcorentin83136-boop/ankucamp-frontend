import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    })
    
    // On remonte aussi les conteneurs avec un scroll interne
    const scrollableContainers = document.querySelectorAll('.overflow-y-auto')
    scrollableContainers.forEach((container) => {
      container.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      })
    })
  }, [pathname])

  return null
}