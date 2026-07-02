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
  const download = searchParams.get("download") === "true";

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

  // Format date to Indonesian format
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    const ReactPDF = await import("@react-pdf/renderer");
    const React = await import("react");

    const styles = ReactPDF.StyleSheet.create({
      page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
      headerContainer: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#000", paddingBottom: 10, marginBottom: 20 },
      headerTextContainer: { flex: 1, textAlign: "center" },
      kopTitle: { fontSize: 14, fontWeight: "bold", textTransform: "uppercase" },
      kopSubtitle: { fontSize: 16, fontWeight: "bold", textTransform: "uppercase", marginTop: 4 },
      kopAddress: { fontSize: 9, marginTop: 4 },

      reportTitleContainer: { marginBottom: 20, textAlign: "center" },
      reportTitle: { fontSize: 14, fontWeight: "bold", textTransform: "uppercase", textDecoration: "underline" },
      reportDate: { fontSize: 11, marginTop: 5 },

      table: { display: "flex", flexDirection: "column", width: "100%", borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#000" },
      row: { flexDirection: "row" },
      headerRow: { flexDirection: "row", backgroundColor: "#f3f4f6", fontWeight: "bold" },
      cellHeader: { padding: 6, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#000", textAlign: "center" },
      cellData: { padding: 6, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#000" },

      colNo: { width: "8%" },
      colNip: { width: "22%" },
      colNama: { width: "30%" },
      colMasuk: { width: "12%", textAlign: "center" },
      colPulang: { width: "12%", textAlign: "center" },
      colStatus: { width: "16%", textAlign: "center" },

      signatureSection: { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
      signatureBlock: { width: "30%", textAlign: "center", flexDirection: "column" },
      signatureTitle: { fontSize: 10, marginBottom: 50 },
      signatureName: { fontSize: 10, fontWeight: "bold", textDecoration: "underline" },
      signatureNip: { fontSize: 10, marginTop: 2 },

      footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#666" }
    });

    const doc = React.createElement(ReactPDF.Document, null,
      React.createElement(ReactPDF.Page, { size: "A4", style: styles.page },

        // KOP SURAT
        React.createElement(ReactPDF.View, { style: styles.headerContainer },
          React.createElement(ReactPDF.View, { style: styles.headerTextContainer },
            React.createElement(ReactPDF.Text, { style: styles.kopTitle }, "PEMERINTAH KABUPATEN KARAWANG"),
            React.createElement(ReactPDF.Text, { style: styles.kopSubtitle }, "PEMERINTAH DESA KUTAMEKAR"),
            React.createElement(ReactPDF.Text, { style: styles.kopAddress }, "Kutamekar, Kec. Ciampel, Kab. Karawang, Jawa Barat 41363")
          )
        ),

        // JUDUL LAPORAN
        React.createElement(ReactPDF.View, { style: styles.reportTitleContainer },
          React.createElement(ReactPDF.Text, { style: styles.reportTitle }, "REKAPITULASI ABSENSI PEGAWAI"),
          React.createElement(ReactPDF.Text, { style: styles.reportDate }, "Tanggal: " + formattedDate)
        ),

        // TABEL
        React.createElement(ReactPDF.View, { style: styles.table },
          // Header
          React.createElement(ReactPDF.View, { style: styles.headerRow },
            React.createElement(ReactPDF.Text, { style: { ...styles.cellHeader, ...styles.colNo } }, "No"),
            React.createElement(ReactPDF.Text, { style: { ...styles.cellHeader, ...styles.colNip } }, "NIP"),
            React.createElement(ReactPDF.Text, { style: { ...styles.cellHeader, ...styles.colNama } }, "Nama Pegawai"),
            React.createElement(ReactPDF.Text, { style: { ...styles.cellHeader, ...styles.colMasuk } }, "Masuk"),
            React.createElement(ReactPDF.Text, { style: { ...styles.cellHeader, ...styles.colPulang } }, "Pulang"),
            React.createElement(ReactPDF.Text, { style: { ...styles.cellHeader, ...styles.colStatus } }, "Status"),
          ),
          // Data
          ...data.map((a: any, i: number) =>
            React.createElement(ReactPDF.View, { key: i, style: styles.row },
              React.createElement(ReactPDF.Text, { style: { ...styles.cellData, ...styles.colNo, textAlign: "center" } }, String(i + 1)),
              React.createElement(ReactPDF.Text, { style: { ...styles.cellData, ...styles.colNip } }, a.pegawai_nip || "-"),
              React.createElement(ReactPDF.Text, { style: { ...styles.cellData, ...styles.colNama } }, a.pegawai_nama || "-"),
              React.createElement(ReactPDF.Text, { style: { ...styles.cellData, ...styles.colMasuk } }, a.jam_masuk?.slice(0, 5) || "-"),
              React.createElement(ReactPDF.Text, { style: { ...styles.cellData, ...styles.colPulang } }, a.jam_pulang?.slice(0, 5) || "-"),
              React.createElement(ReactPDF.Text, { style: { ...styles.cellData, ...styles.colStatus } }, a.status_masuk || "Alpa"),
            )
          )
        ),

        // TANDA TANGAN
        React.createElement(ReactPDF.View, { style: styles.signatureSection },
          // Sekbid Keuangan
          React.createElement(ReactPDF.View, { style: styles.signatureBlock },
            React.createElement(ReactPDF.Text, { style: styles.signatureTitle }, "Sekbid Keuangan,"),
            React.createElement(ReactPDF.Text, { style: styles.signatureName }, "______________________"),
            React.createElement(ReactPDF.Text, { style: styles.signatureNip }, "NIP. ")
          ),
          // Sekretaris Desa
          React.createElement(ReactPDF.View, { style: styles.signatureBlock },
            React.createElement(ReactPDF.Text, { style: styles.signatureTitle }, "Sekretaris Desa,"),
            React.createElement(ReactPDF.Text, { style: styles.signatureName }, "______________________"),
            React.createElement(ReactPDF.Text, { style: styles.signatureNip }, "NIP. ")
          ),
          // Kepala Desa
          React.createElement(ReactPDF.View, { style: styles.signatureBlock },
            React.createElement(ReactPDF.Text, { style: styles.signatureTitle }, "Kepala Desa,"),
            React.createElement(ReactPDF.Text, { style: styles.signatureName }, "______________________"),
            React.createElement(ReactPDF.Text, { style: styles.signatureNip }, "NIP. ")
          )
        ),

        // FOOTER
        React.createElement(ReactPDF.Text, { style: styles.footer, fixed: true },
          "Dicetak dari Sistem Absensi Desa Kutamekar pada " + new Date().toLocaleString('id-ID')
        )
      ),
    );

    const pdfInstance = ReactPDF.pdf(doc);
    const blob = await pdfInstance.toBlob();
    const arrayBuffer = await blob.arrayBuffer();

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");

    // Jika parameter download=true, set sebagai attachment
    // Jika tidak, biarkan default inline agar bisa di-preview di browser
    if (download) {
      headers.set("Content-Disposition", `attachment; filename="rekap-absensi-${date}.pdf"`);
    } else {
      headers.set("Content-Disposition", `inline; filename="rekap-absensi-${date}.pdf"`);
    }

    return new NextResponse(new Uint8Array(arrayBuffer), { headers });
  } catch (error) {
    console.error("PDF Export Error:", error);
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
        <h1>Rekap Absensi - ${formattedDate}</h1>
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
            ${data.map((a: any, i: number) => `
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

    const headers = new Headers();
    headers.set("Content-Type", "text/html");
    if (download) {
      headers.set("Content-Disposition", `attachment; filename="rekap-absensi-${date}.html"`);
    } else {
      headers.set("Content-Disposition", `inline; filename="rekap-absensi-${date}.html"`);
    }

    return new NextResponse(html, { headers });
  }
}
