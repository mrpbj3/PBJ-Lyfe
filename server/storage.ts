// server/storage.ts
import Database from "better-sqlite3";
import OpenAI from "openai";

const db = new Database("pbj.sqlite");
db.pragma("foreign_keys = ON");

/* ---------------- Schema (idempotent) ---------------- */
db.exec(`
create table if not exists users (
  id text primary key,
  created_at text not null default (datetime('now'))
);

create table if not exists sleep_sessions (
  id text primary key, user_id text not null, start_at text not null, end_at text not null,
  duration_min integer not null,
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists body_metrics (
  id text primary key, user_id text not null, date text not null, weight_kg real not null,
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists meals (
  id text primary key, user_id text not null, date text not null, calories integer not null, 
  protein_g real, fat_g real, carbs_g real, notes text,
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists workouts (
  id text primary key, user_id text not null, date text not null, start_at text not null, end_at text not null,
  duration_min integer not null,
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists mental_logs (
  id text primary key, user_id text not null, date text not null, rating text not null, why text,
  foreign key(user_id) references users(id) on delete cascade,
  unique(user_id,date)
);

create table if not exists meditation_sessions (
  id text primary key, user_id text not null, date text not null, duration_min integer not null,
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists goals (
  user_id text primary key, kcal_goal integer default 2000, 
  updated_at text not null default (datetime('now')),
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists work_logs (
  id text primary key, user_id text not null, date text not null, stress text not null, why text,
  foreign key(user_id) references users(id) on delete cascade,
  unique(user_id,date)
);

create table if not exists hobby_logs (
  id text primary key, user_id text not null, date text not null, hobby text not null, duration_min integer,
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists social_logs (
  id text primary key, user_id text not null, date text not null, activity text not null, duration_min integer,
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists profiles (
  user_id text primary key,
  first_name text,
  last_name text,
  starting_weight real,
  units_weight text default 'lbs',
  starting_height_cm real,
  units_height text default 'cm',
  calorie_target integer default 2000,
  sleep_target_minutes integer default 480,
  workout_days_target integer default 3,
  profile_color text default '#3b82f6',
  updated_at text not null default (datetime('now')),
  foreign key(user_id) references users(id) on delete cascade
);

create table if not exists check_ins (
  id text primary key,
  user_id text not null,
  date text not null,
  weight real,
  notes text,
  created_at text not null default (datetime('now')),
  foreign key(user_id) references users(id) on delete cascade
);
`);

// Migrate existing tables to add new columns
try {
  db.exec(`ALTER TABLE meals ADD COLUMN fat_g real`);
} catch (e) { /* column already exists */ }
try {
  db.exec(`ALTER TABLE meals ADD COLUMN carbs_g real`);
} catch (e) { /* column already exists */ }
try {
  db.exec(`ALTER TABLE meals ADD COLUMN notes text`);
} catch (e) { /* column already exists */ }

// Migrate goals table - drop and recreate with new schema
try {
  const existingGoals = db.prepare(`SELECT user_id, data_json FROM goals`).all() as any[];
  db.exec(`DROP TABLE IF EXISTS goals_old`);
  db.exec(`ALTER TABLE goals RENAME TO goals_old`);
  db.exec(`
    CREATE TABLE goals (
      user_id text primary key, 
      kcal_goal integer default 2000, 
      updated_at text not null default (datetime('now')),
      foreign key(user_id) references users(id) on delete cascade
    )
  `);
  // Migrate data - preserve existing kcalGoal values from data_json
  for (const row of existingGoals) {
    let kcalGoal = 2000; // default
    try {
      const data = JSON.parse(row.data_json || '{}');
      kcalGoal = data.kcalGoal || 2000;
    } catch (e) {
      console.log('[Migration] Could not parse data_json for user', row.user_id, '- using default');
    }
    db.prepare(`INSERT INTO goals (user_id, kcal_goal) VALUES (?, ?)`).run(row.user_id, kcalGoal);
  }
  db.exec(`DROP TABLE goals_old`);
} catch (e) { 
  console.log('[Migration] Goals table migration skipped or already completed');
}

