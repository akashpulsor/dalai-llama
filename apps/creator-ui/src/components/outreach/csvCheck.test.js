// Run with: node --test apps/creator-ui/src/components/outreach/csvCheck.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCsv, checkFileKind, columnFor, parseCsv, SAMPLE_CSV } from "./csvCheck.js";

test("the downloadable sample passes and previews both contacts", () => {
  const r = checkCsv(SAMPLE_CSV);
  assert.equal(r.ok, true);
  assert.equal(r.rows, 2);
  assert.equal(r.withEmail, 1);
  assert.equal(r.withoutEmail, 1, "Vikram has no email but is kept");
  assert.equal(r.preview[0].emails[0], "asha@hearthfoods.in");
  assert.equal(r.hasWebsite, true);
});

test("headers are matched like the server: case, spaces, underscores and aliases", () => {
  assert.equal(columnFor(" E-Mail "), "email");
  assert.equal(columnFor("Work Email"), "email");
  assert.equal(columnFor("email2"), "email");
  assert.equal(columnFor("Mobile Number"), "phone");
  assert.equal(columnFor("First_Name"), "firstName");
  assert.equal(columnFor("Organisation"), "company");
  assert.equal(columnFor("Job Title"), "designation");
  assert.equal(columnFor("notes"), null);
});

test("quoted fields keep commas, quotes and line breaks", () => {
  const rows = parseCsv('name,company\r\n"Rao, Asha","Hearth ""Foods""\nLtd"\r\n');
  assert.deepEqual(rows[1], ["Rao, Asha", 'Hearth "Foods"\nLtd']);
});

test("a file without a header row says the first row must be the column names", () => {
  const r = checkCsv("Asha Rao,asha@hearthfoods.in,+91 98765 43210\nVikram,vikram@bolt.in,\n");
  assert.equal(r.ok, false);
  assert.equal(r.title, "The first row must be the column names");
  assert.match(r.detail, /asha@hearthfoods\.in/);
  assert.match(r.fix, /name,company,email,phone,website/);
});

test("unknown column names are listed back", () => {
  const r = checkCsv("Brand Contact Person,Mail ID\nAsha,asha@x.in\n");
  assert.equal(r.ok, false);
  assert.equal(r.title, "We couldn't find the column names");
  assert.match(r.detail, /Brand Contact Person, Mail ID/);
});

test("semicolon files, empty files and header-only files each get their own message", () => {
  assert.equal(checkCsv("name;email\nAsha;asha@x.in\n").title, "The columns are separated by semicolons");
  assert.equal(checkCsv("").title, "The file is empty");
  assert.equal(checkCsv("﻿name,email\r\n").title, "There are no contacts under the column names");
});

test("too many rows and too big are refused before upload", () => {
  const many = "email\n" + Array.from({ length: 5001 }, (_, i) => `a${i}@x.in`).join("\n");
  assert.equal(checkCsv(many).title, "Too many rows");
  assert.equal(checkCsv("email\na@x.in", { size: 3 * 1024 * 1024 }).title, "The file is too big");
});

test("bad emails are counted, rows with nothing to go on are skipped, all-skipped files are refused", () => {
  const r = checkCsv("name,email,notes\nAsha,not-an-email,hi\n,,only a note\nRavi,ravi@x.in,\n");
  assert.equal(r.ok, true);
  assert.equal(r.badEmails, 1);
  assert.equal(r.withEmail, 1);
  assert.equal(r.withoutEmail, 1);
  assert.equal(r.skipped, 1);
  assert.deepEqual(r.ignored, ["notes"]);
  assert.equal(checkCsv("email,notes\n,hello\n").title, "None of the rows can be imported");
});

test("first + last name columns make the name; several emails in one cell split", () => {
  const r = checkCsv("First Name,Last Name,Emails\nAsha,Rao,asha@x.in; hello@x.in\n");
  assert.equal(r.preview[0].name, "Asha Rao");
  assert.deepEqual(r.preview[0].emails, ["asha@x.in", "hello@x.in"]);
});

test("spreadsheets and other files are caught by name or by their first bytes", () => {
  assert.equal(checkFileKind("contacts.xlsx", null).title, "This is a spreadsheet file, not a CSV");
  assert.equal(checkFileKind("contacts.csv", new Uint8Array([0x50, 0x4b, 3, 4])).title, "This is a spreadsheet file, not a CSV");
  assert.equal(checkFileKind("contacts.pdf", new Uint8Array([0x25, 0x50])).title, "This isn't a CSV file");
  assert.equal(checkFileKind("contacts.csv", new Uint8Array([0x6e, 0x61])), null);
});
