#!/usr/bin/env python3
"""
Square Business Data Analyzer for The Mounting Man
Fetches payment data from the Square API and identifies the biggest
day, week, and month by revenue.
"""

import os
import sys
import json
import time
from datetime import datetime, timedelta
from collections import defaultdict

import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SQUARE_ACCESS_TOKEN = os.getenv("SQUARE_ACCESS_TOKEN", "")
SQUARE_LOCATION_ID = os.getenv("SQUARE_LOCATION_ID", "")
SQUARE_ENVIRONMENT = os.getenv("SQUARE_ENVIRONMENT", "production").lower()

if SQUARE_ENVIRONMENT == "sandbox":
    BASE_URL = "https://connect.squareupsandbox.com"
else:
    BASE_URL = "https://connect.squareup.com"

API_VERSION = "2025-10-16"
PAYMENTS_ENDPOINT = f"{BASE_URL}/v2/payments"
LOCATIONS_ENDPOINT = f"{BASE_URL}/v2/locations"
PAGE_LIMIT = 100  # max per page

HEADERS = {
    "Square-Version": API_VERSION,
    "Authorization": f"Bearer {SQUARE_ACCESS_TOKEN}",
    "Content-Type": "application/json",
}


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------

def _get_with_retry(url, params=None, max_retries=4):
    """GET request with exponential back-off on transient failures."""
    for attempt in range(max_retries + 1):
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
            if resp.status_code == 429:  # rate-limited
                wait = 2 ** (attempt + 1)
                print(f"  Rate limited – retrying in {wait}s …")
                time.sleep(wait)
                continue
            return resp
        except requests.RequestException as exc:
            if attempt < max_retries:
                wait = 2 ** (attempt + 1)
                print(f"  Network error ({exc}) – retrying in {wait}s …")
                time.sleep(wait)
            else:
                raise
    return resp  # return last response even if 429


def fetch_locations():
    """Return a list of location dicts for the merchant."""
    resp = _get_with_retry(LOCATIONS_ENDPOINT)
    resp.raise_for_status()
    data = resp.json()
    return data.get("locations", [])


def fetch_all_payments(begin_time=None, end_time=None, location_id=None):
    """
    Fetch every COMPLETED payment via pagination.
    Times should be RFC 3339 strings.
    Returns a list of payment dicts.
    """
    payments = []
    cursor = None

    while True:
        params = {
            "limit": PAGE_LIMIT,
            "sort_order": "ASC",
        }
        if begin_time:
            params["begin_time"] = begin_time
        if end_time:
            params["end_time"] = end_time
        if location_id:
            params["location_id"] = location_id
        if cursor:
            params["cursor"] = cursor

        resp = _get_with_retry(PAYMENTS_ENDPOINT, params=params)
        if resp.status_code != 200:
            print(f"Error fetching payments: {resp.status_code}")
            print(resp.text)
            sys.exit(1)

        data = resp.json()
        batch = data.get("payments", [])
        payments.extend(batch)
        print(f"  Fetched {len(batch)} payments (total so far: {len(payments)})")

        cursor = data.get("cursor")
        if not cursor:
            break

    return payments


# ---------------------------------------------------------------------------
# Analysis helpers
# ---------------------------------------------------------------------------

def _iso_week_key(dt):
    """Return (year, iso_week_number) for grouping."""
    iso = dt.isocalendar()
    return (iso[0], iso[1])


def _week_label(year, week):
    """Human-readable label for an ISO week."""
    # Monday of the given ISO week
    jan4 = datetime(year, 1, 4)
    start = jan4 - timedelta(days=jan4.weekday()) + timedelta(weeks=week - 1)
    end = start + timedelta(days=6)
    return f"Week {week} ({start.strftime('%b %d')} – {end.strftime('%b %d, %Y')})"


def analyze_payments(payments):
    """
    Analyze payments and return the biggest day, week, and month.
    Only considers COMPLETED payments.
    """
    day_totals = defaultdict(int)      # "YYYY-MM-DD" -> cents
    week_totals = defaultdict(int)     # (year, week) -> cents
    month_totals = defaultdict(int)    # "YYYY-MM" -> cents

    day_counts = defaultdict(int)
    week_counts = defaultdict(int)
    month_counts = defaultdict(int)

    included = 0
    skipped = 0

    for p in payments:
        if p.get("status") != "COMPLETED":
            skipped += 1
            continue

        amount_money = p.get("amount_money") or p.get("total_money")
        if not amount_money:
            skipped += 1
            continue

        cents = amount_money.get("amount", 0)
        if cents <= 0:
            skipped += 1
            continue

        created = p.get("created_at", "")
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            skipped += 1
            continue

        day_key = dt.strftime("%Y-%m-%d")
        wk_key = _iso_week_key(dt)
        month_key = dt.strftime("%Y-%m")

        day_totals[day_key] += cents
        week_totals[wk_key] += cents
        month_totals[month_key] += cents

        day_counts[day_key] += 1
        week_counts[wk_key] += 1
        month_counts[month_key] += 1

        included += 1

    return {
        "included": included,
        "skipped": skipped,
        "day_totals": day_totals,
        "week_totals": week_totals,
        "month_totals": month_totals,
        "day_counts": day_counts,
        "week_counts": week_counts,
        "month_counts": month_counts,
    }


def format_dollars(cents):
    """Format cents as dollar string."""
    return f"${cents / 100:,.2f}"


