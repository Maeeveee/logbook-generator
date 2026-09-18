# logbook-generator

Generator Log Book Kegiatan Program Magang Industri (Politeknik Negeri Malang) berbasis Next.js 15, React 19, Tailwind CSS, dan shadcn/ui.

## ✨ Fitur Utama

- **Pratinjau Presisi Sesuai Template Resmi**: Tampilan kop Polinema, tabel identitas bergaris, tabel kegiatan dengan arsir abu-abu, dan susunan tanda tangan mahasiswa & pembimbing yang simetris.
- **Tanda Tangan Digital**: Unggah gambar tanda tangan (PNG/JPG) yang langsung ditempelkan otomatis pada pratinjau dan hasil cetak PDF.
- **Penyimpanan Lokal Otomatis (Local Storage)**: Data diri mahasiswa, instansi mitra, dosen pembimbing, mentor, serta gambar tanda tangan tersimpan otomatis di browser tanpa perlu server/database.
- **Pengisian Cepat & Ringkas**:
  - **Mode Tab Fokus**: Mengisi baris kegiatan per-tab dengan tombol navigasi *Sebelumnya / Berikutnya* dan indikator kelengkapan pengisian.
  - **Mode Tampilkan Semua**: Mengedit semua baris sekaligus dalam container scrollable yang rapi.
- **Ekspor PDF Instan**: Menghasilkan dokumen cetak beresolusi tinggi yang siap ditandatangani dan dikumpulkan menggunakan jsPDF dan jspdf-autotable.

## 🚀 Memulai Proyek

Pastikan Node.js (>= 18) telah terpasang di sistem Anda:

```bash
# Clone repositori
git clone https://github.com/Maeeveee/logbook-generator.git
cd logbook-generator

# Pasang dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada peramban Anda untuk menggunakan aplikasi.

## 🛠️ Teknologi yang Digunakan

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- [Lucide React Icons](https://lucide.dev/)
