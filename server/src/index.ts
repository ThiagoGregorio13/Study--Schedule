import "dotenv/config"
import express, { Request, Response, NextFunction } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import db from "./db"
import cors from "cors"
import crypto from "crypto"
import nodemailer from "nodemailer"

if (!process.env.SEGREDO) {
  throw new Error("SEGREDO não definido no .env")
}

const SEGREDO: string = process.env.SEGREDO

const app = express()

// ======================================================
// E-MAIL (Gmail com senha de app)
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Testa a conexão uma vez, ao iniciar o servidor
transporter.verify((error) => {
  if (error) {
    console.error("ERRO AO CONECTAR NO GMAIL:", error)
  } else {
    console.log("Gmail conectado com sucesso!")
  }
})

// ======================================================
// MIDDLEWARES
// ======================================================

// O front acessa via proxy do Vite (/api), então não há problema de CORS.
// O cors() liberado só facilita testes diretos em desenvolvimento.
app.use(cors())
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))

// ======================================================
// TIPOS
// ======================================================

interface Topic {
  id: number
  title: string
  subject: string
  completed: boolean
  userId: number
  notes?: string
  images?: string[]
}

interface TopicDB {
  id: number
  title: string
  subject: string
  completed: number
  userId: number
  notes: string
  images: string
}

interface User {
  id: number
  email: string
  passwordHash: string
  emailVerified: number
}

function toTopic(t: TopicDB): Topic {
  let imagesArray: string[] = []

  try {
    imagesArray = JSON.parse(t.images || "[]")
  } catch {
    imagesArray = []
  }

  return {
    id: t.id,
    title: t.title,
    subject: t.subject,
    completed: t.completed === 1,
    userId: t.userId,
    notes: t.notes || "",
    images: imagesArray,
  }
}

function normalizeEmail(value: unknown): string {
  return String(value || "").trim().toLowerCase()
}

// ======================================================
// AUTENTICAÇÃO (JWT)
// ======================================================

function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header) {
    return res.status(401).json({ erro: "token nao enviado" })
  }

  const token = header.split(" ")[1]

  try {
    const data = jwt.verify(token, SEGREDO) as { id: number }
    res.locals.userId = data.id
    next()
  } catch {
    return res.status(401).json({ erro: "token invalido ou expirado" })
  }
}

app.get("/", (_req, res) => {
  res.json({ mensagem: "API está funcionando" })
})

// ======================================================
// TOPICS
// ======================================================

app.get("/topics", authenticate, (_req, res) => {
  try {
    const mine = db
      .prepare("SELECT * FROM topics WHERE userId = ?")
      .all(res.locals.userId) as TopicDB[]

    res.json(mine.map(toTopic))
  } catch (error) {
    console.error(">>> ERRO AO BUSCAR TÓPICOS:", error)
    res.status(500).json({ erro: "Erro ao buscar tópicos" })
  }
})

app.get("/topics/:id", authenticate, (req, res) => {
  try {
    const id = Number(req.params.id)

    const topic = db
      .prepare("SELECT * FROM topics WHERE id = ? AND userId = ?")
      .get(id, res.locals.userId) as TopicDB | undefined

    if (!topic) {
      return res.status(404).json({ erro: "Tópico não encontrado" })
    }

    res.json(toTopic(topic))
  } catch (error) {
    console.error(">>> ERRO AO BUSCAR DETALHES DO TÓPICO:", error)
    res.status(500).json({ erro: "Erro ao carregar detalhes do tópico" })
  }
})

app.post("/topics", authenticate, (req, res) => {
  try {
    const { title, subject } = req.body

    if (!title || !subject) {
      return res
        .status(400)
        .json({ erro: "Título e matéria são obrigatórios" })
    }

    const result = db
      .prepare(
        "INSERT INTO topics (title, subject, userId, notes, images) VALUES (?, ?, ?, '', '[]')"
      )
      .run(title, subject, res.locals.userId)

    res.status(201).json({
      id: Number(result.lastInsertRowid),
      title,
      subject,
      completed: false,
      userId: res.locals.userId,
      notes: "",
      images: [],
    })
  } catch (error) {
    console.error(">>> ERRO AO CRIAR TÓPICO:", error)
    res.status(500).json({ erro: "Erro ao cadastrar novo tópico" })
  }
})

app.put("/topics/:id/notes", authenticate, (req, res) => {
  try {
    const id = Number(req.params.id)
    const { notes, images } = req.body

    const imagesJSON = JSON.stringify(images || [])

    const result = db
      .prepare(
        "UPDATE topics SET notes = ?, images = ? WHERE id = ? AND userId = ?"
      )
      .run(notes || "", imagesJSON, id, res.locals.userId)

    if (result.changes === 0) {
      return res.status(404).json({ erro: "Tópico não encontrado" })
    }

    res.json({ mensagem: "Anotações e imagens salvas com sucesso" })
  } catch (error) {
    console.error(">>> ERRO AO SALVAR ANOTAÇÕES:", error)
    res.status(500).json({ erro: "Erro ao salvar anotações" })
  }
})

app.patch("/topics/:id", authenticate, (req, res) => {
  try {
    const id = Number(req.params.id)

    const found = db
      .prepare("SELECT * FROM topics WHERE id = ? AND userId = ?")
      .get(id, res.locals.userId) as TopicDB | undefined

    if (!found) {
      return res.status(404).json({ erro: "Tópico não encontrado" })
    }

    const newValue = found.completed === 1 ? 0 : 1

    db.prepare("UPDATE topics SET completed = ? WHERE id = ?").run(
      newValue,
      id
    )

    res.json(toTopic({ ...found, completed: newValue }))
  } catch (error) {
    console.error(">>> ERRO AO ALTERAR STATUS:", error)
    res.status(500).json({ erro: "Erro ao atualizar tópico" })
  }
})

