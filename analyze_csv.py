#!/usr/bin/env python3
"""
Square CSV Data Analyzer for The Mounting Man
Reads exported Square CSV files (transactions, items, sales summaries)
and produces a comprehensive business analysis.

Usage:
    python analyze_csv.py [data_directory]

The data directory should contain Square CSV exports:
    - transactions-*.csv   (individual transaction records)
    - items-*.csv          (line-item level detail)
    - sales-summary-*.csv  (daily aggregated summaries)
"""

import os
import sys
import glob
import json
import csv
from datetime import datetime, timedelta
from collections import defaultdict
from decimal import Decimal, InvalidOperation

import pandas as pd

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")


# ---------------------------------------------------------------------------
# CSV Loading
# ---------------------------------------------------------------------------

def find_csv_files(data_dir):
    """Discover and categorize CSV files in the data directory."""
    files = {"transactions": [], "items": [], "sales_summary": []}
    for f in sorted(glob.glob(os.path.join(data_dir, "*.csv"))):
        basename = os.path.basename(f).lower()
        if basename.startswith("transaction"):
            files["transactions"].append(f)
        elif basename.startswith("item"):
            files["items"].append(f)
        elif basename.startswith("sales"):
            files["sales_summary"].append(f)
        else:
            print(f"  [skip] Unrecognized file: {basename}")
    return files


def load_csv_files(file_list, label):
    """Load and concatenate a list of CSV files into a single DataFrame."""
    if not file_list:
        print(f"  No {label} files found.")
        return pd.DataFrame()

    frames = []
    for f in file_list:
        try:
            df = pd.read_csv(f, dtype=str)
            df["_source_file"] = os.path.basename(f)
            frames.append(df)
            print(f"  Loaded {os.path.basename(f)}: {len(df)} rows, {len(df.columns)} cols")
        except Exception as e:
            print(f"  ERROR loading {os.path.basename(f)}: {e}")
    if not frames:
        return pd.DataFrame()
    combined = pd.concat(frames, ignore_index=True, sort=False)
    # Drop exact duplicate rows (from overlapping date ranges)
    before = len(combined)
    id_cols = [c for c in ["Transaction ID", "Payment ID"] if c in combined.columns]
    if id_cols:
        combined = combined.drop_duplicates(subset=id_cols, keep="first")
    else:
        combined = combined.drop_duplicates(keep="first")
    after = len(combined)
    if before != after:
        print(f"  Removed {before - after} duplicate rows from {label}")
    print(f"  Total {label} rows: {len(combined)}")
    return combined


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def parse_money(val):
    """Parse a dollar amount string to float. Handles $, commas, parens for negatives."""
    if pd.isna(val) or val is None:
        return 0.0
    s = str(val).strip()
    if not s or s == "--" or s == "N/A":
        return 0.0
    negative = False
    if s.startswith("(") and s.endswith(")"):
        negative = True
        s = s[1:-1]
    if s.startswith("-"):
        negative = True
        s = s[1:]
    s = s.replace("$", "").replace(",", "").strip()
    try:
        result = float(s)
        return -result if negative else result
    except (ValueError, InvalidOperation):
        return 0.0


def parse_date(date_str):
    """Parse a date string from Square CSV exports."""
    if pd.isna(date_str) or not date_str:
        return None
    s = str(date_str).strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y-%m-%dT%H:%M:%S",
                "%m/%d/%Y %I:%M %p", "%m/%d/%Y %H:%M"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


def parse_int(val):
    """Parse an integer, returning 0 on failure."""
    if pd.isna(val) or val is None:
        return 0
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return 0


# ---------------------------------------------------------------------------
# Transaction Analysis
# ---------------------------------------------------------------------------

