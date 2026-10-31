
const isiTabel = document.getElementById("isiTabel");
const jumlahTotal = document.getElementById("jumlahTotal");

function tanggalHariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
  const hari = String(sekarang.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
}

function ambilRiwayat() {
  return JSON.parse(localStorage.getItem("riwayatSurat")) || [];
}

function simpanRiwayat(riwayat) {
  localStorage.setItem("riwayatSurat", JSON.stringify(riwayat));
}

function buatNomorSurat() {
  const tanggal = tanggalHariIni().replaceAll("-", "");
  const riwayat = ambilRiwayat();

  const nomorHariIni = riwayat.filter(item =>
    item.nomor && item.nomor.startsWith(`SJ-${tanggal}`)
  ).length + 1;

  return `SJ-${tanggal}-${String(nomorHariIni).padStart(3, "0")}`;
}

function tambahBaris(data = {}) {
  const baris = document.createElement("tr");

  const tdNo = document.createElement("td");
  tdNo.className = "nomor-baris";

  const tdNama = document.createElement("td");
  const inputNama = document.createElement("input");
  inputNama.type = "text";
  inputNama.className = "nama-bahan";
  inputNama.placeholder = "Nama bahan";
  inputNama.value = data.nama || "";
  tdNama.appendChild(inputNama);

  const tdUkuran = document.createElement("td");
  const inputUkuran = document.createElement("input");
  inputUkuran.type = "text";
  inputUkuran.className = "ukuran";
  inputUkuran.placeholder = "Masukkan ukuran";
  inputUkuran.value = data.ukuran || "";
  tdUkuran.appendChild(inputUkuran);

  const tdTotal = document.createElement("td");
  const inputTotal = document.createElement("input");
  inputTotal.type = "number";
  inputTotal.className = "total";
  inputTotal.min = "0";
  inputTotal.step = "any";
  inputTotal.placeholder = "0";
  inputTotal.value = data.total ?? "";
  inputTotal.addEventListener("input", hitungJumlah);
  tdTotal.appendChild(inputTotal);

  const tdAksi = document.createElement("td");
  tdAksi.className = "no-print";

  const tombolHapus = document.createElement("button");
  tombolHapus.className = "hapus";
  tombolHapus.textContent = "Hapus";
  tombolHapus.addEventListener("click", () => hapusBaris(tombolHapus));

  tdAksi.appendChild(tombolHapus);

  baris.append(tdNo, tdNama, tdUkuran, tdTotal, tdAksi);
  isiTabel.appendChild(baris);

  perbaruiNomor();
  hitungJumlah();
}

function hapusBaris(tombol) {
  tombol.closest("tr").remove();
  perbaruiNomor();
  hitungJumlah();
}

function perbaruiNomor() {
  document.querySelectorAll("#isiTabel tr").forEach((baris, index) => {
    baris.querySelector(".nomor-baris").textContent = index + 1;
  });
}

function hitungJumlah() {
  let jumlah = 0;

  document.querySelectorAll(".total").forEach(input => {
    jumlah += Number(input.value) || 0;
  });

  jumlahTotal.textContent = jumlah.toLocaleString("id-ID", {
    maximumFractionDigits: 2
  });
}

function ambilData() {
  const bahan = [];

  document.querySelectorAll("#isiTabel tr").forEach(baris => {
    bahan.push({
      nama: baris.querySelector(".nama-bahan").value,
      ukuran: baris.querySelector(".ukuran").value,
      total: baris.querySelector(".total").value
    });
  });

  return {
    nomor: document.getElementById("nomor").value,
    tanggal: document.getElementById("tanggal").value,
    penerima: document.getElementById("penerima").value,
    alamatPenerima: document.getElementById("alamatPenerima").value,
    teleponPenerima: document.getElementById("teleponPenerima").value,
    catatan: document.getElementById("catatan").value,
    bahan
  };
}

function isiData(data) {
  document.getElementById("nomor").value = data.nomor || "";
  document.getElementById("tanggal").value = data.tanggal || "";
  document.getElementById("penerima").value = data.penerima || "";
  document.getElementById("alamatPenerima").value =
    data.alamatPenerima || "";
  document.getElementById("teleponPenerima").value =
    data.teleponPenerima || "";
  document.getElementById("catatan").value = data.catatan || "";

  isiTabel.innerHTML = "";

  (data.bahan || []).forEach(item => tambahBaris(item));

  if (!data.bahan || data.bahan.length === 0) {
    tambahBaris();
  }

  hitungJumlah();
}

function simpanSurat() {
  const data = ambilData();

  if (!data.nomor) {
    alert("Nomor surat belum tersedia.");
    return;
  }

  const riwayat = ambilRiwayat();
  const index = riwayat.findIndex(item => item.nomor === data.nomor);

  if (index >= 0) {
    riwayat[index] = data;
  } else {
    riwayat.push(data);
  }

  simpanRiwayat(riwayat);
  alert("Surat jalan berhasil disimpan.");
}

function suratBaru() {
  if (!confirm(
    "Buat surat jalan baru? Pastikan data sebelumnya sudah disimpan."
  )) {
    return;
  }

  document.getElementById("nomor").value = buatNomorSurat();
  document.getElementById("tanggal").value = tanggalHariIni();
  document.getElementById("penerima").value = "";
  document.getElementById("alamatPenerima").value = "";
  document.getElementById("teleponPenerima").value = "";
  document.getElementById("catatan").value = "";

  isiTabel.innerHTML = "";
  tambahBaris();
}

function lihatRiwayat() {
  const panel = document.getElementById("panelRiwayat");
  panel.hidden = false;
  tampilkanRiwayat();
}

function tampilkanRiwayat() {
  const daftar = document.getElementById("daftarRiwayat");
  const riwayat = ambilRiwayat();

  daftar.innerHTML = "";

  if (riwayat.length === 0) {
    daftar.textContent = "Belum ada riwayat surat jalan.";
    return;
  }

  riwayat.slice().reverse().forEach(data => {
    const item = document.createElement("div");
    item.className = "item-riwayat";

    const info = document.createElement("span");
    info.textContent =
      `${data.nomor} - ${data.penerima || "Tanpa nama penerima"}`;

    const tombolBuka = document.createElement("button");
    tombolBuka.textContent = "Buka";
    tombolBuka.onclick = () => {
      isiData(data);
      document.getElementById("panelRiwayat").hidden = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const tombolHapus = document.createElement("button");
    tombolHapus.textContent = "Hapus";
    tombolHapus.className = "hapus-riwayat";

    tombolHapus.onclick = () => {
      hapusRiwayat(data.nomor);
    };

    const aksi = document.createElement("div");
    aksi.appendChild(tombolBuka);
    aksi.appendChild(tombolHapus);

    item.appendChild(info);
    item.appendChild(aksi);

    daftar.appendChild(item);
  });
}

function hapusRiwayat(nomor) {
  if (!confirm(`Yakin ingin menghapus surat ${nomor} dari riwayat?`)) {
    return;
  }

  const riwayat = ambilRiwayat().filter(item => item.nomor !== nomor);

  simpanRiwayat(riwayat);
  tampilkanRiwayat();

  alert("Riwayat surat berhasil dihapus.");
}

function tutupRiwayat() {
  document.getElementById("panelRiwayat").hidden = true;
}

// Inisialisasi halaman
document.getElementById("nomor").value = buatNomorSurat();
document.getElementById("tanggal").value = tanggalHariIni();

tambahBaris();
