import { useState, useEffect } from 'react';
import './App.css';

// .env의 VITE_API_URL 사용 (예: https://vibe-todo-xxx.herokuapp.com/api/todos)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/todos';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '할일 목록을 불러오지 못했습니다.');
      }
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || '할일 목록을 불러오지 못했습니다.');
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, completed: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '할일 추가에 실패했습니다.');
      setTodos((prev) => [data, ...prev]);
      setInputValue('');
    } catch (err) {
      setError(err.message || '할일 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTodo = async (id) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (res.status === 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '해당 할일을 찾을 수 없습니다.');
      }
      if (!res.ok) throw new Error('할일 삭제에 실패했습니다.');
      setTodos((prev) => prev.filter((t) => t._id !== id));
      if (editingId === id) {
        setEditingId(null);
        setEditingText('');
      }
    } catch (err) {
      setError(err.message || '할일 삭제에 실패했습니다.');
    }
  };

  const toggleComplete = async (todo) => {
    const nextCompleted = !todo.completed;
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${todo._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: nextCompleted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '완료 상태 변경에 실패했습니다.');
      setTodos((prev) =>
        prev.map((t) => (t._id === todo._id ? { ...t, completed: nextCompleted } : t))
      );
    } catch (err) {
      setError(err.message || '완료 상태 변경에 실패했습니다.');
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo._id);
    setEditingText(todo.title);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const trimmed = editingText.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '할일 수정에 실패했습니다.');
      setTodos((prev) =>
        prev.map((t) => (t._id === editingId ? { ...t, title: trimmed } : t))
      );
      setEditingId(null);
      setEditingText('');
    } catch (err) {
      setError(err.message || '할일 수정에 실패했습니다.');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>할 일</h1>
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={addTodo} className="add-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="새 할 일 입력..."
            className="add-input"
            maxLength={200}
            disabled={submitting}
          />
          <button type="submit" className="btn btn-add" disabled={submitting}>
            {submitting ? '추가 중...' : '추가'}
          </button>
        </form>
      </header>

      <ul className="todo-list">
        {loading && (
          <li className="empty-message">할 일 목록 불러오는 중...</li>
        )}
        {!loading && todos.length === 0 && (
          <li className="empty-message">할 일이 없습니다. 위에서 추가해 보세요.</li>
        )}
        {!loading &&
          todos.map((todo) => (
            <li
              key={todo._id}
              className={`todo-item ${todo.completed ? 'completed' : ''} ${editingId === todo._id ? 'editing' : ''}`}
            >
              {editingId === todo._id ? (
                <form onSubmit={saveEdit} className="edit-form">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="edit-input"
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button type="submit" className="btn btn-save">
                      저장
                    </button>
                    <button
                      type="button"
                      className="btn btn-cancel"
                      onClick={cancelEdit}
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleComplete(todo)}
                    className="checkbox"
                    aria-label={`${todo.title} 완료 표시`}
                  />
                  <span
                    className="todo-text"
                    onClick={() => toggleComplete(todo)}
                  >
                    {todo.title}
                  </span>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="btn btn-edit"
                      onClick={() => startEdit(todo)}
                      aria-label="수정"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="btn btn-delete"
                      onClick={() => deleteTodo(todo._id)}
                      aria-label="삭제"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}

export default App;