/* ---------------- helpers ---------------- */
function uuid() {
  // 32 hex chars — fine for local use
  return String(Buffer.from(db.prepare("select lower(hex(randomblob(16))) as id").get().id));
}
function ensureUser(userId: string) {
  db.prepare("insert or ignore into users(id) values (?)").run(userId);
}

/* ---------------- users ---------------- */
export async function getUser(userId: string) {
  ensureUser(userId);
  return { id: userId };
}

/* ---------------- sleep ---------------- */
export async function createSleep(userId: string, startAt: string, endAt: string) {
  ensureUser(userId);
  const duration = Math.max(
    0,
    Math.round(
      (Date.parse(endAt) - Date.parse(startAt)) / 60000
    )
  );
  const id = uuid();
  db.prepare(`insert into sleep_sessions(id,user_id,start_at,end_at,duration_min) values (?,?,?,?,?)`)
    .run(id, userId, startAt, endAt, duration);
  return { id, userId, startAt, endAt, durationMin: duration };
}

export async function getSleepByDate(userId: string, dateISO: string) {
  ensureUser(userId);
  // Match sleep sessions that END on this date (when you wake up)
  return db.prepare(
    `select id, start_at as startAt, end_at as endAt, duration_min as durationMin
     from sleep_sessions
     where user_id=? and date(end_at)=date(?)
     order by end_at asc`
  ).all(userId, dateISO);
}

/* ---------------- weight ---------------- */
export async function createWeight(userId: string, date: string, weightKg: number) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into body_metrics(id,user_id,date,weight_kg) values (?,?,date(?),?)`)
    .run(id, userId, date, weightKg);
  return { id, userId, date, weightKg };
}

export async function getWeightHistory(userId: string, limit = 30) {
  ensureUser(userId);
  return db.prepare(
    `select date, weight_kg as weightKg
     from body_metrics where user_id=? order by date desc limit ?`
  ).all(userId, limit);
}

/* ---------------- meals ---------------- */
export async function createMeal(userId: string, date: string, calories: number, proteinG?: number, fatG?: number, carbsG?: number, notes?: string) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into meals(id,user_id,date,calories,protein_g,fat_g,carbs_g,notes) values (?,?,?,?,?,?,?,?)`)
    .run(id, userId, date, calories, proteinG ?? null, fatG ?? null, carbsG ?? null, notes ?? null);
  return { id, userId, date, calories, proteinG: proteinG ?? null, fatG: fatG ?? null, carbsG: carbsG ?? null, notes };
}

export async function getMealsByDate(userId: string, date: string) {
  ensureUser(userId);
  return db.prepare(
    `select id, date, calories, protein_g as proteinG
     from meals where user_id=? and date=date(?) order by rowid asc`
  ).all(userId, date);
}

/* ---------------- workouts ---------------- */
export async function createWorkout(userId: string, date: string, startAt: string, endAt: string) {
  ensureUser(userId);
  const duration = Math.max(0, Math.round((Date.parse(endAt) - Date.parse(startAt))/60000));
  const id = uuid();
  db.prepare(`insert into workouts(id,user_id,date,start_at,end_at,duration_min) values (?,?,?,?,?,?)`)
    .run(id, userId, date, startAt, endAt, duration);
  return { id, userId, date, startAt, endAt, durationMin: duration };
}

export async function getWorkoutsByDate(userId: string, date: string) {
  ensureUser(userId);
  return db.prepare(
    `select id, date, start_at as startAt, end_at as endAt, duration_min as durationMin
     from workouts where user_id=? and date=date(?) order by start_at asc`
  ).all(userId, date);
}

/* ---------------- mental ---------------- */
export async function createMentalLog(userId: string, date: string, rating: string, why?: string) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into mental_logs(id,user_id,date,rating,why)
              values (?,?,?,?,?)
              on conflict(user_id,date) do update set rating=excluded.rating, why=excluded.why`)
    .run(id, userId, date, rating, why ?? null);
  return { userId, date, rating, why: why ?? null };
}

export async function getMentalLogByDate(userId: string, date: string) {
  ensureUser(userId);
  return db.prepare(
    `select date, rating, coalesce(why,'') as why
     from mental_logs where user_id=? and date=date(?)`
  ).get(userId, date);
}

/* ---------------- meditation ---------------- */
export async function createMeditation(userId: string, date: string, durationMin: number) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into meditation_sessions(id,user_id,date,duration_min) values (?,?,date(?),?)`)
    .run(id, userId, date, durationMin);
  return { id, userId, date, durationMin };
}

