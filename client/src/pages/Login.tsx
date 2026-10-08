import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { API_URL } from "../api"

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.erro || "Falha no login")
        return
      }

      localStorage.setItem("token", data.token)
      navigate("/")
    } catch {
      setError("Não foi possível conectar ao servidor")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Login</h1>
          <p>Entre para continuar seus estudos.</p>
        </header>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleLogin()
          }}
        >
          <div className="input-group">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <footer className="auth-footer">
          <p>
            Ainda não possui uma conta? <Link to="/register">Criar conta</Link>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default Login
