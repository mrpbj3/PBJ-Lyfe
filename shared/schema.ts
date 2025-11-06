// PBJ Health - Complete Database Schema
// Reference: Replit Auth + PostgreSQL blueprints
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  index,
  jsonb,
  date,
  integer,
  numeric,
  boolean,
  uuid,
  check,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ============================================================================
// SESSION & AUTH (Required for Replit Auth)
// ============================================================================

export const sessions = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)]
);

export const users = pgTable('users', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email').unique(),
  firstName: varchar('first_name'),
  lastName: varchar('last_name'),
  profileImageUrl: varchar('profile_image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================================================
// USER PROFILE & GOALS
// ============================================================================

export const profiles = pgTable('profiles', {
  userId: varchar('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  age: integer('age'),
  gender: varchar('gender', { length: 10 }),
  heightCm: numeric('height_cm', { precision: 5, scale: 2 }),
  activityFactor: numeric('activity_factor', { precision: 3, scale: 2 }).default('1.2'),
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
  inRecovery: boolean('in_recovery').default(false),
  profileJson: jsonb('profile_json').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const goals = pgTable('goals', {
  userId: varchar('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  goalWeightKg: numeric('goal_weight_kg', { precision: 6, scale: 2 }),
  paceLbPerWeek: numeric('pace_lb_per_week', { precision: 4, scale: 2 }),
  stepGoal: integer('step_goal').default(10000),
  kcalGoal: integer('kcal_goal').default(2000),
  kcalFloor: integer('kcal_floor').default(1500),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================================
// SLEEP TRACKING
// ============================================================================

export const sleepSessions = pgTable('sleep_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  quality: integer('quality'),
  dreamType: text('dream_type'),
  dreamDescription: text('dream_description'),
  notes: text('notes'),
}, (table) => [
  check('sleep_dream_type_check', sql`dream_type IN ('dream', 'nightmare', 'none') OR dream_type IS NULL`),
]);

// ============================================================================
// BODY METRICS (Weight, Body Composition)
// ============================================================================

export const bodyMetrics = pgTable('body_metrics', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  weightKg: numeric('weight_kg', { precision: 6, scale: 2 }).notNull(),
  bodyFatPct: numeric('body_fat_pct', { precision: 5, scale: 2 }),
  muscleKg: numeric('muscle_kg', { precision: 6, scale: 2 }),
  waterPct: numeric('water_pct', { precision: 5, scale: 2 }),
  visceralFat: numeric('visceral_fat', { precision: 5, scale: 2 }),
  source: text('source'),
  rawJson: jsonb('raw_json'),
}, (table) => [
  index('body_metrics_user_date_idx').on(table.userId, table.date),
]);

// ============================================================================
// STEPS TRACKING
// ============================================================================

export const steps = pgTable('steps', {
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  steps: integer('steps').notNull().default(0),
  activeMinutes: integer('active_minutes'),
  source: text('source'),
}, (table) => [
  index('steps_user_date_idx').on(table.userId, table.date),
]);

// ============================================================================
// NUTRITION TRACKING
// ============================================================================

export const meals = pgTable('meals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  mealType: text('meal_type'),
  calories: integer('calories').notNull(),
  proteinG: numeric('protein_g', { precision: 6, scale: 2 }),
  carbsG: numeric('carbs_g', { precision: 6, scale: 2 }),
  fatG: numeric('fat_g', { precision: 6, scale: 2 }),
  notes: text('notes'),
}, (table) => [
  index('meals_user_date_idx').on(table.userId, table.date),
]);

// ============================================================================
// WORKOUT TRACKING
// ============================================================================

export const workouts = pgTable('workouts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  templateId: text('template_id'),
  rpe: numeric('rpe', { precision: 4, scale: 2 }),
  exercises: text('exercises').array(),
  notes: text('notes'),
  durationMin: integer('duration_min'),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
}, (table) => [
  index('workouts_user_date_idx').on(table.userId, table.date),
]);

export const exercises = pgTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  equipment: text('equipment'),
  primaryMuscle: text('primary_muscle'),
  smithFriendlyBool: boolean('smith_friendly_bool').default(false),
});

export const workoutSets = pgTable('workout_sets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workoutId: uuid('workout_id').references(() => workouts.id, { onDelete: 'cascade' }).notNull(),
  exerciseId: text('exercise_id').references(() => exercises.id),
  setNo: integer('set_no'),
  weightKg: numeric('weight_kg', { precision: 6, scale: 2 }),
  reps: integer('reps'),
  rir: integer('rir'),
});

// ============================================================================
// MENTAL HEALTH & DREAMS
// ============================================================================

export const mentalLogs = pgTable('mental_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  rating: text('rating').notNull(),
  why: text('why'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  check('mental_rating_check', sql`rating IN ('great', 'ok', 'bad')`),
  index('mental_logs_user_date_idx').on(table.userId, table.date),
]);

export const dreamEntries = pgTable('dream_entries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  title: text('title'),
  narrative: text('narrative'),
  tags: text('tags').array(),
  emotion: integer('emotion'),
  intensity: integer('intensity'),
  aiSummary: text('ai_summary'),
  aiThemes: text('ai_themes').array(),
  aiAdvice: text('ai_advice'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  check('dream_emotion_check', sql`emotion >= 1 AND emotion <= 5`),
  check('dream_intensity_check', sql`intensity >= 1 AND intensity <= 5`),
  index('dream_entries_user_date_idx').on(table.userId, table.date),
]);

// ============================================================================
// WORK & STRESS
// ============================================================================

export const workLogs = pgTable('work_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
  stress: text('stress'),
  why: text('why'),
}, (table) => [
  check('work_stress_check', sql`stress IN ('low', 'medium', 'high')`),
  index('work_logs_user_date_idx').on(table.userId, table.date),
]);

