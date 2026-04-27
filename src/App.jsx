import { Calendar, HeartPulse, Trophy, AlertTriangle, ClipboardList } from 'lucide-react';

const samplePlan = [
  {
    week: 'Week 1',
    focus: 'Build consistency',
    sessions: ['Easy run 30 min', 'Intervals: 6 x 1 min controlled', 'Long easy run 45 min']
  },
  {
    week: 'Week 2',
    focus: 'Add structure',
    sessions: ['Easy run 35 min', 'Tempo: 3 x 6 min', 'Long easy run 50 min']
  },
  {
    week: 'Week 3',
    focus: 'Race-specific work',
    sessions: ['Easy run 30 min', 'Intervals: 5 x 3 min', 'Long easy run 55 min']
  }
];

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MatchaRun</p>
          <h1>Adaptive running plans without the clutter.</h1>
          <p className="hero-copy">
            Enter your race date, distance, current time, age, sex, training availability and injury notes.
            MatchaRun turns that into a sensible structured plan.
          </p>
        </div>
        <div className="hero-card" aria-label="Training plan summary">
          <Trophy size={36} />
          <strong>Goal-ready plans</strong>
          <span>Built around your current fitness, target race and constraints.</span>
        </div>
      </section>

      <section className="grid">
        <form className="panel form-panel">
          <h2>Create your plan</h2>
          <label>
            Race date
            <input type="date" />
          </label>
          <label>
            Race distance
            <select defaultValue="5K">
              <option>5K</option>
              <option>10K</option>
              <option>Half marathon</option>
              <option>Marathon</option>
            </select>
          </label>
          <label>
            Current race time
            <input placeholder="e.g. 21:07 for 5K" />
          </label>
          <div className="two-cols">
            <label>
              Age
              <input type="number" placeholder="55" />
            </label>
            <label>
              Sex
              <select defaultValue="Male">
                <option>Male</option>
                <option>Female</option>
                <option>Prefer not to say</option>
              </select>
            </label>
          </div>
          <label>
            Injury or training constraints
            <textarea placeholder="e.g. hamstring tendinopathy, treadmill only, 4 days per week" />
          </label>
          <button type="button">Generate plan</button>
        </form>

        <section className="panel">
          <h2>What the coach considers</h2>
          <div className="feature"><Calendar /><span>Competition date and available weeks</span></div>
          <div className="feature"><HeartPulse /><span>Current fitness and safe progression</span></div>
          <div className="feature"><AlertTriangle /><span>Injuries, fatigue and risk flags</span></div>
          <div className="feature"><ClipboardList /><span>Structured runs: easy, tempo, intervals and long runs</span></div>
        </section>
      </section>

      <section className="panel plan-panel">
        <h2>Example plan preview</h2>
        <div className="plan-grid">
          {samplePlan.map((week) => (
            <article className="week-card" key={week.week}>
              <h3>{week.week}</h3>
              <p>{week.focus}</p>
              <ul>
                {week.sessions.map((session) => <li key={session}>{session}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
