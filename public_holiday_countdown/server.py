from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from datetime import UTC, date, datetime
from typing import Any

CACHE_TTL_SECONDS = 6 * 60 * 60
USER_AGENT = "tesserae/0.1 (+public_holiday_countdown)"
API_BASE = "https://date.nager.at/api/v3/PublicHolidays"


class UnsupportedCountryError(ValueError):
    pass


def fetch(options: dict, settings: dict, *, ctx: dict) -> dict:
    del settings

    country_code = str(options.get("country_code") or "US").strip().upper()
    label = str(options.get("label") or country_code).strip()
    region_code = str(options.get("region_code") or "").strip()
    count = _bounded_int(options.get("count"), default=4, minimum=1, maximum=8)
    data_dir = str(ctx.get("data_dir") or ".")

    if not _valid_country(country_code):
        return {"error": "Country code must be a two-letter ISO code."}

    today = date.today()
    try:
        holidays = _holidays_for_window(country_code, data_dir, today.year)
        holidays.extend(_holidays_for_window(country_code, data_dir, today.year + 1))
        upcoming = [
            _shape_holiday(item, today)
            for item in holidays
            if _applies_to_region(item, region_code)
            and _parse_date(str(item.get("date") or "")) >= today
        ]
    except UnsupportedCountryError:
        return {"error": f"Country code '{country_code}' is not supported."}
    except Exception as exc:
        return {"error": f"Could not load holidays: {exc}"}

    upcoming.sort(key=lambda item: item["date"])

    return {
        "country_code": country_code,
        "label": label,
        "region_code": region_code,
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "next": upcoming[0] if upcoming else None,
        "upcoming": upcoming[:count],
    }


def _holidays_for_window(country_code: str, data_dir: str, year: int) -> list[dict]:
    cache_path = _cache_path(data_dir, country_code, year)
    cached = _read_cache(cache_path)
    if cached is not None:
        return cached

    url = f"{API_BASE}/{year}/{country_code}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            payload = resp.read()
    except urllib.error.HTTPError as exc:
        if exc.code == 404:
            raise UnsupportedCountryError(country_code) from exc
        raise

    parsed = json.loads(payload.decode("utf-8"))
    if not isinstance(parsed, list):
        raise ValueError("unexpected response shape")

    _write_cache(cache_path, parsed)
    return parsed


def _read_cache(path: str) -> list[dict] | None:
    try:
        if time.time() - os.path.getmtime(path) > CACHE_TTL_SECONDS:
            return None
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        return None

    return data if isinstance(data, list) else None


def _write_cache(path: str, data: list[dict]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(data, fh, separators=(",", ":"))
    os.replace(tmp, path)


def _cache_path(data_dir: str, country_code: str, year: int) -> str:
    filename = f"holidays_{country_code.lower()}_{year}.json"
    return os.path.join(data_dir, filename)


def _shape_holiday(item: dict[str, Any], today: date) -> dict:
    day = _parse_date(str(item.get("date") or ""))
    return {
        "date": day.isoformat(),
        "name": str(item.get("name") or item.get("localName") or "Holiday"),
        "local_name": str(item.get("localName") or item.get("name") or "Holiday"),
        "days": (day - today).days,
        "global": bool(item.get("global")),
        "types": item.get("types") if isinstance(item.get("types"), list) else [],
        "counties": item.get("counties") if isinstance(item.get("counties"), list) else [],
    }


def _applies_to_region(item: dict[str, Any], region_code: str) -> bool:
    if not region_code:
        return True
    counties = item.get("counties")
    if not counties:
        return bool(item.get("global"))
    wanted = region_code.upper()
    return any(str(county).upper().endswith(wanted) for county in counties)


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def _bounded_int(value: object, *, default: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default
    return max(minimum, min(maximum, parsed))


def _valid_country(value: str) -> bool:
    return len(value) == 2 and value.isalpha()
