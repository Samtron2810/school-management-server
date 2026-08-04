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
    if (
      Array.isArray(settings.scoreComponents) &&
      settings.scoreComponents.length > 0
    ) {
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
  // Load school settings for logo + profile fields.
  let settings = null;
  try {
    settings = await settingService.getSettings();
  } catch {
    // fall through — letterhead will degrade gracefully
  }

  const logoUrl = settings?.logo?.url || "";
  const schoolName = settings?.schoolName || "TronSchool";
  const schoolAddress = settings?.address || "";
  const schoolEmail = settings?.email || "";
  const schoolPhone = settings?.phoneNumber || "";

  const logoSize = 60; // square px
  const logoRightGutter = 14;
  const profileX = pageLeft + (logoUrl ? logoSize + logoRightGutter : 0);
  const profileWidth =
    contentWidth - (logoUrl ? logoSize + logoRightGutter : 0);

  // Draw logo image if a URL is configured. PDFKit supports jpeg/png via
  // the image() method. A missing or broken URL is caught and silently
  // skipped so the rest of the letterhead still renders.
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const imgBuffer = Buffer.from(arrayBuffer);
        doc.image(imgBuffer, pageLeft, y, {
          width: logoSize,
          height: logoSize,
        });
      }
    } catch {
      // URL unreachable or not a supported image — skip logo silently.
    }
  }

  // School name, address, contact — centred in the space beside the logo.
  const letterheadY = y;
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(schoolName, profileX, letterheadY, {
      width: profileWidth,
      align: "center",
    });
  let profileY = letterheadY + 20;

  if (schoolAddress) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(schoolAddress, profileX, profileY, {
        width: profileWidth,
        align: "center",
      });
    profileY += 13;
  }

  const contactParts = [schoolEmail, schoolPhone]
    .filter(Boolean)
    .join("   |   ");
  if (contactParts) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(contactParts, profileX, profileY, {
        width: profileWidth,
        align: "center",
      });
    profileY += 13;
  }

  // Advance y past whichever was taller — logo or profile block.
  y = Math.max(y + logoSize, profileY) + 10;

  // Divider line under letterhead.
  ensureSpace(8);
  doc
    .moveTo(pageLeft, y)
    .lineTo(pageRight, y)
    .strokeColor("#333333")
    .lineWidth(1)
    .stroke();
  y += 14;

  // ── Report Card title + period ───────────────────────────────────────────
  writeLine("Student Report Card", {
    fontSize: 14,
    bold: true,
    align: "center",
    gapAfter: 10,
  });
  writeLine(`${card.session?.name || ""} — ${card.term?.name || ""}`, {
    fontSize: 10,
    align: "center",
    gapAfter: 18,
  });

  // ── Student info (bold) ──────────────────────────────────────────────────
  writeLine(`Name: ${studentName}`, { fontSize: 11, bold: true, gapAfter: 14 });
  writeLine(`Admission No: ${card.student?.admissionNumber || "—"}`, {
    fontSize: 11,
    bold: true,
    gapAfter: 14,
  });
  writeLine(`Class: ${className}`, { fontSize: 11, bold: true, gapAfter: 20 });

  const subjects = card.subjects || [];

  // Score-component columns (CA 1, CA 2, Test, Exam, etc) are global and
  // admin-managed — every subject on this report card shares the exact
  // same set, so there's no need to reconcile differing per-subject
  // configs here anymore.
  const scoreComponents = await getGlobalScoreComponents();
  const breakdownColumns = scoreComponents
    .filter((c) => c.isActive)
    .map((c) => ({ key: c.key, label: c.label }));

  // Subject score table. Column widths sum to contentWidth.
  // "%" column is removed — merged into "Total" which now shows the
  // percentage value directly (displayed as a plain number, e.g. 67).
  const fixedColumnShares = {
    subject: 0.18,
    total: 0.13, // slightly wider now that % column is gone
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
    // "Total %" header; data rows show plain percentage number (e.g. 67)
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

      // Total % column: show percentage as a plain number (e.g. 67, not 67%)
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
  const boxHeight = 50;
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

// Generates a single student's report card PDF and streams it directly to
// the HTTP response.
const streamStudentReportCardPdf = async (studentId, query, user, res) => {
  const card = await reportCardService.getStudentReportCard(
    studentId,
    query,
    user,
  );

  const studentName = card.student?.user?.fullName || "student";
  const filename = `report-card-${studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);
  await drawReportCard(doc, card);
  doc.end();
};

// Hard cap on bulk PDF requests. Each PDF sits in memory during generation
// before being handed to archiver. At ~200-500 KB per PDF, 100 students ≈
// 50 MB peak — safe. Beyond this, callers should paginate their requests.
const BULK_PDF_MAX_STUDENTS = 100;

// Generates report cards for multiple students and streams them as a
// single zip file to the HTTP response. Students the caller can't access
// (e.g. not yet published, for a non-staff caller) are skipped rather than
// failing the whole batch.
//
// Memory strategy: generate one PDF at a time, hand the buffer to archiver,
// then explicitly release the reference before moving to the next student.
// This keeps peak memory at max(1 PDF) rather than max(all PDFs at once).
const streamBulkReportCardsZip = async (studentIds, query, user, res) => {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ApiError(400, "At least one student is required.");
  }

  if (studentIds.length > BULK_PDF_MAX_STUDENTS) {
    throw new ApiError(
      400,
      `Bulk download is limited to ${BULK_PDF_MAX_STUDENTS} students per request. Split into smaller batches.`,
    );
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="report-cards.zip"',
  );

  // Use compression level 6 (default) — level 9 is marginally smaller but
  // significantly more CPU-intensive on large batches.
  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.pipe(res);

  for (const studentId of studentIds) {
    try {
      const card = await reportCardService.getStudentReportCard(
        studentId,
        query,
        user,
      );
      const studentName = card.student?.user?.fullName || studentId;
      const filename = `${studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`;

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      const buffer = await new Promise((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        drawReportCard(doc, card)
          .then(() => doc.end())
          .catch(reject);
      });

      archive.append(buffer, { name: filename });

      // Release the card and buffer from memory before the next iteration.
      // In a tight loop over many students this prevents accumulated
      // allocations from sitting until GC runs after the loop completes.
      chunks.length = 0;
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