export async function getMeditationByDate(userId: string, date: string) {
  ensureUser(userId);
  return db.prepare(
    `select id, date, duration_min as durationMin
     from meditation_sessions where user_id=? and date=date(?) order by rowid asc`
  ).all(userId, date);
}

/* ---------------- goals ---------------- */
export async function upsertGoals(userId: string, data: any) {
  ensureUser(userId);
  const kcalGoal = data.kcalGoal || 2000;
  db.prepare(`insert into goals(user_id, kcal_goal) values(?,?)
              on conflict(user_id) do update set kcal_goal=excluded.kcal_goal, updated_at=datetime('now')`)
    .run(userId, kcalGoal);
  return { kcalGoal };
}

export async function getUserGoals(userId: string) {
  ensureUser(userId);
  const row = db.prepare(`select kcal_goal from goals where user_id=?`).get(userId) as any;
  return row ? { kcalGoal: row.kcal_goal } : null;
}

/* ---------------- analytics & streaks ---------------- */
export async function getDailyAnalytics(userId: string, dateISO: string) {
  ensureUser(userId);
  
  // Get user goals (default: 1700 kcal)
  const goals = await getUserGoals(userId) || { kcalGoal: 1700 };
  const kcalGoal = goals.kcalGoal || 1700;
  
  // Calculate total sleep hours for the date
  const sleepSessions = await getSleepByDate(userId, dateISO);
  const sleepHours = sleepSessions.reduce((total: number, s: any) => total + (s.durationMin / 60), 0);
  
  // Calculate total calories for the date
  const meals = await getMealsByDate(userId, dateISO);
  const calories = meals.reduce((total: number, m: any) => total + m.calories, 0);
  
  // Count workouts for the date
  const workouts = await getWorkoutsByDate(userId, dateISO);
  const workoutCount = workouts.length;
  
  // Get weight for the date (convert kg to lbs)
  const weightHistory = await getWeightHistory(userId);
  const todayWeight = weightHistory.find((w: any) => w.date === dateISO);
  const weightLbs = todayWeight ? todayWeight.weightKg / 0.453592 : null;
  
  // Calculate Big 3 score (0-3)
  let scoreSmall = 0;
  if (sleepHours >= 6) scoreSmall++; // Sleep goal: 6+ hours
  if (calories > 0 && Math.abs(calories - kcalGoal) <= kcalGoal * 0.10) scoreSmall++; // Within ±10% of goal
  if (workoutCount > 0) scoreSmall++; // At least one workout
  
  return {
    date: dateISO,
    sleepHours: Number(sleepHours.toFixed(1)),
    calories,
    workouts: workoutCount,
    weight: weightLbs,
    scoreSmall,
    kcalGoal,
  };
}

export async function getAnalyticsHistory(userId: string, days: number = 7) {
  ensureUser(userId);
  
  const today = new Date();
  const history: any[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateISO = d.toISOString().split('T')[0];
    const analytics = await getDailyAnalytics(userId, dateISO);
    history.push(analytics);
  }
  
  return history;
}

export async function getStreaks(userId: string) {
  ensureUser(userId);
  
  // Get last 30 days of analytics
  const today = new Date();
  const days: any[] = [];
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateISO = d.toISOString().split('T')[0];
    const analytics = await getDailyAnalytics(userId, dateISO);
    days.push({ date: dateISO, score: analytics.scoreSmall });
  }
  
  days.reverse(); // Oldest first
  
  // Calculate streaks from most recent backwards
  let greenStreak = 0;
  let onTrackStreak = 0;
  
  for (let i = days.length - 1; i >= 0; i--) {
    const score = days[i].score;
    
    // Green streak: consecutive 3/3 days
    if (score === 3) {
      greenStreak++;
    } else if (greenStreak === 0) {
      // Only count from most recent day
      break;
    } else {
      break;
    }
  }
  
  // On Track streak: consecutive days with 2+ or 3/3
  for (let i = days.length - 1; i >= 0; i--) {
    const score = days[i].score;
    if (score >= 2) {
      onTrackStreak++;
    } else if (onTrackStreak === 0) {
      break;
    } else {
      break;
    }
  }
  
  return {
    greenDays: greenStreak,
    onTrackDays: onTrackStreak,
  };
}

