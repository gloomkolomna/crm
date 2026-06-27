import sqlite3
conn = sqlite3.connect('uchet.db')
c = conn.cursor()

# Check all tables
c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in c.fetchall()]
print("=== TABLES ===")
for t in tables:
    print(f"  {t}")

# Check orders columns
print("\n=== ORDERS COLUMNS ===")
c.execute("PRAGMA table_info(orders)")
for r in c.fetchall():
    print(f"  {r[1]} ({r[2]})")

# Check orders data
print("\n=== ORDERS DATA ===")
c.execute("SELECT * FROM orders")
rows = c.fetchall()
print(f"  Count: {len(rows)}")
for r in rows[:3]:
    print(f"  {r}")

# Check shipping_methods
print("\n=== SHIPPING METHODS ===")
c.execute("SELECT * FROM shipping_methods")
rows = c.fetchall()
print(f"  Count: {len(rows)}")
for r in rows:
    print(f"  {r}")

# Check alembic version
print("\n=== ALEMBIC VERSION ===")
c.execute("SELECT version_num FROM alembic_version")
print(f"  {c.fetchone()}")

conn.close()