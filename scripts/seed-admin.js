require('dotenv').config();
const admin = require('firebase-admin');

// Anda memerlukan service account key untuk menggunakan Firebase Admin SDK.
// 1. Pergi ke Firebase Console > Project Settings > Service Accounts
// 2. Generate new private key
// 3. Simpan sebagai 'serviceAccountKey.json' di root proyek (JANGAN DI-COMMIT)
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (e) {
  console.error("❌ ERROR: File serviceAccountKey.json tidak ditemukan!");
  console.log("Silakan unduh dari Firebase Console dan simpan di root proyek.");
  process.exit(1);
}

// Inisialisasi Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function seedAdmin() {
  const email = process.argv[2] || 'admin@garutkab.go.id';
  const password = process.argv[3] || 'PUPRAdmin2024!';
  const displayName = 'Super Admin PUPR';

  try {
    console.log(`⏳ Membuat akun super_admin untuk: ${email}`);
    
    // 1. Cek apakah user sudah ada di Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`ℹ️ User ${email} sudah terdaftar di Firebase Auth (UID: ${userRecord.uid})`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        // Buat user baru
        userRecord = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: true,
        });
        console.log(`✅ User ${email} berhasil dibuat di Firebase Auth (UID: ${userRecord.uid})`);
      } else {
        throw e;
      }
    }

    // 2. Simpan profil ke Firestore
    const userRef = db.collection('users').doc(userRecord.uid);
    await userRef.set({
      email,
      displayName,
      role: 'super_admin',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`✅ Profil super_admin berhasil disimpan di Firestore.`);
    console.log(`\n🎉 Proses seeding berhasil!`);
    console.log(`\nSilakan coba login menggunakan:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
