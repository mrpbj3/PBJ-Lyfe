// server/pbj-db.ts
import Database from "better-sqlite3";

// creates/opens pbj.sqlite at repo root
export const db = new Database("pbj.sqlite");
db.pragma("foreign_keys = ON");

// idempotent schema: safe to run every boot
db.exec(`
create table if not exists sleep_sessions (
  id text primary key,
  start_at text not null,
  end_at   text not null,
  duration_min integer not null,
  notes text
);
create table if not exists body_metrics (
  id text primary key,
  date text not null,
  weight_kg real not null
);
create table if not exists meals (
  id text primary key,
  date text not null,
  calories integer not null,
  notes text
);
create table if not exists workouts (
  id text primary key,
  date text not null,
  start_at text,
  end_at text,
  duration_min integer not null default 0,
  notes text
);
create table if not exists analytics_daily (
  date text primary key,
  sleep_min integer not null default 0,
  kcal_intake integer not null default 0,
  kcal_goal integer not null default 1700,
  gym_duration_min integer not null default 0,
  color text not null default 'red'
);
`);
