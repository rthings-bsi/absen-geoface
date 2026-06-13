#!/usr/bin/env node
/**
 * Test admin authentication flow
 */
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('data/absensi.db');

async function testAdminAuth() {
  console.log('🔍 Testing Admin Authentication Flow\n');

  // 1. Check user in database
  console.log('1️⃣  Checking admin user...');
  const adminUser = db.prepare('SELECT id, email, is_active FROM users WHERE email = ?').get('admin@absensi.test');
  console.log('   User:', adminUser);

  if (!adminUser) {
    console.error('   ❌ Admin user not found!');
    return;
  }

  // 2. Check pegawai record
  console.log('\n2️⃣  Checking pegawai record...');
  const adminPegawai = db.prepare(`
    SELECT p.id, p.nip, p.nama, p.role, p.id_role, r.nama as role_nama, r.can_admin
    FROM pegawai p
    LEFT JOIN roles r ON p.id_role = r.id
    WHERE p.id_user = ?
  `).get(adminUser.id);
  console.log('   Pegawai:', adminPegawai);

  if (!adminPegawai) {
    console.error('   ❌ Pegawai record not found!');
    return;
  }

  // 3. Check can_admin status
  console.log('\n3️⃣  Checking admin status...');
  const can_admin = adminPegawai.can_admin || (adminPegawai.role === 'Admin');
  console.log('   can_admin (from role.can_admin):', adminPegawai.can_admin);
  console.log('   role field:', adminPegawai.role);
  console.log('   ✅ Final can_admin result:', can_admin);

  if (!can_admin) {
    console.error('\n   ❌ PROBLEM: can_admin is false!');
    console.log('   To fix:');
    console.log('   - Set roles.can_admin = 1 for role ID', adminPegawai.id_role);
    return;
  }

  // 4. Check permissions
  console.log('\n4️⃣  Checking permissions...');
  const perms = db.prepare(`
    SELECT rp.id_role, p.nama
    FROM role_permission rp
    JOIN permissions p ON rp.id_permission = p.id
    WHERE rp.id_role = ?
    LIMIT 5
  `).all(adminPegawai.id_role);
  console.log('   Permissions count:', perms.length);
  if (perms.length > 0) {
    console.log('   Sample permissions:', perms.map(p => p.nama).join(', '));
  }

  console.log('\n✅ Auth flow check complete!');
  console.log('\nExpected behavior when admin logs in:');
  console.log('   - Session should have: can_admin = true');
  console.log('   - Middleware should allow access to /admin/dashboard');
  console.log('   - Should NOT redirect to /pegawai/dashboard');
}

testAdminAuth().catch(console.error);
