<h1>
IF2150 REKAYASA PERANGKAT LUNAK
<br>
TUGAS 9
<br>
IMPLEMENTASI PERANGKAT LUNAK
</h1>
<br>

## *Commitment Issues*
<img alt="Logo P/L" src="./assets/logo.svg" width="20%">

### Untuk: *Made Branenda Jordhy*

Dipersiapkan oleh:
| Informasi | Keterangan |
| --- | --- |
| Kelas | 03 |
| Kelompok | 03 |

| NIM | Nama |
|---|---|
| 13525012 | Steve Bradley Hoeij |
| 13525072 | Fahrezy Fitriansyah |
| 13525084 | Ariq Ulwan Hammam |
| 13525132 | Zidane Uland Fakhry |
| 13525135 | Ananda Aulia Nurramadhan |
| 10124063 | Dominick Vincent Devict |

---

# BAGIAN A: Ketentuan Implementasi

## A.1 Deskripsi Tugas

Pada tugas ini, kalian mengimplementasikan perangkat lunak yang telah dirancang pada tugas-tugas sebelumnya (SKPL, APL, DPPL) menjadi aplikasi yang **dapat dijalankan**. Platform bebas (web, desktop, atau mobile) selama aplikasi dapat dijalankan ulang oleh asisten mengikuti petunjuk kalian.

Ketentuan umum:
- Setiap anggota bertanggung jawab atas **minimal satu fitur atau modul** dan harus terlihat jelas di riwayat commit/PR.
- Implementasi harus **mengacu pada DPPL**. Jika ada yang berubah (kelas, layar, basis data, dsb.), catat di Bagian B.1. Perubahan itu wajar, tetapi harus tercatat dan beralasan.
- Implementasi **tidak harus berupa kelas** (misalnya fungsi, komponen, *route/handler*, *stored procedure*, atau skrip). Namun, setiap kelas perancangan pada DPPL **wajib dapat ditelusuri** ke implementasinya, dan penelusuran ini dicatat di Bagian B.5.
- Seluruh use case pada SKPL **diprioritaskan** untuk diimplementasikan. Status tiap use case akan dilaporkan pada HIUPL (Tugas 10).
- Seluruh mahasiswa **wajib** mengikuti asistensi akbar.

## A.2 Platform, Bahasa, dan Teknologi

Kalian **bebas** memilih bahasa, framework, library, dan basis data, dengan syarat:

1. **Dapat dijalankan ulang** oleh asisten pada mesin biasa dengan mengikuti README. Versi bahasa/runtime dan seluruh dependensi harus tertulis jelas.
2. **Dependensi dikelola lewat file standar**, misalnya `package.json` + lockfile, `requirements.txt`/`pyproject.toml`, `pom.xml`/`build.gradle`, `composer.json`, `pubspec.yaml`, dan sejenisnya. Jangan meng-commit folder hasil instalasi (`node_modules/`, `venv/`, `build/`, dll.).
3. **Jika memakai layanan eksternal** (basis data cloud, API pihak ketiga, auth, dll.), sediakan cara menjalankan tanpa akun pribadi kalian, atau sediakan data/akun uji pada README. Basis data **sangat disarankan** dapat dijalankan lokal (SQLite, atau Docker Compose untuk PostgreSQL/MySQL/MongoDB).
4. **Arsitektur sesuai DPPL.** Pola arsitektur yang kalian pilih di APL/DPPL (MVC, layered, client-server, dll.) harus terlihat pada struktur kode.

Ketentuan tambahan per platform:

| Platform | Ketentuan |
| :--- | :--- |
| **Web** | Berjalan lokal lewat satu-dua perintah yang terdokumentasi. Boleh juga di-*deploy*; jika ya, cantumkan URL, tetapi **tetap wajib bisa dijalankan lokal** (URL deploy bisa mati). |
| **Desktop** | Berjalan dari source lewat perintah yang terdokumentasi. Build/installer opsional. |
| **Mobile** | Berjalan di emulator/simulator atau perangkat. Sertakan langkah menjalankan, dan **sangat disarankan** melampirkan APK/build di Release. |

## A.3 Keamanan Repository

Repo fork kelompok bersifat **public**, sehingga:

