<h1>
IF2150 REKAYASA PERANGKAT LUNAK
<br>
TUGAS 1
<br>
TOPIC BRAINSTORMING
</h1>
<br>

## *Commitment Issues*

### Untuk: *[Made Branenda Jordhy]*

Dipersiapkan oleh:
| Informasi | Keterangan |
| --- | --- |
| Kelas | 03 |
| Kelompok | 03 |

| NIM | Nama |
|---|---|
| [13525012] | [Steve Bradley Hoeij] |
| [13525072] | [Fahrezy Fitriansyah] |
| [13525084] | [Ariq Ulwan Hammam] |
| [13525132] | [Zidane Uland Fakhry] |
| [13525135] | [Ananda Aulia Nurramadhan] |
---

<br>
<br>

# BAB 1: Analisis Permasalahan

## 1.1 Latar Belakang Masalah
Git adalah sistem kendali versi yang memungkinkan penggunanya untuk melacak perubahan pada kode dan mengatur proyek menggunakan perintah sederhana. Git melacak perubahan dalam sebuah proyek, yang disimpan dalam *repository*, dengan *commit*. Sebuah *commit* dapat digunakan untuk mengembalikan ataupun memajukan kode menuju *commit* dalam sejarah *commit*. Hal ini sangat membantu karena *developer* dapat melihat kapan terjadi sebuah kesalahan. Saat menggunakan Git, *developer* dapat bekerja pada salinan *repository* pribadi, kemudian melakukan sinkronisasi proyek ketika selesai melakukan implementasi sehingga mempermudah kolaborasi antara *developer*.

Menurut *Stack Overflow Developer Survey* pada 2022 yang mengakumulasi jawaban dari 70.000 *developer*, 93,87% responden mengadopsi Git sebagai sistem kendali versi. Hal ini menunjukkan popularitas Git dalam dunia profesional. Edukasi terkait Git selaras dengan SDG (*Sustainable Development Goal*) 4, *Quality Education*, secara spesifik target 4.4, yakni meningkatkan jumlah orang yang memiliki keterampilan yang relevan demi kesuksesan finansial. Dengan adanya edukasi Git, seorang *developer* dapat berintegrasi dengan industri secara lebih mulus.

