import sqlite3
conn = sqlite3.connect('tregu.db')
cursor = conn.cursor()
cursor.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = [row[0] for row in cursor.fetchall()]
print('Tables:', tables)
if 'users' in tables:
    cursor.execute('SELECT COUNT(*) FROM users')
    count = cursor.fetchone()[0]
    print(f'Users count: {count}')
    if count > 0:
        cursor.execute('SELECT id, email, role FROM users LIMIT 5')
        users = cursor.fetchall()
        print('Sample users:', users)
if 'inventory_categories' in tables:
    cursor.execute('SELECT COUNT(*) FROM inventory_categories')
    count = cursor.fetchone()[0]
    print(f'Categories count: {count}')
    cursor.execute('SELECT id, name, parent_id FROM inventory_categories LIMIT 5')
    categories = cursor.fetchall()
    print('Sample categories:', categories)
conn.close()