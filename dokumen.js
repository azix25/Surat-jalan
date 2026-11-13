const $=id=>document.getElementById(id);
let customTemplate=localStorage.getItem("templateCanvaBisnis")||"";
let companyLogo=localStorage.getItem("logoPerusahaanBisnis")||"";
if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
const fieldIds=["perusahaan","alamatPerusahaan","teleponPerusahaan","emailPerusahaan","penanggungJawab","jabatan","pihak","alamatPihak","nomorDokumen","tanggalDokumen","jatuhTempo","keterangan","pajak","diskon","catatan","kolomNamaLabel","kolomJumlahLabel","kolomDetailLabel","layoutMode","rincianBebas","teksPenutupKiri","teksPenutupKanan"];
const labels={invoice:{title:"INVOICE",party:"DITAGIHKAN KEPADA",right:"JATUH TEMPO",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Catatan / Ketentuan"},suratjalan:{title:"SURAT JALAN",party:"DIKIRIM KEPADA",right:"TANGGAL PENGIRIMAN",leftSign:"Pengirim,",rightSign:"Penerima,",notes:"Catatan Pengiriman"},penawaran:{title:"SURAT PENAWARAN HARGA",party:"KEPADA YTH.",right:"TANGGAL PENAWARAN",leftSign:"Hormat kami,",rightSign:"Menyetujui,",notes:"Syarat dan Ketentuan"},penagihan:{title:"SURAT TAGIHAN",party:"DITAGIHKAN KEPADA",right:"BATAS PEMBAYARAN",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Informasi Pembayaran"},kuitansi:{title:"KUITANSI",party:"TELAH DITERIMA DARI",right:"TANGGAL PEMBAYARAN",leftSign:"Penerima,",rightSign:"Pembayar,",notes:"Keterangan Pembayaran"},purchaseorder:{title:"PESANAN PEMBELIAN",party:"PEMASOK / VENDOR",right:"TANGGAL PENGIRIMAN",leftSign:"Pemesan,",rightSign:"Pemasok,",notes:"Syarat Pemesanan"},beritaacara:{title:"BERITA ACARA PEKERJAAN",party:"PIHAK TERKAIT",right:"TANGGAL KEGIATAN",leftSign:"Pihak Pertama,",rightSign:"Pihak Kedua,",notes:"Uraian / Catatan"},kontrak:{title:"SURAT PERJANJIAN KERJA",party:"PARA PIHAK",right:"TANGGAL PERJANJIAN",leftSign:"Pihak Pertama,",rightSign:"Pihak Kedua,",notes:"Pasal / Ketentuan"},surattugas:{title:"SURAT TUGAS",party:"DITUGASKAN KEPADA",right:"TANGGAL TUGAS",leftSign:"Pemberi Tugas,",rightSign:"Penerima Tugas,",notes:"Instruksi / Catatan"},permohonan:{title:"SURAT PERMOHONAN",party:"KEPADA YTH.",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Mengetahui,",notes:"Lampiran / Catatan"},resmi:{title:"SURAT RESMI",party:"KEPADA YTH.",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Mengetahui,",notes:"Lampiran / Catatan"},tandaterima:{title:"BUKTI TANDA TERIMA",party:"TELAH DITERIMA DARI",right:"TANGGAL PENERIMAAN",leftSign:"Yang Menyerahkan,",rightSign:"Yang Menerima,",notes:"Keterangan Barang"},deliveryorder:{title:"PERINTAH PENGIRIMAN",party:"DIKIRIM KEPADA",right:"TANGGAL PENGIRIMAN",leftSign:"Pengirim,",rightSign:"Penerima,",notes:"Instruksi Pengiriman"},spk:{title:"SURAT PERINTAH KERJA",party:"KEPADA PELAKSANA",right:"TANGGAL MULAI",leftSign:"Pemberi Kerja,",rightSign:"Pelaksana,",notes:"Lingkup Pekerjaan / Ketentuan"},rab:{title:"RENCANA ANGGARAN BIAYA",party:"NAMA PROYEK / PEMILIK",right:"TANGGAL PENYUSUNAN",leftSign:"Disusun oleh,",rightSign:"Disetujui oleh,",notes:"Asumsi / Catatan Anggaran"},bast:{title:"BERITA ACARA SERAH TERIMA",party:"PIHAK PENERIMA",right:"TANGGAL SERAH TERIMA",leftSign:"Pihak yang Menyerahkan,",rightSign:"Pihak yang Menerima,",notes:"Kondisi / Catatan Serah Terima"},laporanprogress:{title:"LAPORAN KEMAJUAN PEKERJAAN",party:"NAMA PROYEK / PEMBERI KERJA",right:"PERIODE LAPORAN",leftSign:"Dibuat oleh,",rightSign:"Diperiksa oleh,",notes:"Kendala / Tindak Lanjut"},laporanhari:{title:"LAPORAN HARIAN PEKERJAAN",party:"NAMA PROYEK",right:"TANGGAL LAPORAN",leftSign:"Pelaksana,",rightSign:"Pengawas,",notes:"Cuaca / Kendala / Catatan"},permintaanpembelian:{title:"FORMULIR PERMINTAAN PEMBELIAN",party:"BAGIAN / PEMOHON",right:"TANGGAL DIBUTUHKAN",leftSign:"Pemohon,",rightSign:"Menyetujui,",notes:"Alasan / Spesifikasi Pembelian"},notadebit:{title:"NOTA DEBIT",party:"DITUJUKAN KEPADA",right:"TANGGAL NOTA",leftSign:"Penerbit,",rightSign:"Penerima,",notes:"Alasan / Referensi Transaksi"},notakredit:{title:"NOTA KREDIT",party:"DITUJUKAN KEPADA",right:"TANGGAL NOTA",leftSign:"Penerbit,",rightSign:"Penerima,",notes:"Alasan / Referensi Transaksi"},suratperingatan:{title:"SURAT TEGURAN / PERINGATAN",party:"KEPADA YTH.",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Uraian / Tindak Lanjut"},suratundangan:{title:"SURAT UNDANGAN",party:"KEPADA YTH.",right:"HARI / TANGGAL ACARA",leftSign:"Hormat kami,",rightSign:"Mengetahui,",notes:"Agenda / Tempat / Waktu"},suratkuasa:{title:"SURAT KUASA",party:"PENERIMA KUASA",right:"TANGGAL PEMBUATAN",leftSign:"Pemberi Kuasa,",rightSign:"Penerima Kuasa,",notes:"Ruang Lingkup Kuasa"},suratketerangan:{title:"SURAT KETERANGAN",party:"YANG DITERANGKAN",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Mengetahui,",notes:"Keterangan Tambahan"},memointernal:{title:"MEMO INTERNAL",party:"KEPADA",right:"TANGGAL MEMO",leftSign:"Dibuat oleh,",rightSign:"Diketahui,",notes:"Tindak Lanjut"},suratpengantar:{title:"SURAT PENGANTAR",party:"KEPADA YTH.",right:"TANGGAL SURAT",leftSign:"Pengirim,",rightSign:"Penerima,",notes:"Daftar Lampiran / Catatan"},laporanbiaya:{title:"LAPORAN RINCIAN BIAYA PROYEK",party:"NAMA PROYEK / PENANGGUNG JAWAB",right:"PERIODE LAPORAN",leftSign:"Disusun oleh,",rightSign:"Diperiksa oleh,",notes:"Keterangan Biaya"},checklistqc:{title:"DAFTAR PEMERIKSAAN MUTU",party:"NAMA PROYEK / LOKASI",right:"TANGGAL PEMERIKSAAN",leftSign:"Pelaksana,",rightSign:"Pemeriksa QC,",notes:"Temuan / Tindakan Perbaikan"},invoicetermin:{title:"TAGIHAN TERMIN",party:"DITAGIHKAN KEPADA",right:"JATUH TEMPO",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Termin / Progres / Ketentuan Pembayaran"},rekapitulasi:{title:"LAPORAN REKAPITULASI PEMBAYARAN",party:"PELANGGAN / PROYEK",right:"PERIODE REKAP",leftSign:"Dibuat oleh,",rightSign:"Diperiksa oleh,",notes:"Ringkasan / Catatan Pembayaran"}};
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function money(n){return (Number(n)||0).toLocaleString("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0})}
function defaultColumnLabels(type){const detail=["suratjalan","deliveryorder","tandaterima","bast","checklistqc","laporanhari","laporanprogress","permintaanpembelian","suratpengantar"].includes(type);return {kolomNamaLabel:detail?"Nama barang":"Deskripsi barang / jasa",kolomJumlahLabel:"Jumlah",kolomDetailLabel:detail?"Ukuran / Keterangan":"Harga satuan"};}
function applyDefaultColumnLabels(){const defaults=defaultColumnLabels($("jenis").value);Object.entries(defaults).forEach(([id,value])=>{if($(id))$(id).value=value;});}
function addItem(item={}){
 const tr=document.createElement("tr");
 tr.innerHTML='<td><div class="item-input-wrap"><input class="item-name" type="text" placeholder="Nama barang / jasa" autocomplete="off"><button class="clear-field" type="button" aria-label="Kosongkan deskripsi" title="Kosongkan">×</button></div></td><td><div class="item-input-wrap"><input class="item-qty" type="text" inputmode="text" autocomplete="off" value="1" aria-label="Jumlah"><button class="clear-field" type="button" aria-label="Kosongkan jumlah" title="Kosongkan">×</button></div></td><td><input class="item-price" type="text" inputmode="text" autocomplete="off" value="0"></td><td><button class="delete-item" type="button" aria-label="Hapus baris item">×</button></td>';
 tr.querySelector(".item-name").value=item.nama??"";
 tr.querySelector(".item-qty").value=item.qty??1;
 tr.querySelector(".item-price").value=item.harga??0;
 tr.querySelectorAll("input").forEach(el=>{
  el.addEventListener("focus",()=>{requestAnimationFrame(()=>{try{el.setSelectionRange(0,el.value.length);}catch(_){el.select();}});});
  el.addEventListener("input",render);
 });
 tr.querySelectorAll(".clear-field").forEach(btn=>{btn.addEventListener("click",()=>{const input=btn.parentElement.querySelector("input");input.value="";input.dispatchEvent(new Event("input",{bubbles:true}));input.focus();});});
 tr.querySelector(".delete-item").onclick=()=>{tr.remove();render()};
 $("barisItem").append(tr);
 syncItemEditorFields();
 render();
}
function syncItemEditorFields(){const type=$("jenis").value;const detailTypes=["suratjalan","deliveryorder","tandaterima","bast","checklistqc","laporanhari","laporanprogress","permintaanpembelian","suratpengantar"];const detailMode=detailTypes.includes(type);const headers=$("barisItem").closest("table").querySelectorAll("thead th");if(headers[0])headers[0].textContent=$("kolomNamaLabel").value;if(headers[1])headers[1].textContent=$("kolomJumlahLabel").value;$("judulKolomHarga").textContent=$("kolomDetailLabel").value;$("barisItem").querySelectorAll(".item-price").forEach(input=>{const desiredType="text";if(input.type!==desiredType)input.type=desiredType;if(detailMode){input.removeAttribute("min");input.placeholder="Ukuran / Keterangan";input.setAttribute("aria-label","Ukuran / Keterangan");}else{input.removeAttribute("min");input.placeholder="Harga satuan";input.setAttribute("aria-label","Harga satuan");}})}
function getItems(){return [...$("barisItem").rows].map(r=>({nama:r.querySelector(".item-name").value,qty:r.querySelector(".item-qty").value,harga:r.querySelector(".item-price").value}))}
function readData(){const d={jenis:$("jenis").value,template:$("template").value,templateFormat2:$("templateFormat2")?.value||"f2-polos"};fieldIds.forEach(id=>d[id]=$(id).value);d.rincianBebas=$("pWordContent")?.innerHTML??$("rincianBebas").value??"";const f2Body=$("f2WordContent");d.rincianFormat2=f2Body?(f2Body.textContent.trim()?f2Body.innerHTML:""):"";d.items=getItems();return d}
function setData(d){$("jenis").value=d.jenis||"invoice";$("template").value=d.template||"standar";if($("templateFormat2"))$("templateFormat2").value=d.templateFormat2||"f2-polos";applyCustomTemplate();fieldIds.forEach(id=>$(id).value=d[id]??"");if($("pWordContent"))$("pWordContent").innerHTML=d.rincianBebas??"";if($("f2WordContent"))$("f2WordContent").innerHTML=d.rincianFormat2??(d.layoutMode==="no-table"?(d.rincianBebas??""):"");applyDefaultColumnLabels();["kolomNamaLabel","kolomJumlahLabel","kolomDetailLabel"].forEach(id=>{if(Object.prototype.hasOwnProperty.call(d,id))$(id).value=d[id]??"";});$("barisItem").innerHTML="";(d.items||[]).forEach(addItem);if(!d.items?.length)addItem();render()}
function fmtDate(v){if(!v)return "-";const d=new Date(v+"T00:00:00");return d.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}
const noMoneyTypes=["suratjalan","resmi","permohonan","surattugas","beritaacara","kontrak","tandaterima","deliveryorder","spk","bast","laporanprogress","laporanhari","permintaanpembelian","suratperingatan","suratundangan","suratkuasa","suratketerangan","memointernal","suratpengantar","checklistqc"];
function renderFormat2Preview(d,L){const paper=$("lembarFormat2"),logo=$("f2Logo");const active=d.layoutMode==="no-table";paper.hidden=!active;$("lembar").hidden=active;if(!active)return;paper.className="paper-format2 template-"+($("templateFormat2")?.value||"f2-polos")+" doc-type-"+d.jenis;paper.dataset.category=d.jenis;logo.innerHTML="";if(companyLogo){const img=document.createElement("img");img.src=companyLogo;img.alt="Logo perusahaan";logo.append(img);}else logo.textContent=(d.perusahaan||"NP").trim().split(/\\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"NP";$("f2Perusahaan").textContent=d.perusahaan||"NAMA PERUSAHAAN";$("f2Alamat").textContent=d.alamatPerusahaan||"";$("f2Tanggal").textContent=fmtDate(d.tanggalDokumen);$("f2LabelPihak").textContent="KEPADA YTH."; $("f2Pihak").textContent=d.pihak||"";$("f2AlamatPihak").textContent=d.alamatPihak||"";const content=$("f2WordContent");if(content&&!content.dataset.bound){content.dataset.bound="1";}const body=d.rincianFormat2??"";if(content&&content.innerHTML!==body&&document.activeElement!==content)content.innerHTML=body;}
function render(){syncItemEditorFields();const d=readData(),type=d.jenis,L=labels[type]||labels.invoice,items=d.items;const noTable=d.layoutMode==="no-table";document.body.classList.toggle("layout-no-table",noTable);$("lembar").classList.toggle("layout-no-table",noTable);$("pTeksPenutupKiri").textContent=d.teksPenutupKiri??"Hormat kami,";$("pTeksPenutupKanan").textContent=d.teksPenutupKanan??"Mengetahui,";const total=items.reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.harga)||0),0);const tax=total*(Number(d.pajak)||0)/100,disc=Number(d.diskon)||0,grand=Math.max(0,total+tax-disc);
const letterTypes=["penawaran","penagihan","beritaacara","kontrak","surattugas","permohonan","resmi","suratperingatan","suratundangan","suratkuasa","suratketerangan","memointernal","suratpengantar","spk","bast"];
const reportTypes=["rab","laporanprogress","laporanhari","laporanbiaya","checklistqc","rekapitulasi"];
const kind=letterTypes.includes(type)?"letter":reportTypes.includes(type)?"report":["invoice","kuitansi","purchaseorder","tandaterima","deliveryorder","notadebit","notakredit","invoicetermin","suratjalan"].includes(type)?"transaction":"general";
const format2=d.layoutMode==="no-table";const activeTemplate=format2?($("templateFormat2")?.value||"f2-polos"):d.template;$("lembar").className="paper template-"+activeTemplate+" doc-type-"+type+" doc-kind-"+kind+(customTemplate?" has-custom-template":"")+(format2?" format2-paper":"");
const logoBox=$("pLogo");logoBox.innerHTML="";if(companyLogo){logoBox.classList.add("has-image");const img=document.createElement("img");img.src=companyLogo;img.alt="Logo perusahaan";img.className="logo-img";logoBox.append(img);}else{logoBox.classList.remove("has-image");logoBox.textContent=(d.perusahaan||"NP").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"NP";}
$("pPerusahaan").textContent=d.perusahaan||"NAMA PERUSAHAAN";$("pAlamat").textContent=d.alamatPerusahaan||"";$("pKontak").textContent=[d.teleponPerusahaan,d.emailPerusahaan].filter(Boolean).join(" · ");$("pJudul").textContent=L.title;$("pNomor").textContent="No: "+(d.nomorDokumen||"-");$("pTanggal").textContent="Tanggal: "+fmtDate(d.tanggalDokumen);$("pLabelPihak").textContent=format2?"KEPADA YTH.":L.party;$("pPihak").textContent=d.pihak||"Nama pelanggan / penerima";$("pAlamatPihak").textContent=d.alamatPihak||"";$("pJatuhTempoBox").querySelector("small").textContent=L.right;$("pJatuhTempo").textContent=fmtDate(["invoice","penagihan","invoicetermin"].includes(type)?d.jatuhTempo:d.tanggalDokumen);$("pJatuhTempoBox").style.display=format2?"none":["suratjalan","resmi","permohonan","surattugas","beritaacara","kontrak","spk","bast","laporanprogress","laporanhari","permintaanpembelian","suratperingatan","suratundangan","suratkuasa","suratketerangan","memointernal","suratpengantar","checklistqc","laporanbiaya","rekapitulasi"].includes(type)?"none":"flex";$("pKeterangan").textContent=d.keterangan||"";$("pCatatanLabel").textContent=noTable?"Lampiran / Catatan":L.notes;$("pCatatan").textContent=d.catatan||"-";$("pTtdKiri").textContent=L.leftSign;$("pTtdKanan").textContent=L.rightSign;$("pNamaTtd").textContent=d.penanggungJawab||"(................................)";$("pJabatanTtd").textContent=d.penanggungJawab?(d.jabatan||""):"";$("pFooter").textContent=[d.alamatPerusahaan,d.teleponPerusahaan,d.emailPerusahaan].filter(Boolean).join(" | ");
const wordContent=$("pWordContent");if(wordContent&&!wordContent.dataset.bound){wordContent.dataset.bound="1";wordContent.addEventListener("input",()=>{$("rincianBebas").value=wordContent.innerHTML;});}const head=$("pHeadTabel");const plainItems=$("pItemsPlain");plainItems.textContent="";const detailTable=["suratjalan","deliveryorder","tandaterima","bast","checklistqc","laporanhari","laporanprogress","permintaanpembelian","suratpengantar"].includes(type);head.innerHTML=detailTable?"<tr><th>No.</th><th></th><th></th><th></th></tr>":"<tr><th>No.</th><th></th><th></th><th></th><th>Jumlah</th></tr>";if(head.rows[0]){head.rows[0].cells[1].textContent=d.kolomNamaLabel??defaultColumnLabels(type).kolomNamaLabel;head.rows[0].cells[2].textContent=d.kolomJumlahLabel??"Jumlah";head.rows[0].cells[3].textContent=d.kolomDetailLabel??defaultColumnLabels(type).kolomDetailLabel;}
$("pItems").innerHTML="";items.forEach((x,i)=>{const tr=document.createElement("tr");if(["suratjalan","deliveryorder","tandaterima","bast","checklistqc","laporanhari","laporanprogress","permintaanpembelian","suratpengantar"].includes(type)){tr.innerHTML="<td>"+(i+1)+"</td><td></td><td></td><td></td>";tr.cells[1].textContent=x.nama;tr.cells[2].textContent=x.qty;tr.cells[3].textContent=x.harga?x.harga:""}else{tr.innerHTML="<td>"+(i+1)+"</td><td></td><td></td><td></td><td></td>";tr.cells[1].textContent=x.nama;tr.cells[2].textContent=x.qty;tr.cells[3].textContent=money(x.harga);tr.cells[4].textContent=money((Number(x.qty)||0)*(Number(x.harga)||0))}$("pItems").append(tr);const line=document.createElement("p");line.className="plain-item";const parts=[(i+1)+". "+(x.nama||"-"),"Jumlah: "+(x.qty??""),detailTable?(x.harga||""):"Harga satuan: "+money(x.harga)];if(!detailTable)parts.push("Total: "+money((Number(x.qty)||0)*(Number(x.harga)||0)));line.textContent=parts.filter(Boolean).join("  ·  ");if(!noTable&&!d.rincianBebas)plainItems.append(line)});if(noTable){const freeText=String(d.rincianBebas||"").trim();if(freeText){plainItems.textContent=freeText;}else{items.forEach((x,i)=>{const line=document.createElement("p");line.className="plain-item";line.textContent=[(i+1)+". "+(x.nama||"-"),"Jumlah: "+(x.qty??""),x.harga||""].filter(Boolean).join("  ·  ");plainItems.append(line);});}}
plainItems.style.display=noTable?"block":"none";
$("pTotals").style.display=noTable||noMoneyTypes.includes(type)?"none":"block";$("pTotals").innerHTML='<div class="total-line"><span>Subtotal</span><b>'+money(total)+'</b></div><div class="total-line"><span>Pajak ('+(Number(d.pajak)||0)+'%)</span><b>'+money(tax)+'</b></div><div class="total-line"><span>Diskon</span><b>- '+money(disc)+'</b></div><div class="total-line grand"><span>Total</span><b>'+money(grand)+'</b></div>';
$("labelPihak").firstChild.textContent=["suratjalan","deliveryorder","suratpengantar"].includes(type)?"Nama penerima":type==="penawaran"?"Nama pelanggan":["kuitansi","tandaterima","bast"].includes(type)?"Nama pemberi":["spk","rab","laporanprogress","laporanhari","laporanbiaya","checklistqc"].includes(type)?"Nama proyek / lokasi":type==="permintaanpembelian"?"Nama pemohon":type==="memointernal"?"Nama penerima memo":"Nama pelanggan / penerima";$("judulKolomHarga").textContent=$("kolomDetailLabel").value||defaultColumnLabels(type).kolomDetailLabel;$("labelJatuhTempo").style.display=(["invoice","penagihan","invoicetermin"].includes(type))?"block":"none";renderFormat2Preview(d,L)}
function applyCustomTemplate(){
  const paper=$("lembar"),active=Boolean(customTemplate);
  paper.style.backgroundImage=active?'url("'+customTemplate+'")':"";
  $("templateBuiltInWrap").hidden=active;
  $("canvaActiveNotice").hidden=!active;
  $("statusTemplateCanva").textContent=active?"Desain Canva aktif — template bawaan disembunyikan":"Belum ada desain khusus";
  paper.classList.toggle("has-custom-template",active);
}
function canvasToTemplate(canvas){
  const maxW=1400,maxH=1980,scale=Math.min(1,maxW/canvas.width,maxH/canvas.height);
  const out=document.createElement("canvas");out.width=Math.round(canvas.width*scale);out.height=Math.round(canvas.height*scale);
  out.getContext("2d").drawImage(canvas,0,0,out.width,out.height);
  return out.toDataURL("image/jpeg",0.82);
}
async function importCanvaTemplate(file){
  if(!file)return;
  if(file.size>8*1024*1024){alert("Ukuran file maksimal 8 MB.");$("fileTemplateCanva").value="";return;}
  try{
    if(file.type==="application/pdf"){
      if(!window.pdfjsLib)throw new Error("Pembaca PDF belum dapat dimuat. Periksa koneksi internet lalu coba lagi.");
      const bytes=await file.arrayBuffer(),pdf=await pdfjsLib.getDocument({data:bytes}).promise,page=await pdf.getPage(1);
      const viewport=page.getViewport({scale:1.6}),canvas=document.createElement("canvas");
      canvas.width=viewport.width;canvas.height=viewport.height;
      await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
      customTemplate=canvasToTemplate(canvas);
    }else if(["image/png","image/jpeg","image/webp"].includes(file.type)){
      const image=new Image(),url=URL.createObjectURL(file);
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
      const canvas=document.createElement("canvas");canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      canvas.getContext("2d").drawImage(image,0,0);URL.revokeObjectURL(url);
      customTemplate=canvasToTemplate(canvas);
    }else{throw new Error("Format file tidak didukung.");}
    try{localStorage.setItem("templateCanvaBisnis",customTemplate);}catch(storageError){throw new Error("Desain terlalu besar untuk disimpan. Coba file yang lebih kecil.");}
    applyCustomTemplate();render();
  }catch(error){alert("Gagal mengimpor desain: "+error.message);}
  $("fileTemplateCanva").value="";
}
async function importCompanyLogo(file){
 if(!file)return;
 if(!["image/png","image/jpeg","image/webp"].includes(file.type)){alert("Logo harus berupa PNG, JPG, atau WEBP.");$("fileLogoPerusahaan").value="";return;}
 if(file.size>5*1024*1024){alert("Ukuran logo maksimal 5 MB.");$("fileLogoPerusahaan").value="";return;}
 try{
  const url=URL.createObjectURL(file),img=new Image();
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
  const scale=Math.min(1,600/img.naturalWidth,600/img.naturalHeight),canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);
  companyLogo=canvas.toDataURL("image/png");
  try{localStorage.setItem("logoPerusahaanBisnis",companyLogo);}catch(e){throw new Error("Penyimpanan perangkat penuh. Gunakan gambar logo yang lebih kecil.");}
  $("statusLogoPerusahaan").textContent="Logo berhasil diunggah";
  render();
 }catch(error){alert("Gagal mengunggah logo: "+error.message);}
 $("fileLogoPerusahaan").value="";
}
function history(){
 const list=JSON.parse(localStorage.getItem("dokumenBisnis")||"[]");
 $("riwayat").innerHTML="";
 if(!list.length){$("riwayat").textContent="Belum ada dokumen tersimpan.";return}
 list.map((d,index)=>({d,index})).reverse().forEach(({d,index})=>{
  const row=document.createElement("div");row.className="history-row";
  const info=document.createElement("span");info.textContent=(labels[d.jenis]?.title||d.jenis)+" · "+(d.nomorDokumen||"Tanpa nomor")+" · "+(d.pihak||"-");
  const actions=document.createElement("div");actions.className="history-actions";
  const btn=document.createElement("button");btn.type="button";btn.textContent="Buka";btn.onclick=()=>setData(d);
  const del=document.createElement("button");del.type="button";del.textContent="Hapus";del.className="history-delete";
  del.setAttribute("aria-label","Hapus "+(d.nomorDokumen||"dokumen"));
  del.onclick=()=>{
   if(!confirm("Hapus dokumen "+(d.nomorDokumen||"ini")+" dari riwayat?"))return;
   const current=JSON.parse(localStorage.getItem("dokumenBisnis")||"[]");
   current.splice(index,1);localStorage.setItem("dokumenBisnis",JSON.stringify(current));history();
  };
  actions.append(btn,del);row.append(info,actions);$("riwayat").append(row);
 });
}
function save(){const d=readData();if(!d.nomorDokumen.trim()){alert("Isi nomor dokumen terlebih dahulu.");$("nomorDokumen").focus();return}const list=JSON.parse(localStorage.getItem("dokumenBisnis")||"[]");const i=list.findIndex(x=>x.jenis===d.jenis&&x.nomorDokumen===d.nomorDokumen);if(i>=0)list[i]=d;else list.push(d);localStorage.setItem("dokumenBisnis",JSON.stringify(list));history();alert("Dokumen berhasil disimpan di perangkat ini.")}
function companyInitials(name){
 const words=(name||"").trim().toUpperCase().replace(/[^A-Z0-9\s]/g," ").split(/\s+/).filter(Boolean).filter(w=>!["PT","CV","UD","TBK","PERSERO"].includes(w));
 return (words.length?words.map(w=>w[0]).join(""):"XX").slice(0,5);
}
function numberParts(){
 const company=companyInitials($("perusahaan").value);
 const dateValue=$("tanggalDokumen").value||today();
 const parts=dateValue.split("-");
 const year=parts[0]||String(new Date().getFullYear());
 const day=String(Number(parts[2]||new Date().getDate()));
 const key="docseq_"+company+"_"+year+"_"+day;
 return {company,year,day,key};
}
function nextDocumentNumber(sequence){
 const p=numberParts();
 const n=sequence??((Number(localStorage.getItem(p.key))||0)+1);
 return p.company+"/"+p.year+"/"+p.day+"/"+n;
}
function makeNumber(){return nextDocumentNumber()}
function newDoc(){if(!confirm("Buat dokumen baru? Perubahan yang belum disimpan akan hilang."))return;const keep={perusahaan:$("perusahaan").value,alamatPerusahaan:$("alamatPerusahaan").value,teleponPerusahaan:$("teleponPerusahaan").value,emailPerusahaan:$("emailPerusahaan").value,penanggungJawab:$("penanggungJawab").value,jabatan:$("jabatan").value||"Direktur"};["pihak","alamatPihak","nomorDokumen","tanggalDokumen","jatuhTempo","keterangan","pajak","diskon","catatan"].forEach(id=>$(id).value="");$("layoutMode").value="table";if($("pWordContent"))$("pWordContent").innerHTML="";if($("f2WordContent"))$("f2WordContent").innerHTML="";$("rincianBebas").value="";$("teksPenutupKiri").value="Hormat kami,";$("teksPenutupKanan").value="Mengetahui,";Object.entries(keep).forEach(([id,value])=>$(id).value=value);$("tanggalDokumen").value=today();$("nomorDokumen").value=makeNumber();$("barisItem").innerHTML="";addItem();render()}
$("fileTemplateCanva").addEventListener("change",e=>importCanvaTemplate(e.target.files[0]));$("fileLogoPerusahaan").addEventListener("change",e=>importCompanyLogo(e.target.files[0]));$("hapusLogoPerusahaan").onclick=()=>{companyLogo="";localStorage.removeItem("logoPerusahaanBisnis");$("statusLogoPerusahaan").textContent="Belum ada logo diunggah";render();};$("hapusTemplateCanva").onclick=()=>{customTemplate="";localStorage.removeItem("templateCanvaBisnis");applyCustomTemplate();render()};$("tambahItem").onclick=()=>addItem();$("simpan").onclick=save;async function exportFormat2PDF(source,filename){
 if(typeof window.html2pdf!=="function")throw new Error("Pustaka PDF belum termuat.");
 const clone=source.cloneNode(true);
 clone.hidden=false;
 clone.removeAttribute("hidden");
 clone.style.width="210mm";
 clone.style.minHeight="0";
 clone.style.height="auto";
 clone.style.maxWidth="none";
 clone.style.margin="0";
 clone.style.boxShadow="none";
 clone.style.overflow="visible";
 clone.style.boxSizing="border-box";
 clone.querySelectorAll("[contenteditable]").forEach(node=>node.removeAttribute("contenteditable"));
 const body=clone.querySelector(".f2-word-content");
 if(body){
  body.style.minHeight="0";
  body.style.height="auto";
  body.style.overflow="visible";
  body.style.breakInside="auto";
  body.style.pageBreakInside="auto";
 }
 const images=[...clone.querySelectorAll("img")];
 await Promise.all(images.map(img=>{
  if(img.complete&&img.naturalWidth)return Promise.resolve();
  if(typeof img.decode==="function")return img.decode().catch(()=>{});
  return new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;});
 }));
 if(document.fonts&&document.fonts.ready)await document.fonts.ready;
 const worker=window.html2pdf().set({
  margin:[0,0,0,0],
  filename:filename,
  image:{type:"jpeg",quality:0.96},
  html2canvas:{
   scale:1.5,
   useCORS:true,
   allowTaint:false,
   backgroundColor:"#ffffff",
   scrollX:0,
   scrollY:0,
   logging:false
  },
  jsPDF:{unit:"mm",format:"a4",orientation:"portrait",compress:true},
  pagebreak:{
   mode:["css","legacy"],
   avoid:["img","table","tr","blockquote",".f2-company",".f2-recipient"]
  }
 }).from(clone);
 await worker.save();
}
$("cetak").onclick=async()=>{
 const p=numberParts(),n=(Number(localStorage.getItem(p.key))||0)+1;
 $("nomorDokumen").value=nextDocumentNumber(n);
 render();
 if($("layoutMode").value==="no-table"){
  const el=$("lembarFormat2");
  const safeName=String($("nomorDokumen").value||"Dokumen").replace(/[^a-z0-9_-]+/gi,"-")+".pdf";
  try{
   await exportFormat2PDF(el,safeName);
   localStorage.setItem(p.key,String(n));
   $("nomorDokumen").value=nextDocumentNumber(n+1);
   render();
  }catch(err){
   console.error("PDF Format 2 gagal dibuat:",err);
   alert("PDF gagal dibuat secara utuh. Periksa koneksi internet lalu coba lagi. Dokumen dan nomor dokumen tidak dihapus.");
  }
 }else{
  localStorage.setItem(p.key,String(n));
  window.print();
  $("nomorDokumen").value=nextDocumentNumber(n+1);
  render();
 }
};$("baru").onclick=newDoc;$("jenis").onchange=()=>{if(!$("nomorDokumen").value||$("nomorDokumen").value.includes("/"))$("nomorDokumen").value=makeNumber();applyDefaultColumnLabels();render()};$("template").onchange=render;$("templateFormat2").onchange=render;function syncFormatMode(){const f2=$("layoutMode").value==="no-table";if($("previewTitle"))$("previewTitle").textContent=f2?"Pratinjau Format 2":"Pratinjau Format 1";$("templateBuiltInWrap").querySelector("select").hidden=f2;$("templateFormat2").hidden=!f2;$("templateBuiltInWrap").querySelector("label").firstChild.textContent=f2?"Template Format 2":"Template bawaan";document.body.classList.toggle("format2-editor",f2);}fieldIds.forEach(id=>$(id).addEventListener("input",render));$("layoutMode").addEventListener("change",()=>{syncFormatMode();render()});syncFormatMode();applyDefaultColumnLabels();$("tanggalDokumen").value=today();$("nomorDokumen").value=makeNumber();$("perusahaan").addEventListener("input",()=>{$("nomorDokumen").value=makeNumber();render();});$("tanggalDokumen").addEventListener("change",()=>{$("nomorDokumen").value=makeNumber();render();});addItem();history();
async function generateWithAI(){
 const prompt=$("aiPrompt").value.trim(),accessCode=$("aiAccessCode").value.trim(),btn=$("aiGenerate"),status=$("aiStatus");
 if(!prompt){alert("Tulis perintah untuk AI terlebih dahulu.");$("aiPrompt").focus();return}
 if(!accessCode){alert("Masukkan kode akses AI.");$("aiAccessCode").focus();return}
 btn.disabled=true;status.textContent="AI sedang menyusun dokumen...";
 try{
  const current=readData(),format2=current.layoutMode==="no-table";
  const aiInstruction=format2
   ?prompt+"\\n\\nMODE FORMAT 2: Buat isi dokumen dalam bentuk teks/HTML Word yang rapi untuk area isi bebas. Jangan membuat tabel barang, rincian harga, total, tanda tangan, atau blok penutup. Pertahankan kategori dokumen yang dipilih. Kembalikan isi utama pada rincianFormat2 atau rincianBebas."
   :prompt;
  const response=await fetch("https://nqwqlhcwiwprsbcdadhy.supabase.co/functions/v1/dokumen-ai",{
   method:"POST",headers:{"Content-Type":"application/json","x-ai-access-code":accessCode},
   body:JSON.stringify({instruction:aiInstruction,currentDocument:{...current,formatMode:format2?"format2":"format1",templateSource:format2?"Template Format 2 (isi bebas tanpa tabel dan tanda tangan)":customTemplate?"Canva (desain latar dipertahankan; isi dokumen dapat diedit)":"Template bawaan"}})
  });
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||"Permintaan AI gagal.");
  const d=result.document||{};
  const merged={...current,...d,layoutMode:current.layoutMode,items:Array.isArray(d.items)?d.items:current.items};
  if(format2){
   const generatedBody=d.rincianFormat2??d.rincianBebas??d.isiDokumen??d.body;
   if(generatedBody!==undefined)merged.rincianFormat2=generatedBody;
   else if(typeof d.keterangan==="string"&&d.keterangan.trim())merged.rincianFormat2=d.keterangan;
   merged.rincianBebas=current.rincianBebas;
  }
  setData(merged);
  status.textContent=result.message||"Draf AI sudah dimasukkan. Periksa kembali data dan nominal sebelum digunakan.";
 }catch(error){status.textContent="Belum berhasil: "+error.message}
 finally{btn.disabled=false}
}
$("aiGenerate").onclick=generateWithAI;
applyCustomTemplate();
if(companyLogo)$("statusLogoPerusahaan").textContent="Logo tersimpan di perangkat";