/* ---------------- things you can fill later (return empties for now) ------- */
export async function createDream(_u:string,_d:string,_t:string,_n:string){ return { ok:true }; }
export async function getDreamsByDate(_u:string,_d:string){ return []; }
/* ---------------- work stress ---------------- */
export async function createWorkLog(userId: string, date: string, stress: string, why?: string) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into work_logs(id, user_id, date, stress, why)
              values (?,?,?,?,?)
              on conflict(user_id, date) do update set stress=excluded.stress, why=excluded.why`)
    .run(id, userId, date, stress, why ?? null);
  return { userId, date, stress, why: why ?? null };
}

export async function getWorkLogsByDate(userId: string, date: string) {
  ensureUser(userId);
  return db.prepare(`select id, date, stress, why from work_logs where user_id=? and date=date(?)`)
    .all(userId, date);
}

/* ---------------- social activities ---------------- */
export async function createSocialLog(userId: string, date: string, activity: string, durationMin?: number) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into social_logs(id, user_id, date, activity, duration_min)
              values (?,?,?,?,?)`)
    .run(id, userId, date, activity, durationMin ?? 0);
  return { userId, date, activity, durationMin: durationMin ?? 0 };
}

export async function getSocialLogsByDate(userId: string, date: string) {
  ensureUser(userId);
  return db.prepare(`select id, date, activity, duration_min as durationMin from social_logs where user_id=? and date=date(?)`)
    .all(userId, date);
}

/* ---------------- hobbies ---------------- */
export async function createHobbyLog(userId: string, date: string, hobby: string, durationMin?: number) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into hobby_logs(id, user_id, date, hobby, duration_min)
              values (?,?,?,?,?)`)
    .run(id, userId, date, hobby, durationMin ?? 0);
  return { userId, date, hobby, durationMin: durationMin ?? 0 };
}

export async function getHobbyLogsByDate(userId: string, date: string) {
  ensureUser(userId);
  return db.prepare(`select id, date, hobby, duration_min as durationMin from hobby_logs where user_id=? and date=date(?)`)
    .all(userId, date);
}

// Legacy hobby functions (keeping for backwards compatibility)
export async function createHobby(_u:string,_n:string,_p:boolean){ return { ok:true }; }
export async function getUserHobbies(_u:string){ return []; }
export async function createHobbySession(_u:string,_h:string,_d:string,_m:number){ return { ok:true }; }
export async function createDrugProfile(_u:string,_n:string,_r:boolean,_c?:string){ return { ok:true }; }
export async function getUserDrugProfiles(_u:string){ return []; }
export async function createDrugUseLog(userId: string, date: string, drugName: string, amount?: string, isPrescribed?: boolean) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into drug_use_logs(id,user_id,date,drug_name,amount,is_prescribed) values (?,?,?,?,?,?)`)
    .run(id, userId, date, drugName, amount ?? null, isPrescribed ? 1 : 0);
  return { id, userId, date, drugName, amount, isPrescribed };
}

export async function createWithdrawalLog(userId: string, date: string, drugName: string, symptoms?: string) {
  ensureUser(userId);
  const id = uuid();
  db.prepare(`insert into withdrawal_symptoms(id,user_id,date,drug_name,symptoms) values (?,?,?,?,?)`)
    .run(id, userId, date, drugName, symptoms ?? null);
  return { id, userId, date, drugName, symptoms };
}

