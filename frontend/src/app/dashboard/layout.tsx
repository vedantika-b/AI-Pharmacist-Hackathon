export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: 220, padding: 12, borderRight: '1px solid #eee' }}>
        <nav>
          <ul>
            <li>Medicines</li>
            <li>Chat</li>
            <li>Alerts</li>
          </ul>
        </nav>
      </aside>
      <section style={{ flex: 1, padding: 12 }}>{children}</section>
    </div>
  )
}