// ============================================================================
// MEDITATION
// ============================================================================

export const meditationSessions = pgTable('meditation_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  durationMin: integer('duration_min').notNull(),
  feeling: text('feeling'),
  startedAt: timestamp('started_at').defaultNow(),
}, (table) => [
  check('meditation_feeling_check', sql`feeling IN ('calm', 'neutral', 'restless')`),
  index('meditation_sessions_user_date_idx').on(table.userId, table.date),
]);

// ============================================================================
// HOBBIES & SOCIAL
// ============================================================================

export const hobbies = pgTable('hobbies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  primaryHobby: boolean('primary_hobby').notNull().default(false),
});

export const hobbySessions = pgTable('hobby_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  hobbyId: uuid('hobby_id').references(() => hobbies.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }),
  endAt: timestamp('end_at', { withTimezone: true }),
  durationMin: integer('duration_min'),
}, (table) => [
  index('hobby_sessions_user_date_idx').on(table.userId, table.date),
]);

export const socialLogs = pgTable('social_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  activity: text('activity').notNull(),
  durationMin: integer('duration_min').default(0),
}, (table) => [
  index('social_logs_user_date_idx').on(table.userId, table.date),
]);

export const hobbyLogs = pgTable('hobby_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  hobby: text('hobby').notNull(),
  durationMin: integer('duration_min').default(0),
}, (table) => [
  index('hobby_logs_user_date_idx').on(table.userId, table.date),
]);

// ============================================================================
// DRUGS & RECOVERY
// ============================================================================

export const drugProfiles = pgTable('drug_profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: text('type'),
  inRecovery: boolean('in_recovery').notNull().default(false),
  cleanSince: date('clean_since'),
  goal: text('goal'),
});

export const drugUseLogs = pgTable('drug_use_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  drugId: uuid('drug_id').references(() => drugProfiles.id, { onDelete: 'cascade' }),
  drugName: text('drug_name').notNull(),
  amount: text('amount'),
  isPrescribed: boolean('is_prescribed').default(false).notNull(),
  notes: text('notes'),
}, (table) => [
  index('drug_use_logs_user_date_idx').on(table.userId, table.date),
]);

export const withdrawalSymptoms = pgTable('withdrawal_symptoms', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  drugId: uuid('drug_id').references(() => drugProfiles.id, { onDelete: 'cascade' }),
  drugName: text('drug_name').notNull(),
  symptoms: text('symptoms'),
  symptom: text('symptom'),
  strength: text('strength'),
}, (table) => [
  check('withdrawal_strength_check', sql`strength IN ('low', 'medium', 'high')`),
  index('withdrawal_symptoms_user_date_idx').on(table.userId, table.date),
]);

// ============================================================================
// ANALYTICS (Daily & Weekly)
// ============================================================================

