<h1>
IF2150 REKAYASA PERANGKAT LUNAK
<br>
TUGAS 10
<br>
HASIL IMPLEMENTASI DAN UJI PERANGKAT LUNAK (HIUPL)
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

## Daftar Isi

- [BAB 1: Pendahuluan](#bab-1-pendahuluan)
  - [1.1 Tujuan Penulisan Dokumen](#11-tujuan-penulisan-dokumen)
  - [1.2 Lingkup Masalah](#12-lingkup-masalah)
  - [1.3 Definisi, Istilah, dan Singkatan](#13-definisi-istilah-dan-singkatan)
  - [1.4 Aturan Penomoran](#14-aturan-penomoran)
  - [1.5 Referensi](#15-referensi)
  - [1.6 Deskripsi Umum Dokumen (Ikhtisar)](#16-deskripsi-umum-dokumen-ikhtisar)
- [BAB 2: Deskripsi Umum Perangkat Lunak](#bab-2-deskripsi-umum-perangkat-lunak)
- [BAB 3: Implementasi](#bab-3-implementasi)
  - [3.1 Lingkungan Implementasi](#31-lingkungan-implementasi)
  - [3.2 Implementasi Modul](#32-implementasi-modul)
  - [3.3 Implementasi Antarmuka](#33-implementasi-antarmuka)
  - [3.4 File Lain](#34-file-lain)
- [BAB 4: Hasil Pengujian](#bab-4-hasil-pengujian)
  - [4.1 Strategi dan Kedalaman Pengujian Kelas](#41-strategi-dan-kedalaman-pengujian-kelas)
  - [4.2 Pengujian Unit Kelas](#42-pengujian-unit-kelas)
  - [4.3 Pengujian Integrasi](#43-pengujian-integrasi)
  - [4.4 Pengujian Use Case](#44-pengujian-use-case)
  - [4.5 Pengujian Kebutuhan Non-Fungsional (KNF)](#45-pengujian-kebutuhan-non-fungsional-knf)
  - [4.6 Tangkapan Layar dan Bukti Hasil Pengujian](#46-tangkapan-layar-dan-bukti-hasil-pengujian)
- [BAB 5: Traceability](#bab-5-traceability)

---

## Daftar Perubahan

| Revisi | Deskripsi |
| :--- | :--- |
| *A* | *Deskripsikan perubahan yang dilakukan dari dokumen sebelumnya pada dokumen ini. Jika tidak terdapat perubahan, harap kosongkan tabel.* |
| *B* |  |
| *C* |  |
| ... |  |

---

# BAB 1: Pendahuluan

## 1.1 Tujuan Penulisan Dokumen

Dokumen HIUPL adalah dokumentasi dari hasil implementasi dan pengujian perangkat lunak _Commitment Issues_ yang dibuat sebagai titik acuan atau panduan selama proses pengembangan. Dokumen ini diperuntukan para pengembang perangkat lunak _Commitment Issues_ dan semua guru, dosen, atau pengajar lainnya yang ingin menggunakan perangkat lunak _Commitment Issues_ dalam proses pengajaran Git.

## 1.2 Lingkup Masalah

Git adalah sistem kendali versi yang memungkinkan penggunanya untuk melacak perubahan pada kode dan mengatur proyek menggunakan perintah-perintah sederhana. Menurut Stack Overflow Developer Survey pada 2022 yang mengakumulasi jawaban dari 70.000 developer, 93,87% responden mengadopsi Git sebagai sistem kendali versi. _Commitment Issues_ bertujuan untuk menyediakan sarana pembelajaran interaktif yang menyimulasikan penerapan Git dalam suatu proyek yang realistis, sehingga memberikan pengalaman belajar yang lebih relevan dan mudah diterapkan bagi pelajar. Perangkat lunak ini akan berfokus untuk menguji pelajar dalam menghadapi skenario-skenario yang sering ditemukan saat menggunakan Git, contohnya penanganan konflik.

## 1.3 Definisi, Istilah, dan Singkatan

Tabel 1.3. Definisi Istilah dan Singkatan

| Singkatan, Akronim, atau Istilah | Penjelasan |
| :--- | :--- |
| *P/L* | *Singkatan dari Perangkat Lunak, yaitu aplikasi yang memberikan perintah kepada komputer untuk menjalankan tugas tertentu.* |
| *SKPL* | *Singkatan dari Spesifikasi Kebutuhan Perangkat Lunak, yaitu dokumen yang merangkum kriteria-kriteria yang diperlukan untuk membangun aplikasi menjalankan tugasnya.* |
| *DPPL* | *Singkatan dari Deskripsi Perancangan Perangkat Lunak, yaitu dokumen yang menjelaskan rancangan arsitektur, kelas, dan antarmuka P/L.* |
| *HIUPL* | *Singkatan dari Hasil Implementasi dan Uji Perangkat Lunak, yaitu dokumen yang melaporkan hasil implementasi dan pengujian P/L.* |
| *KF* | *Singkatan dari Kebutuhan Fungsional.* |
| *KNF* | *Singkatan dari Kebutuhan Non-Fungsional.* |
| *UC* | *Singkatan dari Use Case.* |
| *TC* | *Singkatan dari Test Case, yaitu satu kasus uji untuk skenario tertentu.* |
| *UT* | *Singkatan dari Unit Test, yaitu test case tingkat kelas/operasi.* |
| *INT* | *Singkatan dari Integration Test, yaitu test case yang menguji interaksi antarkomponen.* |
| *Boundary* | *Kasus uji pada nilai batas masukan, misalnya nilai minimum, maksimum, atau tepat di ambang aturan.* |
| *Coverage* | *Persentase baris/cabang kode yang dieksekusi oleh pengujian.* |

## 1.4 Aturan Penomoran

Tabel 1.4. Aturan Penomoran

| Hal/Bagian | Penomoran | Keterangan |
| :--- | :--- | :--- |
| *Kebutuhan Fungsional* | *KFXX* | *Sesuai SKPL* |
| *Kebutuhan Non-Fungsional* | *KNFXX* | *Sesuai SKPL* |
| *Use Case* | *UCXX* | *Sesuai SKPL* |
| *Kelas* | *CXX* | *Sesuai DPPL* |
| *Antarmuka* | *I-XX* | *Sesuai DPPL* |
| *Test Case Unit* | *CXX-UTYY* | *XX adalah nomor kelas, YY adalah nomor urut test case unit pada kelas tersebut* |
| *Test Case Integrasi* | *INT-TCYY* | *YY adalah nomor urut test case integrasi* |
| *Test Case Use Case* | *UCXX-TCYY* | *XX adalah nomor use case, YY adalah nomor urut test case pada use case tersebut* |
| *Test Case KNF* | *KNFXX-TCYY* | *XX adalah nomor KNF, YY adalah nomor urut test case pada KNF tersebut* |

## 1.5 Referensi
> Cantumkan daftar buku, panduan, atau dokumentasi lain yang dirujuk dalam pembuatan dokumen dan pengembangan P/L, **minimal dokumen SKPL, APL, DPPL, dan Implementasi (Tugas 9)**. Tambahkan dokumentasi *framework*/*library*/*testing tool* atau referensi lain apabila digunakan.

- SKPL Commitment Issues
- APL Commitment Issues
- DPPL Commitment Issues
- Implementasi Commitment Issues
- Chacon, S. & Straub, B. (2014). Pro Git (edisi ke-2). Apress. Tersedia di: [https://git-scm.com/book/en/v2](https://git-scm.com/book/en/v2)
- Git Practice. (t.thn.). Git Practice: Interactive Git Learning. Diakses pada 30 Agustus 2026, dari [https://git-practice.com](https://git-practice.com)
- Peter C. (t.thn.). Learn Git Branching. Diambil kembali dari [https://learngitbranching.js.org](https://learngitbranching.js.org)
- Object Management Group. (2017). Unified Modeling Language (UML) Version 2.5.1. Tersedia di: [https://www.omg.org/spec/UML/2.5.1/](https://www.omg.org/spec/UML/2.5.1/)
- PlantUML. (t.thn.). Sequence Diagram dan Class Diagram. Tersedia di: [https://plantuml.com](https://plantuml.com)

## 1.6 Deskripsi Umum Dokumen (Ikhtisar)

Dokumen ini terdiri atas pendahuluan dokumen (bab 1), deskripsi umum P/L (bab 2), penjelasan hasil implementasi P/L (bab 3), tabulasi dan dokumentasi hasil pengujian P/L (bab 4), dan tabulasi keterlacakan KF dan KNF dalam hasil pengujian P/L (bab 5).

<br>

---

# BAB 2: Deskripsi Umum Perangkat Lunak

_Commitment Issues_ merupakan aplikasi pembelajaran Git dimana pelajar dapat mengerjakan berbagai tantangan yang didesain untuk menyimulasikan skenario-skenario realistis yang mungkin ditemukan ketika menggunakan Git. Untuk menyimpan data Pelajar, seperti biodata Pelajar dan riwayat tantangan-tantangan yang sudah pernah diselesaikan atau sedang dikerjakan, sistem akan berinteraksi dengan suatu **Database**. Sistem akan mengirimkan perubahan riwayat pelajar ke **Database** setiap kali Pelajar menyelesaikan suatu tantangan atau keluar dari tampilan pengerjaan tantangan. **Database** juga akan menyimpan data para Pembuat Tantangan, yaitu biodata pengguna dan informasi dari tantangan-tantangan yang pernah dibuat oleh Pembuat Tantangan tersebut. 

Dalam menginisiasi sebuah repository untuk tantangan, sistem akan mengextract sebuah zip setup yang telah dibuat oleh Pembuat Tantangan. File zip tersebut berisikan data repositori Git untuk tantangan tersebut, beserta script-script untuk menginisiasi repository tantangan, mengulang tantangan, dan memverifikasi jawaban. Repository tantangan disimpan pada environment sandbox yang berada di server sistem.

Saat seorang Pelajar mengerjakan suatu tantangan atau seorang Pembuat Tantangan sedang mengevaluasi suatu tantangan, Pelajar/Pembuat Tantangan akan mengirimkan command-command Git melalui suatu _Command Line Interface_. Command-command yang dijalankan oleh Pengguna lewat CLI tersebut akan diterima dan dijalankan oleh server.

<p align="center">
<img alt="System Overview / Use Case Diagram Commitment Issues" src="./assets/diagram-usecase.jpeg" width="90%">
</p>
<p align="center">
<i>Gambar 2.1. Use Case Diagram Commitment Issues</i>
</p>

<br>

---

# BAB 3: Implementasi

> Bagian ini diisi dengan informasi tentang elemen P/L yang dikembangkan (*executable files*, *configuration files*, *data files*, dan sebagainya) serta perubahannya terhadap rancangan pada DPPL (jika ada).

## 3.1 Lingkungan Implementasi

> Tuliskan *hardware* dan *software* yang digunakan untuk implementasi, mencakup *operating system*, bahasa pemrograman beserta versinya, *framework*/*library*, DBMS, *development tools*, dan *version control*. Lingkungan ini harus konsisten dengan **Subbab 2.1 DPPL**; jelaskan jika ada perubahan. Cantumkan juga *framework* dan alat pengujian yang dipakai.

Tabel 3.1. Lingkungan Implementasi

| Aspek | Keterangan |
| :--- | :--- |
| *Hardware* | Desktop |
| *Operating System* | Server: NixOS 25.06. Client: lintas platform, cukup mendukung web browser Mozilla Firefox 150+. |
| *Bahasa Pemrograman* | JavaScript di atas runtime NodeJS 24 LTS untuk sisi server; HTML, CSS, dan JavaScript untuk sisi client yang berjalan di web browser. |
| *Framework/Library* | React JS untuk pembuatan antarmuka pengguna. |
| *DBMS* | PostgreSQL 18, untuk data persisten: data pengguna, tantangan, riwayat pengerjaan, percobaan, nilai, dan status kelulusan. |
| *Development Tools* | Git 2.54.0 dan GitHub untuk kendali versi kode; Nginx sebagai server web; draw.io/StarUML dan PlantUML untuk pemodelan UML. |
| *Testing Tools* | Manual (untuk pengujian use case) |

## 3.2 Implementasi Modul

> Daftar modul/kelas yang **TELAH** diimplementasikan. Gunakan nama dan ID kelas yang sama dengan DPPL, dan konsisten dengan Tabel B.5 pada dokumen Implementasi (Tugas 9).

Tabel 3.2. Implementasi Modul

| No | ID Kelas | Nama Modul/Kelas | Nama File Fisik | Nama File Executable |
| :--- | :--- | :--- | :--- | :--- |
| 1 | C01 | PembuatTantangan | src/backend/repositories/userRepository.js | - |
| 2 | C02 | Pelajar | src/backend/repositories/userRepository.js | - |
| 3 | C03 | Tantangan | src/backend/repositories/challengeRepository.js | - |
| 4 | C04 | WindowEdit | src/frontend/UploadPage.jsx | - |
| 5 | C05 | EditController | src/frontend/challengeApi.js | - |
| 6 | C06 | WindowEnvironment | src/frontend/ChallengePage.jsx | - |
| 7 | C07 | EnvironmentController | src/backend/services/terminalService.js | - |
| 8 | C08 | WindowRiwayat | src/frontend/HistoryModal.jsx | - |
| 9 | C09 | RiwayatTantangan | src/backend/repositories/challengeRepository.js | - |

<!--
| Kelas | Use Case Terkait |
| :--- | :--- |
| C01 - PembuatTantangan | UC01 - Mengembangkan Tantangan, UC02 - Mengevaluasi Tantangan, UC04 - Cek Riwayat |
| C02 - Pelajar | UC03 - Mengerjakan Tantangan, UC04 - Cek Riwayat |
| C03 - Tantangan | UC01 - Mengembangkan Tantangan, UC02 - Mengevaluasi Tantangan, UC03 - Mengerjakan Tantangan |
| C04 - WindowEdit | UC01 - Mengembangkan Tantangan |
| C05 - EditController | UC01 - Mengembangkan Tantangan |
| C06 - WindowEnvironment | UC02 - Mengevaluasi Tantangan, UC03 - Mengerjakan Tantangan, UC04 - Cek Riwayat |
| C07 - EnvironmentController | UC02 - Mengevaluasi Tantangan, UC03 - Mengerjakan Tantangan |
| C08 - WindowRiwayat | UC04 - Cek Riwayat |
| C09 - RiwayatTantangan | UC03 - Mengerjakan Tantangan, UC04 - Cek Riwayat |
-->

## 3.3 Implementasi Antarmuka

> Daftar antarmuka yang telah diimplementasikan. Gunakan ID dan nama layar yang sama dengan ID dan nama layar pada tugas DPPL.

Tabel 3.3. Implementasi Antarmuka

| No | ID Antarmuka | Nama Antarmuka | Nama File Fisik | Nama File Executable |
| :--- | :--- | :--- | :--- | :--- |
| 1 | *[I-01]* | *[Nama layar]* | *[path/ke/file]* | *[Nama file executable, atau - jika tidak ada]* |
| 2 | *[I-02]* | *[Nama layar]* | *[path/ke/file]* | *[...]* |
| ... | *...* | *...* | *...* | *...* |

## 3.4 File Lain

> Daftar file lain yang dibuat selain file kelas dan antarmuka, misalnya file *utility*, *configuration*, *database schema/seed*, *file test*, atau *data*.

Tabel 3.4. File Lain

| No | Nama File | Keterangan |
| :--- | :--- | :--- |
| 1 | *[Nama file]* | *[Fungsi file]* |
| ... | *...* | *...* |

<br>

---

# BAB 4: Hasil Pengujian

> Bab ini melaporkan hasil pengujian P/L pada level unit, integrasi, dan sistem. Pengujian dilakukan pada tag release terakhir Tugas 9. Hasil aktual diisi berdasarkan pengamatan saat pengujian. Kesimpulan diisi `Pass` atau `Fail`, dan untuk `Fail` dilengkapi penyebab serta usulan perbaikan.

## 4.1 Strategi dan Kedalaman Pengujian Kelas

> Setiap kelas perancangan pada Tabel 4.1 DPPL diklasifikasikan ke dalam tiga tingkat kedalaman pengujian. Tingkat **Mendalam** diberikan pada kelas yang memuat logika bisnis, perhitungan, validasi, aturan status, algoritma, integrasi eksternal, atau keamanan. Tingkat **Sedang** diberikan pada kelas yang hanya mengoordinasikan atau mendelegasikan proses. Tingkat **Tidak perlu** diberikan pada kelas tanpa logika, seperti *entity/DTO* dan kelas konfigurasi, yang teruji secara tidak langsung melalui test case use case. Seluruh kelas wajib dicantumkan beserta alasan penentuan tingkatnya.

Tabel 4.1.1. Identifikasi Tingkat Pengujian Kelas

| ID Kelas | Nama Kelas | Tingkat | Alasan | Test Case Terkait |
| :--- | :--- | :--- | :--- | :--- |
| *C02* | *Pesanan* | *Mendalam* | *Memuat `hitungTotal()` dan transisi status pembayaran* | *C02-UT01 s.d. C02-UT08* |
| *C03* | *Keranjang* | *Sedang* | *Delegasi sederhana ke Produk dan Pesanan* | *C03-UT01 s.d. C03-UT03, INT-TC02* |
| *C01* | *Pelanggan* | *Tidak perlu* | *Hanya menyimpan data akun, tanpa logika* | *-* |
| *[CXX]* | *[Nama kelas]* | *[Mendalam/Sedang/Tidak perlu]* | *[Alasan penentuan tingkat pengujian]* | *[ID test case atau -]* |
| *...* | *...* | *...* | *...* | *...* |

## 4.2 Pengujian Unit Kelas

> Pengujian unit dilakukan pada kelas bertingkat Mendalam dan Sedang. Kelas Mendalam diuji pada seluruh operasi public dengan kasus normal, batas, dan negatif, serta mencapai *coverage* minimal 70%. Kelas Sedang diuji minimal dengan satu kasus normal dan satu kasus gagal pada operasi public utama.

Cara menjalankan unit test: *[tuliskan perintah, mis. `pytest src/tests/`]*.

Lokasi file test: *[path, mis. `src/tests/`]*.

### 4.2.1 Kelas [Nama Kelas 1]

**ID Kelas:** *[C02]*  
**Nama Kelas:** *[Pesanan]*  
**Tingkat:** *[Mendalam]*

Tabel 4.2.1. Hasil Pengujian Unit Kelas [C02]

| ID Pengujian | Operasi yang Diuji | Jenis Kasus | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *C02-UT01* | *`hitungTotal(): Decimal`* | *Normal* | *Pesanan berisi 2 item: 10.000 x 2 dan 5.000 x 1* | *Total = 25.000* | *[Hasil aktual]* | *Pass/Fail* |
| *C02-UT02* | *`hitungTotal(): Decimal`* | *Batas* | *Pesanan berisi tepat 1 item dengan jumlah 1* | *Total = harga item tersebut* | *[...]* | *Pass/Fail* |
| *C02-UT03* | *`hitungTotal(): Decimal`* | *Negatif* | *Pesanan tanpa item* | *Total = 0 atau melempar kesalahan sesuai rancangan* | *[...]* | *Pass/Fail* |
| *...* | *...* | *...* | *...* | *...* | *...* | *...* |

Khusus kelas **Mendalam**:

Tabel 4.2.1b. Ringkasan Cakupan Kelas [C02]

| Informasi | Keterangan |
| :--- | :--- |
| Daftar operasi public pada DPPL | *[op1(), op2(), ...]* |
| Operasi yang diuji | *[op1(), op2(), ...]* |
| ID Algoritma yang tercakup | *[Algo-001, ...]* |
| Coverage (wajib ≥ 70%) | *[% baris / % cabang, alat dan bukti pada 4.6]* |

### 4.2.2 Kelas [Nama Kelas 2]

*[Ulangi pola 4.2.1 untuk setiap kelas bertingkat Mendalam atau Sedang.]*

<br>

## 4.3 Pengujian Integrasi

> Pengujian integrasi memeriksa interaksi antarkomponen yang melewati batas, yaitu *Controller* ke *Model*, aplikasi ke basis data, dan aplikasi ke sistem eksternal. Daftar antarmuka mengacu pada dokumen DPPL, dengan minimal satu test case untuk setiap antarmuka. Pengujian memakai komponen nyata, bukan *mock*. Apabila ada antarmuka tambahan yang belum didaftarkan pada dokumen DPPL, cantumkan juga.

Tabel 4.3.1. Daftar Antarmuka Antarkomponen

| ID Antarmuka | Komponen Asal | Komponen Tujuan | Jenis Batas | Test Case |
| :--- | :--- | :--- | :--- | :--- |
| *I-01* | *KeranjangController* | *Keranjang (Model)* | *Controller - Model* | *INT-TC01, INT-TC02* |
| *I-02* | *Pesanan (Model)* | *Database* | *Aplikasi - Basis data* | *INT-TC03* |
| *I-03* | *PaymentGatewayAdapter* | *Payment Gateway (dummy)* | *Aplikasi - Sistem eksternal* | *INT-TC04, INT-TC05* |
| *[I-XX]* | *[Komponen asal]* | *[Komponen tujuan]* | *[Jenis batas]* | *[ID test case]* |
| *...* | *...* | *...* | *...* | *...* |

Tabel 4.3.2. Hasil Pengujian Integrasi

| ID Pengujian | ID Antarmuka | Skenario | Prosedur/Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *INT-TC01* | *I-01* | *Normal: tambah item ke keranjang* | *Panggil `tambahItem()` melalui KeranjangController dengan produk valid* | *Item tersimpan pada Keranjang dan tampil pada daftar item* | *[Hasil aktual]* | *Pass/Fail* |
| *INT-TC03* | *I-02* | *Normal: simpan pesanan* | *Buat pesanan, lalu baca ulang langsung dari basis data* | *Baris pesanan ada dengan nilai total dan status yang sama* | *[...]* | *Pass/Fail* |
| *INT-TC05* | *I-03* | *Gagal: gateway mengembalikan status gagal* | *Kirim otorisasi dengan saldo dummy tidak cukup* | *Status pesanan tidak berubah menjadi "Lunas", pesan gagal diteruskan ke pengguna* | *[...]* | *Pass/Fail* |
| *...* | *...* | *...* | *...* | *...* | *...* | *...* |

<br>

## 4.4 Pengujian Use Case

### 4.4.1 Use Case Mengembangkan Tantangan

**ID Use Case:** UC01
**Nama Use Case:** Mengembangkan Tantangan

Tabel 4.4.1. Hasil Pengujian Use Case UC01

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *UC01-TC01* | *KF01, KF03* | *Normal* | *1. Buka halaman login.<br>2. Masukkan kredensial.<br>3. Klik tombol "Log In".<br>4. Klik tombol "Create New Challenge".<br>5. Unggah file pada kotak "Upload your challenge here (.zip)."* | *Username: user-demo<br>Password: password123<br>File: test/challenge.zip* | *File diterima dan dapat diunggah.* | *File diterima namun tidak dapat diunggah.* | *Fail: Sistem sudah bisa menverifikasi bahwa file yang diunggah adalah file .zip, namun bermasalah dalam pemrosesan file tersebut (terlihat via pesan error "Invalid challenge package: spawn unzip ENOENT").* |
| *UC01-TC02* | *KF01, KF03* | *Alternatif 1: Berkas Tantangan Gagal Diproses* | *1. Buka halaman login.<br>2. Masukkan kredensial.<br>3. Klik tombol "Log In".<br>4. Klik tombol "Create New Challenge".<br>5. Unggah file pada kotak "Upload your challenge here (.zip)."* | *Username: user-demo<br>Password: password123<br>File: (File bukan .zip)* | *Pengguna mendapatkan peringatan bahwa file tantangan tidak valid.* | *Pengguna mendapatkan peringatan bahwa file tantangan tidak valid.* | *Pass* |

### 4.4.2 Use Case Mengevaluasi Tantangan

**ID Use Case:** UC02
**Nama Use Case:** Mengevaluasi Tantangan

Tabel 4.4.2. Hasil Pengujian Use Case UC02

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *UC02-TC01* | *KF02* | *Normal* | *1. Buka halaman login.<br>2. Masukkan kredensial.<br>3. Klik tombol "Log In".<br>4. Klik tombol tantangan "Broken Repo".<br>5. Kirim command valid melalui Terminal.<br>6. Publikasikan tantangan.* | *Username: user-demo<br>Password: password123<br>* | *Sistem akan melakukan perubahan terhadap repository sesuai command, lalu menambahkan tantangan ke bank tantangan secara publik.* | *Tantangan tidak dapat dimuat sehingga Terminal tidak dapat diakses, namun tantangan dapat dipublikasi.* | *Fail: Pemrosesan file tantangan masih bermasalah.* |
| *UC02-TC02* | *KF02* | *Alternatif 1: Mengubah Tantangan yang Sudah Dipublikasikan* | *1. Buka halaman login.<br>2. Masukkan kredensial.<br>3. Klik tombol "Log In".<br>4. Klik tombol "Manage challenges & attempts".<br>5. Lakukan perubahan pada kolom Title, Description, dan/atau Difficulty.<br>6. Klik tombol "Save changes".* | *Username: user-demo<br>Password: password123<br>* | *Username: user-demo<br>Password: password123<br>* | *Perubahan pada tantangan disimpan.* | *Perubahan pada tantangan disimpan.* | *Pass* |
| *UC02-TC03* | *KF02* | *Alternatif 2: Menghapus Tantangan yang Sudah Dipublikasikan* | *1. Buka halaman login.<br>2. Masukkan kredensial.<br>3. Klik tombol "Log In".<br>4. Klik tombol "Manage challenges & attempts".<br>5. Klik tombol "Schedule deletion".* | *Username: user-demo<br>Password: password123<br>* | *Tantangan dihapus dari bank tantangan.* | *-* | *-* |


<!--
| *UC02-TC01* | *KF01, KF03* | *Normal* | *1. Buka halaman login.<br>2. Masukkan kredensial.<br>3. Klik tombol "Log In".<br>4. Klik tombol "Create New Challenge".<br>5. Unggah file pada kotak "Upload your challenge here (.zip)."* | *Username: user-demo<br>Password: password123<br>File: test/challenge.zip* | *File diterima dan dapat diunggah.* | *File diterima namun tidak dapat diunggah.* | *Fail: Sistem sudah bisa menverifikasi bahwa file yang diunggah adalah file .zip, namun bermasalah dalam pemrosesan file tersebut (terlihat via pesan error "Invalid challenge package: spawn unzip ENOENT").* |
| *UC02-TC02* | *KF* | *Alternatif 1: * | *Langkah* | *Input* | *Harapan* | *Hasil* | *Pass* |
-->

### 4.4.3 Use Case Mengerjakan Tantangan

**ID Use Case:** UC03
**Nama Use Case:** Mengerjakan Tantangan

Tabel 4.4.3. Hasil Pengujian Use Case UC03

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *UC03-TC01* | *KF04, KF05, KF06, KF07, KF08, KF09, KF10* | *Normal* | *1. Buka halaman signup.<br>2. Buat akun pelajar baru.<br>3. Klik tantangan yang tersedia.<br>4. Kirim command valid via Terminal.<br>5. Klik tombol "Submit".* | *-* | *Sistem melakukan perubahan pada repository sesuai command, dan mengevaluasi environment ketika hasil pekerjaan pelajar di-submit.* | *Tantangan tidak dapat dimuat.* | *Fail: Pemrosesan file tantangan masih bermasalah.* |
| *UC03-TC02* | *KF04* | *Alternatif 1: Pelajar Keluar di Tengah Pengerjaan* | *1. Buka halaman signup.<br>2. Buat akun pelajar baru.<br>3. Klik tantangan yang tersedia.<br>4. Keluar dari halaman pengerjaan tantangan.* | *-* | *Pelajar akan dibawa ke halaman Dashboard dan progress pengerjaan, jika ada, akan hilang.* | *Tantangan tidak dapat dimuat.* | *Fail: Pemrosesan file tantangan masih bermasalah.* |
| *UC03-TC03* | *KF04* | *Alternatif 2: Pelajar Mengulang Pengerjaan* | *1. Buka halaman signup.<br>2. Buat akun pelajar baru.<br>3. Klik tantangan yang tersedia.<br>4. Ulang attempt pengerjaan tantangan.* | *-* | *Sistem me-reset lingkungan tantangan dan progress pelajar akan terhapus.* | *Tantangan tidak dapat dimuat.* | *Fail: Pemrosesan file tantangan masih bermasalah.* |

### 4.4.4 Use Case Cek Riwayat

**ID Use Case:** UC04
**Nama Use Case:** Cek Riwayat

Tabel 4.4.1. Hasil Pengujian Use Case UC04

| ID Pengujian | ID KF | Skenario | Prosedur Pengujian | Masukan | Hasil yang Diharapkan | Hasil Pengujian | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *UC04-TC01* | *KF11, KF12* | *Normal* | *1. Buka halaman signup.<br>2. Buat akun pelajar baru.<br>3. Klik icon profil.<br>4. Klik tombol "History".* | *-* | *Pengguna berada di halaman riwayat pengerjaan tantangan, dan dapat melihat tantangan yang sudah dikerjakan.* | *Pengguna berada di halaman riwayat pengerjaan tantangan, dan dapat melihat tantangan yang sudah dikerjakan.* | *Pass* |
| *UC04-TC02* | *KF11, KF12* | *Alternatif 1: Pelajar Mengulang Tantangan* | *1. Buka halaman signup.<br>2. Buat akun pelajar baru.<br>3. Klik icon profil.<br>4. Klik tombol "History".<br>5. Klik pada tantangan yang sudah pernah dikerjakan.<br>Klik tombol kerjakan ulang.* | *-* | *Pengguna dapat mengerjakan ulangan tantangan dari halaman riwayat.* | *-* | *Fail: Tidak dapat diuji, karena tantangan tidak dapat dimuat.* |

<br>

## 4.5 Pengujian Kebutuhan Non-Fungsional (KNF)

> Setiap KNF pada Tabel 3.2 SKPL diuji secara terukur berdasarkan parameter yang telah didefinisikan. Setiap pengujian memuat target terukur, metode dan alat yang sesuai dengan parameter (misalnya Chrome DevTools untuk *response time* dan inspeksi basis data untuk *security*), serta hasil aktual berupa angka atau data. KNF yang belum dipenuhi atau tidak diimplementasikan dicantumkan beserta alasan dan rencana perbaikan.

Tabel 4.5. Hasil Pengujian KNF

| ID Pengujian | ID KNF | Parameter | Target Terukur | Metode dan Alat | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *KNF01-TC01* | *KNF01* | *Reliability* | *Tidak ada data hilang/ganda saat jaringan putus di tengah transaksi* | *Simulasi putus koneksi saat bayar, lalu cek status di DB* | *[Hasil aktual]* | *Pass/Fail* |
| *KNF02-TC01* | *KNF02* | *Security* | *Password tersimpan sebagai hash, bukan plain-text* | *Inspeksi tabel pengguna di DB* | *[...]* | *Pass/Fail* |
| *KNFXX-TC01* | *KNFXX* | *Response time* | *Halaman tampil ≤ 4 detik* | *Chrome DevTools, 5 kali ukur, ambil rata-rata* | *[Rata-rata ... detik, maks ... detik]* | *Pass/Fail* |
| *...* | *...* | *...* | *...* | *...* | *...* | *...* |

<br>

## 4.6 Tangkapan Layar dan Bukti Hasil Pengujian

> Bukti pengujian dilampirkan sesuai ID Pengujian pada Subbab 4.2 sampai 4.5, berupa tangkapan layar aplikasi, keluaran *test runner*, laporan *coverage* untuk setiap kelas Mendalam, atau hasil alat ukur.

Tabel 4.6. Bukti Hasil Pengujian

| ID Pengujian | Bukti Hasil Pengujian |
| :--- | :--- |
| *UC01-TC01* | <img alt="" src="./assets/UC01-TC01.png" width="700"> |
| *UC01-TC02* | <img alt="" src="./assets/UC01-TC02.png" width="700"> |
| *UC02-TC01* | <img alt="" src="./assets/UC02-TC02-1.png" width="700"><br><img alt="" src="./assets/UC02-TC01-2.png" width="700"> |
| *UC02-TC02* | <img alt="" src="./assets/UC02-TC02.png" width="700"> |
| *UC02-TC03* | - |
| *UC03-TC01* | <img alt="" src="./assets/UC03-TC.png" width="700"> |
| *UC03-TC02* | <img alt="" src="./assets/UC03-TC.png" width="700"> |
| *UC03-TC03* | <img alt="" src="./assets/UC03-TC.png" width="700"> |
| *UC04-TC01* | <img alt="" src="./assets/UC04-TC.png" width="700"> |
| *UC04-TC02* | <img alt="" src="./assets/UC03-TC.png" width="700"> |

<br>

---

# BAB 5: Traceability

> Petakan setiap KF ke KNF, use case, kelas perancangan, file implementasi, dan test case. Tabel traceability berikut akan menjadi sarana verifikasi KF. Setiap KF memiliki minimal satu test case dan dinyatakan terpenuhi apabila **seluruh** test case terkaitnya berkesimpulan `Pass`. KF yang tidak diimplementasikan tetap dicantumkan beserta alasannya.

Tabel 5.1. Matriks Kerunutan KF terhadap Implementasi dan Pengujian

| KF ID | KNF Terkait | Use Case ID | Kelas Terkait | Implementasi File Terkait | Test Case (UC) | Test Case (Unit/Integrasi/KNF) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *KF05* | *KNF01* | *UC03* | *C02 - Pesanan* | *`src/...`* | *UC03-TC01* | *C02-UT05, INT-TC04, KNF01-TC01* |
| *KF01* | *-* | *UC01<br>UC02* | *[C01 - Nama kelas]<br>[C02 - Nama kelas]* | *[path/ke/file1]<br>[path/ke/file2]* | *UC01-TC01, UC01-TC02<br>UC02-TC01* | *-* |
| *KF02* | *[KNFXX atau -]* | *[UCXX]* | *[CXX - Nama kelas]* | *[path/ke/file]* | *[UCXX-TCYY]* | *[CXX-UTYY, INT-TCYY, KNFXX-TCYY atau -]* |
| *KFXX* | *-* | *[UCXX atau -]* | *[CXX - Nama kelas atau -]* | *Tidak diimplementasikan: [alasan]* | *-* | *-* |
| *...* | *...* | *...* | *...* | *...* | *...* | *...* |

Tabel 5.2. Matriks Kerunutan KNF terhadap Pengujian

| ID KNF | Parameter | KF/UC Terkait | Test Case |
| :--- | :--- | :--- | :--- |
| *KNF01* | *Reliability* | *KF05 / UC03* | *KNF01-TC01* |
| *KNFXX* | *[Parameter]* | *[KFXX / UCXX atau -]* | *[KNFXX-TCYY]* |
| *...* | *...* | *...* | *...* |