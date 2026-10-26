"""Create the Supabase schema from the dashboard-friendly SQL source.

Preferred learning path: paste ``supabase/schema.sql`` into the Supabase
Dashboard SQL Editor and run it yourself. This script is an optional shortcut.

Usage:
    python scripts/01_create_schema.py

Prerequisites for the shortcut:
    - config.secret.json with SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF
"""

import json
import sys
from pathlib import Path


def main():
    try:
        secrets = json.loads(Path("config.secret.json").read_text(encoding="utf-8"))
        schema_sql = Path("supabase/schema.sql").read_text(encoding="utf-8")
    except (OSError, json.JSONDecodeError) as error:
        print(f"Could not load the schema or local secret configuration: {error}")
        sys.exit(1)

    project_ref = secrets.get("SUPABASE_PROJECT_REF")
    access_token = secrets.get("SUPABASE_ACCESS_TOKEN")
    if not project_ref or not access_token:
        print("config.secret.json must contain SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN.")
        sys.exit(1)

    try:
        import requests
    except ImportError:
        print("Install dependencies first with: pip install -r requirements.txt")
        sys.exit(1)

    endpoint = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    try:
        response = requests.post(
            endpoint,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={"query": schema_sql},
            timeout=60,
        )
    except requests.RequestException as error:
        print(f"Schema request failed: {error}")
        sys.exit(1)

    if response.status_code not in (200, 201):
        print(f"Schema creation failed ({response.status_code}): {response.text[:500]}")
        sys.exit(1)

    print("✅ Database schema created from supabase/schema.sql")
    print("   Next: python scripts/02_scrape_data.py")


if __name__ == "__main__":
    main()
