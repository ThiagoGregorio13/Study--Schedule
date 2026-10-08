import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { API_URL } from "../api"

interface TopicDetailData {
  id: number
  title: string
  subject: string
  completed: boolean
  notes: string
  images: string[]
}

function TopicDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [topic, setTopic] = useState<TopicDetailData | null>(null)
  const [notes, setNotes] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState("")

  // Imagem em zoom (lightbox)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const token = localStorage.getItem("token")

  useEffect(() => {
    if (!token) {
      navigate("/login")
      return
    }

    async function loadTopic() {
      setLoading(true)
      setErrorMsg("")

      try {
        const response = await fetch(`${API_URL}/topics/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.status === 401) {
          localStorage.removeItem("token")
          navigate("/login")
          return
        }

        if (!response.ok) {
          setErrorMsg("Tópico não encontrado no banco de dados.")
          return
        }

        const data = await response.json()
        setTopic(data)
        setNotes(data.notes || "")
        setImages(data.images || [])
      } catch {
        setErrorMsg("Não foi possível conectar ao servidor.")
      } finally {
        setLoading(false)
      }
    }

    loadTopic()
  }, [id, token, navigate])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const reader = new FileReader()

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImages((prev) => [...prev, reader.result as string])
      }
    }

    reader.readAsDataURL(file)
    e.target.value = "" // permite escolher o mesmo arquivo de novo
  }

  function handleAddImageUrl() {
    if (!imageUrl.trim()) return
    setImages((prev) => [...prev, imageUrl.trim()])
    setImageUrl("")
  }

  function handleRemoveImage(e: React.MouseEvent, indexToRemove: number) {
    e.stopPropagation() // impede de abrir o zoom ao clicar em deletar
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  async function handleSaveAll() {
    setSaving(true)
    setSavedMessage("")

    try {
      const response = await fetch(`${API_URL}/topics/${id}/notes`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes, images }),
      })

      if (response.ok) {
        setSavedMessage("Conteúdo salvo com sucesso!")
        setTimeout(() => setSavedMessage(""), 3000)
      } else {
        setSavedMessage("Erro ao salvar no servidor.")
      }
    } catch {
      setSavedMessage("Erro ao conectar ao servidor.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <Link to="/" className="back">
          <span>←</span> Voltar
        </Link>
        <p className="empty">Carregando detalhes...</p>
      </div>
    )
  }

  if (errorMsg || !topic) {
    return (
      <div className="container">
        <Link to="/" className="back">
          <span>←</span> Voltar
        </Link>
        <div className="empty">
          <p>{errorMsg || "Tópico não encontrado."}</p>
          <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>
            Crie um novo tópico na página inicial para sincronizar com o banco
            de dados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Link to="/" className="back">
        <span>←</span> Voltar
      </Link>

      <div className="detail-card">
        <header className="detail-header">
          <span className="card-subject">{topic.subject}</span>
          <h1>{topic.title}</h1>
          <span className={`status ${topic.completed ? "completed" : ""}`}>
            {topic.completed ? "✓ Concluído" : "⏳ Em andamento"}
          </span>
        </header>

        {/* ANOTAÇÕES */}
        <section className="notes-section">
          <h2>Minhas Anotações</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escreva aqui seus resumos, fórmulas, lembretes..."
            rows={8}
          />
        </section>

        {/* IMAGENS E DIAGRAMAS */}
        <section className="images-section">
          <h2>Imagens e Diagramas</h2>

          <div className="image-inputs">
            <label className="btn-upload">
              Escolher da Galeria
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </label>

            <span className="divider-text">ou</span>

            <div className="image-input-group">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Cole a URL da imagem (https://...)"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleAddImageUrl}
              >
                Adicionar Link
              </button>
            </div>
          </div>

          <div className="image-grid">
            {images.map((img, index) => (
              <div
                key={index}
                className="image-preview clickable"
                onClick={() => setSelectedImage(img)}
              >
                <img src={img} alt={`Anexo ${index + 1}`} />
                <button
                  type="button"
                  className="btn-remove-img"
                  onClick={(e) => handleRemoveImage(e, index)}
                  title="Remover imagem"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* SALVAR */}
        <div className="save-container" style={{ marginTop: "24px" }}>
          <button
            className="btn-primary"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
          {savedMessage && (
            <span className="save-status" style={{ marginLeft: "12px" }}>
              {savedMessage}
            </span>
          )}
        </div>
      </div>

      {/* MODAL DE ZOOM / LIGHTBOX */}
      {selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn-close-modal"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img src={selectedImage} alt="Imagem ampliada" />
          </div>
        </div>
      )}
    </div>
  )
}

export default TopicDetail
