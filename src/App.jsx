import { useEffect, useRef, useState } from 'react'
import {
  BANDS, QUESTIONS, answerText, blankAnswers, buildNotice, buildPlan, errorFor,
  exportMarkdown, groupByPhase, isTransition, noteFor, route, taskId,
} from './plan.js'

const STORE = 'project-endings:v1'

function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE))
    if (!s || typeof s !== 'object') return null
    return {
      screen: ['welcome', 'questions', 'plan'].includes(s.screen) ? s.screen : 'welcome',
      name: typeof s.name === 'string' ? s.name : '',
      a: { ...blankAnswers(), ...s.a },
      step: QUESTIONS[s.step] ? s.step : 'count',
      statuses: s.statuses && typeof s.statuses === 'object' ? s.statuses : {},
      notice: typeof s.notice === 'string' ? s.notice : null,
    }
  } catch {
    return null
  }
}

function Mark() {
  return (
    <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 20a9 9 0 0 1 18 0z" fill="currentColor" />
      <path d="M3 23.5h26M8 27h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function App() {
  const [saved] = useState(loadSaved)
  const [screen, setScreen] = useState(saved?.screen ?? 'welcome')
  const [name, setName] = useState(saved?.name ?? '')
  const [a, setA] = useState(saved?.a ?? blankAnswers())
  const [step, setStep] = useState(saved?.step ?? 'count')
  const [statuses, setStatuses] = useState(saved?.statuses ?? {})
  const [notice, setNotice] = useState(saved?.notice ?? null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [showModel, setShowModel] = useState(false)
  const headingRef = useRef(null)
  const firstRender = useRef(true)

  const r = route(a)
  const idx = Math.max(0, r.indexOf(step))
  const plan = buildPlan(a)
  const generatedNotice = buildNotice(a, name)
  const noticeText = notice ?? generatedNotice
  // "Started" means at least one question has been answered. The project name
  // doesn't count, otherwise typing it would hide the field it's typed in.
  const started = a.count !== ''

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ screen, name, a, step, statuses, notice }))
    } catch { /* storage unavailable: the tool still works, it just won't remember */ }
  }, [screen, name, a, step, statuses, notice])

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    window.scrollTo({ top: 0 })
    headingRef.current?.focus({ preventScroll: true })
  }, [screen, step])

  function update(key, value) {
    setA(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'possible') { next.candidate = ''; next.trust = '' }
      if (key === 'candidate') next.trust = ''
      if (key === 'data' && value === 'Yes' && next.band === BANDS[0]) next.band = ''
      if (key === 'maintenance' || key === 'count') next.external = false
      return next
    })
    setError('')
    setStatus('')
  }

  function toggle(key, value) {
    const q = QUESTIONS[key]
    const cur = a[key]
    let arr
    if (value === q.exclusive) arr = cur.includes(value) ? [] : [value]
    else arr = cur.includes(value) ? cur.filter(x => x !== value) : [...cur.filter(x => x !== q.exclusive), value]
    update(key, arr)
  }

  function next() {
    const e = errorFor(step, a)
    if (e) { setError(e); return }
    setError('')
    if (idx === r.length - 1) {
      const invalid = r.find(k => errorFor(k, a))
      if (invalid) { setStep(invalid); setError(errorFor(invalid, a)); return }
      setScreen('plan')
    } else setStep(r[idx + 1])
  }

  function back() {
    setError('')
    if (idx === 0) setScreen('welcome')
    else setStep(r[idx - 1])
  }

  function editAnswer(key) {
    setStep(key); setScreen('questions'); setError(''); setStatus('')
  }

  function reset() {
    try { localStorage.removeItem(STORE) } catch { /* ignore */ }
    setA(blankAnswers()); setName(''); setStep('count'); setStatuses({}); setNotice(null)
    setError(''); setStatus(''); setConfirmReset(false); setScreen('welcome')
    // The button that opened the dialog may no longer exist, so put focus somewhere sensible.
    requestAnimationFrame(() => { window.scrollTo({ top: 0 }); headingRef.current?.focus({ preventScroll: true }) })
  }

  const allTasks = plan.steps.flatMap(s => s.tasks.map(t => taskId(s, t)))
  const doneCount = allTasks.filter(id => statuses[id] === 'done').length
  const naCount = allTasks.filter(id => statuses[id] === 'na').length

  function setTask(id, value) {
    setStatuses(prev => ({ ...prev, [id]: value }))
  }

  function markdown() {
    return exportMarkdown({ a, name, plan, statuses, notice: noticeText })
  }

  function download() {
    try {
      const blob = new Blob([markdown()], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      link.href = url
      link.download = (slug ? slug + '-' : '') + 'decommissioning-plan.md'
      document.body.appendChild(link); link.click(); link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setStatus('Downloaded.')
    } catch {
      setStatus('Your browser wouldn’t download it. Try copying instead.')
    }
  }

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text)
      setStatus(what + ' copied.')
    } catch {
      setStatus('Couldn’t reach the clipboard. You can select the text and copy it by hand.')
    }
  }

  const projectName = name.trim()

  return (
    <div className="page">
      <header className="masthead">
        <button type="button" className="brand" onClick={() => { setScreen('welcome'); setConfirmReset(false) }}>
          <Mark /> <span>The Sunset</span>
        </button>
        {started && screen !== 'welcome' && (
          <button type="button" className="link" onClick={() => setConfirmReset(true)}>Start again</button>
        )}
      </header>

      {/* Real modals, so they appear wherever the button was pressed (top or bottom of the page). */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} className="confirm" labelledBy="confirm-title">
        <div className="dialog-body">
          <p id="confirm-title"><strong>Start again from the beginning?</strong></p>
          <p>Your project name, answers and ticks will be cleared from this browser. If you want to keep your plan, download it first.</p>
          <div className="row">
            <button type="button" className="btn" autoFocus onClick={() => setConfirmReset(false)}>Keep everything</button>
            <button type="button" className="btn quiet" onClick={reset}>Clear and start again</button>
          </div>
        </div>
      </Modal>

      <ModelDialog open={showModel} onClose={() => setShowModel(false)} />

      <main>
        {screen === 'welcome' && (
          <Welcome
            headingRef={headingRef}
            name={name}
            setName={setName}
            started={started}
            hasPlan={a.count !== '' && r.every(k => !errorFor(k, a))}
            onStart={() => { setScreen('questions'); setStep(started ? step : 'count') }}
            onPlan={() => setScreen('plan')}
            onReset={() => setConfirmReset(true)}
            onModel={() => setShowModel(true)}
          />
        )}

        {screen === 'questions' && (
          <form className="question" onSubmit={e => { e.preventDefault(); next() }} noValidate>
            <p className="kicker">
              Question {idx + 1} of {r.length}
              {['possible', 'candidate', 'trust'].includes(step) && <span className="aside"> · the rest depends on your answers</span>}
            </p>
            <div className="progress" aria-hidden="true"><span style={{ width: ((idx + 1) / r.length) * 100 + '%' }} /></div>

            <fieldset>
              <legend>
                <h1 ref={headingRef} tabIndex={-1}>{QUESTIONS[step].title}</h1>
              </legend>
              <p className="help">{QUESTIONS[step].help}</p>
              <Options step={step} a={a} update={update} toggle={toggle} />
            </fieldset>

            {step === 'maintenance' && a.maintenance === 'Yes' && Number(a.count) === 0 && (
              <label className="option check-inline">
                <input type="checkbox" checked={a.external} onChange={e => { setA(prev => ({ ...prev, external: e.target.checked })); setError('') }} />
                <span className="option-text"><span className="option-label">Someone outside the current team has agreed to help.</span></span>
              </label>
            )}

            {QUESTIONS[step].kind === 'multi' && a[step].includes('other') && (
              <div className="other">
                <label htmlFor="other-text">{QUESTIONS[step].otherLabel}</label>
                <input id="other-text" className="field" value={a[QUESTIONS[step].otherKey]} onChange={e => update(QUESTIONS[step].otherKey, e.target.value)} />
              </div>
            )}

            <Note note={noteFor(step, a)} />

            <div aria-live="polite">{error && <p className="error">{error}</p>}</div>

            <div className="nav">
              <button type="button" className="link" onClick={back}>← Back</button>
              <button type="submit" className="btn primary">
                {idx === r.length - 1 ? (isTransition(a) ? 'See the handover checklist' : 'See my plan') : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {screen === 'plan' && (
          <article className="plan">
            <p className="kicker">{plan.transition ? 'Your next step' : 'Your plan'}</p>
            <h1 ref={headingRef} tabIndex={-1}>
              {plan.transition
                ? <>Handing {projectName ? <em>{projectName}</em> : 'the project'} over</>
                : <>A plan for decommissioning {projectName ? <em>{projectName}</em> : 'your project'}</>}
            </h1>
            <p className="lead">
              {plan.transition
                ? 'Passing a project to someone you trust can give it a second life. Here’s what a careful handover involves.'
                : 'This is a starting point, not a contract. Tick things off, skip what doesn’t fit, and change your answers whenever you like. Not every project needs every step.'}
            </p>

            <p className="meta">
              {!plan.transition && <><span>Over {a.band.toLowerCase()}</span><span aria-hidden="true"> · </span></>}
              <span>{doneCount} of {allTasks.length - naCount} done</span>
              {naCount > 0 && <><span aria-hidden="true"> · </span><span>{naCount} set aside</span></>}
            </p>

            <div className="toolbar">
              <button type="button" className="btn primary" onClick={download}>Download as Markdown</button>
              <button type="button" className="btn" onClick={() => copy(markdown(), 'Plan')}>Copy</button>
              <button type="button" className="btn" onClick={() => window.print()}>Print</button>
              <span className="status" role="status">{status}</span>
            </div>

            {plan.notes.length > 0 && (
              <aside className="worth">
                <h2>Worth knowing before you start</h2>
                <ul>{plan.notes.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </aside>
            )}

            {groupByPhase(plan.steps).map((p, i) => (
              <section className="phase" key={p.id}>
                <header className="phase-head">
                  <span className="phase-num">{plan.transition ? '' : i + 1}</span>
                  <div>
                    <h2>{p.title}</h2>
                    <p>{p.intro}</p>
                  </div>
                </header>
                {p.steps.map(s => (
                  <div className="step" key={s.id}>
                    <h3>{s.title}</h3>
                    <p className="why">{s.why}</p>
                    <ul className="tasks">
                      {s.tasks.map(t => {
                        const id = taskId(s, t)
                        const st = statuses[id] || 'todo'
                        return (
                          <li className={'task ' + st} key={id}>
                            <label>
                              <input type="checkbox" checked={st === 'done'} disabled={st === 'na'} onChange={e => setTask(id, e.target.checked ? 'done' : 'todo')} />
                              <span>{t.text}{t.optional && <span className="tag">if you have time</span>}</span>
                            </label>
                            <button type="button" className="skip" aria-pressed={st === 'na'} onClick={() => setTask(id, st === 'na' ? 'todo' : 'na')}>
                              {st === 'na' ? 'Bring back' : 'Doesn’t apply'}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </section>
            ))}

            <section className="draft">
              <h2>A notice you can start from</h2>
              <p>
                {plan.transition
                  ? 'For the README or an announcement. Fill in the brackets and change the words until they sound like you.'
                  : 'For the top of your README, or an announcement post. Fill in the brackets and change the words until they sound like you.'}
              </p>
              <label className="sr-only" htmlFor="notice">Draft notice</label>
              <textarea id="notice" className="field notice" rows={Math.min(24, noticeText.split('\n').length + 6)} value={noticeText} onChange={e => setNotice(e.target.value)} />
              <div className="row">
                <button type="button" className="btn" onClick={() => copy(noticeText, 'Notice')}>Copy notice</button>
                {notice !== null && notice !== generatedNotice && (
                  <button type="button" className="link" onClick={() => setNotice(null)}>Go back to the original draft</button>
                )}
              </div>
            </section>

            {!plan.transition && (
              <section className="goodbye">
                <h2>Before you go</h2>
                <p><strong>You can leave the door open.</strong> Several of the teams we heard from wrote down how their project could be revived one day, and found the decision easier to live with because of it. Some take a middle path: most of the steps above, but with a way back.</p>
                <p><strong>This counts as maintenance.</strong> The time you spend decommissioning properly is time your users won’t have to spend working out what happened and where to go next.</p>
                <p><strong>It isn’t a defeat.</strong> Projects end for all kinds of reasons. The software did its job, something better came along, people’s lives changed. Decommissioning one with care is a good thing to have done.</p>
              </section>
            )}

            <details className="answers">
              <summary>What you told us</summary>
              <dl>
                {r.map(k => (
                  <div key={k}>
                    <dt>{QUESTIONS[k].title}</dt>
                    <dd>
                      <span>{answerText(k, a)}</span>
                      <button type="button" className="link" onClick={() => editAnswer(k)} aria-label={'Change answer: ' + QUESTIONS[k].title}>Change</button>
                    </dd>
                  </div>
                ))}
              </dl>
            </details>

            <p className="curious">
              Curious where these steps come from?{' '}
              <button type="button" className="link" onClick={() => setShowModel(true)}>See the diagram from our research</button>
            </p>

            <footer className="fine">
              <p>This is a guide, not legal advice. Check your own obligations, especially around user data, and your platforms’ own instructions before you switch anything off.</p>
              <p>Your answers and ticks are saved in this browser only. Nothing is sent anywhere. <button type="button" className="link" onClick={() => setConfirmReset(true)}>Clear everything</button></p>
            </footer>
          </article>
        )}
      </main>
    </div>
  )
}

function Welcome({ headingRef, name, setName, started, hasPlan, onStart, onPlan, onReset, onModel }) {
  return (
    <div className="welcome">
      <h1 ref={headingRef} tabIndex={-1}>Thinking about decommissioning your OSS project?</h1>
      <p className="lead">
        Maybe you’ve run out of time, or out of energy, or life has simply moved on. That’s allowed.
        Open-source projects end all the time, but very few of them are decommissioned on purpose, and most
        maintainers have to work out how to do it on their own.
      </p>
      <p>
        This page asks around ten questions about your project and turns your answers into a plan:
        whether someone could take it over, who to tell, what to archive, and what to leave behind
        for the people who depend on it. It’s built on conversations with people who have
        been through it.
      </p>

      <ul className="promises">
        <li><strong>It takes about five minutes.</strong> You can go back and change any answer.</li>
        <li><strong>It stays with you.</strong> There’s no account, and nothing you type is sent anywhere. Your answers are saved in this browser so you can come back later.</li>
        <li><strong>It doesn’t commit you to anything.</strong> Making a plan is a good way to find out whether decommissioning is what you want at all.</li>
      </ul>

      <div className="start">
        <label htmlFor="project-name">What’s the project called? <span className="aside">Optional, only used in your plan.</span></label>
        <input id="project-name" className="field" value={name} onChange={e => setName(e.target.value)} autoComplete="off" spellCheck="false" />

        <div className="row">
          {hasPlan ? (
            <>
              <button type="button" className="btn primary" onClick={onPlan}>Back to my plan</button>
              <button type="button" className="btn" onClick={onStart}>Review my answers</button>
              <button type="button" className="link" onClick={onReset}>Start again</button>
            </>
          ) : started ? (
            <>
              <button type="button" className="btn primary" onClick={onStart}>Carry on where I left off</button>
              <button type="button" className="link" onClick={onReset}>Start again</button>
            </>
          ) : (
            <button type="button" className="btn primary" onClick={onStart}>Let’s begin</button>
          )}
        </div>
      </div>

      <section className="about">
        <h2>Where this comes from</h2>
        <p>
          This tool is part of research into the end of life of open-source projects, by Filipe Correia,
          Alexander Serebrenik, Greg Wilson and Sebastian Baltes (Eindhoven University of Technology,
          University of Toronto and Heidelberg University).
        </p>
        <p>
          We interviewed people who had decommissioned software projects in open source, academia and
          industry, mapped out what they did and in what order, and then asked them whether the map
          matched what really happened. The idea of turning it into a planning tool came from Andrew
          Nesbitt in a follow-up conversation.
        </p>
        <p>
          <button type="button" className="link inline" onClick={onModel}>See the map we drew</button>, if
          you’re curious. It shows every step and decision, in the order maintainers took them.
        </p>
        <p>
          If you’ve decommissioned a project and your story doesn’t fit what you see here, we’d love to hear
          it: <a href="mailto:fmcorreia@acm.org">fmcorreia@acm.org</a>.
        </p>
      </section>
    </div>
  )
}

function Options({ step, a, update, toggle }) {
  const q = QUESTIONS[step]
  const multi = q.kind === 'multi'
  return (
    <div className="options">
      {q.options.map((o, i) => {
        const disabled = step === 'band' && i === 0 && a.data === 'Yes'
        const checked = multi ? a[step].includes(o.value) : a[step] === o.value
        return (
          <label key={o.value} className={'option' + (checked ? ' selected' : '') + (disabled ? ' disabled' : '') + (multi ? ' multi' : '')}>
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={step}
              value={o.value}
              checked={checked}
              disabled={disabled}
              onChange={() => (multi ? toggle(step, o.value) : update(step, o.value))}
            />
            <span className="option-text">
              <span className="option-label">{o.label}</span>
              {(o.hint || disabled) && <span className="option-hint">{disabled ? 'Too short when people need time to collect their data' : o.hint}</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}

// Native <dialog> shown as a modal: traps focus, closes on Escape, and closes
// when you click the dimmed area around it.
function Modal({ open, onClose, className, labelledBy, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </dialog>
  )
}

function ModelDialog({ open, onClose }) {
  const [zoomed, setZoomed] = useState(false)
  const close = () => { setZoomed(false); onClose() }
  return (
    <Modal open={open} onClose={close} className="model" labelledBy="model-title">
      <header className="model-head">
        <h2 id="model-title">The end of life of an open-source project</h2>
        <div className="row">
          <button type="button" className="link" onClick={() => setZoomed(z => !z)} aria-pressed={zoomed}>
            {zoomed ? 'Fit to width' : 'Zoom in'}
          </button>
          <button type="button" className="close" onClick={close} aria-label="Close the diagram">×</button>
        </div>
      </header>

      <div className="dialog-body">
        <p>
          This is the map from our research. We drew it from interviews with people who had
          decommissioned software projects, then asked them whether it matched what really happened. The
          questions on this site follow its decisions, and the steps in your plan come from its boxes.
        </p>
        <ul className="legend" aria-label="How to read the diagram">
          <li><span className="shape state" aria-hidden="true" />Where the project stands</li>
          <li><span className="shape decision" aria-hidden="true" />A decision</li>
          <li><span className="shape action" aria-hidden="true" />Something you do</li>
        </ul>
      </div>

      <figure className={'figure' + (zoomed ? ' zoomed' : '')}>
        {open && (
          <img
            src="/eol-model.png"
            width="2400"
            height="5729"
            alt="Flowchart of the end of life of an open-source project. A text version follows below."
            onClick={() => setZoomed(z => !z)}
          />
        )}
        <figcaption>
          Figure 1 in <cite>End-of-life Planning in Open-Source Software Projects</cite>.
        </figcaption>
      </figure>

      <div className="dialog-body">
        <details className="as-text">
          <summary>Read the diagram as text</summary>
          <ol>
            <li>A project that nobody maintains any more is <strong>abandoned</strong>. If its maintainers decide to stop maintaining it, its end-of-life stage begins.</li>
            <li><strong>Could someone else take it over?</strong> If someone is already likely to, the project goes through an <strong>ownership transition</strong>: access to the essential tools is passed to the new maintainers, and the project carries on. If nobody comes to mind, <strong>search for community developers</strong> (forks, active members, users) and ask again.</li>
            <li>If a transition isn’t possible, <strong>inform the community</strong>: announcements through mailing lists, social media, blog posts, or a notice in the README.</li>
            <li><strong>Are there alternatives you want to support?</strong> If so, write a <strong>migration guide</strong>, with tools where they help.</li>
            <li><strong>Are there resources to keep developing for a limited time?</strong> If so, form a <strong>temporary team</strong> to fix (security) issues, make a final release, or finish a first usable version.</li>
            <li><strong>Do you hold users’ data?</strong> If so, let people <strong>download their data</strong> for a limited time.</li>
            <li>After any waiting period, <strong>finish decommissioning</strong>: archive the code, archive or delete data, update public platforms and documentation, move or archive the platforms the project used, and mark releases on distribution platforms.</li>
            <li>The project is now <strong>decommissioned</strong>.</li>
          </ol>
        </details>
        <p className="after">
          Since drawing it, maintainers have told us a few things the map doesn’t show. Handing a
          project over isn’t always wise, even when it’s possible. A project can rest in a planned
          hibernation instead of being fully decommissioned. And open issues are worth keeping, so anyone who
          forks it later knows what was left. This site takes those into account.
        </p>
      </div>
    </Modal>
  )
}

function Note({ note }) {
  if (!note) return null
  return <p className={'note ' + note.tone}>{note.text}</p>
}
