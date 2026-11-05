import PDFDocument from "pdfkit";
import { ZipArchive } from "archiver";
import reportCardService from "./reportCard.service.js";
import settingService from "./setting.service.js";
import SchoolClass from "../models/SchoolClass.js";
import Session from "../models/Session.js";
import Term from "../models/Term.js";
import ApiError from "../utils/ApiError.js";
import findDocumentOrFail from "../utils/findDocumentOrFail.js";
import { getCurrentAcademicContext } from "../utils/academicContext.js";
import logger from "../config/logger.js";

// Mirrors SchoolSetting's own schema default, used only if settings can't
// be loaded at all so the PDF still renders something sensible.
const fallbackScoreComponents = [
  { key: "ca1", label: "CA 1", maxMarks: 10, isActive: true },
  { key: "ca2", label: "CA 2", maxMarks: 10, isActive: true },
  { key: "test", label: "Test", maxMarks: 20, isActive: true },
  { key: "exam", label: "Exam", maxMarks: 60, isActive: true },
];

const slug = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// PDFKit only embeds JPEG/PNG. For Cloudinary logos, ask for a small PNG so
// a large or WebP original can't bloat (or break) every PDF in a batch.
const optimizeLogoUrl = (url) =>
  url.includes("res.cloudinary.com") && url.includes("/upload/")
    ? url.replace("/upload/", "/upload/w_240,f_png/")
    : url;

