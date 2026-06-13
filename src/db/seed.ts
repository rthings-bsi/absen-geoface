import { db } from "./index";
import { users, pegawai, jabatan, jam_kerja, roles, permissions, role_permission, lokasi_kantor, struktur_organisasi } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create roles
  console.log("Creating roles...");
  const [roleAdmin] = await db.insert(roles).values({
    nama: "Admin HRD",
    deskripsi: "Administrator HRD dengan akses penuh",
    can_admin: true,
  }).returning();

  const [rolePegawai] = await db.insert(roles).values({
    nama: "Pegawai",
    deskripsi: "Pegawai biasa",
    can_admin: false,
  }).returning();

  // 2. Create permissions
  console.log("Creating permissions...");
  const perms = await db.insert(permissions).values([
    { nama: "dashboard", grup: "Dashboard", deskripsi: "Akses dashboard" },
    { nama: "rekap-absensi", grup: "Absensi", deskripsi: "Melihat rekap absensi" },
    { nama: "monitoring", grup: "Absensi", deskripsi: "Monitoring absensi real-time" },
    { nama: "pegawai", grup: "Master Data", deskripsi: "Mengelola pegawai" },
    { nama: "jabatan", grup: "Master Data", deskripsi: "Mengelola jabatan" },
    { nama: "jam-kerja", grup: "Master Data", deskripsi: "Mengelola jam kerja" },
    { nama: "lokasi-kantor", grup: "Master Data", deskripsi: "Mengelola lokasi kantor" },
    { nama: "struktur-organisasi", grup: "Organisasi", deskripsi: "Mengelola struktur organisasi" },
    { nama: "pengajuan", grup: "Pengajuan", deskripsi: "Mengelola pengajuan" },
    { nama: "role", grup: "Pengaturan", deskripsi: "Mengelola role & permission" },
  ]).returning();

  // 3. Assign all permissions to admin role
  console.log("Assigning permissions to admin role...");
  for (const perm of perms) {
    await db.insert(role_permission).values({ id_role: roleAdmin.id, id_permission: perm.id });
  }

  // 4. Create jam kerja
  console.log("Creating jam kerja...");
  const [jkSeninKamis] = await db.insert(jam_kerja).values({
    nama: "Senin - Kamis",
    jam_masuk: "07:30",
    jam_pulang: "16:00",
    toleransi_terlambat: 30,
  }).returning();

  const [jkJumat] = await db.insert(jam_kerja).values({
    nama: "Jumat",
    jam_masuk: "07:30",
    jam_pulang: "16:30",
    toleransi_terlambat: 30,
  }).returning();

  // 5. Create jabatan
  console.log("Creating jabatan...");
  const [jabKepalaDinas] = await db.insert(jabatan).values({
    nama: "Kepala Dinas",
    deskripsi: "Kepala Dinas Pemerintah Kota Karawang",
  }).returning();

  const [jabKabid] = await db.insert(jabatan).values({
    nama: "Kepala Bidang",
    id_parent: jabKepalaDinas.id,
    deskripsi: "Kepala Bidang",
  }).returning();

  const [jabKasi] = await db.insert(jabatan).values({
    nama: "Kepala Seksi",
    id_parent: jabKabid.id,
    deskripsi: "Kepala Seksi",
  }).returning();

  const [jabStaff] = await db.insert(jabatan).values({
    nama: "Staff",
    id_parent: jabKasi.id,
    deskripsi: "Staff",
  }).returning();

  // 6. Create struktur organisasi
  console.log("Creating struktur organisasi...");
  const [strukDinas] = await db.insert(struktur_organisasi).values({
    nama: "Dinas Pemerintah Kota Karawang",
    level: 0,
    urutan: 1,
  }).returning();

  const [strukBidang] = await db.insert(struktur_organisasi).values({
    nama: "Bidang Kepegawaian",
    id_parent: strukDinas.id,
    level: 1,
    urutan: 1,
  }).returning();

  await db.insert(struktur_organisasi).values({
    nama: "Seksi Data & Informasi",
    id_parent: strukBidang.id,
    level: 2,
    urutan: 1,
  });

  // 7. Create users & pegawai
  console.log("Creating users & pegawai...");
  const hashedPassword = await bcrypt.hash("password", 10);

  const [adminUser] = await db.insert(users).values({
    email: "admin@absensi.test",
    password: hashedPassword,
  }).returning();

  await db.insert(pegawai).values({
    id_user: adminUser.id,
    nip: "199001012010011001",
    nama: "Admin HRD",
    id_jabatan: jabKabid.id,
    id_jam_kerja: jkSeninKamis.id,
    id_role: roleAdmin.id,
    id_struktur: strukBidang.id,
    role: "Admin",
  });

  const [pegawaiUser] = await db.insert(users).values({
    email: "andi@absensi.test",
    password: hashedPassword,
  }).returning();

  await db.insert(pegawai).values({
    id_user: pegawaiUser.id,
    nip: "199205152011011002",
    nama: "Andi Pratama",
    tempat_lahir: "Karawang",
    tanggal_lahir: "1992-05-15",
    jenis_kelamin: "L",
    no_hp: "081234567890",
    alamat: "Jl. Karawang No. 123",
    id_jabatan: jabStaff.id,
    id_jam_kerja: jkSeninKamis.id,
    id_role: rolePegawai.id,
    role: "Pegawai",
  });

  // 8. Create lokasi kantor
  console.log("Creating lokasi kantor...");
  await db.insert(lokasi_kantor).values({
    nama_instansi: "Pemerintah Kota Karawang",
    alamat: "Jl. Proklamasi No. 1, Karawang, Jawa Barat",
    latitude: "-6.2671",
    longitude: "107.2726",
    radius: 100,
  });

  console.log("✅ Seed completed successfully!");
  console.log("   Admin login: admin@absensi.test / password");
  console.log("   Pegawai login: andi@absensi.test / password");
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  });
