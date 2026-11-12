import { useEffect, useMemo, useState } from "react";

const COLORS = ["#fff3c4", "#dff5e8", "#e8e7ff", "#ffe4e7", "#e0f1ff", "#f5e6ff"];
const CATEGORIES = ["Personal", "Study", "Work", "Ideas"];
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function Icon({ name, size = 18 }) {
  const paths = {
    note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    pin: <><path d="m16 3 5 5-4 1-4 4-1 5-2-2-5 5 1-6 5-5 5-2z"/></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15z"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function readNotes(email) {
  try { return JSON.parse(localStorage.getItem(`notely-notes-${email}`) || "[]"); }
  catch { return []; }
}

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: token,
      ...options.headers,
    },
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!response.ok) {
    const error = new Error(typeof data === "string" ? data : data?.msg || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function loadAccountNotes(token, email) {
  let savedNotes = await apiRequest("/notes", token);
  if (savedNotes.length === 0) {
    const browserNotes = readNotes(email);
    if (browserNotes.length > 0) {
      savedNotes = await apiRequest("/notes/import", token, {
        method: "POST",
        body: JSON.stringify({ notes: browserNotes }),
      });
    }
  }
  return savedNotes;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("notely-token") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("notely-email") || "");
  const [userName, setUserName] = useState(() => localStorage.getItem("notely-name") || "");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [notes, setNotes] = useState(() => readNotes(localStorage.getItem("notely-email") || ""));
  const [noteError, setNoteError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ title: "", content: "", color: COLORS[0], category: "Personal", pinned: false });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("notely-theme") === "dark");

  useEffect(() => {
    if (!token || !email) return undefined;
    let active = true;
    loadAccountNotes(token, email)
      .then(savedNotes => { if (active) setNotes(savedNotes); })
      .catch(error => {
        if (!active) return;
        if (error.status === 401) {
          setAuthError("Your session expired. Please sign in again.");
          localStorage.removeItem("notely-token");
          setToken("");
        } else {
          setNoteError(`Could not load notes from MongoDB: ${error.message}`);
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (email) localStorage.setItem(`notely-notes-${email}`, JSON.stringify(notes));
  }, [notes, email]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleNotes = useMemo(() => notes
    .filter(note => filter === "pinned" ? note.pinned : filter === "recent" ? Date.now() - note.updatedAt < 7 * 24 * 60 * 60 * 1000 : filter.startsWith("category:") ? (note.category || "Personal") === filter.slice(9) : true)
    .filter(note => `${note.title} ${note.content} ${note.category || "Personal"}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || (b.updatedAt - a.updatedAt)), [notes, query, filter]);
  const pinnedCount = notes.filter(note => note.pinned).length;
  const todayCount = notes.filter(note => new Date(note.updatedAt).toDateString() === new Date().toDateString()).length;
  const wordCount = notes.reduce((sum, note) => sum + `${note.title} ${note.content}`.trim().split(/\s+/).filter(Boolean).length, 0);
  const pageTitle = filter === "pinned" ? "Pinned notes" : filter === "recent" ? "Recently edited" : filter.startsWith("category:") ? filter.slice(9) : "All notes";

  function exportNotes() {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notely-notes-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Notes exported successfully");
  }

  function toggleTheme() {
    setDarkMode(current => {
      const next = !current;
      localStorage.setItem("notely-theme", next ? "dark" : "light");
      return next;
    });
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    try {
      const isLogin = authMode === "login";
      const response = await fetch(isLogin ? "/user/login" : "/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin
          ? { email: authForm.email.trim(), password: authForm.password }
          : { name: authForm.name.trim(), email: authForm.email.trim(), password: authForm.password }),
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch { data = raw; }

      if (!isLogin) {
        if (response.ok && typeof data === "string" && data.toLowerCase().includes("success")) {
          setToast("Account created! Please sign in.");
          setAuthMode("login");
          setAuthForm(value => ({ ...value, password: "" }));
        } else {
          setAuthError(typeof data === "string" ? data : data?.msg || "Could not create account. Try another email.");
        }
      } else if (response.ok && data && typeof data === "object" && data.token) {
        const accountEmail = authForm.email.trim().toLowerCase();
        const accountNotes = await loadAccountNotes(data.token, accountEmail);
        const name = data.name || accountEmail.split("@")[0];
        setToken(data.token);
        setEmail(accountEmail);
        setUserName(name);
        setNotes(accountNotes);
        localStorage.setItem("notely-token", data.token);
        localStorage.setItem("notely-email", accountEmail);
        localStorage.setItem("notely-name", name);
        setNoteError("");
      } else {
        setAuthError(typeof data === "string" ? data : data?.msg || "Login failed. Check your details.");
      }
    } catch (error) {
      setAuthError(error.message || "Can't connect to the backend. Make sure your server is running on port 8080.");
    } finally {
      setAuthBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("notely-token");
    localStorage.removeItem("notely-email");
    localStorage.removeItem("notely-name");
    setToken("");
    setEmail("");
    setUserName("");
    setNotes([]);
    setNoteError("");
  }

  function openNew() {
    setEditing(null);
    setDraft({ title: "", content: "", color: COLORS[Math.floor(Math.random() * COLORS.length)], category: "Personal", pinned: false });
    setNoteError("");
    setModal(true);
  }

  function openEdit(note) {
    setEditing(note.id);
    setDraft({ title: note.title, content: note.content, color: note.color, category: note.category || "Personal", pinned: note.pinned });
    setNoteError("");
    setModal(true);
  }

  async function saveNote(event) {
    event.preventDefault();
    if (!draft.title.trim() && !draft.content.trim()) return;
    setNoteError("");
    setSaving(true);
    try {
      const payload = {
        ...draft,
        title: draft.title.trim() || "Untitled note",
        content: draft.content.trim(),
        category: draft.category || "Personal",
      };
      const savedNote = await apiRequest(editing ? `/notes/${editing}` : "/notes", token, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setNotes(previous => editing
        ? previous.map(note => note.id === editing ? savedNote : note)
        : [savedNote, ...previous]);
      setToast(editing ? "Note updated" : "Note saved");
      setModal(false);
    } catch (error) {
      setNoteError(`Could not save note to MongoDB: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(id) {
    setNoteError("");
    try {
      const savedNote = await apiRequest(`/notes/${id}/pin`, token, { method: "PATCH" });
      setNotes(previous => previous.map(note => note.id === id ? savedNote : note));
      setToast("Note updated");
    } catch (error) {
      setNoteError(`Could not update note in MongoDB: ${error.message}`);
    }
  }

  async function deleteNote(id) {
    setNoteError("");
    try {
      await apiRequest(`/notes/${id}`, token, { method: "DELETE" });
      setNotes(previous => previous.filter(note => note.id !== id));
      setToast("Note deleted");
    } catch (error) {
      setNoteError(`Could not delete note from MongoDB: ${error.message}`);
    }
  }

  if (!token) return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="brand brand-light"><span className="brand-mark"><Icon name="note" size={22}/></span> notely<span className="brand-dot">.</span></div>
        <div className="art-copy">
          <div className="eyebrow"><Icon name="sparkle" size={15}/> YOUR SPACE TO THINK</div>
          <h1>Big ideas start<br/>with a <em>small note.</em></h1>
          <p>Capture what matters. Keep your thoughts organised. Make room for your next big idea.</p>
          <div className="paper-stack">
            <div className="paper paper-back"><span>Ideas for later</span><i></i><i></i><i></i></div>
            <div className="paper paper-front"><span>Today's thought ✨</span><strong>Start where you are.<br/>Use what you have.</strong><small>— a little reminder</small></div>
            <div className="floating-star">✳</div>
          </div>
        </div>
        <div className="art-footer">A calmer place for your busy mind.</div>
      </div>
      <section className="auth-panel">
        <div className="auth-mobile-brand brand"><span className="brand-mark"><Icon name="note" size={22}/></span> notely<span className="brand-dot">.</span></div>
        <div className="auth-box">
          <div className="auth-welcome">{authMode === "login" ? "WELCOME BACK" : "GET STARTED"}</div>
          <h2>{authMode === "login" ? "Sign in to Notely" : "Create your account"}</h2>
          <p className="auth-sub">{authMode === "login" ? "Your thoughts have been waiting for you." : "A little space for all your big ideas."}</p>
          <form onSubmit={handleAuth}>
            {authMode === "register" && <label>Your name<input autoComplete="name" placeholder="e.g. Karan" value={authForm.name} onChange={event => setAuthForm({ ...authForm, name: event.target.value })} required/></label>}
            <label>Email address<div className="input-wrap"><span>✉</span><input type="email" autoComplete="email" placeholder="you@example.com" value={authForm.email} onChange={event => setAuthForm({ ...authForm, email: event.target.value })} required/></div></label>
            <label>Password<div className="input-wrap"><span>⌑</span><input type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} placeholder="Enter your password" minLength="4" value={authForm.password} onChange={event => setAuthForm({ ...authForm, password: event.target.value })} required/></div></label>
            {authError && <div className="error-message" role="alert">{authError}</div>}
            <button className="primary-btn auth-submit" disabled={authBusy}>{authBusy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"} <span>↗</span></button>
          </form>
          <div className="auth-switch">{authMode === "login" ? "New to Notely?" : "Already have an account?"} <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>{authMode === "login" ? "Create an account" : "Sign in"}</button></div>
          <div className="auth-privacy"><span>✦</span> Your notes, your space. Keep your thoughts close.</div>
        </div>
      </section>
      {toast && <div className="toast"><Icon name="check" size={17}/>{toast}</div>}
    </main>
  );

  return (
    <div className={`app-shell ${darkMode ? "theme-dark" : ""}`}>
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <button className="brand sidebar-brand" onClick={() => { setFilter("all"); setMenuOpen(false); }}><span className="brand-mark"><Icon name="note" size={22}/></span> notely<span className="brand-dot">.</span></button>
        <button className="new-note-btn" onClick={() => { openNew(); setMenuOpen(false); }}><Icon name="plus" size={19}/> New note <span>⌘ N</span></button>
        <div className="nav-label">WORKSPACE</div>
        <nav className="side-nav">
          <button className={filter === "all" ? "active" : ""} onClick={() => { setFilter("all"); setMenuOpen(false); }}><Icon name="grid"/> All notes <span className="nav-count">{notes.length}</span></button>
          <button className={filter === "pinned" ? "active" : ""} onClick={() => { setFilter("pinned"); setMenuOpen(false); }}><Icon name="pin"/> Pinned <span className="nav-count">{pinnedCount}</span></button>
          <button className={filter === "recent" ? "active" : ""} onClick={() => { setFilter("recent"); setMenuOpen(false); }}><Icon name="clock"/> Recently edited</button>
        </nav>
        <div className="nav-label category-label">CATEGORIES</div>
        <nav className="side-nav category-nav">
          {CATEGORIES.map(category => <button key={category} className={filter === `category:${category}` ? "active" : ""} onClick={() => { setFilter(`category:${category}`); setMenuOpen(false); }}><span className={`category-dot dot-${category.toLowerCase()}`}></span>{category}<span className="nav-count">{notes.filter(note => (note.category || "Personal") === category).length}</span></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="storage-card"><div className="storage-icon"><Icon name="sparkle" size={17}/></div><strong>Your mind, organised.</strong><p>One thought at a time. You're doing great.</p><div className="storage-decoration">✳</div></div>
          <div className="profile-row"><div className="avatar">{(userName || email || "U").charAt(0).toUpperCase()}</div><div className="profile-info"><strong>{userName || email.split("@")[0]}</strong><span>{email}</span></div><button className="logout-btn" title="Sign out" onClick={signOut}><Icon name="logout" size={16}/><span>Logout</span></button></div>
        </div>
      </aside>
      {menuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)}/>}
      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-btn" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>{pageTitle}</strong></div>
          <div className="topbar-right">
            <button className="utility-btn" onClick={toggleTheme} title="Toggle dark mode">{darkMode ? "☀️ Light" : "🌙 Dark"}</button>
            <button className="utility-btn" onClick={exportNotes} title="Export your notes">↧ Export</button>
            <button className="utility-btn topbar-logout" onClick={signOut} title="Sign out"><Icon name="logout" size={15}/> Logout</button>
            <div className="date-chip"><span className="live-dot"></span> Your personal space</div>
            <div className="avatar small-avatar">{(userName || email || "U").charAt(0).toUpperCase()}</div>
          </div>
        </header>
        <section className="content-area">
          {noteError && <div className="error-message" role="alert">{noteError}</div>}
          <div className="page-heading"><div><div className="eyebrow muted-eyebrow">YOUR PERSONAL PRODUCTIVITY SPACE</div><h1>{filter === "pinned" ? "Pinned notes" : filter === "recent" ? "Recently edited" : filter.startsWith("category:") ? `${filter.slice(9)} notes` : "Your notes"}<span className="heading-period">.</span></h1><p>A home for all the things you don't want to forget.</p></div><button className="primary-btn heading-create" onClick={openNew}><Icon name="plus" size={18}/> Create note</button></div>
          <div className="stats-row">
            <div className="stat-card"><span className="stat-icon stat-purple">▤</span><div><span>Total notes</span><strong>{notes.length}</strong><small>Ideas captured</small></div></div>
            <div className="stat-card"><span className="stat-icon stat-yellow">✦</span><div><span>Pinned notes</span><strong>{pinnedCount}</strong><small>Quick access</small></div></div>
            <div className="stat-card"><span className="stat-icon stat-green">◷</span><div><span>Updated today</span><strong>{todayCount}</strong><small>Keep the momentum</small></div></div>
            <div className="stat-card"><span className="stat-icon stat-blue">Aa</span><div><span>Words written</span><strong>{wordCount}</strong><small>Your ideas in words</small></div></div>
          </div>
          <div className="toolbar"><div className="search-box"><Icon name="search" size={19}/><input placeholder="Search your notes..." value={query} onChange={event => setQuery(event.target.value)}/><kbd>⌘ K</kbd></div><div className="results-label">{visibleNotes.length} {visibleNotes.length === 1 ? "NOTE" : "NOTES"}</div></div>
          {notes.length > 0 && filter === "all" && !query && <div className="section-title"><span>ALL THOUGHTS</span><span className="section-line"></span><span className="section-total">{notes.length} total</span></div>}
          {visibleNotes.length ? <div className="notes-grid">
            {visibleNotes.map((note, index) => <article className={`note-card ${index === 0 ? "first-card" : ""}`} style={{ "--note-color": note.color }} key={note.id}>
              <div className="note-card-top"><span className="note-type"><span className="note-type-dot"></span> {(note.category || "Personal").toUpperCase()}</span><div className="note-actions">
                <button className={`icon-btn ${note.pinned ? "pinned" : ""}`} title={note.pinned ? "Unpin note" : "Pin note"} onClick={() => togglePin(note.id)}><Icon name="pin" size={16}/></button>
                <button className="icon-btn" title="Edit note" onClick={() => openEdit(note)}><Icon name="edit" size={16}/></button>
                <button className="icon-btn delete-btn" title="Delete note" onClick={() => deleteNote(note.id)}><Icon name="trash" size={16}/></button>
              </div></div>
              <button className="note-body" onClick={() => openEdit(note)}><h3>{note.title}</h3><p>{note.content || "No additional details..."}</p></button>
              <div className="note-card-bottom"><span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>{note.pinned && <span className="pinned-label"><Icon name="pin" size={12}/> Pinned</span>}</div>
              <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
            </article>)}
            <button className="add-card" onClick={openNew}><span className="add-card-icon"><Icon name="plus" size={22}/></span><strong>Capture a new thought</strong><span>Good ideas don't wait.</span></button>
          </div> : <div className="empty-state">
            <div className="empty-illustration"><div className="empty-sheet"><Icon name="note" size={34}/><i></i><i></i><i></i></div><span className="empty-spark">✳</span></div>
            <h3>{query ? "No notes found" : filter === "pinned" ? "Nothing pinned yet" : "A fresh page awaits."}</h3>
            <p>{query ? "Try another search term." : filter === "pinned" ? "Pin a note to keep it close at hand." : "Every great idea starts somewhere. Put the first one here."}</p>
            {!query && filter !== "pinned" && <button className="primary-btn" onClick={openNew}><Icon name="plus" size={18}/> Create your first note</button>}
          </div>}
          <footer className="content-footer"><span>MADE FOR YOUR THOUGHTS <span className="footer-heart">♥</span></span><span>{notes.length} notes synced to your MongoDB account</span></footer>
        </section>
      </main>
      {modal && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setModal(false); }}>
        <section className="note-modal">
          <div className="modal-top"><div><span className="modal-kicker">{editing ? "REFINE YOUR THOUGHT" : "A NEW THOUGHT"}</span><h2>{editing ? "Edit note" : "Create a note"}</h2></div><button className="icon-btn close-modal" onClick={() => setModal(false)}><Icon name="close"/></button></div>
          <form onSubmit={saveNote}>
            <label className="field-label">TITLE<input autoFocus maxLength="100" placeholder="Give your thought a title..." value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })}/></label>
            <label className="field-label">YOUR THOUGHTS<textarea rows="7" placeholder="Start writing here. Anything on your mind..." value={draft.content} onChange={event => setDraft({ ...draft, content: event.target.value })}/></label>
            <label className="field-label">CATEGORY<select value={draft.category || "Personal"} onChange={event => setDraft({ ...draft, category: event.target.value })}>{CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
            <div className="color-picker"><span>NOTE COLOUR</span><div>{COLORS.map(color => <button type="button" key={color} className={`color-dot ${draft.color === color ? "selected" : ""}`} style={{ "--swatch": color }} onClick={() => setDraft({ ...draft, color })} aria-label={`Choose ${color} colour`}/>)}</div></div>
            {noteError && <div className="error-message" role="alert">{noteError}</div>}
            <div className="modal-footer"><span><Icon name="check" size={15}/> Saved to your MongoDB account</span><button type="button" className="cancel-btn" onClick={() => setModal(false)}>Cancel</button><button className="primary-btn save-btn" type="submit" disabled={saving}><Icon name="check" size={17}/>{saving ? "Saving..." : editing ? "Save changes" : "Save note"}</button></div>
          </form>
        </section>
      </div>}
      {toast && <div className="toast"><Icon name="check" size={17}/>{toast}</div>}
    </div>
  );
}