// Fetched ONCE per job (not once per student) with a hard timeout so a slow
// image host can never hang a whole batch.
const loadLogoBuffer = async (url) => {
  if (!url) return null;
  try {
    const res = await fetch(optimizeLogoUrl(url), {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null; // unreachable / unsupported — letterhead renders without it
  }
};

// Everything that is identical for every card in a job: school settings,
// score columns, logo. Load it once and pass it to every drawReportCard.
const buildRenderContext = async () => {
  let settings = null;
  try {
    settings = await settingService.getSettings();
  } catch {
    // fall through — letterhead degrades gracefully
  }

  const scoreComponents =
    Array.isArray(settings?.scoreComponents) &&
    settings.scoreComponents.length > 0
      ? settings.scoreComponents
      : fallbackScoreComponents;

  return {
    settings,
    scoreComponents,
    logoBuffer: await loadLogoBuffer(settings?.logo?.url || ""),
  };
};

// Draws report card content onto an already-created PDFDocument. Caller is
// responsible for creating the doc, piping/collecting its output, and
// calling doc.end() when done. `ctx` (see buildRenderContext) is optional;
// pass it when drawing many cards so nothing is reloaded per card.
//
// IMPORTANT: every piece of text below is placed with an explicit (x, y)
// and we track `y` ourselves in a local variable. PDFKit's own auto-flow
// cursor (doc.y) is unreliable once you've called text() with explicit
// coordinates — mixing explicit positioning with moveDown()/auto-flow text
// is what caused an earlier scattered/overlapping layout. Keeping one
// manual cursor for the whole page avoids that entirely.
const drawReportCard = async (doc, card, ctx = null) => {
  const { settings, scoreComponents, logoBuffer } =
    ctx || (await buildRenderContext());

  const studentName =
    card.student?.user?.fullName || card.student?.admissionNumber || "Student";
  const className = card.enrollment?.schoolClass?.fullName || "—";

  const pageLeft = doc.page.margins.left;
  const pageRight = doc.page.width - doc.page.margins.right;
  const contentWidth = pageRight - pageLeft;
  const lineHeight = 16;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  let y = doc.page.margins.top;

  const ensureSpace = (needed) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
    }
  };

  const writeLine = (text, options = {}) => {
    const {
      fontSize = 11,
      bold = false,
      italic = false,
      boldItalic = false,
      align = "left",
      gapAfter = lineHeight,
      x = pageLeft,
      width = contentWidth,
    } = options;
    ensureSpace(gapAfter);
    let font = "Helvetica";
    if (boldItalic) font = "Helvetica-BoldOblique";
    else if (bold) font = "Helvetica-Bold";
    else if (italic) font = "Helvetica-Oblique";
    doc.font(font).fontSize(fontSize).text(text, x, y, { width, align });
    y += gapAfter;
  };

  // ── Letterhead ──────────────────────────────────────────────────────────
  const schoolName = settings?.schoolName || "TronSchool";
  const schoolAddress = settings?.address || "";
  const schoolEmail = settings?.email || "";
  const schoolPhone = settings?.phoneNumber || "";

  const logoSize = 70; // square px
  const logoRightGutter = 12;
  const hasLogo = Boolean(logoBuffer);
  const profileX = pageLeft + (hasLogo ? logoSize + logoRightGutter : 0);
  const profileWidth =
    contentWidth - (hasLogo ? logoSize + logoRightGutter : 0);

  // A broken image is skipped so the rest of the letterhead still renders.
  if (hasLogo) {
    try {
      doc.image(logoBuffer, pageLeft, y, {
        width: logoSize + 10,
        height: logoSize,
      });
    } catch {
      // not a supported image — skip logo silently.
    }
  }

  // School name, address, contact — centred in the space beside the logo.
  const letterheadY = y;
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .text(schoolName, profileX, letterheadY, {
      width: profileWidth,
      align: "center",
    });
  let profileY = letterheadY + 30;

  if (schoolAddress) {
    doc.font("Helvetica").fontSize(12).text(schoolAddress, profileX, profileY, {
      width: profileWidth,
      align: "center",
    });
    profileY += 20;
  }

  const contactParts = [schoolEmail, schoolPhone]
    .filter(Boolean)
    .join("   |   ");
  if (contactParts) {
    doc.font("Helvetica").fontSize(12).text(contactParts, profileX, profileY, {
      width: profileWidth,
      align: "center",
    });
    profileY += 20;
  }

  // Advance y past whichever was taller — logo or profile block.
  y = Math.max(y + logoSize, profileY) + 4;

  // Divider line under letterhead.
  ensureSpace(8);
  doc
    .moveTo(pageLeft, y)
    .lineTo(pageRight, y)
    .strokeColor("#333333")
    .lineWidth(1)
    .stroke();
  y += 10;

  // ── Report Card title + period ───────────────────────────────────────────
  writeLine("Student Report Card", {
    fontSize: 14,
    bold: true,
    align: "center",
    gapAfter: 22,
  });
  writeLine(`${card.session?.name || ""} — ${card.term?.name || ""}`, {
    fontSize: 10,
    align: "center",
    gapAfter: 20,
  });

  // ── Student info — label bold, value regular ─────────────────────────────
  // writeLine only supports a single font per call, so label/value pairs
  // are drawn as two adjacent text() calls sharing the same y.
  const writeLabelValue = (label, value, { gapAfter = 14 } = {}) => {
    ensureSpace(gapAfter);
    const fontSize = 11;
    doc.font("Helvetica-Bold").fontSize(fontSize);
    const labelWidth = doc.widthOfString(label);
    doc.text(label, pageLeft, y, { lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(fontSize)
      .text(value, pageLeft + labelWidth, y, { lineBreak: false });
    y += gapAfter;
  };

  writeLabelValue("Name: ", studentName);
  writeLabelValue("Admission No: ", card.student?.admissionNumber || "—");
  writeLabelValue("Class: ", className, { gapAfter: 20 });

  const subjects = card.subjects || [];

  // Score-component columns (CA 1, CA 2, Test, Exam, etc) are global and
  // admin-managed — every subject on this report card shares the exact
  // same set.
  const breakdownColumns = scoreComponents
    .filter((c) => c.isActive)
    .map((c) => ({ key: c.key, label: c.label }));

  // Subject score table. Column widths sum to contentWidth.
  // "Total %" shows the percentage as a plain number, e.g. 67.
  const fixedColumnShares = {
    subject: 0.18,
    total: 0.13,
    grade: 0.09,
    remark: 0.16,
  };
  const fixedShareSum = Object.values(fixedColumnShares).reduce(
    (a, b) => a + b,
    0,
  );
  const breakdownShareEach =
    breakdownColumns.length > 0
      ? (1 - fixedShareSum) / breakdownColumns.length
      : 0;

  const columns = [
    {
      key: "subject",
      label: "Subject",
      width: contentWidth * fixedColumnShares.subject,
    },
    ...breakdownColumns.map((c) => ({
      key: c.key,
      label: c.label.length > 6 ? `${c.label.slice(0, 5)}.` : c.label,
      width: contentWidth * breakdownShareEach,
    })),
    {
      key: "total",
      label: "Total %",
      width: contentWidth * fixedColumnShares.total,
    },
    {
      key: "grade",
      label: "Grade",
      width: contentWidth * fixedColumnShares.grade,
    },
    {
      key: "remark",
      label: "Remark",
      width: contentWidth * fixedColumnShares.remark,
    },
  ];

  const columnGutter = 6;

  const drawTableRow = (cells, { bold = false, fontSize = 10 } = {}) => {
    ensureSpace(lineHeight + 4);
    let x = pageLeft;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);
    cells.forEach((text, i) => {
      doc.text(String(text), x, y, {
        width: Math.max(columns[i].width - columnGutter, 10),
        ellipsis: true,
        lineBreak: false,
      });
      x += columns[i].width;
    });
    y += lineHeight;
  };

  // Rule above the header row.
  ensureSpace(6);
  doc
    .moveTo(pageLeft, y)
    .lineTo(pageRight, y)
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .stroke();
  y += 6;

  drawTableRow(
    columns.map((c) => c.label),
    { bold: true, fontSize: 9 },
  );
  // Rule under the header row.
  ensureSpace(6);
  doc
    .moveTo(pageLeft, y)
    .lineTo(pageRight, y)
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .stroke();
  y += 6;

  if (subjects.length === 0) {
    writeLine("No subject scores recorded for this term yet.", {
      fontSize: 10,
      gapAfter: lineHeight,
    });
  } else {
    for (const row of subjects) {
      const subjectName = row.classSubject?.subject?.name || "—";

      const breakdownValues = breakdownColumns.map((col) => {
        const value = row.scores?.get
          ? row.scores.get(col.key)
          : row.scores?.[col.key];
        return value === undefined || value === null ? "—" : String(value);
      });

      const percentageDisplay =
        row.percentage !== undefined && row.percentage !== null
          ? String(row.percentage)
          : "—";

      drawTableRow([
        subjectName,
        ...breakdownValues,
        percentageDisplay,
        row.grade || "—",
        row.remark || "—",
      ]);
    }
  }

  y += 20;

  // ── Summary ──────────────────────────────────────────────────────────────
  writeLine("Summary", { fontSize: 12, bold: true, gapAfter: 18 });
  writeLine(
    `Total Score: ${card.summary?.totalScore ?? 0} / ${card.summary?.totalMaxMarks ?? 0}`,
    { fontSize: 10, gapAfter: lineHeight },
  );
  writeLine(`Average: ${card.summary?.averagePercentage ?? 0}%`, {
    fontSize: 10,
    gapAfter: lineHeight,
  });
  writeLine(
    `Attendance: ${card.summary?.attendance?.present ?? 0} present, ` +
      `${card.summary?.attendance?.absent ?? 0} absent, ` +
      `${card.summary?.attendance?.late ?? 0} late ` +
      `(${card.summary?.attendance?.attendancePercentage ?? 0}%)`,
    { fontSize: 10, gapAfter: lineHeight },
  );

  y += 24;

  // ── Teacher's Comment box ────────────────────────────────────────────────
  ensureSpace(80);
  writeLine("Teacher's Comment", { fontSize: 10, bold: true, gapAfter: 8 });
  // Empty box for handwritten comment after printing.
  const boxHeight = 25;
  doc
    .rect(pageLeft, y, contentWidth, boxHeight)
    .strokeColor("#aaaaaa")
    .lineWidth(0.75)
    .stroke();
  y += boxHeight + 20;

  // ── Sign-off ─────────────────────────────────────────────────────────────
  ensureSpace(20);
  writeLine("Signed by the School Management", {
    fontSize: 10,
    boldItalic: true,
    align: "center",
    gapAfter: lineHeight,
  });
};

// Renders one card to a Buffer. doc.end() is only called after drawing has
// fully finished, so output is never cut short.
const renderCardToBuffer = (card, ctx) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    drawReportCard(doc, card, ctx)
      .then(() => doc.end())
      .catch(reject);
  });