def print_top_n(label, totals, counts, n=5, key_formatter=None):
    """Print the top N entries for a given aggregation."""
    sorted_items = sorted(totals.items(), key=lambda x: x[1], reverse=True)
    print(f"\n{'=' * 60}")
    print(f"  TOP {n} {label}")
    print(f"{'=' * 60}")
    for i, (key, cents) in enumerate(sorted_items[:n], 1):
        display_key = key_formatter(key) if key_formatter else key
        count = counts.get(key, 0)
        print(f"  {i}. {display_key}")
        print(f"     Revenue: {format_dollars(cents)}  |  Transactions: {count}")
    if not sorted_items:
        print("  No data available.")
    print()


def format_day_key(key):
    """Format a YYYY-MM-DD key to a readable date."""
    try:
        dt = datetime.strptime(key, "%Y-%m-%d")
        return dt.strftime("%A, %B %d, %Y")
    except ValueError:
        return key


def format_week_key(key):
    """Format a (year, week) tuple to a readable week range."""
    return _week_label(key[0], key[1])


def format_month_key(key):
    """Format a YYYY-MM key to a readable month."""
    try:
        dt = datetime.strptime(key + "-01", "%Y-%m-%d")
        return dt.strftime("%B %Y")
    except ValueError:
        return key


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not SQUARE_ACCESS_TOKEN:
        print("ERROR: SQUARE_ACCESS_TOKEN is not set.")
        print("Set it via environment variable or in a .env file.")
        print("See .env.example for details.")
        sys.exit(1)

    print("=" * 60)
    print("  THE MOUNTING MAN – Square Business Analyzer")
    print("=" * 60)

    # Fetch locations for context
    print("\nFetching locations …")
    locations = fetch_locations()
    if locations:
        print(f"  Found {len(locations)} location(s):")
        for loc in locations:
            name = loc.get("name", "Unnamed")
            lid = loc.get("id", "?")
            print(f"    - {name} ({lid})")
    else:
        print("  No locations found (will use default).")

    location_id = SQUARE_LOCATION_ID or None

    # Fetch all payments
    print("\nFetching all payments …")
    payments = fetch_all_payments(location_id=location_id)
    print(f"\nTotal payments retrieved: {len(payments)}")

    if not payments:
        print("\nNo payments found. Check your access token and date range.")
        sys.exit(0)

    # Analyze
    results = analyze_payments(payments)
    print(f"\nPayments analyzed: {results['included']} included, {results['skipped']} skipped")

    # Print results
    print_top_n(
        "BIGGEST DAYS",
        results["day_totals"],
        results["day_counts"],
        n=5,
        key_formatter=format_day_key,
    )

    print_top_n(
        "BIGGEST WEEKS",
        results["week_totals"],
        results["week_counts"],
        n=5,
        key_formatter=format_week_key,
    )

    print_top_n(
        "BIGGEST MONTHS",
        results["month_totals"],
        results["month_counts"],
        n=5,
        key_formatter=format_month_key,
    )

    # Summary
    best_day = max(results["day_totals"].items(), key=lambda x: x[1]) if results["day_totals"] else None
    best_week = max(results["week_totals"].items(), key=lambda x: x[1]) if results["week_totals"] else None
    best_month = max(results["month_totals"].items(), key=lambda x: x[1]) if results["month_totals"] else None

    print("=" * 60)
    print("  SUMMARY – THE MOUNTING MAN")
    print("=" * 60)
    if best_day:
        print(f"  Best Day:   {format_day_key(best_day[0])} → {format_dollars(best_day[1])}")
    if best_week:
        print(f"  Best Week:  {format_week_key(best_week[0])} → {format_dollars(best_week[1])}")
    if best_month:
        print(f"  Best Month: {format_month_key(best_month[0])} → {format_dollars(best_month[1])}")
    print("=" * 60)

    # Save raw data to JSON for further analysis
    output = {
        "total_payments_fetched": len(payments),
        "payments_included": results["included"],
        "payments_skipped": results["skipped"],
        "best_day": {
            "date": best_day[0] if best_day else None,
            "revenue_cents": best_day[1] if best_day else 0,
            "revenue_display": format_dollars(best_day[1]) if best_day else "$0.00",
            "transactions": results["day_counts"].get(best_day[0], 0) if best_day else 0,
        },
        "best_week": {
            "key": list(best_week[0]) if best_week else None,
            "label": format_week_key(best_week[0]) if best_week else None,
            "revenue_cents": best_week[1] if best_week else 0,
            "revenue_display": format_dollars(best_week[1]) if best_week else "$0.00",
            "transactions": results["week_counts"].get(best_week[0], 0) if best_week else 0,
        },
        "best_month": {
            "key": best_month[0] if best_month else None,
            "label": format_month_key(best_month[0]) if best_month else None,
            "revenue_cents": best_month[1] if best_month else 0,
            "revenue_display": format_dollars(best_month[1]) if best_month else "$0.00",
            "transactions": results["month_counts"].get(best_month[0], 0) if best_month else 0,
        },
        "top_5_days": [
            {"date": k, "label": format_day_key(k), "revenue_cents": v, "revenue_display": format_dollars(v), "transactions": results["day_counts"][k]}
            for k, v in sorted(results["day_totals"].items(), key=lambda x: x[1], reverse=True)[:5]
        ],
        "top_5_weeks": [
            {"key": list(k), "label": format_week_key(k), "revenue_cents": v, "revenue_display": format_dollars(v), "transactions": results["week_counts"][k]}
            for k, v in sorted(results["week_totals"].items(), key=lambda x: x[1], reverse=True)[:5]
        ],
        "top_5_months": [
            {"key": k, "label": format_month_key(k), "revenue_cents": v, "revenue_display": format_dollars(v), "transactions": results["month_counts"][k]}
            for k, v in sorted(results["month_totals"].items(), key=lambda x: x[1], reverse=True)[:5]
        ],
    }

    output_path = os.path.join(os.path.dirname(__file__), "analysis_results.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nDetailed results saved to: {output_path}")


if __name__ == "__main__":
    main()
