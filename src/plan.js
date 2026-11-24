// Questions, routing and plan generation.
// The structure follows the end-of-life model from the research (Fig. 1):
// ownership transition first, then the decommissioning actions grouped into phases.

export const BANDS = [
  'Less than a week',
  'A few weeks',
  'One to three months',
  'Several months, up to a year',
  'More than a year',
]

export const QUESTIONS = {
  count: {
    title: 'How many people are looking after the project right now?',
    help: 'Only count the people actively maintaining it today, not everyone who has ever sent a patch. If it’s just you, you’re far from alone. That’s very common in open source.',
    kind: 'single',
    options: [
      { value: '1', label: 'Just me' },
      { value: '2', label: 'Two or three of us' },
      { value: '4', label: 'A bigger team' },
      { value: '0', label: 'Nobody, really', hint: 'The project has drifted and no one is looking after it at the moment.' },
    ],
  },
  possible: {
    title: 'Would you be open to someone else taking it over?',
    help: 'Both answers are fine. Handing a project on isn’t always the responsible choice. If the new maintainer turns out to be the wrong person, it’s your users who carry the risk.',
    kind: 'single',
    options: [
      { value: 'Yes', label: 'Yes, if the right person came along' },
      { value: 'No', label: 'No, I’d rather decommission it' },
    ],
  },
  candidate: {
    title: 'Is there anyone who might want it?',
    help: 'Think of past contributors, people who maintain a fork, or users who depend on it heavily. They don’t need to have said yes yet.',
    kind: 'single',
    options: [
      { value: 'Yes', label: 'Someone comes to mind' },
      { value: 'No', label: 'Nobody I can think of' },
    ],
  },
  trust: {
    title: 'Would you trust them with it?',
    help: 'With your users, your release process, and your name on the project. Go with your instinct.',
    kind: 'single',
    options: [
      { value: 'Yes', label: 'Yes, I would' },
      { value: 'No', label: 'No' },
      { value: 'Unsure', label: 'I’m not sure' },
    ],
  },
  data: {
    title: 'Does the project hold any information about its users?',
    help: 'Accounts, data kept in a hosted service, a mailing list or a newsletter. A list of email addresses counts too.',
    kind: 'single',
    options: [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' },
    ],
  },
  band: {
    title: 'How long would you like decommissioning to take?',
    help: 'This is calendar time, from the first announcement to switching the last thing off, not hours of work. In the projects we heard about, decommissioning took anywhere from a few days to two years.',
    kind: 'single',
    options: BANDS.map(b => ({ value: b, label: b })),
  },
  maintenance: {
    title: 'Will anyone be around to fix things in the meantime?',
    help: 'Things like security fixes, a last release, or answering the odd question. Only count time people have actually offered.',
    kind: 'single',
    options: [
      { value: 'Yes', label: 'Yes, someone can help' },
      { value: 'No', label: 'No, maintenance stops now' },
    ],
  },
  alternative: {
    title: 'Is there another project your users could move to?',
    help: 'Something that does a similar job. If you haven’t looked into it properly, “not sure” is a perfectly good answer.',
    kind: 'single',
    options: [
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No, nothing really comes close' },
      { value: 'Unsure', label: 'Not sure' },
    ],
  },
  channels: {
    title: 'Where do you usually talk to your users?',
    help: 'Pick as many as apply. We’ll use them to plan how you share the news.',
    kind: 'multi',
    exclusive: 'none',
    otherKey: 'channelOther',
    otherLabel: 'Where else do you talk to them?',
    options: [
      { value: 'mail', label: 'A mailing list or newsletter' },
      { value: 'repo', label: 'Issues or discussions on the repository' },
      { value: 'web', label: 'A website or blog' },
      { value: 'chat', label: 'A chat server or forum' },
      { value: 'social', label: 'Social media' },
      { value: 'inapp', label: 'Notices inside the software itself' },
      { value: 'other', label: 'Somewhere else' },
      { value: 'none', label: 'We don’t really have a channel' },
    ],
  },
  platforms: {
    title: 'Where does the project live?',
    help: 'Pick everything it uses. Each one needs tidying up in its own way.',
    kind: 'multi',
    exclusive: 'none',
    otherKey: 'platformOther',
    otherLabel: 'What else does it use?',
    options: [
      { value: 'forge', label: 'Code hosting', hint: 'GitHub, GitLab, Codeberg and the like' },
      { value: 'registry', label: 'A package registry or app store', hint: 'npm, PyPI, crates.io, an app store…' },
      { value: 'docs', label: 'A documentation site' },
      { value: 'ci', label: 'CI or release automation' },
      { value: 'service', label: 'A hosted service, database or storage' },
      { value: 'domain', label: 'Its own domain or website' },
      { value: 'community', label: 'A forum, chat or mailing-list provider' },
      { value: 'other', label: 'Something else' },
      { value: 'none', label: 'None of these' },
    ],
  },
}