- **Dilarang** meng-commit password, API key, token, `.env` asli, sertifikat/private key, atau data pribadi. Hal ini dapat mengurangi nilai.
- Sediakan `.env.example` berisi nama variabel tanpa nilai rahasia, dan masukkan `.env` ke `.gitignore`.
- Jika sudah terlanjur ter-commit, **cabut/ganti** kredensial tersebut. Menghapus commit saja tidak cukup.
- Data uji/seed harus berupa data fiktif.

## A.4 Struktur Folder

Seluruh kode ditempatkan di `src/` pada repo fork. Jangan mengubah folder milestone lama.

```
src/                              # SELURUH kode implementasi
	README.md                     # dokumentasi utama aplikasi (lihat A.5)
	.env.example                  # jika memakai environment variable
	<struktur kode kalian>        # bebas, mengikuti pola arsitektur DPPL
	tests/                        # test case (jika ada)
docs/
	M9/
		KXX_GYY_Implementasi.md   # laporan ini (Bagian B)
		KXX_GYY_Form-Asistensi.md
```

Catatan:
- `README.md` aplikasi diletakkan di **`src/README.md`**, bukan di root repo.
- Jika kerangka kerja kalian mewajibkan struktur tertentu (misalnya Maven `src/main/java`, Flutter `lib/`, monorepo `frontend/` dan `backend/`), letakkan semuanya **di dalam `src/`**.
- Nama file dan folder pada `docs/M9/` mengikuti aturan penamaan milestone sebelumnya (`KXX_GYY_...`).

## A.5 Isi Minimal `src/README.md`

README harus cukup bagi orang yang belum pernah melihat proyek kalian untuk menjalankan aplikasi dari nol. Minimal berisi:

1. **Deskripsi singkat** aplikasi.
2. **Teknologi yang digunakan** beserta versi (bahasa, framework, basis data).
3. **Prasyarat dan instalasi** (software yang harus ada, perintah instalasi dependensi).
4. **Konfigurasi** (environment variable, setup basis data, migrasi/seed) dan langkah demi langkah menjalankannya.
5. **Cara menjalankan aplikasi** (dan cara menjalankan test, jika ada).
6. **Akun/data uji** untuk mencoba tiap peran pengguna (jika ada login).
7. **Daftar modul/fitur yang diimplementasi** beserta pembagian anggota.
8. **Daftar tabel/koleksi basis data** beserta atributnya (atau tautan ke skema/ERD).

## A.6 Best Practices

Kalian dianjurkan menerapkan praktik berikut. Bukti penerapannya dirangkum pada Bagian B.2.

### 1. Branching
Sesuai aturan umum di README repository, `main` fork kelompok dijaga agar tetap bisa menerima sync dari asisten. Pada tugas ini **sangat disarankan** memakai branch per fitur dengan format `<tipe>/<nama-fitur>` (contoh: `feat/login-page`, `fix/null-cart`), lalu digabungkan ke `main` melalui Pull Request. Skema Gitflow penuh (dengan `develop`) boleh dipakai, tetapi tidak diwajibkan.

### 2. Semantic Commit
Gunakan format `<tipe>(<scope>): <deskripsi>`, misalnya `feat(auth): tambah validasi email`.

| Tipe | Kegunaan |
| :--- | :--- |
| `feat` | Menambahkan fitur baru |
| `fix` | Memperbaiki bug |
| `docs` | Mengubah dokumentasi |
| `style` | Perubahan format/spasi, tanpa mengubah logika |
| `refactor` | Perubahan kode yang tidak menambah fitur atau memperbaiki bug |
| `test` | Menambah/memperbaiki pengujian |
| `chore` | Tugas rutin (build, dependensi, konfigurasi) |

### 3. Track Tasks
Gunakan **GitHub Issues** (dan opsional GitHub Projects) untuk membagi tugas dan melacak progres.
- Pecah fitur besar menjadi issue yang lebih kecil dan tetapkan penanggung jawabnya.
- Hubungkan PR dengan issue (`Closes #12`) dan tutup issue ketika selesai.

### 4. Pull Request dan Code Review
- Setiap PR berisi penjelasan deskriptif tentang apa yang dikerjakan, beserta bukti (tangkapan layar/rekaman/hasil test).
- Setiap PR di-*review* minimal **1 anggota lain**, dengan komentar konstruktif atau approval.

