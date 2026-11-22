// Reads a contacts CSV in the browser before it's uploaded, so the creator sees a preview, or a plain
// explanation of what's wrong with the file, without waiting on the server. Column names are matched
// the way the server does (LeadCsvParser.java); the server stays the source of truth on import.

export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_ROWS = 5000;

/** The columns, in the order the sample and the help show them. */
export const CSV_COLUMNS = [
  ["name", "Contact's full name (or first_name + last_name)"],
  ["company", "Brand or company name"],
  ["email", "Work email. More in email2, email3… or several separated by ;"],
  ["phone", "With country code, e.g. +91 98765 43210"],
  ["website", "Starting with https://, used to find a missing email"],
  ["designation", "Their role, e.g. Marketing Head"],
  ["industry", "Optional: FASHION, BEAUTY, FOOD_BEVERAGE, TECH, …"],
  ["size", "Optional: Small, Medium, Large or Enterprise"],
];

export const SAMPLE_CSV = [
  "name,company,email,phone,website,designation,industry,size",
  "Asha Rao,Hearth Foods,asha@hearthfoods.in,+91 98765 43210,https://hearthfoods.in,Marketing Head,FOOD_BEVERAGE,Small",
  "Vikram Shah,Bolt Motors,,+91 91234 56789,https://boltmotors.in,Founder,AUTOMOTIVE,Medium",
].join("\r\n");

const RULES = [
  ["email", /^(e?mail\d*|emails|emailaddress(es)?\d*|workemail)$/],
  ["phone", /^((phone|mobile|tel|telephone|whatsapp)(number)?\d*|phones)$/],
  ["name", /^(name|fullname|contactname|contact)$/],
  ["firstName", /^(firstname|givenname)$/],
  ["lastName", /^(lastname|surname|familyname)$/],
  ["designation", /^(designation|title|jobtitle|position|role)$/],
  ["company", /^(company|companyname|organi[sz]ation|brand|business)$/],
  ["industry", /^(industry|sector)$/],
  ["category", /^(category|subcategory|productcategory|products|niche)$/],
  ["country", /^(country|countrycode|location)$/],
  ["website", /^(website|url|site|web)$/],
  ["size", /^(size|companysize|brandsize|segment|tier|employees|employeecount|headcount|companytype)$/],
];
const KEY_FIELDS = ["email", "phone", "name", "firstName", "company", "website"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function columnFor(header) {
  const h = String(header).trim().toLowerCase().replace(/[\s_-]+/g, "");
  return RULES.find(([, re]) => re.test(h))?.[0] || null;
}

/** RFC 4180 records: quoted fields with commas, quotes and newlines; CRLF or LF. */
export function parseCsv(text) {
  const records = [];
  let fields = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { fields.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      fields.push(field); field = "";
      records.push(fields); fields = [];
      if (ch === "\r" && text[i + 1] === "\n") i++;
    } else field += ch;
  }
  if (field || fields.length) { fields.push(field); records.push(fields); }
  return records;
}

const problem = (title, detail, fix) => ({ ok: false, title, detail, fix });

/** Checks a file's name and first bytes before reading it as text. */
export function checkFileKind(name, firstBytes) {
  const lower = String(name || "").toLowerCase();
  const isZip = firstBytes && firstBytes[0] === 0x50 && firstBytes[1] === 0x4b; // "PK": xlsx, numbers, zip
  if (isZip || /\.(xlsx|xls|xlsm|numbers|ods)$/.test(lower)) {
    return problem("This is a spreadsheet file, not a CSV",
      "Uploads must be CSV: plain text with the columns separated by commas.",
      "In Excel choose File → Save As → \"CSV UTF-8 (Comma delimited)\". In Google Sheets choose File → Download → Comma-separated values. Then upload that file.");
  }
  if (lower && !/\.(csv|txt)$/.test(lower)) {
    return problem("This isn't a CSV file", `"${name}" isn't a .csv file.`, "Save your contacts as a .csv file and upload that.");
  }
  return null;
}

