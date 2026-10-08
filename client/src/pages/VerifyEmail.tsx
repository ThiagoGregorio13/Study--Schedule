import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { API_URL } from "../api"

function VerifyEmail() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const navigate = useNavigate()
  const location = useLocation()
  const email: string | undefined = location.state?.email

  useEffect(() => {
    if (!email) navigate("/register")
  }, [email, navigate])

  async function handleVerify() {
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${API_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.erro || "Código inválido")
        return
      }

      setSuccess("E-mail verificado com sucesso!")
      setTimeout(() => navigate("/login"), 1500)
    } catch {
      setError("Não foi possível conectar ao servidor")
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Verifique seu e-mail</h1>
          <p>Enviamos um código de 6 dígitos para:</p>
          <strong>{email}</strong>
        </header>

        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleVerify()
          }}
        >
          <div className="input-group">
            <label htmlFor="verification-code">Código de verificação</label>
            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="btn-primary btn-full">
            Verificar e-mail
          </button>
        </form>
      </div>
    </div>
  )
}

export default VerifyEmail