def analyze_transactions(df):
    """Analyze transaction-level data."""
    if df.empty:
        return None

    print("\n  Columns found:", list(df.columns))

    # Identify money columns - Square uses various names
    gross_col = next((c for c in df.columns if "gross" in c.lower() and "sale" in c.lower()), None)
    net_sales_col = next((c for c in df.columns if "net" in c.lower() and "sale" in c.lower()), None)
    total_col = next((c for c in df.columns if "total collected" in c.lower()), None)
    tax_col = next((c for c in df.columns if c.lower().strip() == "tax"), None)
    tip_col = next((c for c in df.columns if c.lower().strip() == "tip"), None)
    discount_col = next((c for c in df.columns if "discount" in c.lower()), None)
    fee_col = next((c for c in df.columns if "fee" in c.lower()), None)
    net_total_col = next((c for c in df.columns if "net total" in c.lower()), None)
    refund_col = next((c for c in df.columns if "refund" in c.lower()), None)
    date_col = next((c for c in df.columns if c.lower().strip() == "date"), None)
    time_col = next((c for c in df.columns if c.lower().strip() == "time"), None)
    source_col = next((c for c in df.columns if c.lower().strip() == "source"), None)
    card_brand_col = next((c for c in df.columns if "card brand" in c.lower()), None)
    location_col = next((c for c in df.columns if c.lower().strip() == "location"), None)
    event_type_col = next((c for c in df.columns if "event type" in c.lower()), None)
    staff_col = next((c for c in df.columns if "staff name" in c.lower()), None)
    customer_col = next((c for c in df.columns if "customer name" in c.lower()), None)
    cash_col = next((c for c in df.columns if c.lower().strip() == "cash"), None)
    card_col = next((c for c in df.columns if c.lower().strip() == "card" or c.lower() == "card "), None)
    dining_col = next((c for c in df.columns if "dining" in c.lower()), None)

    revenue_col = total_col or gross_col or net_sales_col

    if not revenue_col:
        print("  WARNING: Could not identify a revenue column in transactions.")
        print(f"  Available columns: {list(df.columns)}")
        return None

    print(f"  Using '{revenue_col}' as primary revenue column")

    # Parse money columns
    df["_revenue"] = df[revenue_col].apply(parse_money)
    if gross_col:
        df["_gross"] = df[gross_col].apply(parse_money)
    if net_sales_col:
        df["_net_sales"] = df[net_sales_col].apply(parse_money)
    if tax_col:
        df["_tax"] = df[tax_col].apply(parse_money)
    if tip_col:
        df["_tip"] = df[tip_col].apply(parse_money)
    if discount_col:
        df["_discount"] = df[discount_col].apply(parse_money)
    if fee_col:
        df["_fees"] = df[fee_col].apply(parse_money)
    if net_total_col:
        df["_net_total"] = df[net_total_col].apply(parse_money)
    if refund_col:
        df["_refund"] = df[refund_col].apply(parse_money)

    # Parse dates
    if date_col:
        df["_date"] = df[date_col].apply(parse_date)
        df = df.dropna(subset=["_date"])
        df["_date_str"] = df["_date"].apply(lambda d: d.strftime("%Y-%m-%d"))
        df["_month"] = df["_date"].apply(lambda d: d.strftime("%Y-%m"))
        df["_year"] = df["_date"].apply(lambda d: d.year)
        df["_weekday"] = df["_date"].apply(lambda d: d.strftime("%A"))
        df["_iso_week"] = df["_date"].apply(lambda d: f"{d.isocalendar()[0]}-W{d.isocalendar()[1]:02d}")
        df["_quarter"] = df["_date"].apply(lambda d: f"{d.year}-Q{(d.month - 1) // 3 + 1}")

    # Filter to payment events only (exclude refund-only rows if event type present)
    if event_type_col:
        event_types = df[event_type_col].dropna().unique()
        print(f"  Event types found: {list(event_types)}")
        payment_df = df[df[event_type_col].str.lower().isin(["payment", "sale", ""])
                        | df[event_type_col].isna()].copy()
        refund_df = df[df[event_type_col].str.lower().str.contains("refund", na=False)].copy()
    else:
        payment_df = df[df["_revenue"] >= 0].copy()
        refund_df = df[df["_revenue"] < 0].copy()

    return {
        "all": df,
        "payments": payment_df,
        "refunds": refund_df,
        "columns": {
            "revenue": revenue_col,
            "gross": gross_col,
            "net_sales": net_sales_col,
            "total": total_col,
            "tax": tax_col,
            "tip": tip_col,
            "discount": discount_col,
            "fees": fee_col,
            "net_total": net_total_col,
            "date": date_col,
            "source": source_col,
            "card_brand": card_brand_col,
            "location": location_col,
            "staff": staff_col,
            "customer": customer_col,
            "cash": cash_col,
            "card": card_col,
            "dining": dining_col,
        },
    }


