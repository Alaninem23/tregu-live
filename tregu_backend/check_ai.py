import sqlite3

conn = sqlite3.connect('tregu.db')
cursor = conn.cursor()

# Check AI tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ai_%'")
tables = cursor.fetchall()
print('AI tables:', tables)

# Check AI characters count
if tables:
    try:
        cursor.execute('SELECT COUNT(*) FROM ai_characters')
        count = cursor.fetchone()[0]
        print(f'AI characters count: {count}')

        # List characters
        cursor.execute('SELECT id, name, personality FROM ai_characters')
        characters = cursor.fetchall()
        print('Characters:')
        for char in characters:
            print(f'- ID: {char[0]}, Name: {char[1]}, Personality: {char[2][:50]}...')
    except Exception as e:
        print(f'Error querying characters: {e}')

conn.close()