export function publicationKey(issue) {
  if(!Number.isInteger(issue?.number) || issue.number<1 || !/^\d{4}-\d{2}-\d{2}$/.test(issue.date||'')) throw new Error('Invalid publication identity.');
  const revision=issue.telegram?.delivery_revision ?? 'initial';
  if(typeof revision!=='string' || !/^[A-Za-z0-9_.-]{1,80}$/.test(revision)) throw new Error('Invalid Telegram delivery revision.');
  return `${issue.number}:${issue.date}:${revision}`;
}

export function deliveryChanged(issue, previousIssue) {
  return !previousIssue || publicationKey(issue)!==publicationKey(previousIssue);
}

export function buildTelegramMessage(issue) {
if (!issue || !/^issues\/\d{4}\/\d{2}\/[\w-]+\/(?:[\w-]+\/)?$/.test(issue.path)) {
  throw new Error('The latest issue metadata is missing or its path is invalid.');
}

const siteUrl = 'https://devilz13.github.io/daily-equity-decision-loop/';
const brief = issue.telegram;
const deliveryNotice = brief?.delivery_notice;
const headlines = brief?.headlines ?? [];
const eventUpdates = brief?.event_updates ?? [];
const weekAhead = brief?.week_ahead ?? null;
const issueDay = new Date(`${issue.date}T00:00:00Z`).getUTCDay();
if (!Array.isArray(headlines) || headlines.length > 3) {
  throw new Error('Supply zero to three world-watch headlines.');
}

if (!Array.isArray(eventUpdates) || eventUpdates.length > 2) {
  throw new Error('Supply zero to two verified event updates.');
}
if (eventUpdates.length && issueDay !== 0) {
  throw new Error('Conference and economic-event updates belong to the Sunday outlook.');
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

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const sectionTitle = (value) => `<b><u>${escapeHtml(value)}</u></b>`;
const subtitle = (value) => `<u>${escapeHtml(value)}</u>`;
const sourceLink = (value) => `<a href="${escapeHtml(value)}">${escapeHtml(value)}</a>`;

const lines = [escapeHtml(`DEDL Market Brief · Issue ${String(issue.number).padStart(3, '0')} · ${issue.date}`), ''];
if (deliveryNotice !== undefined) {
  lines.push(sectionTitle('DELIVERY APOLOGY'), '', escapeHtml(oneLine(deliveryNotice, 300, 'delivery notice')), '');
}
lines.push(sectionTitle('THE BIG PICTURE'), '', '', escapeHtml(oneLine(brief?.summary ?? issue.title, 330, 'summary')), '', sectionTitle('WORLD WATCH'), '', '');

if (headlines.length === 0) {
  lines.push(escapeHtml(brief ? 'No major new development verified by this issue’s cutoff.' : 'No world-watch brief supplied for this edition; see the full report.'));
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
    lines.push(
      subtitle(`${index + 1}. ${title} · ${date}`),
      escapeHtml(context),
      sourceLink(source),
    );
    if (index < headlines.length - 1) lines.push('');
  });
}

if (eventUpdates.length) {
  lines.push('', sectionTitle('GLOBAL ECONOMIC EVENTS'), '', '');
  eventUpdates.forEach((item, index) => {
    const name = oneLine(item.name, 70, 'event name');
    const date = oneLine(item.date, 30, 'event update date');
    const update = oneLine(item.update, 150, 'event update');
    const source = oneLine(item.source, 300, 'event source');
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Event source must be a public HTTPS URL.');
    lines.push(subtitle(`${name} · ${date}`), escapeHtml(update), sourceLink(source));
    if (index < eventUpdates.length - 1) lines.push('');
  });
}

if (weekAhead) {
  if (issueDay !== 0) throw new Error('Week-ahead briefs belong to Sunday issues.');
  lines.push('', sectionTitle('WEEK AHEAD · MON–FRI'), '', '');
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  weekAhead.days.forEach((day, index) => {
    if (day.day !== weekdays[index] || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) throw new Error('Week-ahead day/date is invalid.');
    const expected = new Date(`${issue.date}T00:00:00Z`);
    expected.setUTCDate(expected.getUTCDate() + index + 1);
    if (day.date !== expected.toISOString().slice(0, 10)) throw new Error('Week-ahead date does not match the coming week.');
    if (!Array.isArray(day.items) || day.items.length > 3) throw new Error('Supply zero to three events per day.');
    const items = day.items.length
      ? day.items.map((item) => `• ${escapeHtml(oneLine(item, 140, 'week-ahead item'))}`)
      : ['No verified major event scheduled'];
    lines.push(subtitle(`${day.day} ${day.date}`), ...items);
    if (index < weekAhead.days.length - 1) lines.push('');
  });
  lines.push('', 'Dates and direct source links: full issue. Events can change.');
}

const fullIssueUrl = `${siteUrl}${issue.path}`;
lines.push(
  '',
  sectionTitle('MARKET SNAPSHOT'),
  '',
  '',
  escapeHtml(oneLine(brief?.market_note ?? `${issue.status}: ${issue.markets.join(' · ')}`, 350, 'market note')),
  '',
  `Full issue: ${sourceLink(fullIssueUrl)}`,
  '',
  'OpenAI-generated research and news summary. Verify sources. Not investment advice.',
);
const message = lines.join('\n');
if (message.length > 4096) throw new Error('Telegram message exceeds its 4,096-character limit.');

return message;
}