export const analyticsDaily = pgTable('analytics_daily', {
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  sleepMin: integer('sleep_min').notNull().default(0),
  sleepOk: boolean('sleep_ok').notNull().default(false),
  kcalIntake: integer('kcal_intake').notNull().default(0),
  kcalGoal: integer('kcal_goal').notNull().default(0),
  kcalDelta: integer('kcal_delta').notNull().default(0),
  kcalOk: boolean('kcal_ok').notNull().default(false),
  kcalStatus: text('kcal_status').notNull().default('GOAL'),
  gymOk: boolean('gym_ok').notNull().default(false),
  gymStartAt: timestamp('gym_start_at', { withTimezone: true }),
  gymEndAt: timestamp('gym_end_at', { withTimezone: true }),
  gymDurationMin: integer('gym_duration_min').notNull().default(0),
  scoreSmall: integer('score_small').notNull().default(0),
  color: text('color').notNull().default('red'),
  mentalRating: text('mental_rating'),
  mentalWhy: text('mental_why'),
  dreamCount: integer('dream_count').default(0),
  meditationMin: integer('meditation_min').default(0),
  workMin: integer('work_min').default(0),
  workStress: text('work_stress'),
  socialMin: integer('social_min').default(0),
  hobbyMin: integer('hobby_min').default(0),
  topSocialActivities: text('top_social_activities').array(),
  topHobbies: text('top_hobbies').array(),
  drugSummary: text('drug_summary'),
  recoveryDays: jsonb('recovery_days'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const analyticsWeekly = pgTable('analytics_weekly', {
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  weekStart: date('week_start').notNull(),
  kcalAvg: integer('kcal_avg'),
  tdeeEst: integer('tdee_est'),
  deficitAvg: integer('deficit_avg'),
  stepsAvg: integer('steps_avg'),
  sleepAvgH: numeric('sleep_avg_h', { precision: 4, scale: 2 }),
  trendLossLb: numeric('trend_loss_lb', { precision: 5, scale: 2 }),
  notes: text('notes'),
});

// ============================================================================
// INSERT SCHEMAS (for validation)
// ============================================================================

export const insertProfileSchema = createInsertSchema(profiles).omit({
  userId: true,
  createdAt: true,
});
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export const insertGoalsSchema = createInsertSchema(goals).omit({
  userId: true,
  updatedAt: true,
});
export type InsertGoals = z.infer<typeof insertGoalsSchema>;
export type Goals = typeof goals.$inferSelect;

export const insertSleepSessionSchema = createInsertSchema(sleepSessions).omit({
  id: true,
  userId: true,
});
export type InsertSleepSession = z.infer<typeof insertSleepSessionSchema>;
export type SleepSession = typeof sleepSessions.$inferSelect;

export const insertBodyMetricsSchema = createInsertSchema(bodyMetrics).omit({
  id: true,
  userId: true,
});
export type InsertBodyMetrics = z.infer<typeof insertBodyMetricsSchema>;
export type BodyMetrics = typeof bodyMetrics.$inferSelect;

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  userId: true,
});
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof meals.$inferSelect;

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
  userId: true,
});
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

export const insertWorkoutSetSchema = createInsertSchema(workoutSets).omit({
  id: true,
});
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;
export type WorkoutSet = typeof workoutSets.$inferSelect;

export const insertMentalLogSchema = createInsertSchema(mentalLogs).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertMentalLog = z.infer<typeof insertMentalLogSchema>;
export type MentalLog = typeof mentalLogs.$inferSelect;

export const insertDreamEntrySchema = createInsertSchema(dreamEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
});
export type InsertDreamEntry = z.infer<typeof insertDreamEntrySchema>;
export type DreamEntry = typeof dreamEntries.$inferSelect;

export const insertMeditationSessionSchema = createInsertSchema(meditationSessions).omit({
  id: true,
  userId: true,
  startedAt: true,
});
export type InsertMeditationSession = z.infer<typeof insertMeditationSessionSchema>;
export type MeditationSession = typeof meditationSessions.$inferSelect;

export const insertDrugUseLogSchema = createInsertSchema(drugUseLogs).omit({
  id: true,
  userId: true,
});
export type InsertDrugUseLog = z.infer<typeof insertDrugUseLogSchema>;
export type DrugUseLog = typeof drugUseLogs.$inferSelect;

export const insertWithdrawalSymptomSchema = createInsertSchema(withdrawalSymptoms).omit({
  id: true,
  userId: true,
});
export type InsertWithdrawalSymptom = z.infer<typeof insertWithdrawalSymptomSchema>;
export type WithdrawalSymptom = typeof withdrawalSymptoms.$inferSelect;

export const insertWorkLogSchema = createInsertSchema(workLogs).omit({
  id: true,
  userId: true,
});
export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type WorkLog = typeof workLogs.$inferSelect;

export const insertSocialLogSchema = createInsertSchema(socialLogs).omit({
  id: true,
  userId: true,
});
export type InsertSocialLog = z.infer<typeof insertSocialLogSchema>;
export type SocialLog = typeof socialLogs.$inferSelect;

export const insertHobbyLogSchema = createInsertSchema(hobbyLogs).omit({
  id: true,
  userId: true,
});
export type InsertHobbyLog = z.infer<typeof insertHobbyLogSchema>;
export type HobbyLog = typeof hobbyLogs.$inferSelect;

export const insertDrugProfileSchema = createInsertSchema(drugProfiles).omit({
  id: true,
  userId: true,
});
export type InsertDrugProfile = z.infer<typeof insertDrugProfileSchema>;
export type DrugProfile = typeof drugProfiles.$inferSelect;
