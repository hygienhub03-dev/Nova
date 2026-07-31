import * as SQLite from 'expo-sqlite';
import { MemoryEngine } from './MemoryEngine';

const db = SQLite.openDatabaseSync('nova_habits.db');

db.execSync(`
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

export class HabitEngine {

  static createHabit(data: {
    name: string;
    description: string;
    trigger_type: string;
    trigger_value: string;
    action_type: string;
    action_params: Record<string, any>;
  }): number {
    const now = Date.now();
    const params = JSON.stringify(data.action_params);
    const id = db.runSync(
      'INSERT INTO habits (name, description, trigger_type, trigger_value, action_type, action_params, confidence, times_triggered, times_successful, last_triggered, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 0.5, 0, 0, NULL, 1, ?)',
      [data.name, data.description, data.trigger_type, data.trigger_value, data.action_type, params, now]
    );
    return id;
  }

  static getHabits(): any[] {
    return db.getAllSync('SELECT * FROM habits WHERE is_active = 1 ORDER BY confidence DESC');
  }

  static getAllHabits(): any[] {
    return db.getAllSync('SELECT * FROM habits ORDER BY created_at DESC');
  }

  static getHabit(id: number): any {
    return db.getFirstSync('SELECT * FROM habits WHERE id = ?', [id]);
  }

  static updateConfidence(id: number, success: boolean): void {
    const habit = db.getFirstSync('SELECT * FROM habits WHERE id = ?', [id]);
    if (!habit) return;

    const newTriggers = habit.times_triggered + 1;
    const newSuccessful = success ? habit.times_successful + 1 : habit.times_successful;
    const newConfidence = Math.min(1, newSuccessful / Math.max(1, newTriggers));

    db.runSync(
      'UPDATE habits SET times_triggered = ?, times_successful = ?, confidence = ?, last_triggered = ? WHERE id = ?',
      [newTriggers, newSuccessful, newConfidence, Date.now(), id]
    );
  }

  static toggleHabit(id: number, active: boolean): void {
    db.runSync('UPDATE habits SET is_active = ? WHERE id = ?', [active ? 1 : 0, id]);
  }

  static deleteHabit(id: number): void {
    db.runSync('DELETE FROM routine_log WHERE habit_id = ?', [id]);
    db.runSync('DELETE FROM habits WHERE id = ?', [id]);
  }

  static logExecution(habitId: number, trigger: string, action: string, status: string): void {
    db.runSync(
      'INSERT INTO routine_log (habit_id, trigger, action, status, executed_at) VALUES (?, ?, ?, ?, ?)',
      [habitId, trigger, action, status, Date.now()]
    );
  }

  static getRoutineLog(limit: number = 50): any[] {
    return db.getAllSync(
      `SELECT rl.*, h.name as habit_name FROM routine_log rl
       LEFT JOIN habits h ON rl.habit_id = h.id
       ORDER BY rl.executed_at DESC LIMIT ?`,
      [limit]
    );
  }

  static checkTriggers(context: { location?: string; timeOfDay?: string; event?: string; deviceState?: any }): any[] {
    const habits = db.getAllSync('SELECT * FROM habits WHERE is_active = 1');
    const triggered: any[] = [];

    habits.forEach((habit: any) => {
      const match = this.matchTrigger(habit, context);
      if (match) {
        triggered.push({ ...habit, matchReason: match });
      }
    });

    return triggered;
  }

  private static matchTrigger(habit: any, context: any): string | null {
    switch (habit.trigger_type) {
      case 'time':
        return this.matchTimeTrigger(habit, context);
      case 'event':
        return this.matchEventTrigger(habit, context);
      case 'location':
        return this.matchLocationTrigger(habit, context);
      case 'device':
        return this.matchDeviceTrigger(habit, context);
      default:
        return null;
    }
  }

  private static matchTimeTrigger(habit: any, context: any): string | null {
    if (!context.timeOfDay) return null;
    const habitTime = habit.trigger_value;
    const currentTime = context.timeOfDay;
    const diff = Math.abs(this.timeDiff(habitTime, currentTime));
    return diff < 30 ? `time_match:${habitTime}` : null;
  }

  private static matchEventTrigger(habit: any, context: any): string | null {
    if (!context.event) return null;
    return context.event === habit.trigger_value ? `event:${habit.trigger_value}` : null;
  }

  private static matchLocationTrigger(habit: any, context: any): string | null {
    if (!context.location) return null;
    const habitLoc = habit.trigger_value.toLowerCase();
    const currentLoc = context.location.toLowerCase();
    if (habitLoc === currentLoc) return `location:${habitLoc}`;
    if (currentLoc.includes(habitLoc) || habitLoc.includes(currentLoc)) return `location_near:${habitLoc}`;
    return null;
  }

  private static matchDeviceTrigger(habit: any, context: any): string | null {
    if (!context.deviceState) return null;
    const params = JSON.parse(habit.action_params || '{}');
    const deviceId = params.deviceId || '';
    const deviceState = context.deviceState[deviceId];
    if (deviceState !== undefined) return `device:${deviceId}`;
    return null;
  }

  private static timeDiff(time1: string, time2: string): number {
    const parse = (t: string) => {
      const parts = t.split(':').map((p) => parseInt(p));
      return parts[0] * 60 + (parts[1] || 0);
    };
    return Math.abs(parse(time1) - parse(time2));
  }

  static generateProactiveSuggestions(context: any): any[] {
    const suggestions: any[] = [];
    const habits = this.getHabits();
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = `${hour}:${String(now.getMinutes()).padStart(2, '0')}`;

    habits.forEach((habit: any) => {
      const confidence = habit.confidence;
      if (confidence < 0.3) return;

      if (habit.trigger_type === 'time') {
        const diff = Math.abs(this.timeDiff(habit.trigger_value, timeOfDay));
        if (diff < 60 && diff > 5) {
          suggestions.push({
            id: `suggestion_${habit.id}_${Date.now()}`,
            type: 'proactive',
            title: `Ready to: ${habit.name}`,
            description: `${habit.description} (Confidence: ${Math.round(confidence * 100)}%)`,
            action_type: habit.action_type,
            action_params: JSON.parse(habit.action_params || '{}'),
            confidence,
            habitId: habit.id,
          });
        }
      }
    });

    return suggestions;
  }

  static recordSuggestionDismissal(suggestionId: string): void {
    db.runSync('UPDATE proactive_suggestions SET dismissed = 1 WHERE id = ?', [suggestionId]);
  }

  static recordSuggestionShown(suggestionId: string): void {
    db.runSync('UPDATE proactive_suggestions SET shown = 1 WHERE id = ?', [suggestionId]);
  }

  static getPendingSuggestions(): any[] {
    return db.getAllSync(
      'SELECT * FROM proactive_suggestions WHERE shown = 0 AND dismissed = 0 ORDER BY confidence DESC LIMIT 5'
    );
  }
}