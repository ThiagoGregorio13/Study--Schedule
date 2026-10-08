import type { Topic } from "../types"
import { Link } from "react-router-dom"

interface TopicCardProps {
  topic: Topic;
  onToggle: () => void;
  onRemove: () => void;
}

function TopicCard({ topic, onToggle, onRemove }: TopicCardProps) {
  return (
    <div className={topic.completed ? "card completed" : "card"}>
      <button className="btn-check" onClick={onToggle} aria-label="Marcar como concluído">
        {topic.completed && "✓"}
      </button>

      <div className="card-info">
        <h2 className="card-title">
          <Link to={`/topic/${topic.id}`}>{topic.title}</Link>
        </h2>
        <span className="card-subject">{topic.subject}</span>
      </div>

      <button className="btn-remove" onClick={onRemove} aria-label="Remover tópico">
        🗑️
      </button>
    </div>
  )
}

export default TopicCard
