
import sqlite3
from pathlib import Path


DATABASE_PATH = Path(__file__).parent / "fa_ah.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database():
    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id)
                    REFERENCES conversations(id)
                    ON DELETE CASCADE
            )
        """)

        connection.commit()

    finally:
        connection.close()


def create_conversation(title):
    connection = get_connection()

    try:
        cursor = connection.execute(
            "INSERT INTO conversations (title) VALUES (?)",
            (title,)
        )

        connection.commit()
        return cursor.lastrowid

    finally:
        connection.close()


def save_message(conversation_id, role, content):
    connection = get_connection()

    try:
        connection.execute("""
            INSERT INTO messages (conversation_id, role, content)
            VALUES (?, ?, ?)
        """, (conversation_id, role, content))

        connection.execute("""
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (conversation_id,))

        connection.commit()

    finally:
        connection.close()


def get_conversations():
    connection = get_connection()

    try:
        rows = connection.execute("""
            SELECT * FROM conversations
            ORDER BY updated_at DESC
        """).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def get_messages(conversation_id):
    connection = get_connection()

    try:
        rows = connection.execute("""
            SELECT * FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
        """, (conversation_id,)).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


def delete_conversation(conversation_id):
    connection = get_connection()

    try:
        connection.execute(
            "DELETE FROM conversations WHERE id = ?",
            (conversation_id,)
        )

        connection.commit()

    finally:
        connection.close()
