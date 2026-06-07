# Tesserae Public Holiday Countdown

Countdown widget for Tesserae that shows the next public holiday and a short
upcoming list for a selected country.

## Data Source

This widget uses the Nager.Date public holiday API:

https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}

No API key is required. The widget fetches holiday data server-side through
`server.py` and caches each country/year response for 6 hours in the Tesserae
plugin `data_dir`.

## Install Locally

Copy `public_holiday_countdown/` into your Tesserae `plugins/` directory:

```text
plugins/
  public_holiday_countdown/
    plugin.json
    client.js
    server.py
```

Restart Tesserae, then render a test cell:

```text
http://127.0.0.1:8765/_test/render?plugin=public_holiday_countdown&size=md
```

## Options

- `country_code`: Two-letter ISO country code, default `US`.
- `label`: Display label for the title bar, default `United States`.
- `region_code`: Optional ISO 3166-2 region code or suffix such as `US-CA` or
  `CA`. Leave empty to show global and regional holidays.
- `count`: Number of upcoming holidays to include, clamped from 1 to 8.

## Review Notes

- Network egress: `https://date.nager.at/api/v3/PublicHolidays/...` only.
- Settings access: none.
- Filesystem access: writes JSON cache files inside the plugin `data_dir` only.
- Secrets: none.
- Failure mode: `server.py` returns `{"error": "..."}`; `client.js` renders an
  error card instead of crashing.

## Catalog Entry Draft

```json
{
  "id": "public_holiday_countdown",
  "name": "Public Holiday Countdown",
  "description": "Countdown to the next public holiday, with a short upcoming list.",
  "icon": "ph-calendar-star",
  "author": {
    "name": "Your Name",
    "github": "your-handle"
  },
  "tags": ["calendar"],
  "kind": "widget",
  "tesserae_compat": "1.x",
  "screenshot_sizes": ["lg"],
  "release": {
    "version": "0.1.0",
    "tarball_url": "https://github.com/your-handle/tesserae-public-holiday-countdown/archive/refs/tags/v0.1.0.tar.gz",
    "sha256": "..."
  },
  "source": "https://github.com/your-handle/tesserae-public-holiday-countdown"
}
```
