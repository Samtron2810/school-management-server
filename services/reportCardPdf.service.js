import PDFDocument from "pdfkit";
import * as archiver from "archiver";
import reportCardService from "./reportCard.service.js";
import ApiError from "../utils/ApiError.js";

// Draws report card content onto an already-created PDFDocument. Caller is
// responsible for creating the doc, piping/collecting its output, and
// calling doc.end() when done.
const drawReportCard = (doc, card) => {
  const studentName =
    card.student?.user?.fullName || card.student?.admissionNumber || "Student";
  const className = card.enrollment?.schoolClass?.fullName || "—";

  doc.fontSize(18).text("Student Report Card", { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(11)
    .text(`${card.session?.name || ""} — ${card.term?.name || ""}`, {
      align: "center",
    });
  doc.moveDown(1);

  doc.fontSize(12).text(`Name: ${studentName}`);
  doc.text(`Admission No: ${card.student?.admissionNumber || "—"}`);
  doc.text(`Class: ${className}`);
  doc.moveDown(1);

  // Subject score table.
  const tableTop = doc.y;
  const columns = [
    { label: "Subject", width: 150 },
    { label: "Score", width: 70 },
    { label: "Max", width: 60 },
    { label: "%", width: 60 },
    { label: "Grade", width: 60 },
    { label: "Remark", width: 110 },
  ];

  let x = doc.x;
  let y = tableTop;
  doc.fontSize(10).font("Helvetica-Bold");
  columns.forEach((col) => {
    doc.text(col.label, x, y, { width: col.width });
    x += col.width;
  });
  doc.moveDown(0.5);
  doc.font("Helvetica");

  y = doc.y;
  for (const row of card.subjects || []) {
    x = doc.x;
    const subjectName = row.classSubject?.subject?.name || "—";
    const cells = [
      subjectName,
      String(row.total ?? "—"),
      String(row.totalMaxMarks ?? "—"),
      `${row.percentage ?? 0}%`,
      row.grade || "—",
      row.remark || "—",
    ];
    cells.forEach((text, i) => {
      doc.text(text, x, y, { width: columns[i].width });
      x += columns[i].width;
    });
    y += 18;
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = doc.y;
    }
  }

  doc.moveDown(2);
  doc.fontSize(11).font("Helvetica-Bold").text("Summary");
  doc.font("Helvetica").fontSize(10);
  doc.text(
    `Total Score: ${card.summary?.totalScore ?? 0} / ${card.summary?.totalMaxMarks ?? 0}`,
  );
  doc.text(`Average: ${card.summary?.averagePercentage ?? 0}%`);
  doc.text(
    `Attendance: ${card.summary?.attendance?.present ?? 0} present, ` +
      `${card.summary?.attendance?.absent ?? 0} absent, ` +
      `${card.summary?.attendance?.late ?? 0} late ` +
      `(${card.summary?.attendance?.attendancePercentage ?? 0}%)`,
  );
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
  drawReportCard(doc, card);
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
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="report-cards.zip"',
  );

  const archive = archiver("zip", { zlib: { level: 9 } });
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
        drawReportCard(doc, card);
        doc.end();
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
