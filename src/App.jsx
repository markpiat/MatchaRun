import { useMemo, useState } from 'react';
import { Calendar, HeartPulse, Trophy, AlertTriangle, ClipboardList, Timer, TrendingUp } from 'lucide-react';

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
  targetTime: '20:30',
  age: '55',
  sex: 'Male',
  runsPerWeek: '4',
  currentWeeklyKm: '28',
  longestRunMinutes: '65',
  preferredSurface: 'Mostly treadmill',
  constraints: 'Hamstring tendinopathy, mostly treadmill running'
};

function parseTimeToSeconds(value) {
  if (!value.trim()) return null;
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
  const safeSeconds = Math.max(150, secondsPerKm);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = Math.round(safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}/km`;
}

function formatTime(totalSeconds) {
  if (!totalSeconds) return '—';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60).toString().padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

function weeksUntilRace(raceDate) {
  if (!raceDate) return 8;

  const today = new Date();
  const race = new Date(`${raceDate}T12:00:00`);
  const diffDays = Math.ceil((race - today) / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays) || diffDays < 1) return 1;
  return Math.min(24, Math.max(1, Math.ceil(diffDays / 7)));
}

function classifyRisk(form) {
  const text = `${form.constraints} ${form.preferredSurface}`.toLowerCase();
  const age = Number(form.age) || 35;
  const currentWeeklyKm = Number(form.currentWeeklyKm) || 0;
  let score = 0;
  const reasons = [];

  if (/injury|tendon|hamstring|pain|niggle|achilles|knee|calf|plantar|shin/.test(text)) {
    score += 3;
    reasons.push('injury or pain-related constraint');
  }

  if (/treadmill/.test(text)) {
    score += 1;
    reasons.push('mostly treadmill running');
  }

  if (age >= 50) {
    score += 1;
    reasons.push('masters runner recovery needs');
  }

  if (currentWeeklyKm > 0 && currentWeeklyKm < 20) {
    score += 1;
    reasons.push('lower current weekly volume');
  }

  if (score >= 4) return { level: 'High caution', score, reasons };
  if (score >= 2) return { level: 'Moderate caution', score, reasons };
  return { level: 'Normal', score, reasons: reasons.length ? reasons : ['no major risk flags entered'] };
}

function getTrainingPaces(form) {
  const currentSeconds = parseTimeToSeconds(form.currentTime);
  const targetSeconds = parseTimeToSeconds(form.targetTime);
  const km = distanceKm[form.raceDistance];

  if (!currentSeconds || !km) return null;

  const currentPace = currentSeconds / km;
  const targetPace = targetSeconds ? targetSeconds / km : null;
  const workingPace = targetPace && targetPace > currentPace - 30 ? (currentPace * 0.65 + targetPace * 0.35) : currentPace;

  return {
    currentRace: formatPace(currentPace),
    targetRace: targetPace ? formatPace(targetPace) : 'not set',
    easy: `${formatPace(workingPace + 70)} to ${formatPace(workingPace + 110)}`,
    steady: `${formatPace(workingPace + 35)} to ${formatPace(workingPace + 60)}`,
    tempo: `${formatPace(workingPace + 8)} to ${formatPace(workingPace + 25)}`,
    threshold: `${formatPace(workingPace)} to ${formatPace(workingPace + 15)}`,
    interval: `${formatPace(workingPace - 20)} to ${formatPace(workingPace - 5)}`,
    currentTime: formatTime(currentSeconds),
    targetTime: targetSeconds ? formatTime(targetSeconds) : 'not set'
  };
}

function getPhase(week, totalWeeks) {
  const ratio = week / totalWeeks;
  if (week === totalWeeks) return 'Race week';
  if (ratio <= 0.35) return 'Base';
  if (ratio <= 0.7) return 'Build';
  return 'Sharpen';
}

function getDistanceWorkout(distance, phase, week, paces, risk) {
  const cautious = risk.level !== 'Normal';
  const controlled = cautious ? 'controlled, stop if pain rises above 3/10' : 'controlled but purposeful';

  if (phase === 'Race week') {
    return `Sharpening: 4 x 2 minutes at ${paces?.interval || 'race effort'} with full easy recoveries`;
  }

  if (distance === '5K') {
    if (phase === 'Base') return `Neuromuscular speed: 8 x 45 seconds relaxed-fast at ${paces?.interval || '5K effort'}, 75 seconds easy jog (${controlled})`;
    if (phase === 'Build') return `5K strength: ${cautious ? '4' : '5'} x 3 minutes at ${paces?.interval || '5K effort'}, 2 minutes easy jog`;
    return `Race-specific: 3 x 5 minutes around ${paces?.threshold || 'threshold effort'}, then 4 x 30 seconds fast-relaxed`;
  }

  if (distance === '10K') {
    if (phase === 'Base') return `Aerobic intervals: 5 x 3 minutes at ${paces?.threshold || 'threshold effort'}, 90 seconds easy`;
    if (phase === 'Build') return `10K session: ${cautious ? '3' : '4'} x 6 minutes at ${paces?.tempo || 'tempo effort'}, 2 minutes easy`;
    return `Race-specific: 2 x 10 minutes at ${paces?.threshold || 'threshold effort'} plus 4 relaxed strides`;
  }

  if (distance === 'Half marathon') {
    if (phase === 'Base') return `Steady aerobic block: 2 x 12 minutes at ${paces?.steady || 'steady effort'}, 4 minutes easy`;
    if (phase === 'Build') return `Half-marathon tempo: ${cautious ? '2' : '3'} x 10 minutes at ${paces?.tempo || 'tempo effort'}, 3 minutes easy`;
    return `Race-specific: 25 to 35 minutes continuous at ${paces?.steady || 'steady effort'}`;
  }

  if (phase === 'Base') return `Marathon aerobic block: 2 x 15 minutes at ${paces?.steady || 'steady effort'}, 5 minutes easy`;
  if (phase === 'Build') return `Marathon endurance: 3 x 15 minutes at ${paces?.steady || 'steady effort'}, 5 minutes easy`;
  return `Race-specific: 35 to 45 minutes steady inside the long run`;
}

function getLongRunMinutes(form, week, totalWeeks, phase, risk) {
  const base = Number(form.longestRunMinutes) || 50;
  const distance = form.raceDistance;
  const cautious = risk.level === 'High caution';
  const recoveryWeek = week % 4 === 0;
  const taper = phase === 'Race week';
  const maxByDistance = {
    '5K': 85,
    '10K': 100,
    'Half marathon': 130,
    Marathon: 180
  }[distance];

  if (taper) return Math.max(25, Math.round(base * 0.45));
  if (recoveryWeek) return Math.max(35, Math.round(base * 0.8));

  const step = cautious ? 4 : 7;
  return Math.min(maxByDistance, base + week * step);
}

function getWeeklyKm(form, week, phase, risk) {
  const current = Number(form.currentWeeklyKm) || 20;
  const cautious = risk.level !== 'Normal';
  const growth = cautious ? 0.05 : 0.08;
  const recoveryWeek = week % 4 === 0;
  const taper = phase === 'Race week';

  if (taper) return Math.max(10, Math.round(current * 0.55));
  if (recoveryWeek) return Math.round(current * 0.85);
  return Math.round(current * (1 + growth * Math.min(week, 5)));
}

function buildPlan(form) {
  const weeks = weeksUntilRace(form.raceDate);
  const paces = getTrainingPaces(form);
  const runs = Number(form.runsPerWeek) || 3;
  const risk = classifyRisk(form);
  const planLength = Math.min(weeks, 12);
  const distance = form.raceDistance;

  const plan = Array.from({ length: planLength }, (_, index) => {
    const week = index + 1;
    const phase = getPhase(week, planLength);
    const recoveryWeek = week % 4 === 0 && phase !== 'Race week';
    const longRun = getLongRunMinutes(form, week, planLength, phase, risk);
    const weeklyKm = getWeeklyKm(form, week, phase, risk);
    const sessions = [];

    sessions.push(`Easy aerobic run: ${recoveryWeek ? '25 to 35' : '30 to 45'} minutes at ${paces?.easy || 'comfortable conversational pace'}`);

    if (runs >= 3) {
      sessions.push(recoveryWeek
        ? `Recovery quality: 6 x 20 seconds relaxed strides, full easy recovery`
        : getDistanceWorkout(distance, phase, week, paces, risk));
    }

    if (runs >= 4) {
      sessions.push(phase === 'Race week'
        ? `Pre-race easy run: 20 to 30 minutes with 4 relaxed strides`
        : `Support run: ${phase === 'Base' ? 'steady technique run' : 'tempo support'} — ${phase === 'Base' ? '35 to 45 minutes easy plus drills' : `2 x 8 minutes at ${paces?.tempo || 'tempo effort'}`}`);
    }

    if (runs >= 5) {
      sessions.push('Recovery jog: 20 to 35 minutes very easy, skip if tired or sore');
    }

    if (runs >= 6) {
      sessions.push('Optional short aerobic run: 25 to 40 minutes easy, only if recovery is good');
    }

    sessions.push(`Long run: ${longRun} minutes easy${distance === 'Marathon' && phase === 'Build' ? ', practise fuelling' : ''}`);

    const strength = risk.level === 'High caution'
      ? 'Strength: 2 short rehab/prehab sessions, avoid heavy loading if symptoms flare'
      : 'Strength: 2 short sessions covering calves, glutes, hamstrings, core and single-leg control';

    return {
      week: `Week ${week}`,
      phase,
      focus: recoveryWeek ? 'Absorb the work' : phase === 'Race week' ? 'Freshen up and race' : phase === 'Base' ? 'Build durability' : phase === 'Build' ? 'Raise threshold and endurance' : 'Sharpen race readiness',
      weeklyKm,
      strength,
      sessions
    };
  });

  const recommendations = [
    `${risk.level} risk profile: ${risk.reasons.join(', ')}.`,
    risk.level === 'High caution'
      ? 'Keep intensity capped and prioritise consistency over hero sessions.'
      : 'Progress only when easy runs feel controlled and recovery is stable.',
    'Use the paces as ranges, not strict targets. Effort and pain response override pace.',
    distance === 'Marathon' || distance === 'Half marathon'
      ? 'Long-run fuelling and hydration practice should be part of the plan.'
      : 'For shorter races, relaxed strides help leg speed without adding much fatigue.'
  ];

  return { plan, paces, weeks, risk, recommendations };
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
            Enter your race details, current fitness and constraints. MatchaRun uses rules-based coaching logic to create a safer, more useful starter plan in your browser.
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
          <div className="two-cols">
            <label>
              Current race time
              <input name="currentTime" value={form.currentTime} onChange={updateField} placeholder="e.g. 21:07" />
            </label>
            <label>
              Target race time
              <input name="targetTime" value={form.targetTime} onChange={updateField} placeholder="e.g. 20:30" />
            </label>
          </div>
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
          <div className="two-cols">
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
              Current weekly km
              <input name="currentWeeklyKm" type="number" min="0" value={form.currentWeeklyKm} onChange={updateField} />
            </label>
          </div>
          <label>
            Longest recent run, minutes
            <input name="longestRunMinutes" type="number" min="0" value={form.longestRunMinutes} onChange={updateField} />
          </label>
          <label>
            Preferred surface
            <input name="preferredSurface" value={form.preferredSurface} onChange={updateField} placeholder="e.g. road, trail, mostly treadmill" />
          </label>
          <label>
            Injury or training constraints
            <textarea name="constraints" value={form.constraints} onChange={updateField} placeholder="e.g. hamstring tendinopathy, treadmill only, 4 days per week" />
          </label>
          <button type="submit">Generate smarter plan</button>
        </form>

        <section className="panel">
          <h2>Training guidance</h2>
          <div className="feature"><Calendar /><span>{result.weeks} weeks available before race day</span></div>
          <div className="feature"><Timer /><span>Current pace: {result.paces?.currentRace || 'enter a valid time'}</span></div>
          <div className="feature"><TrendingUp /><span>Target pace: {result.paces?.targetRace || 'optional'}</span></div>
          <div className="feature"><HeartPulse /><span>Easy pace: {result.paces?.easy || 'enter a valid time'}</span></div>
          <div className="feature"><AlertTriangle /><span>Risk profile: {result.risk.level}</span></div>
          <div className="feature"><ClipboardList /><span>Phased plan: base, build, sharpen and race week</span></div>
        </section>
      </section>

      <section className="panel recommendation-panel">
        <h2>Coach notes</h2>
        <ul>
          {result.recommendations.map((note) => <li key={note}>{note}</li>)}
        </ul>
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
              <div className="week-meta">
                <span>{week.phase}</span>
                <span>~{week.weeklyKm} km</span>
              </div>
              <h3>{week.week}</h3>
              <p>{week.focus}</p>
              <ul>
                {week.sessions.map((session) => <li key={session}>{session}</li>)}
              </ul>
              <p className="strength-note">{week.strength}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
