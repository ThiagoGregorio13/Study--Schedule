import { useState, useEffect, useRef } from "react"
import { Routes, Route, useNavigate } from "react-router-dom"
import TopicCard from "./components/TopicCard"
import TopicDetail from "./pages/TopicDetail"
import Login from "./pages/Login"
import Register from "./pages/Register"
import VerifyEmail from "./pages/VerifyEmail"
import type { Topic } from "./types"
import { API_URL } from "./api"
import "./App.css"

function Home() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newSubject, setNewSubject] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all")
  const titleRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const token = localStorage.getItem("token")

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    async function fetchTopics() {
      try {
        const response = await fetch(`${API_URL}/topics`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.status === 401) {
          localStorage.removeItem("token")
          navigate("/login")
          return
        }

        if (response.ok) {
          const data = await response.json()
          setTopics(data)
        }
      } catch (err) {
        console.error("Erro ao carregar tópicos:", err)
      }
    }

    fetchTopics()
  }, [token, navigate])

  async function toggleCompleted(id: number) {
    try {
      const response = await fetch(`${API_URL}/topics/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const updatedTopic = await response.json()
        setTopics((prev) => prev.map((t) => (t.id === id ? updatedTopic : t)))
      }
    } catch (err) {
      console.error("Erro ao alterar status:", err)
    }
  }

  async function addTopic() {
    if (!newTitle.trim() || !newSubject.trim()) return

    try {
      const response = await fetch(`${API_URL}/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          subject: newSubject,
        }),
      })

      if (response.ok) {
        const createdTopic = await response.json()
        setTopics((prev) => [...prev, createdTopic])
        setNewTitle("")
        setNewSubject("")
        titleRef.current?.focus()
      }
    } catch (err) {
      console.error("Erro ao adicionar tópico:", err)
    }
  }

  async function removeTopic(id: number) {
    try {
      const response = await fetch(`${API_URL}/topics/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setTopics((prev) => prev.filter((t) => t.id !== id))
      }
    } catch (err) {
      console.error("Erro ao remover tópico:", err)
    }
  }

  function handleLogout() {
    localStorage.removeItem("token")
    navigate("/login")
  }

  const visibleTopics = topics.filter((topic) => {
    if (filter === "pending") return !topic.completed
    if (filter === "completed") return topic.completed
    return true
  })

  const completedCount = topics.filter((t) => t.completed).length

  const percentage =
    topics.length === 0
      ? 0
      : Math.round((completedCount / topics.length) * 100)

  return (
    <div className="container">
      <button
        className="btn-logout-fixed"
        onClick={handleLogout}
        title="Sair da conta"
      >
        Sair <span>➔</span>
      </button>

      <header className="header">
        <h1>Organizador de Estudos</h1>
        <p>Acompanhe o que você já estudou e o que ainda falta.</p>
      </header>

      <div className="progress">
        <div className="progress-top">
          <span>
            {completedCount} de {topics.length} concluídos
          </span>
          <span>{percentage}%</span>
        </div>

        <div className="bar">
          <div className="bar-fill" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className="form">
        <input
          ref={titleRef}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título do tópico"
        />

        <input
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          placeholder="Matéria"
        />

        <button className="btn-primary" onClick={addTopic}>
          Adicionar
        </button>
      </div>

      <div className="filters">
        <button
          className={filter === "all" ? "filter active" : "filter"}
          onClick={() => setFilter("all")}
        >
          Todos
        </button>

        <button
          className={filter === "pending" ? "filter active" : "filter"}
          onClick={() => setFilter("pending")}
        >
          Pendentes
        </button>

        <button
          className={filter === "completed" ? "filter active" : "filter"}
          onClick={() => setFilter("completed")}
        >
          Concluídos
        </button>
      </div>

      <div className="list">
        {visibleTopics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onToggle={() => toggleCompleted(topic.id)}
            onRemove={() => removeTopic(topic.id)}
          />
        ))}
      </div>

      {visibleTopics.length === 0 && (
        <p className="empty">Nenhum tópico por aqui ainda.</p>
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topic/:id" element={<TopicDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
    </Routes>
  )
}

export default App
