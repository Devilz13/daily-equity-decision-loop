import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const issueIndex = JSON.parse(readFileSync('issues.json', 'utf8'));
const issue = issueIndex.issues?.[0];
if (!issue || !/^issues\/\d{4}\/\d{2}\/[\w-]+\/$/.test(issue.path)) {
  throw new Error('The latest issue metadata is missing or its path is invalid.');
}

if (process.env.GITHUB_EVENT_NAME === 'push') {
  const previous = JSON.parse(execFileSync('git', ['show', 'HEAD^:issues.json'], { encoding: 'utf8' }));
  if (previous.issues?.[0]?.number === issue.number) {
    process.stdout.write('The latest issue number is unchanged; no duplicate Telegram message sent.\n');
    process.exit(0);
  }
}

const siteUrl = 'https://devilz13.github.io/daily-equity-decision-loop/';
const brief = issue.telegram;
const headlines = brief?.headlines ?? [];
const eventUpdates = brief?.event_updates ?? [];
const weekAhead = brief?.week_ahead ?? null;
if (!Array.isArray(headlines) || headlines.length > 3) {
  throw new Error('Supply zero to three world-watch headlines.');
}

if (!Array.isArray(eventUpdates) || eventUpdates.length > 2) {
  throw new Error('Supply zero to two verified event updates.');
}
if (weekAhead && (!Array.isArray(weekAhead.days) || weekAhead.days.length !== 5)) {
  throw new Error('A week-ahead brief must include Monday through Friday.');
}

const oneLine = (value, max, label) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\r\n]/.test(value)) {
    throw new Error(`${label} must be a single line of at most ${max} characters.`);
  }
  return value.trim();
};

const lines = [
  `DEDL Market Brief · Issue ${String(issue.number).padStart(3, '0')} · ${issue.date}`,
  '',
  'THE BIG PICTURE',
  oneLine(brief?.summary ?? issue.title, 330, 'summary'),
  '',
  'WORLD WATCH',
];

if (headlines.length === 0) {
  lines.push(brief ? 'No major new development verified by this issue’s cutoff.' : 'No world-watch brief supplied for this edition; see the full report.');
} else {
  headlines.forEach((item, index) => {
    const title = oneLine(item.title, 130, 'headline title');
    const date = oneLine(item.date, 30, 'headline observation date');
    const context = oneLine(item.context, 180, 'headline context');
    const source = oneLine(item.source, 300, 'headline source');
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new Error('Headline source must be a public HTTPS URL.');
    }
    lines.push(`${index + 1}. ${title} · ${date}`, context, source);
  });
}

if (eventUpdates.length) {
  lines.push('', 'CONFERENCE & RELEASE WATCH');
  eventUpdates.forEach((item) => {
    const name = oneLine(item.name, 70, 'event name');
    const date = oneLine(item.date, 30, 'event update date');
    const update = oneLine(item.update, 150, 'event update');
    const source = oneLine(item.source, 300, 'event source');
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Event source must be a public HTTPS URL.');
    lines.push(`${name} · ${date}`, update, source);
  });
}

if (weekAhead) {
  if (new Date(`${issue.date}T00:00:00Z`).getUTCDay() !== 0) throw new Error('Week-ahead briefs belong to Sunday issues.');
  lines.push('', 'WEEK AHEAD · MON–FRI');
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  weekAhead.days.forEach((day, index) => {
    if (day.day !== weekdays[index] || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) throw new Error('Week-ahead day/date is invalid.');
    const expected = new Date(`${issue.date}T00:00:00Z`);
    expected.setUTCDate(expected.getUTCDate() + index + 1);
    if (day.date !== expected.toISOString().slice(0, 10)) throw new Error('Week-ahead date does not match the coming week.');
    if (!Array.isArray(day.items) || day.items.length > 3) throw new Error('Supply zero to three events per day.');
    const summary = day.items.length ? day.items.map((item) => oneLine(item, 140, 'week-ahead item')).join('; ') : 'No verified major event scheduled';
    lines.push(`${day.day} ${day.date}: ${summary}`);
  });
  lines.push('Dates and direct source links: full issue. Events can change.');
}

lines.push('', 'MARKET SNAPSHOT', oneLine(brief?.market_note ?? `${issue.status}: ${issue.markets.join(' · ')}`, 350, 'market note'), '', `Full issue: ${siteUrl}${issue.path}`, '', 'OpenAI-generated research and news summary. Verify sources. Not investment advice.');
const message = lines.join('\n');
if (message.length > 4096) throw new Error('Telegram message exceeds its 4,096-character limit.');

if (process.argv.includes('--dry-run')) {
  process.stdout.write(`${message}\n`);
} else {
  const token = process.env.BOT_TOKEN;
  const channel = process.env.CHANNEL_ID;
  if (!token || !channel) {
    process.stdout.write('Telegram is not configured; skipping push.\n');
  } else {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: channel, text: message, link_preview_options: { is_disabled: true } }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(`Telegram rejected the message (HTTP ${response.status}).`);
    process.stdout.write(`Telegram accepted message ${result.result.message_id}.\n`);
  }
}
