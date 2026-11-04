import { useState } from 'react'
import { ArrowLeft, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'

const OPTIONS = ['A', 'B', 'C', 'D']

export function blankQuestion() {
  return { text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: '', explanation: '' }
}

export function blankQuiz() {
  return { title: '', description: '', questions: [blankQuestion()] }
}

export default function QuizEditor({ quiz, onSave, onCancel }) {
  const [form, setForm] = useState({
    ...quiz,
    description: quiz.description ?? '',
    questions: quiz.questions.map(q => ({ ...q, explanation: q.explanation ?? '' }))
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function setQuestionField(index, field, value) {
    setForm(current => ({
      ...current,
      questions: current.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    }))
  }

  function addQuestion() {
    setForm(current => ({ ...current, questions: [...current.questions, blankQuestion()] }))
  }

  function removeQuestion(index) {
    setForm(current => ({ ...current, questions: current.questions.filter((_, i) => i !== index) }))
  }

  function findProblem() {
    if (!form.title.trim()) return 'Give the quiz a title.'
    for (const [index, q] of form.questions.entries()) {
      const number = index + 1
      if (!q.text.trim()) return `Question ${number} needs some text.`
      if (OPTIONS.some(letter => !q[`option${letter}`].trim())) return `Question ${number} needs all four options.`
      if (!q.correctOption) return `Choose the correct answer for question ${number}.`
    }
    return ''
  }

  async function submit() {
    const problem = findProblem()
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <section>
      <button className="back-link" onClick={onCancel}><ArrowLeft size={16} /> Back to quizzes</button>
      <div className="eyebrow">ADMIN</div>
      <h1 className="page-title">{form.id ? 'Edit quiz' : 'New quiz'}</h1>

      <div className="editor-details">
        <div className="field">
          <label htmlFor="quizTitle">Title</label>
          <input id="quizTitle" className="admin-input" value={form.title} maxLength={255}
                 onChange={e => setField('title', e.target.value)} placeholder="Present Perfect" />
        </div>
        <div className="field">
          <label htmlFor="quizDescription">Description</label>
          <textarea id="quizDescription" className="admin-input" rows={2} value={form.description} maxLength={1000}
                    onChange={e => setField('description', e.target.value)}
                    placeholder="Short text students see on the topic card" />
        </div>
      </div>

      <div className="question-list">
        {form.questions.map((q, index) => (
          <article className="question-card" key={index}>
            <div className="editor-question-head">
              <span className="question-number">QUESTION {String(index + 1).padStart(2, '0')}</span>
              <button className="icon-button danger" onClick={() => removeQuestion(index)}
                      disabled={form.questions.length === 1} aria-label={`Remove question ${index + 1}`}>
                <Trash2 size={16} />
              </button>
            </div>

            <textarea className="admin-input" rows={2} value={q.text} maxLength={1000}
                      onChange={e => setQuestionField(index, 'text', e.target.value)}
                      placeholder="She _____ to school every day." />

            <div className="editor-options">
              {OPTIONS.map(letter => (
                <label key={letter} className={q.correctOption === letter ? 'editor-option correct' : 'editor-option'}>
                  <input type="radio" name={`correct-${index}`} checked={q.correctOption === letter}
                         onChange={() => setQuestionField(index, 'correctOption', letter)} />
                  <span className="option-letter">{letter}</span>
                  <input className="admin-input" value={q[`option${letter}`]} maxLength={255}
                         onChange={e => setQuestionField(index, `option${letter}`, e.target.value)}
                         placeholder={`Option ${letter}`} />
                </label>
              ))}
            </div>
            <p className="editor-hint">Select the circle next to the correct answer.</p>

            <input className="admin-input" value={q.explanation} maxLength={1000}
                   onChange={e => setQuestionField(index, 'explanation', e.target.value)}
                   placeholder="Explanation shown in the results (optional)" />
          </article>
        ))}
      </div>

      <button className="secondary-button add-question" onClick={addQuestion}><Plus size={16} /> Add question</button>

      <div className="editor-bar">
        {error
          ? <span className="editor-error">{error}</span>
          : <span className="muted-count">{form.questions.length} {form.questions.length === 1 ? 'question' : 'questions'}</span>}
        <div className="admin-actions">
          <button className="secondary-button" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="primary-button" onClick={submit} disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            Save quiz
          </button>
        </div>
      </div>
    </section>
  )
}
