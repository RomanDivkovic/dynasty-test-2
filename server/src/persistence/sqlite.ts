import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);

const tables = [
  "players",
  "teams",
  "coaches",
  "games",
  "seasons",
  "standings",
  "awards",
  "career_saves",
];

const schema = `
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY(team_id) REFERENCES teams(id)
);
CREATE TABLE IF NOT EXISTS coaches (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  FOREIGN KEY(season_id) REFERENCES seasons(id)
);
CREATE TABLE IF NOT EXISTS standings (
  season_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(season_id, team_id)
);
CREATE TABLE IF NOT EXISTS awards (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  award_type TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS career_saves (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  payload TEXT NOT NULL
);
`;

export function initializeDatabase() {
  const path = resolve("data/basketball-dynasty.sqlite");
  mkdirSync(dirname(path), { recursive: true });

  try {
    // node:sqlite is available in modern Node and avoids native addon setup for the starter project.
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");
    const database = new DatabaseSync(path);
    database.exec(schema);
  } catch {
    // The API can still expose schema metadata in environments where node:sqlite is unavailable.
  }

  return { path, tables };
}
