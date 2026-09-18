import type { LogbookData } from "@/lib/logbook";

/**
 * On-screen replica of docs/template-logbook.pdf and template-logbook.docx.
 * Uses explicit hex/black styling inside the paper so the
 * preview stays faithful in both light and dark mode.
 */
export function LogbookPreview({ data }: { data: LogbookData }) {
  const displayRows =
    data.activities.length > 0
      ? data.activities
      : [
          { id: "empty", hariTanggal: "", jamMasuk: "", jamPulang: "", kegiatan: "" },
        ];
  const padded =
    displayRows.length < 7
      ? [
          ...displayRows,
          ...Array.from({ length: 7 - displayRows.length }, (_, i) => ({
            id: `pad-${i}`,
            hariTanggal: "",
            jamMasuk: "",
            jamPulang: "",
            kegiatan: "",
          })),
        ]
      : displayRows;

  const mahasiswa = data.namaMahasiswa || data.nama || "[Nama Mahasiswa]";
  const pembimbing = data.namaPembimbing || "[Nama pembimbing]";
  const mentor = data.namaMentor || "[Nama Mentor]";

  return (
    <div
      id="logbook-paper"
      className="w-full max-w-[794px] bg-white px-8 py-8 font-serif text-[12px] leading-normal text-black shadow-xl sm:px-12"
      style={{ minHeight: "1123px" }}
    >
      {/* Kop Surat (1 logo di kiri, teks di tengah) */}
      <div className="relative flex items-center justify-center pb-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo1.png"
            alt="Logo Polinema"
            className="h-[84px] w-[84px] object-contain"
          />
        </div>
        <div className="text-center text-black">
          <p className="text-[12px] font-bold tracking-wide">
            KEMENTERIAN PENDIDIKAN TINGGI, SAINS,
          </p>
          <p className="text-[12px] font-bold tracking-wide">DAN TEKNOLOGI</p>
          <p className="text-[15px] font-bold tracking-wide">
            POLITEKNIK NEGERI MALANG
          </p>
          <p className="text-[13px] font-bold tracking-wide">
            JURUSAN TEKNOLOGI INFORMASI
          </p>
          <p className="mt-0.5 text-[9.5px]">
            Jalan Soekarno Hatta Nomor 9, Jatimulyo, Lowokwaru, Malang 65141
          </p>
          <p className="text-[9.5px]">
            Telepon (0341) 404424, 404425, Faksimile (0341) 404420
          </p>
          <p className="text-[9.5px]">Laman www.polinema.ac.id</p>
        </div>
      </div>

      {/* Garis batas kop tunggal hitam tebal */}
      <div className="border-b-[2.5px] border-black" />

      {/* Judul Dokumen */}
      <div className="mt-4 text-center">
        <p className="text-[13px] font-bold tracking-wide">LOG BOOK KEGIATAN</p>
        <p className="text-[13px] font-bold tracking-wide">
          PROGRAM MAGANG INDUSTRI
        </p>
      </div>

      {/* Tabel Identitas Bergaris (Bordered Box) */}
      <table className="mt-3.5 w-full border-collapse border border-black text-[11.5px]">
        <tbody>
          <tr>
            <td className="w-[28%] border border-black px-2.5 py-1 font-bold">
              Nama
            </td>
            <td className="w-[3%] border border-black px-1 py-1 text-center font-bold">
              :
            </td>
            <td className="border border-black px-2.5 py-1">
              {data.nama || <span>&nbsp;</span>}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2.5 py-1 font-bold">NIM</td>
            <td className="border border-black px-1 py-1 text-center font-bold">
              :
            </td>
            <td className="border border-black px-2.5 py-1">
              {data.nim || <span>&nbsp;</span>}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2.5 py-1 font-bold">
              Program Studi
            </td>
            <td className="border border-black px-1 py-1 text-center font-bold">
              :
            </td>
            <td className="border border-black px-2.5 py-1">
              {data.programStudi || <span>&nbsp;</span>}
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2.5 py-1 font-bold">
              Nama Mitra Industri
            </td>
            <td className="border border-black px-1 py-1 text-center font-bold">
              :
            </td>
            <td className="border border-black px-2.5 py-1">
              {data.namaMitra || <span>&nbsp;</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Tabel Kegiatan Harian */}
      <table className="mt-4 w-full border-collapse border border-black text-[11.5px]">
        <thead>
          <tr className="bg-[#d4d4d4]">
            <th className="w-[18%] border border-black px-2 py-1.5 font-bold text-center">
              Hari,
              <br />
              Tanggal
            </th>
            <th className="w-[13%] border border-black px-2 py-1.5 font-bold text-center">
              Jam Masuk
            </th>
            <th className="w-[13%] border border-black px-2 py-1.5 font-bold text-center">
              Jam Pulang
            </th>
            <th className="w-[56%] border border-black px-2 py-1.5 font-bold text-center">
              Kegiatan
            </th>
          </tr>
        </thead>
        <tbody>
          {padded.map((a) => (
            <tr key={a.id} className="align-top">
              <td className="border border-black px-2 py-1.5 text-center leading-snug">
                {a.hariTanggal || <span>&nbsp;</span>}
              </td>
              <td className="border border-black px-2 py-1.5 text-center">
                {a.jamMasuk || <span>&nbsp;</span>}
              </td>
              <td className="border border-black px-2 py-1.5 text-center">
                {a.jamPulang || <span>&nbsp;</span>}
              </td>
              <td className="min-h-12 border border-black px-2 py-1.5 text-left leading-snug whitespace-pre-wrap">
                {a.kegiatan || <span>&nbsp;</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bagian Tanda Tangan Sesuai Template Resmi */}
      <div className="mt-6 text-[11.5px]">
        {/* Tingkat 1: Mahasiswa di kolom kanan (lurus dengan Pembimbing Lapangan di bawahnya) */}
        <div className="grid grid-cols-2 gap-4">
          <div aria-hidden="true" />
          <div className="text-center">
            <p>Mahasiswa,</p>
            <div className="flex h-16 items-center justify-center">
              {data.ttdMahasiswa ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.ttdMahasiswa}
                  alt="Tanda Tangan Mahasiswa"
                  className="max-h-16 max-w-[160px] object-contain"
                />
              ) : (
                <div className="h-16" />
              )}
            </div>
            <p className="font-bold">{mahasiswa}</p>
          </div>
        </div>

        {/* Tingkat 2: Mengetahui di tengah, membawahi Dosen Pembimbing & Pembimbing Lapangan */}
        <div className="mt-4">
          <p className="text-center font-normal">Mengetahui,</p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p>Dosen Pembimbing,</p>
              <div className="h-16" />
              <p className="font-bold">{pembimbing}</p>
            </div>
            <div className="text-center">
              <p>Pembimbing Lapangan</p>
              <div className="h-16" />
              <p className="font-bold">{mentor}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
