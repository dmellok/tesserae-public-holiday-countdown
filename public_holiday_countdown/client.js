export default async function render(shadow, ctx) {
  const data = ctx.data || {};
  const size = ctx.cell?.size || "md";
  const label = data.label || ctx.cell?.options?.label || data.country_code || "Holidays";

  if (data.error) {
    shadow.innerHTML = shell(size, label, errorBody(data.error));
    return;
  }

  if (!data.next) {
    shadow.innerHTML = shell(size, label, emptyBody());
    return;
  }

  shadow.innerHTML = shell(size, label, countdownBody(data, size));
}

function shell(size, label, body) {
  return `
    <link rel="stylesheet" href="/static/style/spectra-widgets.css">
    <link rel="stylesheet" href="/static/icons/phosphor/bold/style.css">
    <style>
      :host {
        display: block;
        height: 100%;
      }

      .holiday-root {
        container-type: size;
      }

      .holiday-body {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: var(--space-4, 1.25em);
        min-height: 0;
        overflow: hidden;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--space-4, 1.25em);
        min-height: 0;
      }

      .days-block {
        min-width: 0;
      }

      .days {
        display: flex;
        align-items: baseline;
        gap: var(--space-2, .5em);
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
      }

      .days strong {
        font-size: clamp(48px, 24cqmin, 176px);
        line-height: .85;
        font-weight: var(--fw-black, 900);
        letter-spacing: 0;
      }

      .days span {
        font-size: clamp(13px, 4cqmin, 28px);
        font-weight: var(--fw-bold, 800);
        color: var(--text-secondary);
        text-transform: var(--label-transform, uppercase);
      }

      .next-name {
        margin-top: var(--space-2, .5em);
        color: var(--text-primary);
        font-size: clamp(18px, 6cqmin, 52px);
        line-height: .98;
        font-weight: var(--fw-black, 900);
        overflow-wrap: anywhere;
      }

      .next-date {
        margin-top: var(--space-2, .5em);
        color: var(--text-muted);
        font-size: clamp(11px, 2.5cqmin, 18px);
        font-weight: var(--fw-semi, 700);
        text-transform: var(--label-transform, uppercase);
      }

      .hero-icon {
        display: grid;
        place-items: center;
        inline-size: clamp(56px, 24cqmin, 180px);
        block-size: clamp(56px, 24cqmin, 180px);
        color: var(--accent-4);
        background: var(--accent-4-soft);
        border-radius: var(--pill-radius, var(--radius-0, 0));
      }

      .hero-icon i {
        font-size: clamp(38px, 15cqmin, 118px);
        line-height: 1;
      }

      .upcoming {
        display: grid;
        gap: var(--list-gap, var(--space-1, .25em));
        min-height: 0;
        overflow: hidden;
        align-content: start;
      }

      .holiday-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--space-3, .75em);
        padding: var(--list-pad-y, var(--space-2, .5em)) var(--space-3, .75em);
        background: var(--zebra-bg, var(--surface-sunken));
        color: var(--text-primary);
      }

      .holiday-row:first-child {
        background: var(--accent-4-soft);
      }

      .row-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: var(--fw-bold, 800);
      }

      .row-date {
        color: var(--text-secondary);
        font-size: var(--fs-label, .8em);
        font-weight: var(--fw-semi, 700);
        font-variant-numeric: tabular-nums;
      }

      .pill-days {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-inline-size: 3.25em;
        padding: .2em .55em;
        color: var(--on-accent);
        background: var(--accent-4);
        border-radius: var(--pill-radius, var(--radius-0, 0));
        font-weight: var(--fw-black, 900);
        font-variant-numeric: tabular-nums;
      }

      .message {
        display: grid;
        place-items: center;
        height: 100%;
        gap: var(--space-3, .75em);
        text-align: center;
        color: var(--text-secondary);
        font-weight: var(--fw-bold, 800);
      }

      .message i {
        color: var(--accent-1);
        font-size: clamp(44px, 18cqmin, 120px);
      }

      .size-xs .holiday-body {
        display: grid;
        grid-template-rows: 1fr;
      }

      .size-xs .w-title {
        display: none;
      }

      .size-xs .hero {
        grid-template-columns: 1fr;
        place-items: center;
        text-align: center;
      }

      .size-xs .hero-icon,
      .size-xs .upcoming,
      .size-xs .next-date {
        display: none;
      }

      .size-sm .upcoming .holiday-row:nth-child(n + 3),
      .size-md .upcoming .holiday-row:nth-child(n + 5) {
        display: none;
      }

      @container (max-width: 360px) {
        .hero {
          grid-template-columns: 1fr;
          text-align: center;
        }

        .hero-icon {
          display: none;
        }
      }
    </style>
    <div class="w holiday-root size-${escapeAttr(size)}" data-widget="public_holiday_countdown" data-plugin="public_holiday_countdown">
      <div class="w-title">
        <i class="ph-bold ph-calendar-star" aria-hidden="true"></i>
        <h3>${escapeHtml(label)}</h3>
        <span class="w-title-meta">Holidays</span>
      </div>
      <div class="w-body cal-body holiday-body">
        ${body}
      </div>
    </div>
  `;
}

function countdownBody(data) {
  const next = data.next;
  const upcoming = Array.isArray(data.upcoming) ? data.upcoming : [];
  return `
    <section class="hero" aria-label="Next public holiday">
      <div class="days-block">
        <div class="days">
          <strong>${escapeHtml(String(next.days))}</strong>
          <span>${next.days === 1 ? "day" : "days"}</span>
        </div>
        <div class="next-name">${escapeHtml(next.name)}</div>
        <div class="next-date">${escapeHtml(formatDate(next.date))}</div>
      </div>
      <div class="hero-icon">
        <i class="ph-bold ph-calendar-check" aria-hidden="true"></i>
      </div>
    </section>
    <section class="upcoming" aria-label="Upcoming holidays">
      ${upcoming.map(rowHtml).join("")}
    </section>
  `;
}

function rowHtml(item) {
  return `
    <div class="holiday-row">
      <div>
        <div class="row-name">${escapeHtml(item.name)}</div>
        <div class="row-date">${escapeHtml(formatDate(item.date))}</div>
      </div>
      <span class="pill-days">${escapeHtml(daysLabel(item.days))}</span>
    </div>
  `;
}

function errorBody(message) {
  return `
    <div class="message">
      <i class="ph-bold ph-warning-circle" aria-hidden="true"></i>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function emptyBody() {
  return `
    <div class="message">
      <i class="ph-bold ph-calendar-x" aria-hidden="true"></i>
      <span>No upcoming public holidays found.</span>
    </div>
  `;
}

function daysLabel(days) {
  if (days === 0) return "Today";
  if (days === 1) return "1d";
  return `${days}d`;
}

function formatDate(value) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value || "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}
