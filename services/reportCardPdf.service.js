import PDFDocument from "pdfkit";
import { createRequire } from "module";
import reportCardService from "./reportCard.service.js";
import settingService from "./setting.service.js";
import ApiError from "../utils/ApiError.js";

// archiver ships as CommonJS; Node's strict ESM loader can't always
// synthesize a default export for it depending on the installed version,
// so it's pulled in via createRequire instead of a plain default import.
const require = createRequire(import.meta.url);
const archiver = require("archiver");

// Mirrors SchoolSetting's own schema default, used only if settings can't
// be loaded at all so the PDF still renders something sensible.
const fallbackScoreComponents = [
  { key: "ca1", label: "CA 1", maxMarks: 10, isActive: true },
  { key: "ca2", label: "CA 2", maxMarks: 10, isActive: true },
  { key: "test", label: "Test", maxMarks: 20, isActive: true },
  { key: "exam", label: "Exam", maxMarks: 60, isActive: true },
];

const getGlobalScoreComponents = async () => {
  try {
    const settings = await settingService.getSettings();
    if (Array.isArray(settings.scoreComponents) && settings.scoreComponents.length > 0) {
      return settings.scoreComponents;
    }
  } catch {
    // fall through
  }
  return fallbackScoreComponents;
};

// Draws report card content onto an already-created PDFDocument. Caller is
// responsible for creating the doc, piping/collecting its output, and
// calling doc.end() when done.
//
// IMPORTANT: every piece of text below is placed with an explicit (x, y)
// and we track `y` ourselves in a local variable. PDFKit's own auto-flow
// cursor (doc.y) is unreliable once you've called text() with explicit
// coordinates — mixing explicit positioning with moveDown()/auto-flow text
// is what caused an earlier scattered/overlapping layout. Keeping one
// manual cursor for the whole page avoids that entirely.
const drawReportCard = async (doc, card) => {
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
      align = "left",
      gapAfter = lineHeight,
    } = options;
    ensureSpace(gapAfter);
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fontSize)
      .text(text, pageLeft, y, { width: contentWidth, align });
    y += gapAfter;
  };

  // Header.
  writeLine("Student Report Card", { fontSize: 18, bold: true, align: "center", gapAfter: 24 });
  writeLine(`${card.session?.name || ""} — ${card.term?.name || ""}`, {
    fontSize: 11,
    align: "center",
    gapAfter: 20,
  });

  writeLine(`Name: ${studentName}`, { fontSize: 12, gapAfter: 16 });
  writeLine(`Admission No: ${card.student?.admissionNumber || "—"}`, {
    fontSize: 12,
    gapAfter: 16,
  });
  writeLine(`Class: ${className}`, { fontSize: 12, gapAfter: 24 });

  const subjects = card.subjects || [];

  // Score-component columns (CA 1, CA 2, Test, Exam, etc) are global and
  // admin-managed — every subject on this report card shares the exact
  // same set, so there's no need to reconcile differing per-subject
  // configs here anymore.
  const scoreComponents = await getGlobalScoreComponents();
  const breakdownColumns = scoreComponents
    .filter((c) => c.isActive)
    .map((c) => ({ key: c.key, label: c.label }));

  // Subject score table. Column widths sum to contentWidth so every row —
  // header and data — lines up under the same fixed grid. Fixed columns
  // (Subject, Total, %, Grade, Remark) get a set share; the breakdown
  // columns split the remainder evenly between them.
  const fixedColumnShares = {
    subject: 0.18,
    total: 0.11,
    percentage: 0.08,
    grade: 0.09,
    remark: 0.16,
  };
  const fixedShareSum = Object.values(fixedColumnShares).reduce((a, b) => a + b, 0);
  const breakdownShareEach =
    breakdownColumns.length > 0
      ? (1 - fixedShareSum) / breakdownColumns.length
      : 0;

  const columns = [
    { key: "subject", label: "Subject", width: contentWidth * fixedColumnShares.subject },
    ...breakdownColumns.map((c) => ({
      key: c.key,
      // Long labels don't fit a narrow breakdown column without wrapping
      // or colliding with the next column, so the header shows an
      // abbreviation here; the full label is still used everywhere else
      // (Mark Entries UI, school settings, etc). CA 1/CA 2/Test/Exam are
      // all short enough to never actually need this in practice.
      label: c.label.length > 6 ? `${c.label.slice(0, 5)}.` : c.label,
      width: contentWidth * breakdownShareEach,
    })),
    { key: "total", label: "Total", width: contentWidth * fixedColumnShares.total },
    { key: "percentage", label: "%", width: contentWidth * fixedColumnShares.percentage },
    { key: "grade", label: "Grade", width: contentWidth * fixedColumnShares.grade },
    { key: "remark", label: "Remark", width: contentWidth * fixedColumnShares.remark },
  ];

  const columnGutter = 6; // px gap reserved at the right edge of each column

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
        // row.scores is a Mongoose Map here (these are live documents, not
        // serialized JSON), so .get(key) is required rather than bracket
        // access.
        const value = row.scores?.get ? row.scores.get(col.key) : row.scores?.[col.key];
        return value === undefined || value === null ? "—" : String(value);
      });

      drawTableRow([
        subjectName,
        ...breakdownValues,
        String(row.total ?? "—"),
        `${row.percentage ?? 0}%`,
        row.grade || "—",
        row.remark || "—",
      ]);
    }
  }

  y += 20;

  // Summary.
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
};

// Generates a single student's report card PDF and streams it directly to
// the HTTP response.
const streamStudentReportCardPdf = async (studentId, query, user, res) => {
  const card = await reportCardService.getStudentReportCard(studentId, query, user);

  const studentName = card.student?.user?.fullName || "student";
  const filename = `report-card-${studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);
  await drawReportCard(doc, card);
  doc.end();
};

// Generates report cards for multiple students and streams them as a
// single zip file to the HTTP response. Students the caller can't access
// (e.g. not yet published, for a non-staff caller) are skipped rather than
// failing the whole batch.
const streamBulkReportCardsZip = async (studentIds, query, user, res) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ApiError(400, "At least one student is required.");
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="report-cards.zip"');

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(res);

  for (const studentId of studentIds) {
    try {
      const card = await reportCardService.getStudentReportCard(studentId, query, user);
      const studentName = card.student?.user?.fullName || studentId;
      const filename = `${studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      const buffer = await new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        drawReportCard(doc, card).then(() => doc.end()).catch(reject);
      });

      archive.append(buffer, { name: filename });
    } catch {
      // Skip students that fail (not published, not found, etc.) instead
      // of aborting the whole zip.
      continue;
    }
  }

  await archive.finalize();
};

export default {
  drawReportCard,
  streamStudentReportCardPdf,
  streamBulkReportCardsZip,
};
