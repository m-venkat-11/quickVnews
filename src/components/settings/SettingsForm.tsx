'use client';

import { useEffect, useState } from 'react';

const EXAMS = ['All', 'UPSC', 'APPSC', 'SSC', 'Banking', 'General Knowledge'];
const LOCATIONS = ['India', 'Andhra Pradesh', 'Visakhapatnam'];
const TOPICS = ['AI', 'Geopolitics', 'Economy', 'Science', 'Politics', 'Environment', 'Defence', 'Government schemes', 'Jobs'];

export function SettingsForm() {
  const [exam, setExam] = useState('All');
  const [location, setLocation] = useState('India');
  const [topics, setTopics] = useState<string[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [explain, setExplain] = useState('standard');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d: Record<string, unknown>) => {
      if (d.exam) setExam(String(d.exam));
      if (d.location) setLocation(String(d.location));
      if (Array.isArray(d.topics)) setTopics((d.topics as string[]).map(String));
      if (d.explain_level) setExplain(String(d.explain_level));
    }).catch(() => {});
    const t = localStorage.getItem('prism-theme');
    if (t === 'light' || t === 'dark') setTheme(t);
  }, []);

  const toggleTopic = (t: string) => {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const save = async () => {
    localStorage.setItem('prism-theme', theme);
    document.documentElement.dataset.theme = theme;
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ exam, location, topics, explain_level: explain, theme }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <header className="panel">
        <div className="section-head" style={{ marginBottom: 4 }}>
          <h2><span className="sh-glyph">⚙️</span>Personalization</h2>
          {saved && <span className="sh-link" style={{ color: 'var(--green)' }}>Saved ✓</span>}
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          Preferences tune ranking and emphasis. Browsing without an account always works — this just tailors the dashboard.
        </p>
      </header>

      <section className="panel mt-3">
        <h3 style={{ margin: '0 0 10px', fontSize: 14 }}>Exam preference</h3>
        <div className="chips">
          {EXAMS.map((e) => (
            <button key={e} type="button" className={`chip${exam === e ? ' active' : ''}`} onClick={() => setExam(e)}>{e}</button>
          ))}
        </div>

        <h3 style={{ margin: '18px 0 10px', fontSize: 14 }}>Location focus</h3>
        <div className="chips">
          {LOCATIONS.map((l) => (
            <button key={l} type="button" className={`chip${location === l ? ' active' : ''}`} onClick={() => setLocation(l)}>{l}</button>
          ))}
        </div>

        <h3 style={{ margin: '18px 0 10px', fontSize: 14 }}>Topics of interest</h3>
        <div className="chips">
          {TOPICS.map((t) => (
            <button key={t} type="button" className={`chip${topics.includes(t) ? ' active' : ''}`} onClick={() => toggleTopic(t)} aria-pressed={topics.includes(t)}>{t}</button>
          ))}
        </div>

        <h3 style={{ margin: '18px 0 10px', fontSize: 14 }}>Default explanation level</h3>
        <div className="chips">
          {['quick', 'standard', 'deep'].map((l) => (
            <button key={l} type="button" className={`chip${explain === l ? ' active' : ''}`} onClick={() => setExplain(l)}>{l.toUpperCase()}</button>
          ))}
        </div>

        <h3 style={{ margin: '18px 0 10px', fontSize: 14 }}>Theme</h3>
        <div className="chips">
          {(['dark', 'light'] as const).map((t) => (
            <button key={t} type="button" className={`chip${theme === t ? ' active' : ''}`} onClick={() => { setTheme(t); localStorage.setItem('prism-theme', t); document.documentElement.dataset.theme = t; }}>
              {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          ))}
        </div>

        <button type="button" className="btn primary mt-4" onClick={save}>Save preferences</button>
      </section>
    </div>
  );
}