export async function calculateCaloriesWithAI(mealsDescription: string) {
  console.log('[OpenAI] Starting calorie calculation for:', mealsDescription.substring(0, 100) + '...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('[OpenAI] OPENAI_API_KEY is not set!');
    throw new Error('OpenAI API key is not configured');
  }
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `You are a nutrition expert. Analyze the following meals/beverages and estimate the total calories, protein (g), fat (g), and carbs (g).

Meals/Beverages:
${mealsDescription}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{"calories": number, "protein": number, "fat": number, "carbs": number}`;

  try {
    console.log('[OpenAI] Sending request to API...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content.trim();
    console.log('[OpenAI] Raw response:', response);
    
    const data = JSON.parse(response);
    console.log('[OpenAI] Parsed data:', data);
    
    const result = {
      calories: Math.round(data.calories),
      protein: Math.round(data.protein),
      fat: Math.round(data.fat),
      carbs: Math.round(data.carbs),
    };
    
    console.log('[OpenAI] Returning result:', result);
    return result;
  } catch (error) {
    console.error('[OpenAI] Error during calculation:', error);
    if (error instanceof Error) {
      console.error('[OpenAI] Error message:', error.message);
      console.error('[OpenAI] Error stack:', error.stack);
    }
    throw error;
  }
}

export async function getProfile(userId:string){ return { inRecovery: false }; }

export async function getProfileDetailed(userId: string) {
  ensureUser(userId);
  const row = db.prepare(`
    SELECT first_name, last_name, starting_weight, units_weight, 
           starting_height_cm, units_height, calorie_target, 
           sleep_target_minutes, workout_days_target, profile_color
    FROM profiles 
    WHERE user_id = ?
  `).get(userId) as any;
  
  if (!row) {
    return {
      firstName: '',
      lastName: '',
      startingWeight: null,
      unitsWeight: 'lbs',
      startingHeightCm: null,
      unitsHeight: 'cm',
      calorieTarget: 2000,
      sleepTargetMinutes: 480,
      workoutDaysTarget: 3,
      profileColor: '#3b82f6'
    };
  }
  
  return {
    firstName: row.first_name,
    lastName: row.last_name,
    startingWeight: row.starting_weight,
    unitsWeight: row.units_weight,
    startingHeightCm: row.starting_height_cm,
    unitsHeight: row.units_height,
    calorieTarget: row.calorie_target,
    sleepTargetMinutes: row.sleep_target_minutes,
    workoutDaysTarget: row.workout_days_target,
    profileColor: row.profile_color
  };
}

export async function updateProfileDetailed(userId: string, data: any) {
  ensureUser(userId);
  
  const stmt = db.prepare(`
    INSERT INTO profiles (
      user_id, first_name, last_name, starting_weight, units_weight,
      starting_height_cm, units_height, calorie_target, sleep_target_minutes,
      workout_days_target, profile_color, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      starting_weight = excluded.starting_weight,
      units_weight = excluded.units_weight,
      starting_height_cm = excluded.starting_height_cm,
      units_height = excluded.units_height,
      calorie_target = excluded.calorie_target,
      sleep_target_minutes = excluded.sleep_target_minutes,
      workout_days_target = excluded.workout_days_target,
      profile_color = excluded.profile_color,
      updated_at = datetime('now')
  `);
  
  stmt.run(
    userId,
    data.firstName,
    data.lastName,
    data.startingWeight,
    data.unitsWeight,
    data.startingHeightCm,
    data.unitsHeight,
    data.calorieTarget,
    data.sleepTargetMinutes,
    data.workoutDaysTarget,
    data.profileColor
  );
  
  return { success: true };
}

export async function getCheckIns(userId: string, limit?: number) {
  ensureUser(userId);
  
  let query = `
    SELECT id, date, weight, notes, created_at
    FROM check_ins
    WHERE user_id = ?
    ORDER BY date DESC
  `;
  
  if (limit) {
    query += ` LIMIT ?`;
  }
  
  const stmt = db.prepare(query);
  const rows = limit ? stmt.all(userId, limit) : stmt.all(userId);
  
  return rows.map((row: any) => ({
    id: row.id,
    date: row.date,
    weight: row.weight,
    notes: row.notes,
    createdAt: row.created_at
  }));
}

export async function createCheckIn(userId: string, date: string, weight: number, notes?: string) {
  ensureUser(userId);
  const id = Math.random().toString(36).substring(2, 15);
  
  db.prepare(`
    INSERT INTO check_ins (id, user_id, date, weight, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, date, weight, notes || null);
  
  return { id, date, weight, notes };
}

export async function getGoals(userId: string) {
  ensureUser(userId);
  const row = db.prepare(`select kcal_goal from goals where user_id = ?`).get(userId) as any;
  if (!row) return { kcalGoal: 2000 };
  return { kcalGoal: row.kcal_goal };
}