export const PHASES = {
  handover: { title: 'Handing over', intro: 'Passing the project on, safely.' },
  prepare: { title: 'Getting ready', intro: 'Things to sort out before you tell anyone.' },
  share: { title: 'Telling people and helping them move', intro: 'Most of the care in decommissioning goes here.' },
  close: { title: 'Archiving and keeping what matters', intro: 'The last steps of decommissioning. Archive the code at the very end.' },
}

export function blankAnswers() {
  return {
    count: '', possible: '', candidate: '', trust: '', data: '', band: '', maintenance: '',
    external: false, alternative: '', channels: [], platforms: [], channelOther: '', platformOther: '',
  }
}

export const isTransition = a => a.possible === 'Yes' && a.candidate === 'Yes' && a.trust === 'Yes'

export function route(a) {
  const r = ['count', 'possible']
  if (a.possible === 'Yes') {
    r.push('candidate')
    if (a.candidate === 'Yes') r.push('trust')
  }
  if (isTransition(a)) return r
  return [...r, 'data', 'band', 'maintenance', 'alternative', 'channels', 'platforms']
}

export function errorFor(key, a) {
  const q = QUESTIONS[key]
  if (q.kind === 'single' && !a[key]) return 'Pick an answer to carry on.'
  if (key === 'band' && a.data === 'Yes' && a.band === BANDS[0]) return 'With user data involved, a week is too short. Please pick a longer period.'
  if (key === 'maintenance' && Number(a.count) === 0 && a.maintenance === 'Yes' && !a.external)
    return 'Since nobody is looking after the project right now, tick the box to confirm that someone new has agreed to help, or change your answer.'
  if (q.kind === 'multi') {
    if (!a[key].length) return 'Pick at least one. If nothing fits, choose the last option.'
    if (a[key].includes('other') && !a[q.otherKey].trim()) return 'Add a few words about the other one, so it can go in your plan.'
  }
  return ''
}

// A short, gentle note that appears under a question once it's answered.
export function noteFor(key, a) {
  if (key === 'count' && a.count === '0')
    return { tone: 'care', text: 'That happens more often than people admit. Someone who still has access to the repository and accounts will need to take the decommissioning steps, so it’s worth working out who that is first.' }
  if (key === 'candidate' && a.candidate === 'No')
    return { tone: 'calm', text: 'We’ll add a short search for a new maintainer to your plan. You can start decommissioning at the same time, and if someone turns up you can come back and change this.' }
  if (key === 'trust' && a.trust === 'Yes')
    return { tone: 'calm', text: 'Then your next step is handing the project over, not decommissioning it. We’ll give you a checklist for passing the project on safely.' }
  if (key === 'trust' && (a.trust === 'No' || a.trust === 'Unsure'))
    return { tone: 'calm', text: 'That’s a sensible call, and it’s wiser not to hand over access. We’ll plan a careful decommissioning instead. You can revisit this if someone else comes along.' }
  if (key === 'band' && a.data === 'Yes')
    return { tone: 'care', text: 'Because people have data with you, give them time to collect it. Depending on where you and your users are, the law may expect more time than these options suggest.' }
  if (key === 'maintenance' && a.maintenance === 'No' && a.data === 'Yes')
    return { tone: 'care', text: 'That’s fine for the code, but someone still needs to keep the data and any live service safe until it’s switched off. Looking after a server isn’t the same as maintaining code, so it could be a different person.' }
  if (key === 'maintenance' && a.maintenance === 'No')
    return { tone: 'calm', text: 'That’s okay. We’ll make sure your announcement says so clearly, so nobody waits for fixes that won’t come.' }
  return null
}

export function answerText(key, a) {
  const q = QUESTIONS[key]
  const label = v => {
    if (v === 'other') return 'Something else: ' + a[q.otherKey].trim()
    return q.options.find(o => o.value === v)?.label ?? v
  }
  if (q.kind === 'multi') return a[key].map(label).join(', ')
  return label(a[key])
}

const task = (text, optional = false) => ({ text, optional })
const step = (id, phase, title, why, tasks) => ({ id, phase, title, why, tasks: tasks.filter(Boolean) })