// Perintah suara Bahasa Indonesia (Web Speech API).
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let voiceRecognition=null,voiceFinalText="",voiceShouldSubmit=false,voiceTargetLayoutMode="table";
function voiceStatus(message){$("voiceStatus").textContent=message;}
let voiceRecorder=null,voiceStream=null,voiceChunks=[],voiceAudioContext=null,voiceSilenceTimer=null,voiceSpeechDetected=false,voiceLastSoundAt=0;
async function startRecordedVoiceCommand(){
 voiceTargetLayoutMode=$("layoutMode").value;
 if(!window.isSecureContext){voiceStatus("Mikrofon hanya dapat digunakan melalui HTTPS atau localhost.");return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){voiceStatus("Perekam suara tidak didukung browser ini. Coba Chrome Android terbaru melalui HTTPS.");return;}
 if(!$("aiAccessCode").value.trim()){voiceStatus("Masukkan kode akses AI terlebih dahulu.");$("aiAccessCode").focus();return;}
 try{
  voiceStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  const mimeTypes=["audio/webm;codecs=opus","audio/webm","audio/mp4"];
  const mimeType=mimeTypes.find(t=>MediaRecorder.isTypeSupported(t))||"";
  voiceRecorder=new MediaRecorder(voiceStream,mimeType?{mimeType}:undefined);voiceChunks=[];
  // Pantau tingkat suara: berhenti otomatis setelah 3 detik hening sesudah pengguna mulai bicara.
  voiceSpeechDetected=false;voiceLastSoundAt=0;
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(AudioCtx){
   voiceAudioContext=new AudioCtx();
   if(voiceAudioContext.state==="suspended")await voiceAudioContext.resume();
   const source=voiceAudioContext.createMediaStreamSource(voiceStream),analyser=voiceAudioContext.createAnalyser();
   analyser.fftSize=1024;source.connect(analyser);
   const samples=new Uint8Array(analyser.fftSize);
   voiceSilenceTimer=setInterval(()=>{
    if(!voiceRecorder||voiceRecorder.state!=="recording")return;
    analyser.getByteTimeDomainData(samples);
    let sum=0;for(let i=0;i<samples.length;i++){const v=(samples[i]-128)/128;sum+=v*v;}
    const level=Math.sqrt(sum/samples.length);
    if(level>0.025){voiceSpeechDetected=true;voiceLastSoundAt=Date.now();}
    if(voiceSpeechDetected&&Date.now()-voiceLastSoundAt>=3000){
     voiceStatus("Tidak ada suara selama 3 detik. Menghentikan rekaman dan memproses perintah...");
     voiceRecorder.stop();
    }
   },120);
  }
  voiceRecorder.ondataavailable=e=>{if(e.data&&e.data.size)voiceChunks.push(e.data);};
  voiceRecorder.onerror=()=>voiceStatus("Perekaman gagal. Periksa izin dan mikrofon perangkat.");
  voiceRecorder.onstart=()=>{$("voiceStart").disabled=true;$("voiceStop").disabled=false;voiceStatus("Mikrofon aktif untuk "+(voiceTargetLayoutMode==="no-table"?"Format 2":"Format 1")+". Silakan berbicara; rekaman berhenti otomatis setelah 3 detik tanpa suara.");};
  voiceRecorder.onstop=async()=>{
   $("voiceStart").disabled=false;$("voiceStop").disabled=true;
   if(voiceSilenceTimer){clearInterval(voiceSilenceTimer);voiceSilenceTimer=null;}
   if(voiceAudioContext){voiceAudioContext.close().catch(()=>{});voiceAudioContext=null;}
   voiceStream?.getTracks().forEach(t=>t.stop());voiceStream=null;
   const blob=new Blob(voiceChunks,{type:voiceRecorder?.mimeType||"audio/webm"});
   if(!blob.size){voiceStatus("Suara tidak terekam. Coba ulangi.");return;}
   if(blob.size>4*1024*1024){voiceStatus("Rekaman terlalu panjang. Maksimal sekitar 45 detik; coba lebih singkat.");return;}
   voiceStatus("Mengubah suara menjadi teks...");
   try{
    const bytes=new Uint8Array(await blob.arrayBuffer());let binary="";
    for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);
    const response=await fetch("https://nqwqlhcwiwprsbcdadhy.supabase.co/functions/v1/dokumen-ai",{
     method:"POST",headers:{"Content-Type":"application/json","x-ai-access-code":$("aiAccessCode").value.trim()},
     body:JSON.stringify({audioBase64:btoa(binary),mimeType:blob.type||"audio/webm"})
    });
    const result=await response.json();if(!response.ok)throw new Error(result.error||"Suara gagal diproses.");
    const transcript=String(result.transcript||"").trim();if(!transcript)throw new Error("Tidak ada ucapan yang terdeteksi.");
    $("layoutMode").value=voiceTargetLayoutMode;syncFormatMode();render();
    $("aiPrompt").value=transcript;voiceStatus("Perintah tertangkap untuk "+(voiceTargetLayoutMode==="no-table"?"Format 2":"Format 1")+": "+transcript+" — AI sedang menyusun...");
    await generateWithAI();voiceStatus("Perintah suara selesai diproses untuk "+(voiceTargetLayoutMode==="no-table"?"Format 2":"Format 1")+". Periksa hasil dokumen.");
   }catch(error){voiceStatus("Gagal memproses suara: "+error.message);}
  };
  voiceRecorder.start();
 }catch(error){
  voiceStream?.getTracks().forEach(t=>t.stop());voiceStream=null;
  const msg=error.name==="NotAllowedError"?"Izin mikrofon ditolak. Izinkan Mikrofon pada pengaturan situs/browser.":error.name==="NotFoundError"?"Mikrofon tidak ditemukan pada perangkat.":"Tidak bisa membuka mikrofon: "+error.message;
  voiceStatus(msg);
 }
}
async function startVoiceCommand(){
 voiceTargetLayoutMode=$("layoutMode").value;
 if(!window.isSecureContext){voiceStatus("Mikrofon membutuhkan halaman HTTPS atau localhost. Buka situs GitHub Pages melalui alamat https://, bukan file lokal atau HTTP.");return}
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){voiceStatus("Browser ini tidak menyediakan akses mikrofon. Coba Chrome terbaru dan buka halaman melalui HTTPS.");return}
 if(!SpeechRecognition){startRecordedVoiceCommand();return;}
 if(!$("aiAccessCode").value.trim()){voiceStatus("Masukkan kode akses AI terlebih dahulu.");$("aiAccessCode").focus();return;}
 voiceFinalText="";voiceShouldSubmit=true;
 try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(track=>track.stop());}catch(error){voiceShouldSubmit=false;const reason=error.name==="NotAllowedError"?"Izin mikrofon ditolak. Buka pengaturan situs lalu izinkan Mikrofon.":error.name==="NotFoundError"?"Mikrofon tidak ditemukan pada perangkat.":"Tidak bisa mengakses mikrofon: "+error.message;voiceStatus(reason);return;}
 voiceRecognition=new SpeechRecognition();
 voiceRecognition.lang="id-ID";voiceRecognition.continuous=false;voiceRecognition.interimResults=true;voiceRecognition.maxAlternatives=1;
 voiceRecognition.onstart=()=>{$("voiceStart").disabled=true;$("voiceStop").disabled=false;voiceStatus("Mendengarkan... Silakan ucapkan perintah Anda.");};
 voiceRecognition.onresult=event=>{
  let interim="";
  for(let i=event.resultIndex;i<event.results.length;i++){
   const transcript=event.results[i][0].transcript;
   if(event.results[i].isFinal)voiceFinalText+=transcript+" ";
   else interim+=transcript;
  }
  $("aiPrompt").value=(voiceFinalText+interim).trim();
  voiceStatus(interim?"Mendengar: "+(voiceFinalText+interim).trim():"Perintah tertangkap: "+voiceFinalText.trim());
 };
 voiceRecognition.onerror=event=>{
  voiceShouldSubmit=false;
  const messages={ "not-allowed":"Izin mikrofon ditolak. Aktifkan izin mikrofon untuk situs ini.","no-speech":"Suara belum terdeteksi. Tekan mikrofon dan coba bicara lebih dekat.","network":"Pengenalan suara membutuhkan koneksi internet pada browser ini.","audio-capture":"Mikrofon tidak ditemukan atau sedang digunakan aplikasi lain."};
  voiceStatus(messages[event.error]||("Pengenalan suara gagal: "+event.error));
 };
 voiceRecognition.onend=()=>{
  $("voiceStart").disabled=false;$("voiceStop").disabled=true;
  const command=voiceFinalText.trim();
  if(voiceShouldSubmit&&command){
   voiceStatus("Perintah diterima: "+command);
   const normalized=command.toLowerCase().replace(/[.,!?]/g,"").replace(/\s+/g," ").trim();
   if(/^(tolong )?(simpan|simpan dokumen|save)( sekarang)?$/.test(normalized)){
    save();
    voiceStatus("Perintah suara selesai. Silakan periksa notifikasi penyimpanan.");
   }else if(/^(tolong )?(cetak|print|cetak pdf|unduh pdf|download pdf)( dokumen)?( sekarang)?$/.test(normalized)){
    if(window.confirm("AI meminta mencetak atau menyimpan dokumen sebagai PDF. Lanjutkan?")){
     $("cetak").click();
     voiceStatus("Perintah cetak/PDF dijalankan.");
    }else voiceStatus("Perintah cetak dibatalkan.");
   }else if(/^(buat|mulai|buka) (dokumen )?baru$/.test(normalized)){
    newDoc();
    voiceStatus("Perintah dokumen baru diproses.");
   }else if(/^(batal|batalkan|jangan jadi)$/.test(normalized)){
    voiceStatus("Baik, perintah dibatalkan.");
   }else{
    $("aiPrompt").value=command;
    awaitVoiceAI();
   }
  }else if(!command){voiceStatus("Belum ada perintah yang tertangkap. Tekan mikrofon untuk mencoba lagi.");}
  voiceShouldSubmit=false;
 };
 try{voiceRecognition.start();}catch(error){voiceShouldSubmit=false;$("voiceStart").disabled=false;$("voiceStop").disabled=true;voiceStatus("Mikrofon belum siap. Coba tekan kembali.");}
}
async function awaitVoiceAI(){
 try{$("layoutMode").value=voiceTargetLayoutMode;syncFormatMode();render();await generateWithAI();voiceStatus("Perintah suara selesai diproses AI untuk "+(voiceTargetLayoutMode==="no-table"?"Format 2":"Format 1")+". Periksa hasil pada pratinjau dokumen.");}
 catch(error){voiceStatus("AI belum dapat memproses perintah: "+error.message);}
}
$("voiceStart").addEventListener("click",startRecordedVoiceCommand);
$("voiceStop").addEventListener("click",()=>{if(voiceRecorder&&voiceRecorder.state!=="inactive"){voiceRecorder.stop();return;}voiceShouldSubmit=true;if(voiceRecognition)voiceRecognition.stop();});
