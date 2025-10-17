import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from app.db import engine

def run_sql(path: str):
    with engine.begin() as conn:
        with open(path, 'r', encoding='utf-8') as f:
            sql = f.read()
        for stmt in sql.split(';'):
            s = stmt.strip()
            if not s:
                continue
            conn.execute(text(s))

def main():
    sql_dir = os.path.join(os.path.dirname(__file__), 'sql')
    if not os.path.isdir(sql_dir):
        print("No SQL directory found, skipping")
        return
    files = [f for f in os.listdir(sql_dir) if f.endswith('.sql')]
    files.sort()
    if not files:
        print("No SQL files found, skipping")
        return
    print(f"Applying SQL migrations in {sql_dir}...")
    for name in files:
        path = os.path.join(sql_dir, name)
        print(f" - {name}")
        run_sql(path)
    print("All SQL migrations applied.")

if __name__ == '__main__':
    main()
