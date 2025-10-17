import sqlite3
import uuid
import hashlib

conn = sqlite3.connect('tregu.db')
cursor = conn.cursor()

# Delete existing admin user if exists
cursor.execute('DELETE FROM users WHERE email = ?', ('admin@tregu.com',))

# Create tenant
tenant_id = str(uuid.uuid4())
cursor.execute('INSERT INTO tenants (id, name) VALUES (?, ?)', (tenant_id, 'tregu-admin'))

# Create admin user with simple hash
password_hash = hashlib.sha256("Admin123!".encode()).hexdigest()
cursor.execute('''
INSERT INTO users (id, tenant_id, email, password_hash, role, created_at)
VALUES (?, ?, ?, ?, ?, datetime('now'))
''', (str(uuid.uuid4()), tenant_id, 'admin@tregu.com', password_hash, 'admin'))

conn.commit()
conn.close()

print("Admin user created successfully with hash:", password_hash)