# ---------------------------------------------------------------------------
# Items Analysis
# ---------------------------------------------------------------------------

def analyze_items(df):
    """Analyze item-level data."""
    if df.empty:
        return None

    print("\n  Items columns found:", list(df.columns))

    item_col = next((c for c in df.columns if c.lower().strip() == "item"), None)
    cat_col = next((c for c in df.columns if "category" in c.lower()), None)
    qty_col = next((c for c in df.columns if "qty" in c.lower()), None)
    gross_col = next((c for c in df.columns if "gross" in c.lower()), None)
    net_col = next((c for c in df.columns if "net" in c.lower() and "sale" in c.lower()), None)
    date_col = next((c for c in df.columns if c.lower().strip() == "date"), None)
    sku_col = next((c for c in df.columns if c.lower().strip() == "sku"), None)
    modifier_col = next((c for c in df.columns if "modifier" in c.lower()), None)

    revenue_col = net_col or gross_col

    if revenue_col:
        df["_revenue"] = df[revenue_col].apply(parse_money)
    if qty_col:
        df["_qty"] = df[qty_col].apply(parse_int)
    if date_col:
        df["_date"] = df[date_col].apply(parse_date)
        df = df.dropna(subset=["_date"])
        df["_month"] = df["_date"].apply(lambda d: d.strftime("%Y-%m"))
        df["_year"] = df["_date"].apply(lambda d: d.year)

    return {
        "df": df,
        "columns": {
            "item": item_col,
            "category": cat_col,
            "qty": qty_col,
            "revenue": revenue_col,
            "date": date_col,
            "sku": sku_col,
        },
    }


# ---------------------------------------------------------------------------
# Report Generation
# ---------------------------------------------------------------------------

def fmt(amount):
    """Format a dollar amount."""
    if amount < 0:
        return f"-${abs(amount):,.2f}"
    return f"${amount:,.2f}"


def pct(part, whole):
    """Format a percentage."""
    if whole == 0:
        return "0.0%"
    return f"{part / whole * 100:.1f}%"


def print_section(title):
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}")


