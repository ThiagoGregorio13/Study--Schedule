import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { API_URL } from "../api"

function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleRegister() {
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.erro || "Falha no cadastro")
        return
      }

      navigate("/verify-email", {
        state: { email: email.trim().toLowerCase() },
      })
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
          <h1>Criar Conta</h1>
          <p>Cadastre-se para gerenciar seus estudos.</p>
        </header>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleRegister()
          }}
        >
          <div className="input-group">
            <label htmlFor="reg-email">E-mail</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Senha</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              minLength={8}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "Enviando código..." : "Registrar agora"}
          </button>
        </form>

        <footer className="auth-footer">
          <p>
            Já possui uma conta? <Link to="/login">Fazer Login</Link>
          </p>
        </footer>
      </div>
    </div>
  )
}

export default Register
