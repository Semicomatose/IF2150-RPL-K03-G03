<h1>
IF2150 REKAYASA PERANGKAT LUNAK
<br>
TUGAS 1
<br>
TOPIC BRAINSTORMING
</h1>
<br>

## *Nama Perangkat Lunak*

### Untuk: *[Made Branenda Jordhy]*

Dipersiapkan oleh:
| Informasi | Keterangan |
| --- | --- |
| Kelas | *\[03\]* |
| Kelompok | *\[03\]*  |

| NIM | Nama |
|---|---|
| *[13525012]* | *[Steve Bradley Hoeij]* |
| *[13525072]* | *[Fahrezy Fitriansyah]* |
| *[13525084]* | *[Ariq Ulwan Hammam]* |
| *[13525132]* | *[Zidane Uland Fakhry]* |
| *[13525135]* | *[Ananda Aulia Nurramadhan]* |
---

<br>
<br>

# BAB 1: Analisis Permasalahan

## 1.1 Latar Belakang Masalah
Git adalah sistem kendali versi yang memungkinkan penggunanya untuk melacak perubahan pada kode dan mengatur proyek menggunakan perintah sederhana. Git melacak perubahan dalam sebuah proyek, yang disimpan dalam *repository*, dengan *commit*. Sebuah *commit* dapat digunakan untuk mengembalikan ataupun memajukan kode menuju *commit* dalam sejarah *commit*. Hal ini sangat membantu karena *developer* dapat melihat kapan terjadi sebuah kesalahan. Saat menggunakan Git, *developer* dapat bekerja pada salinan *repository* pribadi, kemudian melakukan sinkronisasi proyek ketika selesai melakukan implementasi sehingga mempermudah kolaborasi antara *developer*.

Menurut *Stack Overflow Developer Survey* pada 2022 yang mengakumulasi jawaban dari 70.000 *developer*, 93,87% responden mengadopsi Git sebagai sistem kendali versi. Hal ini menunjukkan popularitas Git dalam dunia profesional. Edukasi terkait Git selaras dengan SDG (*Sustainable Development Goal*) 4, *Quality Education*, secara spesifik target 4.4, yakni meningkatkan jumlah orang yang memiliki keterampilan yang relevan demi kesuksesan finansial. Dengan adanya edukasi Git, seorang *developer* dapat berintegrasi dengan industri secara lebih mulus.

## 1.2 Analisis Kondisi Saat Ini
Lakukan analisis terhadap proses yang berjalan saat ini di dunia nyata, baik itu sistem lama ataupun solusi yang sudah ada. Soroti kesenjangan atau celah dari kondisi tersebut yang nantinya akan diselesaikan oleh perangkat lunak kalian.

---

# BAB 2: Analisis Solusi

## 2.1 Deskripsi Perangkat Lunak
Abstraksikan solusi perangkat lunak yang diusulkan dari sudut pandang pengguna. Jelaskan target platform yang akan digunakan (misalnya: desktop application) beserta alasan pemilihannya. Deskripsikan juga nilai unik (inovasi inti) dari perangkat lunak kalian dan apa yang membedakannya dari solusi yang sudah ada.

## 2.2 Asumsi dan Batasan
Definisikan secara tegas asumsi (baik teknis maupun dari sisi pengguna) yang menjadi dasar pengembangan. Tuliskan batasan seperti regulasi/hukum, keterbatasan sumber daya, dan ruang lingkup solusi.

---

# BAB 3: Spesifikasi Kebutuhan dan Proses Bisnis

## 3.1 Identifikasi Aktor
Buatlah daftar seluruh aktor (pengguna) yang akan berinteraksi langsung dengan sistem solusi yang kalian kembangkan. Berikan penjelasan singkat mengenai peran dan karakteristik dari masing-masing aktor tersebut.

| Aktor | Deskripsi |
| :--- | :--- |
| *Kasir* | *Pengguna ini bertindak sebagai pihak yang bertanggung jawab untuk memproses transaksi harian dan melayani pembayaran pelanggan. Karakteristik dari pengguna ini adalah mengutamakan kecepatan dan keakuratan saat bertransaksi.* |
| ... | ... |


## 3.2 Kebutuhan Pengguna Awal
Definisikan apa yang ingin dicapai oleh pengguna saat menggunakan sistem ini dalam format *User Story* (Sebagai [Aktor], saya ingin [Aktivitas/Kebutuhan], sehingga [Tujuan/Nilai]). Pastikan kalian berfokus pada "apa yang ingin dilakukan pengguna".

| ID | Aktor | Kebutuhan / Aktivitas | Tujuan / Nilai |
| :--- | :--- | :--- | :--- |
| US-01 | *Kasir* |  *Memindai barcode barang* | *Proses pembayaran berjalan cepat dan akurat* |
| US-02 | *[Nama Aktor]* | *[Kebutuhan pengguna]* | *[Tujuan yang dicapai pengguna]* |
| ... | ... | ... | ... |

## 3.3 Model Proses Bisnis
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