export function buildPlan(a) {
  const count = Number(a.count)

  if (isTransition(a)) {
    const notes = []
    if (count === 0) notes.push('Work out who has the authority and the access to hand the project over. Nothing below can happen without them.')
    notes.push('Trusting someone isn’t the same as them having agreed. Make sure they’ve said yes, and check that the handover works before you step away.')
    return {
      transition: true,
      notes,
      steps: [step('handover', 'handover', 'Hand the project over', 'You’ve found someone you trust. Now make sure the handover really works.', [
        task('Check that they’ve really said yes, and that you have the right to hand the project over (for example, if a company or foundation is involved).'),
        task('Agree on what’s being handed over, a date, and anything you’ll keep looking after for a while.'),
        task('Write down how things work: where the code, releases, infrastructure and accounts live, and what’s still in progress.'),
        task('Give them access to the repository, package registries, domains and anything else they’ll need.'),
        task('Replace personal credentials and rotate shared secrets. Then check that they can build and publish a release without you.'),
        task('If there’s user data or a hosted service, decide carefully whether and how that responsibility moves before giving access to it.'),
        task('Announce the new maintainer, and how to reach them, through the channels you already use.'),
        task('Once everything works, remove the access you no longer need.'),
      ])],
    }
  }

  const bandIdx = BANDS.indexOf(a.band)
  const long = bandIdx >= 2
  const shortest = bandIdx === 0
  const data = a.data === 'Yes'
  const maint = a.maintenance === 'Yes'
  const alt = a.alternative === 'Yes'
  const ch = v => a.channels.includes(v)
  const has = v => a.platforms.includes(v)

  const notes = []
  if (count === 0) notes.push('Work out who still has access to the repository, the registry and the accounts. They’re the person who can take these steps.')
  if (a.possible === 'Yes' && a.candidate === 'Yes' && a.trust !== 'Yes')
    notes.push('Don’t give the person you had in mind access or credentials. If someone else you trust appears later, a handover is still possible.')
  if (!maint) notes.push('Say clearly that there will be no more fixes. A long decommissioning period doesn’t mean anyone is supporting the project while it happens.')
  if (data) notes.push('People need time to get their data back, and you may have legal duties about how long you keep it or how you delete it. Keeping data read-only isn’t automatically safe or lawful, so check what applies to you.')
  if (data && !maint) notes.push('Decide who will keep the data and any live service safe until it’s switched off. If nobody can, it’s better to change the plan than to leave a server running unattended.')
  if (count > 1) notes.push('Agree among yourselves who does what, so nothing is missed or done twice.')
  if (count === 1) notes.push('Keep it small. The essential steps matter far more than the optional ones, so don’t let the extras hold you up.')

  const steps = []

  if (a.possible === 'Yes' && a.candidate === 'No') steps.push(step('search', 'prepare', 'Look for a new maintainer', 'You’re open to handing it on, but nobody obvious has come forward yet.', [
    task('Ask past contributors, people who maintain forks, and users who depend on the project whether they’d like to take it on.'),
    task('Give the search a deadline, and keep preparing the decommissioning in the meantime.'),
    task('If someone steps forward, come back and change your answers. Think about trust before you give anyone access.'),
  ]))

  if (maint) steps.push(step('team', 'prepare', 'Keep a small team on for a while', 'Someone can still fix things, so make good use of that time.', [
    task('Agree who’s on the temporary team, what they’ll cover, how people can reach them, and when it stops.'),
    task('Deal with the issues that matter most, security first, within the time people actually have.'),
    shortest ? task('Keep it tight. A week isn’t long enough for a big final release.') : task('Publish a final release, if it would be useful and can be done safely.', true),
    task('If the project never quite reached a usable first version, consider finishing that, but only if it’s realistic.', true),
  ]))

  steps.push(step('inform', 'share', 'Tell the people who use it', 'The earlier people know, the more time they have to plan.', [
    task('Announce the decision: why, when, what changes, and what people need to do. Be clear about the difference between the code no longer being maintained and any service being switched off.'),
    maint ? task('Say who’s on the temporary team, what they’ll cover, how to reach them, and when that ends.') : task('Say plainly that there will be no more fixes or releases.'),
    data && task('Give the deadline for downloading data, well before anything is switched off or deleted.'),
    alt ? task('Point people to the migration guide and explain the key dates.') : task('Be honest that you don’t know of a direct replacement.'),
    ch('none') && task('Since you don’t have a regular channel, put the news where people will find it: the README, the docs, the package page, the website. You won’t reach everyone, and that’s okay.'),
    ch('mail') && task('Email your mailing list or newsletter. Remember that the subscriber list is user data too.'),
    ch('repo') && task('Post it on the repository, pin it if you can, and link to a page that will stay up.'),
    ch('web') && task('Write a post on the website or blog that will stay online after the project is decommissioned.'),
    ch('chat') && task('Post and pin it in your chat or forum, with reminders as the dates get closer.'),
    ch('social') && task('Share a short note on social media that links to the full announcement.'),
    ch('inapp') && task('Show a notice inside the software if you can, especially if a service is being switched off or data needs collecting.'),
    ch('other') && task('Share it through ' + a.channelOther.trim() + '.'),
    long ? task('Spread it out: a first announcement, reminders before each deadline, and updates as you go.') : task('Announce it soon, and send a reminder before each deadline.'),
  ]))

  if (alt) steps.push(step('migrate', 'share', 'Help people move to something else', 'There’s an alternative, so make the switch as easy as you can.', [
    task('Name the alternative and be honest about how it differs: what’s similar, what’s missing, and what works differently.'),
    shortest ? task('Write a short, practical guide using what you already know.') : task('Write down the actual steps to switch, including configuration and moving data where that applies.'),
    long && task('Add worked examples for the most common setups.'),
    long && maint
      ? task('Write or suggest a migration tool or script, if it would really help and someone can build it properly.', true)
      : task('Point to an existing migration tool if there is one. Don’t promise new tooling you won’t have time to build.', true),
  ]))

  if (data) steps.push(step('download', 'share', 'Let people take their data with them', 'People trusted you with their data. Give them a fair chance to get it back.', [
    task('Work out what people might want to keep, and how they could get it.'),
    task('Offer a secure way to download or access it for a limited time. Not every kind of data needs an export. A mailing-list subscription doesn’t, for example.'),
    task('Publish the deadline, and announce it well before anything is deleted or switched off.'),
    task('Try the download yourself, and make sure it stays secure for as long as it’s open.'),
  ]))

  steps.push(step('notices', 'share', 'Put up notices where people will see them', 'Most people will find out from the project’s pages, not from the announcement.', [
    task('Add a clear notice about the project’s status to its public pages, and keep it up to date as things progress.'),
    has('forge') && task('Put a notice at the very top of the README. There’s a draft further down you can adapt.'),
    has('domain') && task('Add a notice to the website that will stay up after everything else is gone.'),
    has('docs') && task('Add a visible notice to the documentation.'),
  ]))

  if (has('registry') || has('forge')) steps.push(step('distribution', 'share', 'Mark the releases', 'Many users only ever see the package page or a warning from their dependency tools.', [
    has('registry') && task('Use your registry’s deprecation flag or warning, and link to the announcement.'),
    has('forge') && task('Mark the latest release as the final one, and link to the announcement.'),
    task('Think carefully before removing anything. Deleting old releases can break projects that still depend on them.'),
  ]))

  steps.push(step('record', 'close', 'Write down what happened', 'Leave notes for whoever comes next: a future user, someone with a fork, or you in five years.', [
    task('Write a short account of how the project was decommissioned: the dates, the reasons behind the big decisions, what’s still unsolved, and what stays available.'),
    task('Include what someone would need to know to fork it or pick it up again.'),
    alt ? task('Link to the migration guide.') : task('Note that there’s no known replacement, and what the risks are of carrying on using it without support.'),
    !maint && task('Note that the project wasn’t maintained while it was being decommissioned.'),
    data && task('Record the data deadlines and what happened to the data, without including anyone’s personal details.'),
  ]))

  if (data) steps.push(step('data', 'close', 'Decide what happens to the data', 'Deleting data and keeping it are both decisions, and both should be made on purpose.', [
    task('List all the user data you hold, including copies, backups, and anything stored with other providers.'),
    task('Decide what to delete, and what (if anything) you have a real reason to keep.'),
    task('Wait until the download window has closed, and any obligations to keep data are met, before deleting anything.'),
    task('Delete what shouldn’t be kept, backups included. Anything you keep should be locked down, read-only, and have a date when it goes.'),
    task('Keep personal data separate from the public code archive. Read-only isn’t automatically safe or lawful.'),
  ]))

  steps.push(step('infra', 'close', 'Close or move what it runs on', 'Some services cost money or won’t last. Decide what stays, what moves, and what gets switched off.', [
    task('List everything the project uses, and check whether each one can sensibly stay as it is for the long term.'),
    task('Move anything worth keeping somewhere more lasting, and close what shouldn’t keep running.'),
    has('docs') && task('Consider turning the documentation into a static site that’s cheap and easy to keep online.'),
    has('ci') && task('Turn off workflows you don’t need, and revoke old automation tokens and secrets.'),
    has('service') && task('Plan how to switch off the service and its infrastructure, in step with the decisions about data.'),
    has('domain') && task('Decide what happens to the domain. If it lapses, someone else could buy it and put anything at that address.'),
    has('community') && task('Keep the useful public history of your forum, chat or mailing list, then close or lock it.'),
    has('other') && task('Work out what to keep, move or switch off for ' + a.platformOther.trim() + '.'),
    task('Check each provider’s own instructions before you change anything.'),
  ]))

  steps.push(step('archive', 'close', 'Archive the code', 'Keep the code and its history available, and make its status obvious.', [
    maint ? task('When the temporary team has finished, make the repository read-only.') : task('Once the notices are up, make the repository read-only so it’s clear contributions have stopped.'),
    has('forge') && task('Use your code host’s archive feature, if it has one.'),
    task('Keep the code, the releases and the issue history. You don’t need to close open issues: they show anyone who forks the project what was still unsolved.'),
  ]))

  return { transition: false, notes, steps }
}