## 1.2 Analisis Kondisi Saat Ini
Saat ini, terdapat beberapa solusi yang ada, yaitu [buku resmi Git](https://git-scm.com/book/en), [W3Schools](https://www.w3schools.com/git/default.asp), [git-practice.com](https://git-practice.com), [nos111/git-challenge](https://github.com/nos111/git-challenge), [LabEx](https://labex.io/exercises/git), [Learn Git Branching](https://learngitbranching.js.org). Namun, solusi-solusi tersebut belum berfokus keterampilan Git yang realistis.

Pada penggunaan nyatanya, kegunaan Git lebih tecermin pada sistem manajemen versinya sehingga solusi yang optimal untuk pembelajaran Git adalah _learning by doing_ berbasis praktik langsung yang membantu pengguna untuk menggunakan Git sebagai aplikasi CLI. Pemahaman dan penguasaan Git baru teruji saat pengguna harus menangani konflik tanpa merusak _codebase_, seperti penanganan konflik merge dan file recovery.

[Buku Git](https://git-scm.com/book/en) berisi penjelasan dan contoh-contoh yang dapat membantu pemahaman, namun tidak berisi tantangan (challenge) sehingga tidak memaksa pembacanya untuk mempraktikkan apa yang mereka sudah pelajari. Serupa dengan buku resmi git, [W3Schools](https://www.w3schools.com/git/default.asp) berisi dengan banyak penjelasan command dan contoh, namun tidak mengandung tantangan bagi penggunanya.

Selain itu, solusi interaktif yang memiliki model tantangan belum sesuai dengan harapan. [git-practice.com](https://git-practice.com) serta [nos111/git-challenge](https://github.com/nos111/git-challenge) berisi latihan-latihan sederhana yang umumnya dapat diselesaikan dengan sebuah command saja. Sedangkan, [Learn Git Branching](https://learngitbranching.js.org) menggunakan antarmuka kustom dengan terminal yang terbatas pada perintah-perintah sederhana.

---

# BAB 2: Analisis Solusi

## 2.1 Deskripsi Perangkat Lunak
Ketika pengguna membuka aplikasi web, pengguna akan disambut dengan sebuah jendela yang mendeskripsikan masalah secara singkat dan sebuah jendela CLI yang sederhana. Di jendela CLI, pengguna dapat menuliskan lalu mengekseskusi perintah Git dan tools-tools lainnya, seperti `mv`, `ls`, dan `cd`. Jika pengguna merasa kesulitan dengan masalah tertentu, mereka dapat mereset kondisi, meminta hint, dan bila masih kesulitan bisa melakukan reveal solusi. Jika pengguna merasa sudah menyelesaikan masalahnya, pengguna dapat memencet tombol submit supaya aplikasi dapat menerima dan memeriksa jawaban pengguna. Jika sudah benar, pengguna dapat lanjut ke pertanyaan selanjutnya, namun, jika salah, pengguna dapat memperbaiki jawabannya.

Kami memilih solusi aplikasi berbasis web karena pertimbangan waktu pengembangan aplikasi. Aplikasi web memiliki ekosistem yang besar sehingga tidak perlu mengimplementasikan segala hal secara manual. Selain itu, aplikasi web juga memiliki kompatibilitas yang tinggi sehingga dapat berjalan pada sebagian besar sistem.

Inovasi inti dari aplikasi ini adalah ekosistem terminal yang lebih komprehensif. Pada aplikasi lainnya yang disebutkan pada Bab 1.2, perintah-perintah yang tersedia pada CLI yang disediakan memiliki kemampuan yang terbatas sehingga tidak sesuai dengan penggunaan nyata Git. Aplikasi ini melatih pengguna untuk menggunakan alat-alat lain bersamaan dengan Git sehingga dapat melatih workflow Git yang lebih baik.

## 2.2 Asumsi dan Batasan
Asumsi teknikalnya adalah performa shell interaktif yang cepat, sistem verifikasi state repositori yang deterministik, lingkungan yang POSIX-compliant, dan pemulihan state yang seamless.

Asumsi penggunaannya adalah pengguna sudah memiliki pemahaman dasar akan perintah-perintah dasar di terminal dan konsep-konsep dasar Git, seperti `commit`, `branch`, dan `revisions`, pengguna memiliki browser yang mendukung JavaScript dan WebSockets.

Konstrain aplikasinya adalah environment sistem operasi karena konflik format newline antara Dos dan Unix (CRLF di Windows, LF di Linux) yang mengubah hash Git sehingga mungkin mempersulit verifikasi, perubahan state lokal seperti konfigurasi Git, alias, dan hook mungkin mengubah perilaku repositori, dan pembatasan kewenangan pengguna sehingga tidak dapat merusak aplikasi serta environment yang telah dibuat.

---

# BAB 3: Spesifikasi Kebutuhan dan Proses Bisnis

## 3.1 Identifikasi Aktor

| Aktor | Deskripsi |
| :--- | :--- |
| *Pembuat tantangan* | *Pengguna ini bertindak sebagai pihak yang sudah menguasai Git dan mendesain capaian pembelajaran, permasalahan, dan aturan validasi.* |
| *Pelajar* | *Pengguna ini bertindak sebagai pihak yang belum menguasai atau masih mempelajari Git dan sedang memecahkan masalah yang diberikan pembuat tantangan.* |


## 3.2 Kebutuhan Pengguna Awal
Definisikan apa yang ingin dicapai oleh pengguna saat menggunakan sistem ini dalam format *User Story* (Sebagai [Aktor], saya ingin [Aktivitas/Kebutuhan], sehingga [Tujuan/Nilai]). Pastikan kalian berfokus pada "apa yang ingin dilakukan pengguna".

| ID | Aktor | Kebutuhan / Aktivitas | Tujuan / Nilai |
| :--- | :--- | :--- | :--- |
| US-01 | Pembuat tantangan | Mengajarkan tentang Git | Hasil pembelajaran pelajar sesuai dengan capaian pembelajaran |
| US-02 | Pelajar | Memahami kegunaan Git | Menyelesaikan pembelajaran dengan pemahaman baru dan hasil yang memuaskan |

## 3.3 Deskripsi Aktivitas
Buatlah daftar seluruh aktivitas yang terdapat dalam sistem solusi, lengkap dengan ID dan penjelasan. Telusuri hubungan aktivitas tersebut dengan *user story* yang sudah dituliskan sebelumnya. Bisa dibuat dalam bentuk tabel.
| ID | Aktivitas | Penjelasan | ID User Story |
| :--- | :--- | :--- | :--- |
| A01 | *Melakukan Pemesanan* | *Pelanggan memulai proses dengan memesan produk.* | *US-01* |
| A02 | *Memproses Pesanan* | *Sistem memproses dan menyiapkan detail sesuai dengan pesanan.* | *US-02*|
| ... | ... | ... | ... |

## 3.4 Model Proses Bisnis
Buatlah *Activity Diagram* atau *Swimlane Diagram* yang menunjukkan alur kerja proses bisnis dari sistem solusi. Diagram ini harus memvisualisasikan bagaimana alur operasional di dunia nyata berjalan lebih efisien dengan adanya interaksi antara aktor (yang didefinisikan pada poin 3.1) dan sistem perangkat lunak. Perhatikan notasi yang digunakan dalam pembuatannya.
<br>

<p align="center">
<img alt="Contoh Activity Diagram" src="./assets/diagram/diagram-act-1.avif" width="70%">
</p>
<p align="center">
<i>Gambar 1. Contoh Activity Diagram</i>
</p>

<br>

# Referensi
- Marijan, Bosko. 2021. How Does Git Work?: https://phoenixnap.com/kb/how-git-works
- Robbins, Jennifer. 2018. "Version Control With Git," *Learning Web Design*
- Stack Overflow Developer Survey 2022: https://survey.stackoverflow.co/2022/#technology-version-control
- Diagram UML: https://www.drawio.com/, https://staruml.io/