/** Everything the preview shows, or the reason the file can't be imported. */
export function checkCsv(text, { size = text.length } = {}) {
  if (size > MAX_BYTES) {
    return problem("The file is too big", `It's ${(size / 1024 / 1024).toFixed(1)} MB; the limit is 2 MB.`, "Split it into smaller files and upload them one after another.");
  }
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const records = parseCsv(clean).filter((r) => r.some((f) => f.trim() !== ""));
  if (records.length === 0) {
    return problem("The file is empty", "There's nothing in it to import.", "Add a header row and one row per contact, like the sample.");
  }
  const header = records[0];
  if (header.length === 1 && header[0].includes(";")) {
    return problem("The columns are separated by semicolons",
      "This file uses ; between columns. We need commas.",
      "In Excel choose File → Save As → \"CSV UTF-8 (Comma delimited)\", or replace the semicolons in the first row and every row with commas.");
  }
  const fields = header.map(columnFor);
  if (!fields.some((f) => KEY_FIELDS.includes(f))) {
    const firstRow = header.map((h) => h.trim()).filter(Boolean).slice(0, 6).join(", ");
    const looksLikeData = header.some((h) => EMAIL.test(h.trim()) || /^\+?\d[\d\s-]{6,}$/.test(h.trim()));
    return problem(
      looksLikeData ? "The first row must be the column names" : "We couldn't find the column names",
      looksLikeData
        ? `Your first row looks like a contact (${firstRow}), not column names.`
        : `None of the columns in your first row (${firstRow || "empty"}) is one we know.`,
      "Make the first row name the columns, with at least an email, phone, name, company or website column, e.g. name,company,email,phone,website.",
    );
  }
  const dataRows = records.slice(1);
  if (dataRows.length === 0) {
    return problem("There are no contacts under the column names", "The file only has the header row.", "Add one row per contact under the column names.");
  }
  if (dataRows.length > MAX_ROWS) {
    return problem("Too many rows", `The file has ${dataRows.length.toLocaleString()} contacts; the limit is ${MAX_ROWS.toLocaleString()} per upload.`, "Split it into smaller files and upload them one after another.");
  }

  let withEmail = 0, withoutEmail = 0, skipped = 0, badEmails = 0;
  const contacts = dataRows.map((row) => {
    const c = { name: "", company: "", emails: [], phone: "", website: "" };
    let first = "", last = "";
    fields.forEach((f, i) => {
      const v = (row[i] || "").trim();
      if (!v || !f) return;
      if (f === "email") c.emails.push(...v.split(/[;|\s]+/).filter(Boolean));
      else if (f === "phone") c.phone = c.phone || v;
      else if (f === "firstName") first = v;
      else if (f === "lastName") last = v;
      else if (f === "name" || f === "company" || f === "website") c[f] = c[f] || v;
    });
    if (!c.name && (first || last)) c.name = `${first} ${last}`.trim();
    const valid = c.emails.filter((e) => EMAIL.test(e));
    badEmails += c.emails.length - valid.length;
    c.emails = valid;
    if (valid.length) withEmail++;
    else if (c.phone || c.name || c.company || c.website.startsWith("http")) withoutEmail++;
    else { skipped++; c.skipped = true; }
    return c;
  });
  if (withEmail + withoutEmail === 0) {
    return problem("None of the rows can be imported", "Every row is missing an email, phone, name, company and website.",
      "Check the values sit under the right column names, then upload again.");
  }
  return {
    ok: true,
    rows: dataRows.length,
    withEmail,
    withoutEmail,
    skipped,
    badEmails,
    recognised: header.filter((h, i) => fields[i]).map((h) => h.trim()),
    ignored: header.filter((h, i) => !fields[i] && h.trim()).map((h) => h.trim()),
    hasWebsite: fields.includes("website"),
    preview: contacts.slice(0, 5),
  };
}