### 5. Pengujian dan Optimasi Performa
- Tulis pengujian untuk logika inti (unit test dan/atau pengujian alur utama). Cakupan penuh tidak diwajibkan, tetapi pengujian pada logika utama dinilai.
- Lakukan **profiling** pada setidaknya satu fitur yang berat (query besar, proses pengolahan data, render list panjang, dsb.), lalu catat temuan dan perbaikannya. Contoh alat:

| Platform | Contoh alat |
| :--- | :--- |
| Web (frontend) | Chrome DevTools (Performance/Network), Lighthouse |
| Web (backend) | Profiler bawaan bahasa, `EXPLAIN` pada query basis data, logging waktu respons |
| Python | `cProfile`, `PyInstrument` |
| Java | VisualVM, JProfiler |
| Mobile | Android Studio Profiler, Flutter DevTools, Xcode Instruments |

### 6. Penggunaan AI
Penggunaan AI **tetap harus dicatat** pada `docs/KXX_GYY_AI-Usage.md` sesuai ketentuan yang sudah berlaku.

## A.7 Pengumpulan

Pengumpulan dinilai dari **tag release**, bukan commit terakhir.

1. Pastikan seluruh pekerjaan sudah di-*commit* dan di-*push* ke `main` fork kelompok.
2. Buat release dengan tag **`v9.0`** (revisi berikutnya `v9.1`, `v9.2`, dst.) dengan target branch `main`.
3. Yang dinilai adalah **tag terakhir yang dibuat sebelum deadline**.

## A.8 Aturan Tanya Jawab

Agar semua kelompok mendapat jawaban yang sama, pertanyaan dibagi menjadi dua jalur:

| Jenis Pertanyaan | Jalur |
| :--- | :--- |
| **Ketentuan tugas**, misalnya teknologi yang diperbolehkan, struktur folder, format pengumpulan, dan penilaian | **Sheets QnA:** *[tautan sheets QnA]* |
| **Kendala teknis kelompok sendiri**, misalnya error, setup, dan penggunaan git | Grup kelompok bersama asisten masing-masing |

Ketentuan:
1. Pertanyaan tentang ketentuan tugas **wajib** diajukan melalui Sheets QnA. Periksa terlebih dahulu apakah pertanyaan serupa sudah dijawab.
2. Jika pertanyaan tentang ketentuan tugas tetap diajukan langsung kepada asisten kelompok, asisten **berhak menolak menjawab** dan meminta kelompok memasukkan pertanyaannya ke Sheets QnA.
3. Jika pertanyaan di Sheets QnA **belum dijawab dalam 24 jam**, kelompok boleh menghubungi asisten kelompok masing-masing. Cantumkan pertanyaan yang sudah diajukan di sheets tersebut.
4. Jawaban pada Sheets QnA berlaku untuk **seluruh kelompok** dan menjadi acuan jika terjadi perbedaan pemahaman.

---

# BAGIAN B: Laporan Implementasi

## B.1 Perubahan dari DPPL

Catat semua perbedaan antara perancangan (DPPL) dan implementasi akhir. Jika tidak ada perubahan, tuliskan "Tidak ada perubahan".

Tabel B.1. Perubahan dari DPPL

| No | Bagian DPPL | Rancangan Awal | Implementasi Akhir | Alasan |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Kelas C01 PembuatTantangan dan C02 Pelajar | Dua kelas terpisah | Digabung dalam `src/backend/repositories/userRepository.js` dan tabel `users`, dibedakan oleh kolom `role` (`PEMBUAT`/`PELAJAR`) | Perlu dikonfirmasi tim (struktur ini ditemukan pada kode akhir) |
| 2 | Kelas C03 Tantangan dan C09 RiwayatTantangan | Dua kelas terpisah | Digabung dalam `src/backend/repositories/challengeRepository.js` dengan tabel `challenges`, `attempts`, dan `terminal_history` | Perlu dikonfirmasi tim (struktur ini ditemukan pada kode akhir) |
| 3 | Kelas C07 EnvironmentController | Satu kelas controller | Dipecah menjadi `terminalService.js`, `gitService.js`, `challengeSessionService.js`, `challengeVerificationService.js`, dan route pada `server.js` | Perlu dikonfirmasi tim (struktur ini ditemukan pada kode akhir) |
| 4 | Algo-01 `publikasikan()` (Tabel 5.3.1 DPPL) | Publikasi hanya dari status `DRAF` | `updateChallengeStatus()` mengubah status tanpa memeriksa status sebelumnya | Perlu dikonfirmasi tim |

