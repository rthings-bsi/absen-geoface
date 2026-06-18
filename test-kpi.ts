import { db } from "./src/db/index";
import { absensi, pegawai, pengajuan } from "./src/db/schema";
import { eq, and, gte, lte, count } from "drizzle-orm";

async function main() {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    console.log("Querying pegawai count...");
    const totalPegawai = await db.select({ count: count() }).from(pegawai);
    console.log("Pegawai:", totalPegawai);
    
    console.log("Querying absensi...");
    const todayAbsensi = await db
      .select()
      .from(absensi)
      .where(eq(absensi.tanggal, today));
    console.log("Absensi:", todayAbsensi.length);

    console.log("Querying pengajuan...");
    const todayPengajuan = await db
      .select()
      .from(pengajuan)
      .where(
        and(
          eq(pengajuan.status, "Disetujui"),
          lte(pengajuan.tanggal_mulai, today),
          gte(pengajuan.tanggal_selesai, today)
        )
      );
    console.log("Pengajuan:", todayPengajuan.length);
    
  } catch (err: any) {
    console.error("Caught error:", err);
  }
  process.exit(0);
}
main();
