// Simple frontend-only demo with mock API (static JSON) and local demo data.
(function (){
  const $ = (id) => document.getElementById(id)
  const out = $('output')
  const status = $('status')
  const productsList = $('productsList')

  function log(msg){
    const time = new Date().toISOString().split('T')[1].slice(0,8)
    out.textContent = `[${time}] ${msg}\n` + out.textContent
    console.log(msg)
  }

  // Mock API helper that fetches static JSON files shipped with the frontend
  const mockApi = {
    health: async () => {
      const r = await fetch('mock-api/health.json')
      return r.json()
    },
    createOrder: async (order) => {
      // simulate network latency
      await new Promise(r=>setTimeout(r, 400))
      // return static response from file to demonstrate output
      const r = await fetch('mock-api/create-order.json')
      return r.json()
    }
  }

  const demoProducts = [
    {id:'p1', name:'Acetaminophen 500mg', price:4.50, rx:false},
    {id:'p2', name:'Amoxicillin 500mg', price:12.0, rx:true},
    {id:'p3', name:'Loratadine 10mg', price:6.25, rx:false}
  ]

  function renderProducts(items){
    productsList.innerHTML = ''
    items.forEach(p=>{
      const el = document.createElement('div')
      el.className = 'product'
      el.innerHTML = `<strong>${p.name}</strong><div>Price: $${p.price.toFixed(2)}</div><div>Rx: ${p.rx?'Yes':'No'}</div>`
      productsList.appendChild(el)
    })
  }

  async function handleHealth(){
    log('Calling mock health...')
    try{
      const data = await mockApi.health()
      status.textContent = `Mock: ${data.status} — ${data.app}`
      log('Health response: ' + JSON.stringify(data))
    }catch(err){
      log('Health call failed: ' + err)
    }
  }

  async function handleProducts(){
    log('Loading demo products...')
    renderProducts(demoProducts)
    log('Loaded ' + demoProducts.length + ' products')
  }

  async function handleCreateOrder(){
    log('Creating demo order...')
    const order = {id:'order-demo-1', items: [demoProducts[0]], total: demoProducts[0].price}
    try{
      const res = await mockApi.createOrder(order)
      log('Create order response: ' + JSON.stringify(res))
      status.textContent = `Demo order created: ${res.order_id}`
    }catch(err){
      log('Create order failed: ' + err)
    }
  }

  function handleClear(){
    out.textContent = ''
    productsList.innerHTML = ''
    status.textContent = 'Offline (demo mode)'
  }

  // wire buttons
  $('btnHealth').addEventListener('click', handleHealth)
  $('btnProducts').addEventListener('click', handleProducts)
  $('btnCreateOrder').addEventListener('click', handleCreateOrder)
  $('btnClear').addEventListener('click', handleClear)

  // initial render
  renderProducts([])
  log('Frontend demo ready — buttons available')

  // expose for console testing
  window.__demo = {mockApi, demoProducts, handleHealth, handleCreateOrder}
})();