export function groupByPhase(steps) {
  const order = ['handover', 'prepare', 'share', 'close']
  return order
    .map(id => ({ id, ...PHASES[id], steps: steps.filter(s => s.phase === id) }))
    .filter(p => p.steps.length)
}

export const taskId = (s, t) => s.id + '::' + t.text

export function buildNotice(a, name) {
  const n = name.trim() || '[Project name]'
  if (isTransition(a)) return [
    `# ${n} has a new maintainer`,
    '',
    `From [date], ${n} will be looked after by [new maintainer]. You can reach them at [contact].`,
    '',
    '[A sentence or two about the change, if you’d like to share it.]',
    '',
    `Thank you to everyone who has used and contributed to ${n}. It’s in good hands.`,
  ].join('\n')

  const lines = [
    `# ${n} is being decommissioned`,
    '',
    `After [some years], we’ve decided to stop maintaining ${n} and decommission it. [A sentence or two about why, if you’d like to share it.]`,
    '',
    a.maintenance === 'Yes'
      ? 'Until [date], [names] will keep an eye on security issues and urgent bugs. After that, there will be no more fixes or releases.'
      : 'There will be no more fixes or releases from now on.',
  ]
  if (a.data === 'Yes') lines.push('', `If you have data stored with ${n}, please download it before [date]. After that, it will be deleted.`)
  lines.push('', a.alternative === 'Yes'
    ? 'If you need something to use instead, [alternative] does a similar job. We’ve written a guide to help you move: [link].'
    : 'We don’t know of a direct replacement. The code will stay available under its licence, so you’re welcome to fork it.')
  lines.push('', `Thank you to everyone who used ${n}, reported bugs, and contributed. It meant a lot.`)
  return lines.join('\n')
}