// Generates a single student's report card PDF and sends it.
const streamStudentReportCardPdf = async (studentId, query, user, res) => {
  const card = await reportCardService.getStudentReportCard(
    studentId,
    query,
    user,
  );

  const buffer = await renderCardToBuffer(card, await buildRenderContext());

  const studentName = card.student?.user?.fullName || "student";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="report-card-${slug(studentName) || "student"}.pdf"`,
  );
  res.setHeader("Content-Length", buffer.length);
  res.end(buffer);
};

// ── Bulk zip ───────────────────────────────────────────────────────────────

// Hard cap on PDFs per zip (a class of ~100 across all three terms).
const BULK_PDF_MAX_FILES = 300;

// PDF generation is CPU-bound and runs on the same thread as every other
// request. Limit simultaneous bulk jobs per server instance so a few people
// clicking "download" together can't starve the API or exhaust memory.
const MAX_CONCURRENT_BULK_JOBS = 2;
let activeBulkJobs = 0;

const acquireBulkSlot = () => {
  if (activeBulkJobs >= MAX_CONCURRENT_BULK_JOBS) {
    throw new ApiError(
      429,
      "Report cards are already being generated for other users. Please try again in a minute.",
    );
  }
  activeBulkJobs++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      activeBulkJobs--;
    }
  };
};

// Appends a buffer and waits until archiver has taken it before returning,
// so at most ONE finished PDF is ever queued in memory — even when the
// client downloads slowly. A timeout stops a missed event from hanging.
const appendAndWait = (archive, buffer, name) =>
  new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      archive.off("entry", done);
      archive.off("error", done);
      resolve();
    };
    const timer = setTimeout(done, 15000);
    archive.on("entry", done);
    archive.on("error", done);
    archive.append(buffer, { name });
  });

// Streams `entries` ([{ path, card }]) into a zip on `res`, one PDF at a
// time. `notes` lists anything skipped and is added to the zip as
// _skipped.txt. All stream errors are handled here: an unhandled 'error'
// event on the archive would otherwise crash the whole Node process.
const zipCards = async (res, entries, ctx, notes, zipName) => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);

  const archive = new ZipArchive({ zlib: { level: 6 } });
  let aborted = false;

  const abort = () => {
    if (aborted) return;
    aborted = true;
    archive.abort();
  };

  // Client closed the tab / lost connection: stop generating PDFs for nobody.
  res.on("close", () => {
    if (!res.writableFinished) abort();
  });
  archive.on("warning", (err) =>
    logger.warn({ type: "report_zip", event: "warning", error: err.message }),
  );
  archive.on("error", (err) => {
    logger.error({ type: "report_zip", event: "error", error: err.message });
    abort();
    res.destroy();
  });

  archive.pipe(res);

  for (const entry of entries) {
    if (aborted) break;

    try {
      const buffer = await renderCardToBuffer(entry.card, ctx);
      await appendAndWait(archive, buffer, entry.path);
    } catch (err) {
      notes.push(`${entry.path}: could not be generated (${err.message})`);
    }

    // Give other requests a turn between PDFs.
    await new Promise((resolve) => setImmediate(resolve));
  }

  if (aborted) return;

  if (notes.length > 0) {
    archive.append(Buffer.from(notes.join("\n"), "utf8"), {
      name: "_skipped.txt",
    });
  }

  await archive.finalize();
};

const cardFileBase = (card, index) => {
  const name = slug(
    card.student?.user?.fullName || card.student?.admissionNumber || "student",
  );
  const suffix = slug(card.student?.admissionNumber) || String(index + 1);
  return `${name}-${suffix}`;
};

// POST /report-cards/class/:schoolClassId/download
// body: { session?, term? | "all", students?: [id, ...] }
// Builds the whole class's report cards from a handful of queries and
// streams them as one zip. term = "all" produces one folder per term of the
// session. Staff only.
const streamClassReportCardsZip = async (schoolClassId, body, user, res) => {
  if (!["admin", "teacher"].includes(user.role)) {
    throw new ApiError(403, "You are not authorized to download report cards.");
  }

  const release = acquireBulkSlot();

  try {
    const schoolClass = await findDocumentOrFail(
      SchoolClass,
      schoolClassId,
      "Class",
    );

    const allTerms = body.term === "all";
    let session;
    let terms;

    if (allTerms) {
      session = body.session
        ? await findDocumentOrFail(Session, body.session, "Session")
        : await findDocumentOrFail(
            Session,
            (await getCurrentAcademicContext()).session._id,
            "Session",
          );
      terms = await Term.find({ session: session._id }).sort({ startDate: 1 });
    } else {
      const resolved = await reportCardService.resolveSessionTerm(body);
      session = resolved.session;
      terms = [resolved.term];
    }

    const studentFilter =
      Array.isArray(body.students) && body.students.length > 0
        ? body.students
        : null;

    const entries = [];
    const notes = [];

    for (const term of terms) {
      const cards = await reportCardService.loadClassReportCards(
        schoolClass,
        session,
        term,
        studentFilter,
      );
      const folder = allTerms ? `${slug(term.name)}/` : "";

      cards.forEach((card, index) => {
        if (card.subjects.length === 0) {
          const who = card.student?.user?.fullName || "A student";
          notes.push(`${who} (${term.name}): no scores recorded, skipped.`);
          return;
        }
        entries.push({
          path: `${folder}${cardFileBase(card, index)}.pdf`,
          card,
        });
      });
    }

    if (entries.length === 0) {
      throw new ApiError(
        404,
        "No report cards with scores were found for this selection.",
      );
    }

    if (entries.length > BULK_PDF_MAX_FILES) {
      throw new ApiError(
        400,
        `Too many report cards (${entries.length}). Download one term, or select fewer students.`,
      );
    }

    const ctx = await buildRenderContext();
    const zipName = `${slug(schoolClass.fullName)}-${slug(session.name)}-${
      allTerms ? "all-terms" : slug(terms[0].name)
    }.zip`;

    await zipCards(res, entries, ctx, notes, zipName);
  } finally {
    release();
  }
};

// POST /report-cards/bulk-download (kept for compatibility)
// body: { students: [id, ...], session?, term? }
// Per-student access rules apply, so cards that the caller can't see (e.g.
// unpublished, for a student/parent) are skipped and listed in _skipped.txt.
const streamBulkReportCardsZip = async (studentIds, query, user, res) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ApiError(400, "At least one student is required.");
  }

  if (studentIds.length > 100) {
    throw new ApiError(
      400,
      "Bulk download is limited to 100 students per request. Split into smaller batches.",
    );
  }

  const release = acquireBulkSlot();

  try {
    const entries = [];
    const notes = [];

    for (const studentId of studentIds) {
      try {
        const card = await reportCardService.getStudentReportCard(
          studentId,
          query,
          user,
        );
        entries.push({
          path: `${cardFileBase(card, entries.length)}.pdf`,
          card,
        });
      } catch (err) {
        notes.push(`${studentId}: skipped (${err.message})`);
      }
    }

    if (entries.length === 0) {
      throw new ApiError(404, "No report cards are available to download.");
    }

    await zipCards(
      res,
      entries,
      await buildRenderContext(),
      notes,
      "report-cards.zip",
    );
  } finally {
    release();
  }
};

export default {
  drawReportCard,
  streamStudentReportCardPdf,
  streamClassReportCardsZip,
  streamBulkReportCardsZip,
};
