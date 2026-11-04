import { CircleHelp, XCircle } from 'lucide-react'

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null
  return (
    <div className="alert">
      <CircleHelp size={18} />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss error"><XCircle size={17} /></button>
    </div>
  )
}
