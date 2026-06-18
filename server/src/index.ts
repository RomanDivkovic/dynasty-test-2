import express from "express";
import cors from "cors";
import { initializeDatabase } from "./persistence/sqlite.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const db = initializeDatabase();

app.get("/health", (_req, res) => {
  res.json({ ok: true, database: db.path });
});

app.get("/schema", (_req, res) => {
  res.json({ tables: db.tables });
});

app.listen(port, () => {
  console.log(`Basketball Dynasty Manager API listening on http://127.0.0.1:${port}`);
});
