#!/usr/bin/env node
/**
 * Seed payroll-test shifts without the Supabase SQL Editor.
 *
 * WHAT IT DOES
 * - Inserts the same data as scripts/seed-demo-shifts-march-2026-demo.sql:
 *   8 COMPLETED (with clock actuals) + 6 PUBLISHED, anchored to Monday 2026-03-16.
 *
 * PREREQUISITES
 * 1) Supabase project with public.profiles (at least one MANAGER/OWNER and one approved EMPLOYEE).
 * 2) Environment variables (see STEP-BY-STEP below).
 *
 * RUN (from repo root):
 *   cd apps/web && node ./scripts/seed-payroll-demo.mjs
 *
 * Or with inline env:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node ./scripts/seed-payroll-demo.mjs
 */

import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = join(__dirname, "..", name);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

loadDotEnv();

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** @param {Date} base @param {number} dayOffset @param {[number,number,number]} hms */
function ts(base, dayOffset, hms) {
  const x = addDays(base, dayOffset);
  x.setHours(hms[0], hms[1], hms[2], 0);
  return x.toISOString();
}

/** Override minute offsets for variety (matches SQL intent). */
function completedRowTuned(
  employee_id,
  manager_id,
  base,
  dayOff,
  role,
  { startM = 0, endM = 0, actStartM = 5, actEndH = 17, actEndM = 55 }
) {
  const x0 = addDays(base, dayOff);
  const st = new Date(x0);
  st.setHours(10, startM, 0, 0);
  const en = new Date(x0);
  en.setHours(18, endM, 0, 0);
  const ast = new Date(x0);
  ast.setHours(10, actStartM, 0, 0);
  const aen = new Date(x0);
  aen.setHours(actEndH, actEndM, 0, 0);
  return {
    employee_id,
    manager_id,
    start_time: st.toISOString(),
    end_time: en.toISOString(),
    actual_start_time: ast.toISOString(),
    actual_end_time: aen.toISOString(),
    clock_in_lat: 51.0447,
    clock_in_long: -114.0719,
    location_id: "damascus-hq",
    status: "COMPLETED",
    unpaid_break_minutes: 30,
    is_holiday: false,
    role_at_time_of_shift: role,
  };
}

function publishedRow(employee_id, manager_id, base, dayOff, role) {
  const st = ts(base, dayOff, [10, 0, 0]);
  const en = ts(base, dayOff, [18, 0, 0]);
  return {
    employee_id,
    manager_id,
    start_time: st,
    end_time: en,
    actual_start_time: null,
    actual_end_time: null,
    clock_in_lat: null,
    clock_in_long: null,
    location_id: "damascus-hq",
    status: "PUBLISHED",
    unpaid_break_minutes: 30,
    is_holiday: false,
    role_at_time_of_shift: role,
  };
}

async function restGetFull(requestUrl, key) {
  const r = await fetch(requestUrl, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`GET ${requestUrl}: ${r.status} ${text}`);
  return text ? JSON.parse(text) : [];
}

function profilesQueryUrl(baseUrl, kind) {
  const u = new URL(`${baseUrl}/rest/v1/profiles`);
  u.searchParams.set("select", "id");
  if (kind === "manager") {
    u.searchParams.set("or", "(role.eq.OWNER,role.eq.MANAGER)");
    u.searchParams.set("limit", "1");
  } else {
    u.searchParams.set("is_approved", "eq.true");
    u.searchParams.set("or", "(role.eq.EMPLOYEE,role.eq.MANAGER)");
    u.searchParams.set("order", "full_name.asc");
    u.searchParams.set("limit", "2");
  }
  return u.toString();
}

async function restPost(url, key, table, rows) {
  const r = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`POST ${table}: ${r.status} ${text}`);
}

async function main() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    ""
  ).replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) {
    console.error(`
Missing SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY.

Get them from Supabase Dashboard → Project Settings → API:
  - Project URL  → SUPABASE_URL
  - service_role → SUPABASE_SERVICE_ROLE_KEY (keep secret; never commit)

Then either:
  export SUPABASE_URL="https://xxxx.supabase.co"
  export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
  node ./scripts/seed-payroll-demo.mjs

Or add the same keys to apps/web/.env.local (this script loads .env.local and .env).
`);
    process.exit(1);
  }

  const monday = new Date(2026, 2, 16);
  monday.setHours(0, 0, 0, 0);
  const w3 = addDays(monday, -21);
  const w2 = addDays(monday, -14);
  const w1 = addDays(monday, -7);
  const n1 = addDays(monday, 7);
  const n2 = addDays(monday, 14);
  const n3 = addDays(monday, 21);

  const managers = await restGetFull(profilesQueryUrl(url, "manager"), key);
  const emps = await restGetFull(profilesQueryUrl(url, "employee"), key);

  const mgr_id = managers[0]?.id;
  const e1 = emps[0]?.id;
  let e2 = emps[1]?.id;
  if (!mgr_id) {
    console.error("No OWNER/MANAGER profile found.");
    process.exit(1);
  }
  if (!e1) {
    console.error("No approved EMPLOYEE/MANAGER profile found.");
    process.exit(1);
  }
  if (!e2) e2 = e1;

  const completed = [
    completedRowTuned(e1, mgr_id, w3, 1, "SERVER", {
      actStartM: 5,
      actEndM: 55,
    }),
    completedRowTuned(e2, mgr_id, w3, 3, "BARTENDER", {
      actStartM: 3,
      actEndM: 58,
    }),
    completedRowTuned(e2, mgr_id, w2, 1, "SERVER", {
      actStartM: 2,
      actEndH: 18,
      actEndM: 0,
    }),
    completedRowTuned(e1, mgr_id, w2, 3, "LINE_COOK", {
      actStartM: 4,
      actEndM: 57,
    }),
    completedRowTuned(e1, mgr_id, w1, 1, "SERVER", {
      actStartM: 1,
      actEndM: 59,
    }),
    completedRowTuned(e2, mgr_id, w1, 3, "BARTENDER", {
      actStartM: 6,
      actEndM: 56,
    }),
    completedRowTuned(e1, mgr_id, monday, 1, "SERVER", {
      actStartM: 4,
      actEndM: 52,
    }),
    completedRowTuned(e2, mgr_id, monday, 3, "BARTENDER", {
      actStartM: 2,
      actEndM: 58,
    }),
  ];

  const published = [
    publishedRow(e1, mgr_id, n1, 1, "SERVER"),
    publishedRow(e2, mgr_id, n1, 3, "BARTENDER"),
    publishedRow(e2, mgr_id, n2, 1, "SERVER"),
    publishedRow(e1, mgr_id, n2, 3, "LINE_COOK"),
    publishedRow(e1, mgr_id, n3, 1, "SERVER"),
    publishedRow(e2, mgr_id, n3, 3, "BARTENDER"),
  ];

  await restPost(url, key, "shifts", completed);
  await restPost(url, key, "shifts", published);

  console.log(
    "Done: inserted 8 COMPLETED + 6 PUBLISHED shifts (anchor week starting 2026-03-16)."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
