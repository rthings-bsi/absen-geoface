import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { absensi, pegawai } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.can_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("tanggal") || searchParams.get("date") || new Date().toISOString().split("T")[0];

  const data = await db
    .select({
      id: absensi.id,
      jam_masuk: absensi.jam_masuk,
      jam_pulang: absensi.jam_pulang,
      status_masuk: absensi.status_masuk,
      pegawai_nip: pegawai.nip,
      pegawai_nama: pegawai.nama,
    })
    .from(absensi)
    .leftJoin(pegawai, eq(absensi.id_pegawai, pegawai.id))
    .where(eq(absensi.tanggal, date));

  try {
    const ReactPDF = await import("@react-pdf/renderer");
    const React = await import("react");

    const styles = ReactPDF.StyleSheet.create({
      page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
      title: { fontSize: 18, marginBottom: 20, color: "#1e40af", textAlign: "center" },
      subtitle: { fontSize: 10, marginBottom: 20, textAlign: "center", color: "#666" },
      table: { display: "flex", flexDirection: "column", width: "100%" },
      row: { flexDirection: "row", borderBottom: "1px solid #ccc" },
      headerRow: { flexDirection: "row", borderBottom: "1px solid #ccc", backgroundColor: "#f3f4f6" },
      cellNo: { width: "8%", padding: 5 },
      cellNip: { width: "20%", padding: 5 },
      cellNama: { width: "27%", padding: 5 },
      cellJam: { width: "15%", padding: 5 },
      cellStatus: { width: "15%", padding: 5 },
    });

    const doc = React.createElement(ReactPDF.Document, null,
      React.createElement(ReactPDF.Page, { size: "A4", style: styles.page },
        React.createElement(ReactPDF.Text, { style: styles.title }, `Rekap Absensi - ${date}`),
        React.createElement(ReactPDF.Text, { style: styles.subtitle }, `Total: ${data.length} pegawai`),
        React.createElement(ReactPDF.View, { style: styles.table },
          React.createElement(ReactPDF.View, { style: styles.headerRow },
            React.createElement(ReactPDF.Text, { style: styles.cellNo }, "No"),
            React.createElement(ReactPDF.Text, { style: styles.cellNip }, "NIP"),
            React.createElement(ReactPDF.Text, { style: styles.cellNama }, "Nama"),
            React.createElement(ReactPDF.Text, { style: styles.cellJam }, "Masuk"),
            React.createElement(ReactPDF.Text, { style: styles.cellJam }, "Pulang"),
            React.createElement(ReactPDF.Text, { style: styles.cellStatus }, "Status"),
          ),
          ...data.map((a, i) =>
            React.createElement(ReactPDF.View, { key: i, style: styles.row },
              React.createElement(ReactPDF.Text, { style: styles.cellNo }, String(i + 1)),
              React.createElement(ReactPDF.Text, { style: styles.cellNip }, a.pegawai_nip || "-"),
              React.createElement(ReactPDF.Text, { style: styles.cellNama }, a.pegawai_nama || "-"),
              React.createElement(ReactPDF.Text, { style: styles.cellJam }, a.jam_masuk?.slice(0, 5) || "-"),
              React.createElement(ReactPDF.Text, { style: styles.cellJam }, a.jam_pulang?.slice(0, 5) || "-"),
              React.createElement(ReactPDF.Text, { style: styles.cellStatus }, a.status_masuk || "Alpa"),
            )
          ),
        ),
      ),
    );

    const pdfInstance = ReactPDF.pdf(doc);
    const blob = await pdfInstance.toBlob();
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rekap-absensi-${date}.pdf"`,
      },
    });
  } catch {
    // Fallback: return HTML if PDF generation fails
    const html = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>Rekap Absensi - ${date}</h1>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>NIP</th>
              <th>Nama</th>
              <th>Jam Masuk</th>
              <th>Jam Pulang</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((a, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${a.pegawai_nip || "-"}</td>
                <td>${a.pegawai_nama || "-"}</td>
                <td>${a.jam_masuk?.slice(0, 5) || "-"}</td>
                <td>${a.jam_pulang?.slice(0, 5) || "-"}</td>
                <td>${a.status_masuk || "Alpa"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="rekap-absensi-${date}.html"`,
      },
    });
  }
}
