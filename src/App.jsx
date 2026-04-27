import { useMemo, useState } from 'react';
import { Calendar, HeartPulse, Trophy, AlertTriangle, ClipboardList, Timer } from 'lucide-react';

const distanceKm = {
  '5K': 5,
  '10K': 10,
  'Half marathon': 21.0975,
  Marathon: 42.195
};

const initialForm = {
  raceDate: '',
  raceDistance: '5K',
  currentTime: '21:07',
  age: '55',
  sex: 'Male',
  runsPerWeek: '4',
  constraints: 'Hamstring tendinopathy, mostly treadmill running'
};

function parseTimeToSeconds(value) {
  const parts = value.trim().split(':').map(Number);

  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) {
    return null;
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

function formatPace(secondsPerKm) {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}/km`;
}

function weeksUntilRace(raceDate) {
  if (!raceDate) return 6;

  const today = new Date();
  const race = new Date(`${raceDate}T12:00:00`);
  const diffDays = Math.ceil((race - today) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays) || diffDays < 1) return 1;
  return Math.min(20, Math.max(1, Math.ceil(diffDays / 7)));
}

function getTrainingPaces(form) {
  const raceSeconds = parseTimeToSeconds(form.currentTime);
  const km = distanceKm[form.raceDistance];

  if (!raceSeconds || !km) return null;

  const racePace = raceSeconds / km;

  return {
    race: formatPace(racePace),
    easy: `${formatPace(racePace + 70)} to ${formatPace(racePace + 105)}`,
    steady: `${formatPace(racePace + 35)} to ${formatPace(racePace + 55)}`,
    tempo: `${formatPace(racePace + 10)} to ${formatPace(racePace + 25)}`,
    interval: `${formatPace(Math.max(180, racePace - 15))} to ${formatPace(racePace)}`
  };
}

function buildPlan(form) {
  const weeks = weeksUntilRace(form.raceDate);
  const paces = getTrainingPaces(form);
  const runs = Number(form.runsPerWeek) || 3;
  const hasInjury = form.constraints.toLowerCase().match(/injury|tendon|hamstring|pain|niggle|achilles|knee|calf/);
  const planLength = Math.min(weeks, 8);

  const plan = Array.from({ length: planLength }, (_, index) => {
    const week = index + 1;
    const isRecovery = week % 4 === 0;
    const isRaceWeek = week === planLength;
    const qualityLoad = hasInjury ? 'controlled' : 'progressive';

    const sessions = [
      `Easy run: ${isRecovery ? '25 to 35' : '30 to 45'} minutes at ${paces?.easy || 'comfortable pace'}`,
      isRaceWeek
        ? `Sharpening: 4 x 2 minutes near ${paces?.interval || 'race effort'} with full easy recoveries`
        : `Quality: ${week <= 2 ? '6 x 1 minute' : '4 to 6 x 3 minutes'} at ${paces?.interval || 'controlled hard effort'} (${qualityLoad})`,
      `Long run: ${isRecovery ? '40 to 50' : 45 + week * 5} minutes easy, keep it conversational`
    ];

    if (runs >= 4) {
      sessions.splice(2, 0, isRaceWeek
        ? `Short easy run: 20 to 30 minutes plus 4 relaxed strides`
        : `Steady or tempo: ${week <= 2 ? '2 x 8 minutes' : '3 x 8 minutes'} at ${paces?.tempo || 'comfortably hard effort'}`);
    }

    if (runs >= 5) {
      sessions.push('Optional recovery jog: 20 to 30 minutes very easy, skip if tired or sore');
    }

    return {
      week: `Week ${week}`,
      focus: isRaceWeek ? 'Freshen up and race' : isRecovery ? 'Absorb the work' : week <= 2 ? 'Build consistency' : 'Develop race-specific fitness',
      sessions
    };
  });

  return { plan, paces, weeks, hasInjury };
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(() => buildPlan(initialForm));

  const summary = useMemo(() => {
    const distance = form.raceDistance;
    const weeks = weeksUntilRace(form.raceDate);
    return `${weeks}-week ${distance} outline based on ${form.runsPerWeek} runs per week.`;
  }, [form]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setResult(buildPlan(form));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">MatchaRun</p>
          <h1>Adaptive running plans without the clutter.</h1>
          <p className="hero-copy">
            Enter your race date, distance, current time, age, sex, training availability and injury notes.
            MatchaRun creates a sensible starter plan in your browser.
          </p>
        </div>
        <div className="hero-card" aria-label="Training plan summary">
          <Trophy size={36} />
          <strong>{summary}</strong>
          <span>Static-site friendly: no account, no backend and no binary assets required.</span>
        </div>
      </section>

      <section className="grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h2>Create your plan</h2>
          <label>
            Race date
            <input name="raceDate" type="date" value={form.raceDate} onChange={updateField} />
          </label>
          <label>
            Race distance
            <select name="raceDistance" value={form.raceDistance} onChange={updateField}>
              <option>5K</option>
              <option>10K</option>
              <option>Half marathon</option>
              <option>Marathon</option>
            </select>
          </label>
          <label>
            Current race time
            <input name="currentTime" value={form.currentTime} onChange={updateField} placeholder="e.g. 21:07 for 5K" />
          </label>
          <div className="two-cols">
            <label>
              Age
              <input name="age" type="number" min="12" max="100" value={form.age} onChange={updateField} />
            </label>
            <label>
              Sex
              <select name="sex" value={form.sex} onChange={updateField}>
                <option>Male</option>
                <option>Female</option>
                <option>Prefer not to say</option>
              </select>
            </label>
          </div>
          <label>
            Runs per week
            <select name="runsPerWeek" value={form.runsPerWeek} onChange={updateField}>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
            </select>
          </label>
          <label>
            Injury or training constraints
            <textarea name="constraints" value={form.constraints} onChange={updateField} placeholder="e.g. hamstring tendinopathy, treadmill only, 4 days per week" />
          </label>
          <button type="submit">Generate plan</button>
        </form>

        <section className="panel">
          <h2>Training guidance</h2>
          <div className="feature"><Calendar /><span>{result.weeks} weeks available before race day</span></div>
          <div className="feature"><Timer /><span>Current race pace: {result.paces?.race || 'enter a valid time'}</span></div>
          <div className="feature"><HeartPulse /><span>Easy pace: {result.paces?.easy || 'enter a valid time'}</span></div>
          <div className="feature"><AlertTriangle /><span>{result.hasInjury ? 'Injury notes detected: plan keeps quality controlled' : 'No injury trigger detected: normal progression used'}</span></div>
          <div className="feature"><ClipboardList /><span>Includes easy, quality, tempo and long-run structure</span></div>
        </section>
      </section>

      <section className="panel plan-panel">
        <h2>Your generated plan</h2>
        <p className="plan-note">
          This is a conservative coaching outline, not medical advice. Reduce load if pain increases, fatigue accumulates or recovery suffers.
        </p>
        <div className="pace-grid" aria-label="Training pace guide">
          <span><strong>Steady</strong>{result.paces?.steady || '—'}</span>
          <span><strong>Tempo</strong>{result.paces?.tempo || '—'}</span>
          <span><strong>Intervals</strong>{result.paces?.interval || '—'}</span>
        </div>
        <div className="plan-grid">
          {result.plan.map((week) => (
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
