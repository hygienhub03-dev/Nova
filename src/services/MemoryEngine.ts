import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('nova_memory.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    content TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS learned_qa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT,
    keywords TEXT
  );

  CREATE TABLE IF NOT EXISTS smart_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE,
    name TEXT,
    type TEXT,
    brand TEXT,
    ip_address TEXT,
    zone TEXT,
    status TEXT,
    capabilities TEXT,
    config TEXT,
    last_seen INTEGER
  );

  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    trigger_type TEXT,
    trigger_value TEXT,
    action_type TEXT,
    action_params TEXT,
    confidence REAL DEFAULT 0.5,
    times_triggered INTEGER DEFAULT 0,
    times_successful INTEGER DEFAULT 0,
    last_triggered INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS routine_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER,
    trigger TEXT,
    action TEXT,
    status TEXT,
    executed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS proactive_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    title TEXT,
    description TEXT,
    action_type TEXT,
    action_params TEXT,
    confidence REAL DEFAULT 0.5,
    shown INTEGER DEFAULT 0,
    dismissed INTEGER DEFAULT 0,
    created_at INTEGER
  );
`);

export class MemoryEngine {

  static saveFact(category: string, content: string) {
    db.runSync(
      'INSERT INTO facts (category, content, timestamp) VALUES (?, ?, ?)',
      [category, content, Date.now()]
    );
  }

  static saveLearnedQA(question: string, answer: string, keywords: string[]) {
    db.runSync(
      'INSERT INTO learned_qa (question, answer, keywords) VALUES (?, ?, ?)',
      [question, answer, keywords.join(',')]
    );
  }

  static getAllFacts(): any[] {
    return db.getAllSync('SELECT * FROM facts ORDER BY timestamp DESC');
  }

  static getAllLearnedQA(): any[] {
    return db.getAllSync('SELECT * FROM learned_qa ORDER BY id DESC');
  }

  static getMemoriesForPrompt(userQuery: string): string {
    const facts = db.getAllSync(
      'SELECT content FROM facts WHERE content LIKE ? ORDER BY timestamp DESC LIMIT 3',
      [`%${userQuery}%`]
    );

    const pastQA = db.getAllSync(
      'SELECT question, answer FROM learned_qa WHERE question LIKE ? OR keywords LIKE ? LIMIT 2',
      [`%${userQuery}%`, `%${userQuery}%`]
    );

    let memoryContext = '';

    if (facts.length > 0) {
      memoryContext += '### User Facts & Preferences:\n';
      facts.forEach((f: any) => { memoryContext += `- ${f.content}\n`; });
    }

    if (pastQA.length > 0) {
      memoryContext += '### Past Successful Answers (Use these to answer locally):\n';
      pastQA.forEach((qa: any) => {
        memoryContext += `Q: ${qa.question}\nA: ${qa.answer}\n`;
      });
    }

    return memoryContext;
  }

  static clearAll() {
    db.runSync('DELETE FROM facts');
    db.runSync('DELETE FROM learned_qa');
  }
}
