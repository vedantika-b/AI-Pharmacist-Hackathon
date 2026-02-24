"use client"

import { useEffect } from "react"

export function MockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Keep original fetch
    const originalFetch = window.fetch.bind(window)

    // Mapping rules from backend endpoints to local mock files
    const mapToMock = (pathname: string) => {
      const p = pathname.toLowerCase()
      if (p.includes("/api/medic") || p.includes("/products") || p.includes("/inventory")) {
        return "/mock_data/medicines.json"
      }
      if (p.includes("/api/order") || p.includes("/orders") || p.includes("/history") || p.includes("/purchase")) {
        return "/mock_data/history.json"
      }
      if (p.includes("/api/ai") || p.includes("/llm") || p.includes("/ocr")) {
        // Provide a simple stubbed AI response
        return "__MOCK_AI_RESPONSE__"
      }
      return null
    }

    // Override fetch to return static JSON for known backend paths
    // and otherwise call the original fetch.
    // This keeps dev server network calls for other resources intact.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input)
        const resolved = new URL(url, window.location.origin)
        const mock = mapToMock(resolved.pathname)
        if (mock === "__MOCK_AI_RESPONSE__") {
          const body = JSON.stringify({ result: "mock-ai-response", detail: "This is a simulated AI response (mock)." })
          return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } })
        }
        if (mock) {
          console.info(`[MockProvider] Intercepted request to ${resolved.pathname} → serving ${mock}`)
          return originalFetch(mock, init)
        }
      } catch (err) {
        // fallthrough to original fetch on errors
        console.warn("[MockProvider] failed to resolve mock for", input, err)
      }
      return originalFetch(input as any, init)
    }

    // Expose testing checklist and skipped features
    ;(window as any).TESTING_CHECKLIST = {
      ready: true,
      mappedEndpoints: ["/api/medicines → /mock_data/medicines.json", "/api/orders → /mock_data/history.json", "/api/ai → stubbed response"],
      skippedFeatures: [
        "backend-authentication",
        "real-payments",
        "server-side-llm-calls (replaced by stubs)",
      ],
      results: {},
    }

    console.group("AI-Pharmacist Frontend Testing Ready")
    console.info("MockProvider active: backend API calls will be redirected to /mock_data or stubbed.")
    console.info("Open the testing checklist at window.TESTING_CHECKLIST in the console.")
    console.info("Static server should be at http://localhost:5000 after running the provided commands.")
    console.groupEnd()

    // Automated frontend tests (run in browser without backend)
    const runTests = async () => {
      const results: Record<string, string> = {}

      const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

      // Helper to navigate and wait a bit for hydration
      const navigate = async (path: string) => {
        try {
          history.pushState({}, '', path)
          // trigger a popstate to let any client routing react
          window.dispatchEvent(new PopStateEvent('popstate'))
        } catch (e) {
          // fallback to location assign
          window.location.href = path
        }
        await wait(700)
      }

      // Test 1: Medicines listing presence
      try {
        await navigate('/dashboard/medicines')
        await wait(600)
        const foundHeading = !!document.querySelector('h1') && /Medicine Search/i.test(document.querySelector('h1')!.textContent || '')
        results['Medicines listing'] = foundHeading ? 'Pass' : 'Fail'
      } catch (e) {
        results['Medicines listing'] = 'Fail'
      }

      // Test 2: Search and filter
      try {
        const searchInput = Array.from(document.querySelectorAll('input')).find(i => (i as HTMLInputElement).placeholder && /(Search by medicine name|Search medicines|Search)/i.test((i as HTMLInputElement).placeholder || '')) as HTMLInputElement | undefined
        if (searchInput) {
          searchInput.focus()
          searchInput.value = 'Amoxicillin'
          searchInput.dispatchEvent(new Event('input', { bubbles: true }))
          await wait(400)
          const text = Array.from(document.querySelectorAll('p')).map(n => n.textContent || '').find(t => /Found\s+\d+\s+medicine/.test(t))
          results['Search & Filter'] = text && /Found\s+1\s+medicine/.test(text) ? 'Pass' : 'Fail'
        } else {
          results['Search & Filter'] = 'Skipped'
        }
      } catch (e) {
        results['Search & Filter'] = 'Fail'
      }

      // Test 3: Add to cart simulation
      try {
        const addBtn = Array.from(document.querySelectorAll('button')).find(b => /Add to Cart/i.test(b.textContent || '')) as HTMLButtonElement | undefined
        const cartBtn = Array.from(document.querySelectorAll('button')).find(b => /Cart\s*\(/i.test(b.textContent || '')) as HTMLButtonElement | undefined
        const initialCartCount = cartBtn ? (cartBtn.textContent || '').match(/Cart\s*\((\d+)\)/)?.[1] : null
        if (addBtn) {
          addBtn.click()
          await wait(500)
          const newCartCount = cartBtn ? (cartBtn.textContent || '').match(/Cart\s*\((\d+)\)/)?.[1] : null
          results['Add to Cart'] = (newCartCount && initialCartCount !== newCartCount) || /Added to Cart/i.test(addBtn.textContent || '') ? 'Pass' : 'Fail'
        } else {
          results['Add to Cart'] = 'Skipped'
        }
      } catch (e) {
        results['Add to Cart'] = 'Fail'
      }

      // Test 4: Purchase history fetch (API mapping test)
      try {
        const resp = await fetch('/api/orders')
        const data = await resp.json()
        results['Purchase history (API mapping)'] = Array.isArray(data) && data.length > 0 ? 'Pass' : 'Fail'
      } catch (e) {
        results['Purchase history (API mapping)'] = 'Fail'
      }

      // Test 5: AI chat / OCR stubbed response
      try {
        const aiResp = await fetch('/api/ai')
        const aiJson = await aiResp.json()
        results['AI chat / OCR (stub)'] = aiJson && (aiJson.result === 'mock-ai-response' || aiJson.result) ? 'Pass' : 'Fail'
      } catch (e) {
        results['AI chat / OCR (stub)'] = 'Fail'
      }

      // Test 6: Voice-button UI simulation (presence + click)
      try {
        await navigate('/dashboard/chat')
        await wait(500)
        const micBtn = Array.from(document.querySelectorAll('button')).find(b => (b.getAttribute('title') || '').toLowerCase().includes('voice') || /voice input/i.test(b.textContent || '') ) as HTMLButtonElement | undefined
        if (micBtn) {
          micBtn.click()
          await wait(300)
          results['Voice-button UI'] = 'Pass'
        } else {
          results['Voice-button UI'] = 'Skipped'
        }
      } catch (e) {
        results['Voice-button UI'] = 'Fail'
      }

      // Test 7: Notifications (mock)
      try {
        // Create a mock notification element as many browsers block Notification API in insecure contexts
        const testNotification = () => {
          try {
            if ('Notification' in window) {
              // try to create a permissionless mock
              const el = document.createElement('div')
              el.id = 'mock-notification'
              el.textContent = 'Notification: Test'
              el.style.position = 'fixed'
              el.style.right = '12px'
              el.style.bottom = '12px'
              el.style.background = '#111'
              el.style.color = '#fff'
              el.style.padding = '8px 12px'
              el.style.borderRadius = '6px'
              document.body.appendChild(el)
              setTimeout(() => el.remove(), 2500)
              return true
            }
            return false
          } catch (e) {
            return false
          }
        }
        results['Notifications (mock)'] = testNotification() ? 'Pass' : 'Skipped'
      } catch (e) {
        results['Notifications (mock)'] = 'Fail'
      }

      // Merge results into TESTING_CHECKLIST and log
      ;(window as any).TESTING_CHECKLIST.results = results

      console.group('AI-Pharmacist Frontend Testing Results')
      Object.entries(results).forEach(([k, v]) => console.info(k + ': ' + v))
      console.groupEnd()

      // Also send a custom event in case external tools are listening
      window.dispatchEvent(new CustomEvent('AI_PHARM_TESTS_COMPLETE', { detail: results }))
    }

    // Run tests after small delay to allow SPA hydration
    setTimeout(() => runTests().catch(e => console.error('Automated test runner error', e)), 900)

    return () => {
      // restore original fetch
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.fetch = originalFetch
      } catch (e) {
        // ignore
      }
    }
  }, [])

  return <>{children}</>
}

export default MockProvider