def generate_report(txn_result, items_result, summary_df):
    """Generate the full business analysis report."""

    report = {}  # structured data for JSON export

    print("\n")
    print("*" * 70)
    print("*" + " " * 68 + "*")
    print("*" + "THE MOUNTING MAN — COMPLETE BUSINESS ANALYSIS".center(68) + "*")
    print("*" + " " * 68 + "*")
    print("*" * 70)

    if txn_result is None:
        print("\nNo transaction data available to analyze.")
        return report

    df = txn_result["all"]
    payments = txn_result["payments"]
    cols = txn_result["columns"]

    # -----------------------------------------------------------------------
    # 1. OVERALL BUSINESS OVERVIEW
    # -----------------------------------------------------------------------
    print_section("1. OVERALL BUSINESS OVERVIEW")

    total_revenue = payments["_revenue"].sum()
    total_txns = len(payments)
    avg_txn = total_revenue / total_txns if total_txns > 0 else 0
    median_txn = payments["_revenue"].median() if total_txns > 0 else 0

    date_min = payments["_date"].min() if "_date" in payments.columns else None
    date_max = payments["_date"].max() if "_date" in payments.columns else None

    if date_min and date_max:
        span_days = (date_max - date_min).days + 1
        span_str = f"{date_min.strftime('%b %d, %Y')} → {date_max.strftime('%b %d, %Y')} ({span_days} days)"
    else:
        span_days = 0
        span_str = "Unknown"

    print(f"  Date Range:            {span_str}")
    print(f"  Total Revenue:         {fmt(total_revenue)}")
    print(f"  Total Transactions:    {total_txns:,}")
    print(f"  Average Transaction:   {fmt(avg_txn)}")
    print(f"  Median Transaction:    {fmt(median_txn)}")

    if span_days > 0:
        daily_avg = total_revenue / span_days
        monthly_avg = total_revenue / (span_days / 30.44)
        yearly_avg = total_revenue / (span_days / 365.25)
        print(f"  Avg Revenue/Day:       {fmt(daily_avg)}")
        print(f"  Avg Revenue/Month:     {fmt(monthly_avg)}")
        print(f"  Avg Revenue/Year:      {fmt(yearly_avg)}")

    if "_gross" in payments.columns:
        total_gross = payments["_gross"].sum()
        print(f"\n  Gross Sales:           {fmt(total_gross)}")
    if "_tax" in payments.columns:
        total_tax = payments["_tax"].sum()
        print(f"  Total Tax Collected:   {fmt(total_tax)}")
    if "_tip" in payments.columns:
        total_tips = payments["_tip"].sum()
        print(f"  Total Tips:            {fmt(total_tips)}")
    if "_discount" in payments.columns:
        total_discounts = payments["_discount"].sum()
        print(f"  Total Discounts:       {fmt(total_discounts)}")
    if "_fees" in payments.columns:
        total_fees = payments["_fees"].sum()
        print(f"  Total Fees (Square):   {fmt(total_fees)}")
    if "_net_total" in payments.columns:
        total_net = payments["_net_total"].sum()
        print(f"  Net Total (after fees):{fmt(total_net)}")
    if "_refund" in payments.columns:
        total_refunds = payments["_refund"].sum()
        if total_refunds != 0:
            print(f"  Partial Refunds:       {fmt(total_refunds)}")

    report["overview"] = {
        "date_range": span_str,
        "total_revenue": round(total_revenue, 2),
        "total_transactions": total_txns,
        "avg_transaction": round(avg_txn, 2),
        "median_transaction": round(median_txn, 2),
    }

    # -----------------------------------------------------------------------
    # 2. YEAR-OVER-YEAR PERFORMANCE
    # -----------------------------------------------------------------------
    if "_year" in payments.columns:
        print_section("2. YEAR-OVER-YEAR PERFORMANCE")

        yearly = payments.groupby("_year").agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
            avg_txn=("_revenue", "mean"),
            median_txn=("_revenue", "median"),
        ).sort_index()

        report["yearly"] = []
        prev_rev = None
        for year, row in yearly.iterrows():
            growth = ""
            if prev_rev is not None and prev_rev > 0:
                g = (row["revenue"] - prev_rev) / prev_rev * 100
                growth = f"  ({'+' if g >= 0 else ''}{g:.1f}% YoY)"
            prev_rev = row["revenue"]

            print(f"\n  {int(year)}")
            print(f"    Revenue:       {fmt(row['revenue'])}{growth}")
            print(f"    Transactions:  {int(row['transactions']):,}")
            print(f"    Avg Txn:       {fmt(row['avg_txn'])}")
            print(f"    Median Txn:    {fmt(row['median_txn'])}")

            report["yearly"].append({
                "year": int(year),
                "revenue": round(row["revenue"], 2),
                "transactions": int(row["transactions"]),
                "avg_transaction": round(row["avg_txn"], 2),
            })

    # -----------------------------------------------------------------------
    # 3. QUARTERLY PERFORMANCE
    # -----------------------------------------------------------------------
    if "_quarter" in payments.columns:
        print_section("3. QUARTERLY PERFORMANCE")

        quarterly = payments.groupby("_quarter").agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
        ).sort_index()

        for qtr, row in quarterly.iterrows():
            bar_len = int(row["revenue"] / max(quarterly["revenue"]) * 40) if max(quarterly["revenue"]) > 0 else 0
            bar = "█" * bar_len
            print(f"  {qtr}  {fmt(row['revenue']):>12s}  ({int(row['transactions']):>4d} txns)  {bar}")

    # -----------------------------------------------------------------------
    # 4. MONTHLY PERFORMANCE
    # -----------------------------------------------------------------------
    if "_month" in payments.columns:
        print_section("4. MONTHLY PERFORMANCE")

        monthly = payments.groupby("_month").agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
        ).sort_index()

        report["monthly"] = []
        for month, row in monthly.iterrows():
            report["monthly"].append({
                "month": month,
                "revenue": round(row["revenue"], 2),
                "transactions": int(row["transactions"]),
            })

        # Show top 10 and bottom 5 months
        sorted_months = monthly.sort_values("revenue", ascending=False)

        print("\n  TOP 10 MONTHS BY REVENUE:")
        for i, (month, row) in enumerate(sorted_months.head(10).iterrows(), 1):
            try:
                label = datetime.strptime(month + "-01", "%Y-%m-%d").strftime("%B %Y")
            except ValueError:
                label = month
            print(f"    {i:>2}. {label:<20s}  {fmt(row['revenue']):>12s}  ({int(row['transactions']):>4d} txns)")

        print("\n  BOTTOM 5 MONTHS BY REVENUE:")
        for i, (month, row) in enumerate(sorted_months.tail(5).iloc[::-1].iterrows(), 1):
            try:
                label = datetime.strptime(month + "-01", "%Y-%m-%d").strftime("%B %Y")
            except ValueError:
                label = month
            print(f"    {i:>2}. {label:<20s}  {fmt(row['revenue']):>12s}  ({int(row['transactions']):>4d} txns)")

    # -----------------------------------------------------------------------
    # 5. BEST DAYS / WEEKS
    # -----------------------------------------------------------------------
    if "_date_str" in payments.columns:
        print_section("5. TOP 10 BIGGEST DAYS")

        daily = payments.groupby("_date_str").agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
        ).sort_values("revenue", ascending=False)

        report["top_days"] = []
        for i, (day, row) in enumerate(daily.head(10).iterrows(), 1):
            try:
                label = datetime.strptime(day, "%Y-%m-%d").strftime("%A, %B %d, %Y")
            except ValueError:
                label = day
            print(f"    {i:>2}. {label}")
            print(f"        Revenue: {fmt(row['revenue'])}  |  Transactions: {int(row['transactions'])}")
            report["top_days"].append({
                "date": day,
                "label": label,
                "revenue": round(row["revenue"], 2),
                "transactions": int(row["transactions"]),
            })

    if "_iso_week" in payments.columns:
        print_section("6. TOP 10 BIGGEST WEEKS")

        weekly = payments.groupby("_iso_week").agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
        ).sort_values("revenue", ascending=False)

        report["top_weeks"] = []
        for i, (week, row) in enumerate(weekly.head(10).iterrows(), 1):
            print(f"    {i:>2}. {week}  Revenue: {fmt(row['revenue'])}  |  Transactions: {int(row['transactions'])}")
            report["top_weeks"].append({
                "week": week,
                "revenue": round(row["revenue"], 2),
                "transactions": int(row["transactions"]),
            })

    # -----------------------------------------------------------------------
    # 6. DAY-OF-WEEK ANALYSIS
    # -----------------------------------------------------------------------
    if "_weekday" in payments.columns:
        print_section("7. DAY-OF-WEEK ANALYSIS")

        dow_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        dow = payments.groupby("_weekday").agg(
            total_revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
            avg_revenue=("_revenue", "mean"),
        )
        # Count distinct dates per weekday for avg daily revenue
        date_counts = payments.groupby("_weekday")["_date_str"].nunique()
        dow["num_days"] = date_counts
        dow["avg_daily_revenue"] = dow["total_revenue"] / dow["num_days"]

        dow = dow.reindex([d for d in dow_order if d in dow.index])

        print(f"  {'Day':<12s} {'Total Rev':>12s} {'# Txns':>8s} {'Avg Txn':>10s} {'Avg Daily':>12s} {'# Days':>8s}")
        print(f"  {'-' * 12} {'-' * 12} {'-' * 8} {'-' * 10} {'-' * 12} {'-' * 8}")
        for day, row in dow.iterrows():
            print(f"  {day:<12s} {fmt(row['total_revenue']):>12s} {int(row['transactions']):>8,d} "
                  f"{fmt(row['avg_revenue']):>10s} {fmt(row['avg_daily_revenue']):>12s} {int(row['num_days']):>8d}")

    # -----------------------------------------------------------------------
    # 7. PAYMENT SOURCE / METHOD
    # -----------------------------------------------------------------------
    if cols.get("source"):
        print_section("8. PAYMENT SOURCE BREAKDOWN")
        source = payments.groupby(cols["source"]).agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
        ).sort_values("revenue", ascending=False)
        for src, row in source.iterrows():
            src_name = src if pd.notna(src) and str(src).strip() else "(blank)"
            print(f"    {src_name:<30s}  {fmt(row['revenue']):>12s}  ({int(row['transactions']):>5d} txns)  {pct(row['revenue'], total_revenue):>6s}")

    if cols.get("card_brand"):
        print_section("9. CARD BRAND BREAKDOWN")
        brands = payments[payments[cols["card_brand"]].notna()].groupby(cols["card_brand"]).agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
        ).sort_values("revenue", ascending=False)
        for brand, row in brands.iterrows():
            print(f"    {brand:<20s}  {fmt(row['revenue']):>12s}  ({int(row['transactions']):>5d} txns)  {pct(row['revenue'], total_revenue):>6s}")

    # -----------------------------------------------------------------------
    # 8. TRANSACTION SIZE DISTRIBUTION
    # -----------------------------------------------------------------------
    print_section("10. TRANSACTION SIZE DISTRIBUTION")

    positive = payments[payments["_revenue"] > 0]["_revenue"]
    if len(positive) > 0:
        buckets = [0, 25, 50, 100, 150, 200, 300, 500, 1000, 2000, float("inf")]
        labels = ["$0-25", "$25-50", "$50-100", "$100-150", "$150-200",
                  "$200-300", "$300-500", "$500-1K", "$1K-2K", "$2K+"]
        hist = pd.cut(positive, bins=buckets, labels=labels, right=False)
        dist = hist.value_counts().sort_index()

        max_count = dist.max() if dist.max() > 0 else 1
        for bucket, count in dist.items():
            bar_len = int(count / max_count * 35)
            bar = "█" * bar_len
            pct_val = count / len(positive) * 100
            print(f"    {bucket:<10s}  {count:>6d} ({pct_val:>5.1f}%)  {bar}")

        print(f"\n    Percentiles:")
        for p in [10, 25, 50, 75, 90, 95, 99]:
            val = positive.quantile(p / 100)
            print(f"      {p}th percentile: {fmt(val)}")

    # -----------------------------------------------------------------------
    # 9. SEASONALITY — MONTH-OF-YEAR AVERAGES
    # -----------------------------------------------------------------------
    if "_date" in payments.columns:
        print_section("11. SEASONALITY (AVERAGE REVENUE BY MONTH OF YEAR)")

        payments["_month_num"] = payments["_date"].apply(lambda d: d.month)
        monthly_by_num = payments.groupby("_month_num").agg(
            total_revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
        )
        # Count distinct years per month to get average
        years_per_month = payments.groupby("_month_num")["_year"].nunique()
        monthly_by_num["num_years"] = years_per_month
        monthly_by_num["avg_monthly_revenue"] = monthly_by_num["total_revenue"] / monthly_by_num["num_years"]

        month_names = {1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
                       7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"}

        max_avg = monthly_by_num["avg_monthly_revenue"].max() if len(monthly_by_num) > 0 else 1
        for m_num, row in monthly_by_num.iterrows():
            bar_len = int(row["avg_monthly_revenue"] / max_avg * 35) if max_avg > 0 else 0
            bar = "█" * bar_len
            m_name = month_names.get(int(m_num), "???")
            print(f"    {m_name}  {fmt(row['avg_monthly_revenue']):>12s}  (avg over {int(row['num_years'])} yrs)  {bar}")

    # -----------------------------------------------------------------------
    # 10. STAFF PERFORMANCE (if available)
    # -----------------------------------------------------------------------
    if cols.get("staff") and payments[cols["staff"]].notna().any():
        print_section("12. STAFF PERFORMANCE")
        staff = payments[payments[cols["staff"]].notna()].groupby(cols["staff"]).agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
            avg_txn=("_revenue", "mean"),
        ).sort_values("revenue", ascending=False)
        for name, row in staff.iterrows():
            print(f"    {name:<25s}  {fmt(row['revenue']):>12s}  ({int(row['transactions']):>5d} txns)  avg {fmt(row['avg_txn'])}")

    # -----------------------------------------------------------------------
    # 11. CUSTOMER INSIGHTS (if available)
    # -----------------------------------------------------------------------
    if cols.get("customer") and payments[cols["customer"]].notna().any():
        print_section("13. TOP 15 CUSTOMERS BY REVENUE")
        customers = payments[payments[cols["customer"]].notna() &
                            (payments[cols["customer"]].str.strip() != "")].groupby(cols["customer"]).agg(
            revenue=("_revenue", "sum"),
            transactions=("_revenue", "count"),
            avg_txn=("_revenue", "mean"),
            first_visit=("_date", "min"),
            last_visit=("_date", "max"),
        ).sort_values("revenue", ascending=False)

        for i, (name, row) in enumerate(customers.head(15).iterrows(), 1):
            first = row["first_visit"].strftime("%Y-%m-%d") if pd.notna(row["first_visit"]) else "?"
            last = row["last_visit"].strftime("%Y-%m-%d") if pd.notna(row["last_visit"]) else "?"
            print(f"    {i:>2}. {name:<30s}  {fmt(row['revenue']):>10s}  ({int(row['transactions'])} txns)  avg {fmt(row['avg_txn'])}")
            print(f"        First: {first}  Last: {last}")

        total_customers = len(customers)
        print(f"\n    Total unique customers: {total_customers:,}")

    # -----------------------------------------------------------------------
    # 12. ITEMS & CATEGORIES ANALYSIS
    # -----------------------------------------------------------------------
    if items_result is not None:
        idf = items_result["df"]
        icols = items_result["columns"]

        if icols.get("item") and icols.get("revenue"):
            print_section("14. TOP 20 ITEMS BY REVENUE")
            items_grouped = idf[idf[icols["item"]].notna()].groupby(icols["item"]).agg(
                revenue=("_revenue", "sum"),
                qty=("_qty", "sum") if "_qty" in idf.columns else ("_revenue", "count"),
            ).sort_values("revenue", ascending=False)

            report["top_items"] = []
            for i, (item, row) in enumerate(items_grouped.head(20).iterrows(), 1):
                qty_str = f"{int(row['qty'])} sold" if "_qty" in idf.columns else f"{int(row['qty'])} txns"
                print(f"    {i:>2}. {item}")
                print(f"        Revenue: {fmt(row['revenue'])}  |  {qty_str}")
                report["top_items"].append({
                    "item": item,
                    "revenue": round(row["revenue"], 2),
                })

        if icols.get("category") and icols.get("revenue"):
            print_section("15. CATEGORIES BY REVENUE")
            cats = idf[idf[icols["category"]].notna() &
                       (idf[icols["category"]].str.strip() != "")].groupby(icols["category"]).agg(
                revenue=("_revenue", "sum"),
                qty=("_qty", "sum") if "_qty" in idf.columns else ("_revenue", "count"),
            ).sort_values("revenue", ascending=False)

            total_cat_rev = cats["revenue"].sum()
            for i, (cat, row) in enumerate(cats.iterrows(), 1):
                qty_str = f"{int(row['qty'])} sold" if "_qty" in idf.columns else f"{int(row['qty'])} txns"
                print(f"    {i:>2}. {cat:<35s}  {fmt(row['revenue']):>12s}  ({qty_str})  {pct(row['revenue'], total_cat_rev):>6s}")

        # Items trending — compare last year to previous year
        if icols.get("item") and "_year" in idf.columns and icols.get("revenue"):
            years = sorted(idf["_year"].dropna().unique())
            if len(years) >= 2:
                last_year = years[-1]
                prev_year = years[-2]
                print_section(f"16. ITEM TRENDS ({int(prev_year)} → {int(last_year)})")

                ly = idf[idf["_year"] == last_year].groupby(icols["item"])["_revenue"].sum()
                py = idf[idf["_year"] == prev_year].groupby(icols["item"])["_revenue"].sum()

                all_items = set(ly.index) | set(py.index)
                trends = []
                for item in all_items:
                    rev_ly = ly.get(item, 0)
                    rev_py = py.get(item, 0)
                    if rev_py > 50:  # only items with meaningful prior revenue
                        growth = (rev_ly - rev_py) / rev_py * 100
                        trends.append((item, rev_py, rev_ly, growth))

                trends.sort(key=lambda x: x[3], reverse=True)

                if trends:
                    print("\n  FASTEST GROWING:")
                    for item, rev_py, rev_ly, growth in trends[:10]:
                        arrow = "↑" if growth > 0 else "↓"
                        print(f"    {arrow} {item:<35s}  {fmt(rev_py):>10s} → {fmt(rev_ly):>10s}  ({growth:>+.1f}%)")

                    print("\n  BIGGEST DECLINES:")
                    for item, rev_py, rev_ly, growth in trends[-5:]:
                        arrow = "↑" if growth > 0 else "↓"
                        print(f"    {arrow} {item:<35s}  {fmt(rev_py):>10s} → {fmt(rev_ly):>10s}  ({growth:>+.1f}%)")

    # -----------------------------------------------------------------------
    # FINAL SUMMARY
    # -----------------------------------------------------------------------
    print("\n")
    print("*" * 70)
    print("*" + " " * 68 + "*")
    print("*" + "SUMMARY".center(68) + "*")
    print("*" + " " * 68 + "*")
    print("*" * 70)

    print(f"""
  Business Lifespan:     {span_str}
  Total Revenue:         {fmt(total_revenue)}
  Total Transactions:    {total_txns:,}
  Avg Transaction:       {fmt(avg_txn)}
  Median Transaction:    {fmt(median_txn)}
""")

    if "_date_str" in payments.columns and len(daily) > 0:
        best_day = daily.head(1)
        best_day_key = best_day.index[0]
        try:
            best_day_label = datetime.strptime(best_day_key, "%Y-%m-%d").strftime("%A, %B %d, %Y")
        except ValueError:
            best_day_label = best_day_key
        print(f"  Best Single Day:       {best_day_label}")
        print(f"                         {fmt(best_day.iloc[0]['revenue'])} ({int(best_day.iloc[0]['transactions'])} transactions)")

    if "_month" in payments.columns:
        sorted_months_final = monthly.sort_values("revenue", ascending=False)
        best_month_key = sorted_months_final.index[0]
        best_month_row = sorted_months_final.iloc[0]
        try:
            best_month_label = datetime.strptime(best_month_key + "-01", "%Y-%m-%d").strftime("%B %Y")
        except ValueError:
            best_month_label = best_month_key
        print(f"  Best Month:            {best_month_label}")
        print(f"                         {fmt(best_month_row['revenue'])} ({int(best_month_row['transactions'])} transactions)")

    if "_fees" in payments.columns:
        total_fees_val = payments["_fees"].sum()
        print(f"\n  Total Square Fees:     {fmt(total_fees_val)}")
        if total_revenue > 0:
            print(f"  Effective Fee Rate:    {abs(total_fees_val) / total_revenue * 100:.2f}%")

    if "_net_total" in payments.columns:
        net_val = payments["_net_total"].sum()
        print(f"  Net After Fees:        {fmt(net_val)}")

    print(f"\n{'*' * 70}")

    return report


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    data_dir = sys.argv[1] if len(sys.argv) > 1 else DATA_DIR

    if not os.path.isdir(data_dir):
        print(f"ERROR: Data directory not found: {data_dir}")
        print(f"Usage: python {sys.argv[0]} [data_directory]")
        print(f"\nPlace your Square CSV exports in: {data_dir}")
        sys.exit(1)

    print("=" * 70)
    print("  THE MOUNTING MAN — Square CSV Data Analyzer")
    print("=" * 70)
    print(f"\n  Data directory: {data_dir}")

    # Discover files
    print("\nDiscovering CSV files …")
    files = find_csv_files(data_dir)
    total_files = sum(len(v) for v in files.values())
    print(f"  Found {total_files} CSV file(s): "
          f"{len(files['transactions'])} transactions, "
          f"{len(files['items'])} items, "
          f"{len(files['sales_summary'])} sales summaries")

    if total_files == 0:
        print(f"\nNo CSV files found in {data_dir}")
        print("Expected files matching: transactions-*.csv, items-*.csv, sales-summary-*.csv")
        sys.exit(1)

    # Load data
    print("\nLoading transaction files …")
    txn_df = load_csv_files(files["transactions"], "transactions")

    print("\nLoading item files …")
    items_df = load_csv_files(files["items"], "items")

    print("\nLoading sales summary files …")
    summary_df = load_csv_files(files["sales_summary"], "sales summaries")

    # Analyze
    print("\nAnalyzing transactions …")
    txn_result = analyze_transactions(txn_df)

    print("\nAnalyzing items …")
    items_result = analyze_items(items_df)

    # Generate report
    report = generate_report(txn_result, items_result, summary_df)

    # Save JSON
    output_path = os.path.join(os.path.dirname(__file__), "analysis_results.json")
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"\nStructured results saved to: {output_path}")


if __name__ == "__main__":
    main()
