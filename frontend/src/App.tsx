import React, { useState } from 'react'
import MockProvider from '@/components/MockProvider'

// Import wrappers that reuse the Next page components where possible
import MedicinesWrapper from './pages/MedicinesWrapper'
import ChatWrapper from './pages/ChatWrapper'

export default function App() {
  // derive initial route from URL so direct links like /dashboard/medicines work
  const deriveRouteFromPath = (path: string) => {
    const p = path.toLowerCase()
    if (p.startsWith('/dashboard/medicines') || p === '/dashboard/medicines') return 'medicines'
    if (p.startsWith('/dashboard/chat') || p === '/dashboard/chat') return 'chat'
    return 'home'
  }

  const [route, setRoute] = useState<'home' | 'medicines' | 'chat'>(deriveRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/'))

  return (
        <MockProvider>
      <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
        <header style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button onClick={() => { setRoute('home'); history.pushState({}, '', '/'); }}>Home</button>
          <button onClick={() => { setRoute('medicines'); history.pushState({}, '', '/dashboard/medicines'); }}>Medicines</button>
          <button onClick={() => { setRoute('chat'); history.pushState({}, '', '/dashboard/chat'); }}>Chat</button>
        </header>

        <main>
          {route === 'home' && (
            <div>
              <h1>AI Pharmacist Vite Test Harness</h1>
              <p>Use the buttons above to open the test pages. Automated tests run automatically in the browser and record results in <code>window.TESTING_CHECKLIST</code>.</p>
            </div>
          )}

          {route === 'medicines' && <MedicinesWrapper />}
          {route === 'chat' && <ChatWrapper />}
        </main>
      </div>
    </MockProvider>
  )
}