export function exportMarkdown({ a, name, plan, statuses, notice }) {
  const n = name.trim()
  const title = plan.transition ? `Handing ${n || 'the project'} over` : `A plan for decommissioning ${n || 'the project'}`
  const date = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  const out = [`# ${title}`, '', `_Made with The Sunset on ${date}._`, '', '## What you told us', '']
  for (const k of route(a)) out.push(`- **${QUESTIONS[k].title}** ${answerText(k, a)}`)
  if (a.maintenance === 'Yes' && Number(a.count) === 0 && a.external) out.push('- Someone outside the current team has agreed to help with maintenance.')
  if (plan.notes.length) {
    out.push('', '## Worth knowing', '')
    for (const w of plan.notes) out.push('- ' + w)
  }
  groupByPhase(plan.steps).forEach((p, i) => {
    out.push('', `## ${i + 1}. ${p.title}`)
    for (const s of p.steps) {
      out.push('', `### ${s.title}`, '', `_${s.why}_`, '')
      for (const t of s.tasks) {
        const st = statuses[taskId(s, t)]
        out.push(`- [${st === 'done' ? 'x' : ' '}] ${st === 'na' ? '~~' + t.text + '~~ (doesn’t apply)' : t.text}${t.optional ? ' _(if you have time)_' : ''}`)
      }
    }
  })
  out.push('', '## A notice you can start from', '', '```markdown', notice, '```')
  out.push('', '---', '', 'This is a guide, not legal advice. Check your own obligations, especially around user data, and your platforms’ own instructions before you switch anything off.')
  return out.join('\n')
}
