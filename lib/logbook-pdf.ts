"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { logbookFilename, type LogbookData } from "./logbook";

async function loadImageAsDataURL(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportLogbookPdf(data: LogbookData): Promise<string> {
  const filename = logbookFilename(
    data.nama || data.namaMahasiswa,
    data.weekNumber,
  );
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 12;

  // ---- Kop header (mirrors docs/template-logbook.pdf) ----
  const logoLeft = await loadImageAsDataURL("/logo1.png");
  if (logoLeft) {
    try {
      doc.addImage(logoLeft, "PNG", margin, y + 1, 20, 20);
    } catch {
      /* ignore */
    }
  }

  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.text("KEMENTERIAN PENDIDIKAN TINGGI, SAINS,", pageWidth / 2, y + 2, {
    align: "center",
  });
  doc.text("DAN TEKNOLOGI", pageWidth / 2, y + 6.5, { align: "center" });
  doc.setFontSize(13);
  doc.text("POLITEKNIK NEGERI MALANG", pageWidth / 2, y + 11.5, {
    align: "center",
  });
  doc.setFontSize(11);
  doc.text("JURUSAN TEKNOLOGI INFORMASI", pageWidth / 2, y + 16, {
    align: "center",
  });
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.text(
    "Jalan Soekarno Hatta Nomor 9, Jatimulyo, Lowokwaru, Malang 65141",
    pageWidth / 2,
    y + 20,
    { align: "center" },
  );
  doc.text(
    "Telepon (0341) 404424, 404425, Faksimile (0341) 404420",
    pageWidth / 2,
    y + 23.5,
    { align: "center" },
  );
  doc.text("Laman www.polinema.ac.id", pageWidth / 2, y + 27, {
    align: "center",
  });

  y += 29.5;
  // Satu garis tebal hitam tunggal
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ---- Title ----
  doc.setFont("times", "bold");
  doc.setFontSize(11.5);
  doc.text("LOG BOOK KEGIATAN", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text("PROGRAM MAGANG INDUSTRI", pageWidth / 2, y, { align: "center" });
  y += 4;

  // ---- Identity Table (Bordered Box like template) ----
  autoTable(doc, {
    startY: y,
    theme: "grid",
    body: [
      ["Nama", ":", data.nama || ""],
      ["NIM", ":", data.nim || ""],
      ["Program Studi", ":", data.programStudi || ""],
      ["Nama Mitra Industri", ":", data.namaMitra || ""],
    ],
    styles: {
      font: "times",
      fontSize: 9.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 1.5,
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: "bold" },
      1: { cellWidth: 6, halign: "center", fontStyle: "bold" },
      2: { cellWidth: contentWidth - 50 },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 4;

  // ---- Activity table (1 header + min 7 rows like template) ----
  const body = data.activities.map((a) => [
    a.hariTanggal,
    a.jamMasuk,
    a.jamPulang,
    a.kegiatan,
  ]);
  while (body.length < Math.max(5, data.activities.length)) {
    body.push(["", "", "", ""]);
  }

  autoTable(doc, {
    startY: y,
    head: [["Hari, Tanggal", "Jam Masuk", "Jam Pulang", "Kegiatan"]],
    body,
    theme: "grid",
    styles: {
      font: "times",
      fontSize: 9.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      cellPadding: 2,
      valign: "top",
    },
    headStyles: {
      fontStyle: "bold",
      halign: "center",
      fillColor: [212, 212, 212],
      textColor: [0, 0, 0],
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.18, halign: "center" },
      1: { cellWidth: contentWidth * 0.13, halign: "center" },
      2: { cellWidth: contentWidth * 0.13, halign: "center" },
      3: { cellWidth: contentWidth * 0.56, halign: "left" },
    },
    margin: { left: margin, right: margin },
  });

  // ---- Signature block ----
  let sigY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY + 7;
  if (sigY > 245) {
    doc.addPage();
    sigY = 20;
  }

  const mahasiswa = data.namaMahasiswa || data.nama || "[Nama Mahasiswa]";
  const pembimbing = data.namaPembimbing || "[Nama pembimbing]";
  const mentor = data.namaMentor || "[Nama Mentor]";

  // Koordinat horizontal kolom tanda tangan (2 kolom seimbang)
  const dosenX = margin + contentWidth * 0.25;
  const mentorX = margin + contentWidth * 0.75;
  const mhsX = mentorX; // Lurus sejajar dengan Pembimbing Lapangan/Mentor

  // Baris 1: Mahasiswa di kanan
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Mahasiswa,", mhsX, sigY, { align: "center" });

  // Tanda tangan gambar mahasiswa jika ada
  if (data.ttdMahasiswa) {
    try {
      doc.addImage(
        data.ttdMahasiswa,
        "PNG",
        mhsX - 16,
        sigY + 2,
        32,
        16,
        undefined,
        "FAST",
      );
    } catch {
      /* abaikan bila format gambar bermasalah */
    }
  }

  doc.setFont("times", "bold");
  doc.text(mahasiswa, mhsX, sigY + 20, { align: "center" });

  // Baris 2: Mengetahui di tengah, membawahi Dosen & Mentor
  const bwhY = sigY + 27;
  doc.setFont("times", "normal");
  doc.text("Mengetahui,", pageWidth / 2, bwhY, { align: "center" });

  const posTitleY = bwhY + 6;

  doc.text("Dosen Pembimbing,", dosenX, posTitleY, { align: "center" });
  doc.text("Pembimbing Lapangan", mentorX, posTitleY, { align: "center" });

  const posNameY = posTitleY + 20;
  doc.setFont("times", "bold");
  doc.text(pembimbing, dosenX, posNameY, { align: "center" });
  doc.text(mentor, mentorX, posNameY, { align: "center" });

  doc.save(filename);
  return filename;
}
