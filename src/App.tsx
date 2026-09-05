import './App.css'

function App() {
  return (
    <main className="equipment-app">
      <header className="equipment-header">
        <div>
          <p className="equipment-kicker">
            SettingForge Module
          </p>

          <h1>Equipment</h1>

          <p className="equipment-subtitle">
            Physical device discovery, environments, roles,
            capabilities, and reactions.
          </p>
        </div>
      </header>

      <section className="equipment-empty-state">
        <h2>Equipment foundation is running.</h2>

        <p>
          Device management will be added next.
        </p>
      </section>
    </main>
  )
}

export default App