app.put("/topics/:id", authenticate, (req, res) => {
  try {
    const id = Number(req.params.id)
    const { title } = req.body

    if (!title) {
      return res.status(400).json({ erro: "Título é obrigatório" })
    }

    const result = db
      .prepare("UPDATE topics SET title = ? WHERE id = ? AND userId = ?")
      .run(title, id, res.locals.userId)

    if (result.changes === 0) {
      return res.status(404).json({ erro: "Tópico não encontrado" })
    }

    const topic = db
      .prepare("SELECT * FROM topics WHERE id = ? AND userId = ?")
      .get(id, res.locals.userId) as TopicDB

    res.json(toTopic(topic))
  } catch (error) {
    console.error(">>> ERRO AO EDITAR TÓPICO:", error)
    res.status(500).json({ erro: "Erro ao editar tópico" })
  }
})

app.delete("/topics/:id", authenticate, (req, res) => {
  try {
    const id = Number(req.params.id)

    const result = db
      .prepare("DELETE FROM topics WHERE id = ? AND userId = ?")
      .run(id, res.locals.userId)

    if (result.changes === 0) {
      return res.status(404).json({ erro: "Tópico não encontrado" })
    }

    res.status(204).send()
  } catch (error) {
    console.error(">>> ERRO AO DELETAR TÓPICO:", error)
    res.status(500).json({ erro: "Erro ao remover tópico" })
  }
})

// ======================================================
// REGISTER
// ======================================================

app.post("/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || "")

    if (!email || !password) {
      return res.status(400).json({ erro: "E-mail e senha são obrigatórios" })
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ erro: "A senha deve ter ao menos 8 caracteres" })
    }

    const existing = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as User | undefined

    // Só bloqueia se a conta já foi verificada.
    // Contas não verificadas são reaproveitadas (reenvia o código).
    if (existing && existing.emailVerified === 1) {
      return res.status(409).json({ erro: "E-mail já cadastrado" })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    let userId: number

    if (existing) {
      userId = existing.id
      db.prepare("UPDATE users SET passwordHash = ? WHERE id = ?").run(
        passwordHash,
        userId
      )
    } else {
      const result = db
        .prepare("INSERT INTO users (email, passwordHash) VALUES (?, ?)")
        .run(email, passwordHash)
      userId = Number(result.lastInsertRowid)
    }

    const code = crypto.randomInt(100000, 1000000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000

    db.prepare("DELETE FROM email_verifications WHERE userId = ?").run(userId)
    db.prepare(
      "INSERT INTO email_verifications (userId, code, expiresAt) VALUES (?, ?, ?)"
    ).run(userId, code, expiresAt)

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Código de verificação",
      text: `Seu código de verificação é: ${code}

Esse código expira em 10 minutos.`,
    })

    res.status(201).json({ mensagem: "Código de verificação enviado" })
  } catch (error) {
    console.error(">>> ERRO NO REGISTER:", error)
    res
      .status(500)
      .json({ erro: "Não foi possível enviar o e-mail de verificação" })
  }
})

// ======================================================
// VERIFY EMAIL
// ======================================================

app.post("/verify-email", (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const code = String(req.body.code || "").trim()

    if (!email || !code) {
      return res
        .status(400)
        .json({ erro: "E-mail e código são obrigatórios" })
    }

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as User | undefined

    const verification = user
      ? (db
          .prepare(
            "SELECT * FROM email_verifications WHERE userId = ? ORDER BY id DESC LIMIT 1"
          )
          .get(user.id) as
          | { id: number; userId: number; code: string; expiresAt: number }
          | undefined)
      : undefined

    // Mensagem genérica: não revela se o e-mail existe
    if (!user || !verification || verification.code !== code) {
      return res.status(400).json({ erro: "Código de verificação inválido" })
    }

    if (Date.now() > verification.expiresAt) {
      return res.status(400).json({ erro: "Código de verificação expirado" })
    }

    db.prepare("UPDATE users SET emailVerified = 1 WHERE id = ?").run(user.id)
    db.prepare("DELETE FROM email_verifications WHERE userId = ?").run(user.id)

    res.json({ mensagem: "E-mail verificado com sucesso!" })
  } catch (error) {
    console.error(">>> ERRO AO VERIFICAR E-MAIL:", error)
    res.status(500).json({ erro: "Erro interno no servidor" })
  }
})

// ======================================================
// LOGIN
// ======================================================

app.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || "")

    if (!email || !password) {
      return res.status(400).json({ erro: "E-mail e senha são obrigatórios" })
    }

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as User | undefined

    if (!user) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos!" })
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatches) {
      return res.status(401).json({ erro: "E-mail ou senha incorretos!" })
    }

    if (user.emailVerified !== 1) {
      return res.status(403).json({ erro: "E-mail ainda não verificado" })
    }

    const token = jwt.sign({ id: user.id }, SEGREDO, { expiresIn: "1h" })

    return res.json({ token })
  } catch (error) {
    console.error(">>> ERRO NO LOGIN:", error)
    return res.status(500).json({ erro: "Erro interno no servidor" })
  }
})

// ======================================================
// SERVER
// ======================================================

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})