## B.2 Bukti Penerapan Best Practices

Tabel B.2. Bukti Best Practices

| Praktik | Bukti | Keterangan |
| :--- | :--- | :--- |
| Branching | https://github.com/Semicomatose/IF2150-RPL-K03-G03/branches | Branch feature digunakan untuk pengembangan fitur secara independen sebelum diintegrasi dan di-_merge_ ke branch main. |
| Semantic commit | https://github.com/Semicomatose/IF2150-RPL-K03-G03/commits/main | Digunakan untuk mengomunikasikan tipe dan lingkup dari commit. |
| Track tasks | *[Tautan ke Issues/Projects]* | *[Jumlah issue, pembagian]* |
| Pull request dan review | *[Tautan ke 2-3 PR representatif]* | *[Siapa me-review siapa]* |
| Pengujian | https://github.com/Semicomatose/IF2150-RPL-K03-G03/tree/main/src/scripts | Unit test 9 kelas, uji integrasi 10 antarmuka, uji use case otomatis, uji KNF, dan validasi traceability pada `src/scripts/*.test.js`; dijalankan dengan `npm test` dari folder `src`. Uji yang membutuhkan PostgreSQL atau Vite otomatis dilewati bila komponen tersebut tidak tersedia. |

### B.2.1 Profiling dan Optimasi

Pilih minimal satu fitur yang diprofil.

| Informasi | Keterangan |
| :--- | :--- |
| Fitur / proses yang diprofil | *[Nama fitur]* |
| Alat | *[mis. Chrome DevTools, cProfile, EXPLAIN]* |
| Temuan (sebelum) | *[Bottleneck yang ditemukan, sertakan angka/tangkapan layar]* |
| Perbaikan | *[Yang diubah]* |
| Hasil (sesudah) | *[Perbandingan dengan sebelumnya]* |

Jika tidak ada perbaikan yang perlu dilakukan, jelaskan hasil profiling dan alasan kenapa fitur tersebut sudah memadai.

## B.3 Kendala dan Catatan Penting

Tuliskan kendala yang ditemui, fitur yang belum sempurna (*known issues*), serta hal yang perlu diketahui asisten saat menjalankan atau menilai aplikasi (misalnya akun uji khusus, urutan menjalankan, atau batasan).

## B.4 Kontribusi Anggota

Tabel B.4. Kontribusi Anggota

| NIM | Nama | Modul / Fitur yang Dikerjakan | Persentase Kontribusi |
| :--- | :--- | :--- | :--- |
| 13525012 | Steve Bradley Hoeij | Environment tantangan, terminal, implementasi UI, integrasi fitur | ... |
| 13525072 | Fahrezy Fitriansyah | History, user stats | ... |
| 13525084 | Ariq Ulwan Hammam | ... | ... |
| 13525132 | Zidane Uland Fakhry | Complete UI implementation | ... |
| 13525135 | Ananda Aulia Nurramadhan | User authentication | ... |
| 10124063 | Dominick Vincent Devict | Database SQL | ... |

## B.5 Traceability Kelas Perancangan ke Implementasi

Pemetaan dari **setiap kelas perancangan** pada DPPL (Tabel 4.1) ke wujud implementasinya. Bentuk implementasi bebas (kelas, fungsi, komponen, *route/handler*, *stored procedure*, skrip, dsb.), tetapi tiap kelas perancangan harus muncul pada tabel ini. Jika implementasi berupa kelas dengan nama yang sama, tetap dicantumkan.

Tabel B.5. Traceability Kelas Perancangan ke Implementasi

| ID Kelas | Nama Kelas Perancangan | Bentuk Implementasi | Lokasi (File dan Nama) | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| C01 | PembuatTantangan | Fungsi repository, tabel, dan route | `src/backend/repositories/userRepository.js` - `createUser()`, `findUser()`; tabel `users`; `src/server.js` - `requireCreator()`, `POST /api/challenges`, route `/api/creator/*` | Atribut menjadi kolom tabel `users` dengan role `PEMBUAT`; operasi pembuat tantangan diwujudkan sebagai route yang dibatasi `requireCreator()`. |
| C02 | Pelajar | Fungsi repository, layanan autentikasi, dan route | `src/backend/repositories/userRepository.js` - `createUser()`, `findUser()`; `src/backend/services/authService.js` - `authenticateLogin()`; `src/server.js` - `POST /api/sessions`, `POST /api/sessions/:id/submit`, `POST /api/sessions/:id/restart`, `GET /api/history` | Atribut menjadi kolom tabel `users` dengan role `PELAJAR`; `pilihTantangan()`, `kirimSolusi()`, `ulangiTantangan()`, dan `aksesRiwayat()` menjadi route tersebut. |
| C03 | Tantangan | Fungsi repository dan tabel | `src/backend/repositories/challengeRepository.js` - `saveChallengePackage()`, `getChallengePackage()`, `getChallengeDetails()`, `listChallenges()`, `updateChallengeStatus()`, `updateCreatorChallenge()`; tabel `challenges` | Berkas tantangan disimpan pada kolom `package_data`; `publikasikan()` dan `jadwalkanHapus()` menjadi `updateChallengeStatus()` dengan status `TERPUBLIKASI` dan `DIJADWALKAN_HAPUS`. |
| C04 | WindowEdit | Komponen React | `src/frontend/UploadPage.jsx` - `UploadPage` | Isian form menjadi *state*; `periksaValiditas()` menjadi `validatePackage()` dan `kirimBerkas()` menjadi `handleSubmit()`. |
| C05 | EditController | Fungsi klien API dan fungsi validasi server | `src/frontend/challengeApi.js` - `uploadChallenge()`, `getCreatorChallenge()`, `changeChallengeStatus()`; `src/backend/services/challengeSessionService.js` - `validateChallengePackageBuffer()` | `validasiBerkas()` menjadi `validateChallengePackageBuffer()`, `simpanTantangan()` menjadi `uploadChallenge()` dan `POST /api/challenges`, `ambilDaftarTantangan()` menjadi `getCreatorChallenge()`. |
| C06 | WindowEnvironment | Komponen React | `src/frontend/ChallengePage.jsx` - `ChallengePage`; `src/frontend/components/terminal/ChallengeTerminal.jsx` - `ChallengeTerminal`; `src/frontend/CreatorEvaluationPage.jsx` | `kirim()` dikirim melalui WebSocket terminal; `kirimSolusi()`, `reset()`, dan `keluar()` menjadi `submitChallenge()`, `restartChallenge()`, dan `exitChallenge()`. |
| C07 | EnvironmentController | Fungsi service dan route | `src/backend/services/terminalService.js` - `createRestrictedTerminalSession()`; `src/backend/services/gitService.js` - `createSession()`, `runGitCommand()`; `src/backend/services/challengeSessionService.js` - `initializeChallengeSession()`; `src/backend/services/challengeVerificationService.js` - `verifyChallengeRepository()` | `prosesCommand()` menjadi terminal terbatas, `eksekusiCommandUji()` menjadi `runGitCommand()`, `siapkanLingkungan()`/`initiateRepo()` menjadi `initializeChallengeSession()`, dan `validasiSolusi()` menjadi `verifyChallengeRepository()`; publikasi, penghapusan, dan akhir sesi berada pada route `server.js` (lihat B.1 nomor 3). |
| C08 | WindowRiwayat | Komponen React | `src/frontend/HistoryModal.jsx` - `HistoryModal` | `tampilkanDaftarRiwayat()` menjadi render daftar riwayat; `kerjakanUlang()` menjadi tautan ke `/challenges/:id`. |
| C09 | RiwayatTantangan | Fungsi repository dan tabel | `src/backend/repositories/challengeRepository.js` - `createAttempt()`, `finishAttempt()`, `saveTerminalHistory()`, `getStudentHistory()`, `getCreatorChallengeAttempts()`; tabel `attempts` dan `terminal_history` | `simpanPengerjaan()` menjadi `createAttempt()`/`finishAttempt()` dan `ambilDataRiwayat()` menjadi `getStudentHistory()` (lihat B.1 nomor 2). |

Catatan:
- Satu kelas perancangan boleh diwujudkan oleh beberapa file/unit, dan satu file/unit boleh mewujudkan beberapa kelas perancangan. Tuliskan semuanya.
- Kelas perancangan yang **tidak diimplementasikan** atau **digabung/dipecah** tetap dicantumkan, dan alasannya dicatat di Bagian B.1.
