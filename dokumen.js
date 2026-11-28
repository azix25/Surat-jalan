const $=id=>document.getElementById(id);
function sanitizeDocumentHtml(input){
 const source=String(input??"");
 if(!source)return "";
 const parsed=new DOMParser().parseFromString("<!doctype html><body>"+source+"</body>","text/html");
 const allowed=new Set(["P","DIV","BR","STRONG","B","EM","I","U","S","UL","OL","LI","H1","H2","H3","H4","H5","H6","BLOCKQUOTE","SPAN","TABLE","THEAD","TBODY","TFOOT","TR","TH","TD","HR","A"]);
 const blocked=new Set(["SCRIPT","STYLE","IFRAME","OBJECT","EMBED","SVG","MATH","FORM","INPUT","BUTTON","TEXTAREA","SELECT","VIDEO","AUDIO","SOURCE","META","LINK","BASE"]);
 const safeStyle=(value)=>{
  const out=[];
  for(const part of String(value||"").split(";")){
   const pair=part.split(":");if(pair.length<2)continue;
   const key=pair.shift().trim().toLowerCase(),val=pair.join(":").trim();
   if(key==="text-align"&&/^(left|right|center|justify)$/i.test(val))out.push("text-align:"+val.toLowerCase());
   else if(key==="font-weight"&&/^(normal|bold|[1-9]00)$/i.test(val))out.push("font-weight:"+val.toLowerCase());
   else if(key==="font-style"&&/^(normal|italic|oblique)$/i.test(val))out.push("font-style:"+val.toLowerCase());
   else if(key==="text-decoration"&&/^(none|underline|line-through|overline)(\s+(underline|line-through|overline))*$/i.test(val))out.push("text-decoration:"+val.toLowerCase());
  }
  return out.join(";");
 };
 const cleanNode=(node,parent)=>{
  if(node.nodeType===Node.TEXT_NODE){parent.append(document.createTextNode(node.nodeValue||""));return;}
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const tag=node.tagName.toUpperCase();
  if(blocked.has(tag))return;
  if(!allowed.has(tag)){for(const child of [...node.childNodes])cleanNode(child,parent);return;}
  const el=document.createElement(tag.toLowerCase());
  if(tag==="A"){
   const href=node.getAttribute("href")||"";
   try{const u=new URL(href,location.href);if(["https:","http:","mailto:"].includes(u.protocol))el.setAttribute("href",u.href);}catch(_){}
   if(el.hasAttribute("href")){el.setAttribute("rel","noopener noreferrer");el.setAttribute("target","_blank");}
  }
  if(node.hasAttribute("style")){const style=safeStyle(node.getAttribute("style"));if(style)el.setAttribute("style",style);}
  for(const child of [...node.childNodes])cleanNode(child,el);
  parent.append(el);
 };
 const fragment=document.createDocumentFragment();
 for(const child of [...parsed.body.childNodes])cleanNode(child,fragment);
 const holder=document.createElement("div");holder.append(fragment);return holder.innerHTML;
}

const AI_CODE_STORAGE_KEY="azx_ai_access_code";
function getAIAccessCode(){
 const input=$("aiAccessCode");
 const code=(localStorage.getItem(AI_CODE_STORAGE_KEY)||input?.value||"").trim();
 if(!code){alert("Masukkan kode akses AI AZX Office satu kali. Kode akan tersimpan di perangkat ini dan otomatis dipakai juga oleh Inventory.");input?.focus();return "";}
 localStorage.setItem(AI_CODE_STORAGE_KEY,code);
 if(input){input.value=code;const label=input.closest("label");if(label)label.hidden=true;}
 return code;
}
function clearSavedAIAccessCode(){
 localStorage.removeItem(AI_CODE_STORAGE_KEY);
 const input=$("aiAccessCode");
 if(input){input.value="";const label=input.closest("label");if(label)label.hidden=false;}
}
(()=>{
 const saved=localStorage.getItem(AI_CODE_STORAGE_KEY),input=$("aiAccessCode");
 if(saved&&input){input.value=saved;const label=input.closest("label");if(label)label.hidden=true;}
})();

let customTemplate=localStorage.getItem("templateCanvaBisnis")||"";
let companyLogo=localStorage.getItem("logoPerusahaanBisnis")||"";
const COMPANY_PROFILE_KEY="azxOfficeCompanyProfile_v1";
const COMPANY_PROFILE_FIELDS=["perusahaan","alamatPerusahaan","teleponPerusahaan","emailPerusahaan","penanggungJawab","jabatan"];
function readCompanyProfile(){
 try{const saved=JSON.parse(localStorage.getItem(COMPANY_PROFILE_KEY)||"{}");return saved&&typeof saved==="object"?saved:{};}
 catch(error){console.warn("Profil perusahaan tersimpan tidak dapat dibaca:",error);return {};}
}
function saveCompanyProfile(){
 const profile={};COMPANY_PROFILE_FIELDS.forEach(id=>{const el=$(id);if(el)profile[id]=el.value;});
 try{localStorage.setItem(COMPANY_PROFILE_KEY,JSON.stringify(profile));return true;}
 catch(error){console.error("Profil perusahaan gagal disimpan:",error);const status=$("azxAutosaveStatus");if(status)status.textContent="Profil perusahaan belum tersimpan. Ruang penyimpanan browser penuh.";return false;}
}
function restoreCompanyProfile(){
 const profile=readCompanyProfile();
 COMPANY_PROFILE_FIELDS.forEach(id=>{const el=$(id);if(el&&Object.prototype.hasOwnProperty.call(profile,id))el.value=profile[id];});
}
const STAMP_UPLOAD_MARKER="stempelPerusahaanBisnis_uploaded_v1";
let companyStamp=localStorage.getItem("stempelPerusahaanBisnis")||"";
// Khusus Format 1: gambar lama tanpa penanda upload baru tidak boleh tampil.
let format1UploadedStamp=localStorage.getItem(STAMP_UPLOAD_MARKER)==="1"?companyStamp:"";
let useReferenceStamp=false;
if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
const fieldIds=["perusahaan","alamatPerusahaan","teleponPerusahaan","emailPerusahaan","penanggungJawab","jabatan","pihak","alamatPihak","nomorDokumen","tanggalDokumen","jatuhTempo","keterangan","pajak","diskon","catatan","kolomNamaLabel","kolomJumlahLabel","kolomHargaLabel","layoutMode","rincianBebas","teksPenutupKiri","teksPenutupKanan"];
const labels={invoice:{title:"INVOICE",party:"DITAGIHKAN KEPADA",right:"JATUH TEMPO",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Catatan / Ketentuan"},suratjalan:{title:"SURAT JALAN",party:"DIKIRIM KEPADA",right:"TANGGAL PENGIRIMAN",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Catatan Pengiriman"},penawaran:{title:"SURAT PENAWARAN HARGA",party:"KEPADA YTH.",right:"TANGGAL PENAWARAN",leftSign:"Hormat kami,",rightSign:"Menyetujui,",notes:"Syarat dan Ketentuan"},penagihan:{title:"SURAT TAGIHAN",party:"DITAGIHKAN KEPADA",right:"BATAS PEMBAYARAN",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Informasi Pembayaran"},kuitansi:{title:"KUITANSI",party:"TELAH DITERIMA DARI",right:"TANGGAL PEMBAYARAN",leftSign:"Hormat kami,",rightSign:"Pembayar,",notes:"Keterangan Pembayaran"},purchaseorder:{title:"PESANAN PEMBELIAN",party:"PEMASOK / VENDOR",right:"TANGGAL PENGIRIMAN",leftSign:"Hormat kami,",rightSign:"Pemasok,",notes:"Syarat Pemesanan"},beritaacara:{title:"BERITA ACARA PEKERJAAN",party:"PIHAK TERKAIT",right:"TANGGAL KEGIATAN",leftSign:"Hormat kami,",rightSign:"Pihak Kedua,",notes:"Uraian / Catatan"},kontrak:{title:"SURAT PERJANJIAN KERJA",party:"PARA PIHAK",right:"TANGGAL PERJANJIAN",leftSign:"Hormat kami,",rightSign:"Pihak Kedua,",notes:"Pasal / Ketentuan"},surattugas:{title:"SURAT TUGAS",party:"DITUGASKAN KEPADA",right:"TANGGAL TUGAS",leftSign:"Hormat kami,",rightSign:"Penerima Tugas,",notes:"Instruksi / Catatan"},permohonan:{title:"SURAT PERMOHONAN",party:"KEPADA YTH.",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Mengetahui,",notes:"Lampiran / Catatan"},resmi:{title:"SURAT RESMI",party:"KEPADA YTH.",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Mengetahui,",notes:"Lampiran / Catatan"},tandaterima:{title:"BUKTI TANDA TERIMA",party:"TELAH DITERIMA DARI",right:"TANGGAL PENERIMAAN",leftSign:"Hormat kami,",rightSign:"Yang Menerima,",notes:"Keterangan Barang"},deliveryorder:{title:"PERINTAH PENGIRIMAN",party:"DIKIRIM KEPADA",right:"TANGGAL PENGIRIMAN",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Instruksi Pengiriman"},spk:{title:"SURAT PERINTAH KERJA",party:"KEPADA PELAKSANA",right:"TANGGAL MULAI",leftSign:"Hormat kami,",rightSign:"Pelaksana,",notes:"Lingkup Pekerjaan / Ketentuan"},rab:{title:"RENCANA ANGGARAN BIAYA",party:"NAMA PROYEK / PEMILIK",right:"TANGGAL PENYUSUNAN",leftSign:"Hormat kami,",rightSign:"Disetujui oleh,",notes:"Asumsi / Catatan Anggaran"},bast:{title:"BERITA ACARA SERAH TERIMA",party:"PIHAK PENERIMA",right:"TANGGAL SERAH TERIMA",leftSign:"Hormat kami,",rightSign:"Pihak yang Menerima,",notes:"Kondisi / Catatan Serah Terima"},laporanprogress:{title:"LAPORAN KEMAJUAN PEKERJAAN",party:"NAMA PROYEK / PEMBERI KERJA",right:"PERIODE LAPORAN",leftSign:"Hormat kami,",rightSign:"Diperiksa oleh,",notes:"Kendala / Tindak Lanjut"},laporanhari:{title:"LAPORAN HARIAN PEKERJAAN",party:"NAMA PROYEK",right:"TANGGAL LAPORAN",leftSign:"Hormat kami,",rightSign:"Pengawas,",notes:"Cuaca / Kendala / Catatan"},permintaanpembelian:{title:"FORMULIR PERMINTAAN PEMBELIAN",party:"BAGIAN / PEMOHON",right:"TANGGAL DIBUTUHKAN",leftSign:"Hormat kami,",rightSign:"Menyetujui,",notes:"Alasan / Spesifikasi Pembelian"},notadebit:{title:"NOTA DEBIT",party:"DITUJUKAN KEPADA",right:"TANGGAL NOTA",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Alasan / Referensi Transaksi"},notakredit:{title:"NOTA KREDIT",party:"DITUJUKAN KEPADA",right:"TANGGAL NOTA",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Alasan / Referensi Transaksi"},suratperingatan:{title:"SURAT TEGURAN / PERINGATAN",party:"KEPADA YTH.",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Uraian / Tindak Lanjut"},suratundangan:{title:"SURAT UNDANGAN",party:"KEPADA YTH.",right:"HARI / TANGGAL ACARA",leftSign:"Hormat kami,",rightSign:"Mengetahui,",notes:"Agenda / Tempat / Waktu"},suratkuasa:{title:"SURAT KUASA",party:"PENERIMA KUASA",right:"TANGGAL PEMBUATAN",leftSign:"Hormat kami,",rightSign:"Penerima Kuasa,",notes:"Ruang Lingkup Kuasa"},suratketerangan:{title:"SURAT KETERANGAN",party:"YANG DITERANGKAN",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Mengetahui,",notes:"Keterangan Tambahan"},memointernal:{title:"MEMO INTERNAL",party:"KEPADA",right:"TANGGAL MEMO",leftSign:"Hormat kami,",rightSign:"Diketahui,",notes:"Tindak Lanjut"},suratpengantar:{title:"SURAT PENGANTAR",party:"KEPADA YTH.",right:"TANGGAL SURAT",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Daftar Lampiran / Catatan"},laporanbiaya:{title:"LAPORAN RINCIAN BIAYA PROYEK",party:"NAMA PROYEK / PENANGGUNG JAWAB",right:"PERIODE LAPORAN",leftSign:"Hormat kami,",rightSign:"Diperiksa oleh,",notes:"Keterangan Biaya"},checklistqc:{title:"DAFTAR PEMERIKSAAN MUTU",party:"NAMA PROYEK / LOKASI",right:"TANGGAL PEMERIKSAAN",leftSign:"Hormat kami,",rightSign:"Pemeriksa QC,",notes:"Temuan / Tindakan Perbaikan"},invoicetermin:{title:"TAGIHAN TERMIN",party:"DITAGIHKAN KEPADA",right:"JATUH TEMPO",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Termin / Progres / Ketentuan Pembayaran"},rekapitulasi:{title:"LAPORAN REKAPITULASI PEMBAYARAN",party:"PELANGGAN / PROYEK",right:"PERIODE REKAP",leftSign:"Hormat kami,",rightSign:"Diperiksa oleh,",notes:"Ringkasan / Catatan Pembayaran"}};
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function money(n){return (Number(n)||0).toLocaleString("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0})}
 function amountDisplay(n,type){return type==="suratjalan"?(Number(n)||0).toLocaleString("id-ID",{maximumFractionDigits:2}):money(n)}
let extraItemColumns=[];
let extraColumnSequence=0;
function defaultColumnLabels(){return {kolomNamaLabel:"Nama Barang",kolomJumlahLabel:"Qty/Vol",kolomHargaLabel:"Harga Satuan"};}
function applyDefaultColumnLabels(){const defaults=defaultColumnLabels();Object.entries(defaults).forEach(([id,value])=>{if($(id)&&!$(id).value)$(id).value=value;});}
function safeColumnId(){extraColumnSequence++;return "kolom_"+Date.now().toString(36)+"_"+extraColumnSequence;}
function splitQuantityUnit(value){const raw=String(value??"").trim();const match=raw.match(/^([-+]?(?:\d+(?:[.,]\d*)?|[.,]\d+))\s*(.*)$/);return match?{number:match[1],unit:match[2].trim()}:{number:raw,unit:""};}
function quantityNumber(value){const match=String(value??"").trim().match(/^[-+]?(?:\d+(?:[.,]\d*)?|[.,]\d+)/);return match?Number(match[0].replace(",","."))||0:0;}
function priceNumber(value){let raw=String(value??"").trim().replace(/[^0-9,.-]/g,"");if(!raw)return 0;const comma=raw.lastIndexOf(","),dot=raw.lastIndexOf(".");if(comma>=0&&dot>=0){raw=comma>dot?raw.replace(/\./g,"").replace(",","."):raw.replace(/,/g,"");}else if(comma>=0){raw=raw.replace(",",".");}else if(dot>=0&&raw.length-dot-1===3){raw=raw.replace(/\./g,"");}const n=Number(raw);return Number.isFinite(n)?n:0;}
function escapeHTML(value){return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function getEditorColumns(){const type=$("jenis").value;return [{id:"nama",label:$("kolomNamaLabel").value||"Nama Barang",kind:"name"},{id:"qty",label:type==="suratjalan"?"Jumlah":($("kolomJumlahLabel").value||"Qty/Vol"),kind:"qty"},{id:"harga",label:type==="suratjalan"?"Qty":($("kolomHargaLabel").value||"Harga"),kind:"harga"},...extraItemColumns.map(col=>({...col,kind:"extra"})),{id:"total",label:"Total",kind:"total"}];}
function renderExtraColumnManager(){const wrap=$("daftarKolomTambahan");if(!wrap)return;wrap.innerHTML="";extraItemColumns.forEach(col=>{const row=document.createElement("div");row.className="custom-column-row";const input=document.createElement("input");input.type="text";input.value=col.label;input.setAttribute("aria-label","Nama kolom tambahan");input.addEventListener("input",()=>{col.label=input.value;render();});const del=document.createElement("button");del.type="button";del.className="secondary";del.textContent="Hapus";del.addEventListener("click",()=>{extraItemColumns=extraItemColumns.filter(x=>x.id!==col.id);$("barisItem").querySelectorAll("tr").forEach(tr=>tr.querySelector('[data-extra="'+col.id+'"]')?.closest("td")?.remove());renderExtraColumnManager();render();});row.append(input,del);wrap.append(row);});}
function bindItemInput(input){input.addEventListener("focus",()=>{requestAnimationFrame(()=>{try{input.setSelectionRange(0,input.value.length);}catch(_){input.select();}});});input.addEventListener("input",render);}
function addItem(item={}){
 const tr=document.createElement("tr");
 const columns=getEditorColumns();
 columns.forEach(col=>{
  const td=document.createElement("td");
  if(col.kind==="total"){td.className="item-total-cell";td.textContent="Otomatis";td.dataset.total="1";}
  else if(col.kind==="extra"){const input=document.createElement("input");input.type="text";input.className="item-extra";input.dataset.extra=col.id;input.value=item.custom?.[col.id]??"";input.placeholder=col.label;bindItemInput(input);td.append(input);}
  else{
   const wrap=document.createElement("div");wrap.className="item-input-wrap";
   const input=document.createElement("input");input.type="text";input.autocomplete="off";
   input.className=col.kind==="name"?"item-name":col.kind==="qty"?"item-qty":"item-price";
   const parsedQty=col.kind==="qty"?splitQuantityUnit(item.qty??1):null;
   input.value=col.kind==="name"?(item.nama??""):col.kind==="qty"?parsedQty.number:(item.harga??0);
   input.placeholder=col.kind==="qty"?"Contoh: 30":col.label;input.setAttribute("aria-label",col.kind==="qty"?"Jumlah":col.label);if(col.kind==="qty")input.inputMode="decimal";bindItemInput(input);wrap.append(input);
   if(col.kind==="qty"){const unit=document.createElement("select");unit.className="item-unit-select";unit.setAttribute("aria-label","Pilih satuan");const blank=document.createElement("option");blank.value="";blank.textContent="Satuan";unit.append(blank);["m","m²","m³","kg","ton","pcs","dus","unit","batang","sak"].forEach(value=>{const option=document.createElement("option");option.value=value;option.textContent=value;unit.append(option);});if(parsedQty.unit&&!Array.from(unit.options).some(option=>option.value===parsedQty.unit)){const option=document.createElement("option");option.value=parsedQty.unit;option.textContent=parsedQty.unit;unit.append(option);}unit.value=parsedQty.unit;unit.addEventListener("change",render);wrap.append(unit);}
   if(col.kind==="name"||col.kind==="qty"){const clear=document.createElement("button");clear.type="button";clear.className="clear-field";clear.textContent="×";clear.title="Kosongkan";clear.addEventListener("click",()=>{input.value="";const unit=wrap.querySelector(".item-unit-select");if(unit)unit.value="";input.dispatchEvent(new Event("input",{bubbles:true}));input.focus();});wrap.append(clear);}
   td.append(wrap);
  }
  tr.append(td);
 });
 const action=document.createElement("td");const remove=document.createElement("button");remove.type="button";remove.className="delete-item";remove.textContent="×";remove.setAttribute("aria-label","Hapus baris item");remove.onclick=()=>{tr.remove();render();};action.append(remove);tr.append(action);
 $("barisItem").append(tr);render();
}
function syncItemEditorFields(){
 const columns=getEditorColumns(),head=$("headEditorItem");head.innerHTML="";
 columns.forEach(col=>{const th=document.createElement("th");th.textContent=col.label;head.append(th);});
 const action=document.createElement("th");action.textContent="";head.append(action);
 $("barisItem").querySelectorAll("tr").forEach(tr=>{const expected=columns.length+1;while(tr.cells.length<expected){const td=document.createElement("td");const col=columns[tr.cells.length];if(col?.kind==="extra"){const input=document.createElement("input");input.className="item-extra";input.dataset.extra=col.id;input.type="text";input.addEventListener("input",render);td.append(input);}tr.insertBefore(td,tr.lastElementChild);}while(tr.cells.length>expected)tr.deleteCell(tr.cells.length-2);});
}
 function getItems(){return [...$("barisItem").rows].map(r=>{const amount=r.querySelector(".item-qty")?.value??"1";const unit=r.querySelector(".item-unit-select")?.value??"";return {nama:r.querySelector(".item-name")?.value??"",qty:[amount.trim(),unit].filter(Boolean).join(" "),harga:r.querySelector(".item-price")?.value??"0",custom:Object.fromEntries([...r.querySelectorAll(".item-extra")].map(input=>[input.dataset.extra,input.value]))};});}
function readData(){const d={jenis:$("jenis").value,template:$("template").value,templateFormat2:$("templateFormat2")?.value||"f2-polos"};fieldIds.forEach(id=>d[id]=$(id).value);d.rincianBebas=sanitizeDocumentHtml($("pWordContent")?.innerHTML??$("rincianBebas").value??"");const f2Body=$("f2WordContent");d.rincianFormat2=f2Body?(f2Body.textContent.trim()?sanitizeDocumentHtml(f2Body.innerHTML):""):"";d.items=getItems();d.itemColumns=extraItemColumns.map(x=>({...x}));return d;}
function setData(d){
 $("jenis").value=d.jenis||"invoice";$("template").value=d.template||"standar";if($("templateFormat2"))$("templateFormat2").value=d.templateFormat2||"f2-polos";applyCustomTemplate();
 fieldIds.forEach(id=>{if($(id))$(id).value=d[id]??"";});
 // Profil perusahaan selalu diambil dari penyimpanan khusus, bukan dari arsip dokumen lama atau hasil impor Inventory.
 restoreCompanyProfile();
 if($("pWordContent"))$("pWordContent").innerHTML=sanitizeDocumentHtml(d.rincianBebas??"");if($("f2WordContent"))$("f2WordContent").innerHTML=sanitizeDocumentHtml(d.rincianFormat2??(d.layoutMode==="no-table"?(d.rincianBebas??""):""));
 const defaults=defaultColumnLabels();Object.entries(defaults).forEach(([id,value])=>{if($(id)&&!d[id])$(id).value=value;});if(d.kolomDetailLabel&&!d.kolomHargaLabel)$("kolomHargaLabel").value=d.kolomDetailLabel;
 extraItemColumns=Array.isArray(d.itemColumns)?d.itemColumns.filter(x=>x&&x.id).map(x=>({id:String(x.id),label:String(x.label||"Kolom")})):[];
 renderExtraColumnManager();$("barisItem").innerHTML="";
 (d.items||[]).forEach(item=>{
  const legacyUnit=noMoneyTypes.includes(d.jenis)&&typeof item.harga==="string"&&!/^[-+]?\d+(?:[.,]\d+)?$/.test(item.harga);
  const oldUnit=String(item.satuan??(legacyUnit?item.harga:"")).trim();const oldQty=String(item.qty??1).trim();const mergedQty=oldUnit&&oldUnit!=="—"&&!oldQty.toLowerCase().includes(oldUnit.toLowerCase())?`${oldQty} ${oldUnit}`:oldQty;
  addItem({...item,qty:mergedQty,harga:legacyUnit?0:(item.harga??0)});
 });
 if(!d.items?.length)addItem();render();
}
function fmtDate(v){if(!v)return "-";const s=String(v);const isDateOnly=s.length===10&&s[4]==="-"&&s[7]==="-";const d=isDateOnly?new Date(Number(s.slice(0,4)),Number(s.slice(5,7))-1,Number(s.slice(8,10))):new Date(s);if(Number.isNaN(d.getTime()))return s;return new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(d)}
const noMoneyTypes=["suratjalan","resmi","permohonan","surattugas","beritaacara","kontrak","tandaterima","deliveryorder","spk","bast","laporanprogress","laporanhari","permintaanpembelian","suratperingatan","suratundangan","suratkuasa","suratketerangan","memointernal","suratpengantar","checklistqc"];
const F2_ALIGN_KEY="azxOfficeFormat2Alignment";
function setFormat2Alignment(align){if(!["left","center","right"].includes(align))return;const editor=$("f2WordContent");if(!editor)return;editor.style.textAlign=align;try{localStorage.setItem(F2_ALIGN_KEY,align);}catch(e){}document.querySelectorAll("[data-f2-align]").forEach(btn=>{const active=btn.dataset.f2Align===align;btn.classList.toggle("active",active);btn.setAttribute("aria-pressed",String(active));});}
document.querySelectorAll("[data-f2-align]").forEach(btn=>{btn.addEventListener("mousedown",e=>e.preventDefault());btn.addEventListener("click",()=>{setFormat2Alignment(btn.dataset.f2Align);$("f2WordContent")?.focus();});});
try{setFormat2Alignment(localStorage.getItem(F2_ALIGN_KEY)||"left");}catch(e){setFormat2Alignment("left");}
function renderFormat2Preview(d,L){const paper=$("lembarFormat2"),format1=$("lembar"),logo=$("f2Logo");const active=d.layoutMode==="no-table";paper.hidden=!active;paper.style.display=active?"block":"none";format1.hidden=active;format1.style.display=active?"none":"";if(!active)return;paper.className="paper-format2 template-"+($("templateFormat2")?.value||"f2-polos")+" doc-type-"+d.jenis;paper.dataset.category=d.jenis;logo.innerHTML="";if(companyLogo){const img=document.createElement("img");img.src=companyLogo;img.alt="Logo perusahaan";logo.append(img);}else logo.textContent=(d.perusahaan||"NP").trim().split(/\\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"NP";$("f2Perusahaan").textContent=d.perusahaan||"NAMA PERUSAHAAN";$("f2Alamat").textContent=d.alamatPerusahaan||"";$("f2Tanggal").textContent=fmtDate(d.tanggalDokumen);$("f2LabelPihak").textContent=""; $("f2Pihak").textContent=d.pihak||"";$("f2AlamatPihak").textContent=d.alamatPihak||"";const content=$("f2WordContent");if(content&&!content.dataset.bound){content.dataset.bound="1";}const body=sanitizeDocumentHtml(d.rincianFormat2??"");if(content&&content.innerHTML!==body&&document.activeElement!==content)content.innerHTML=body;}
function render(){syncItemEditorFields();$("barisItem").querySelectorAll("tr").forEach(tr=>{const q=quantityNumber(tr.querySelector(".item-qty")?.value);const p=priceNumber(tr.querySelector(".item-price")?.value);const cell=tr.querySelector(".item-total-cell");if(cell)cell.textContent=amountDisplay(q*p,$("jenis").value);});const d=readData(),type=d.jenis,L=labels[type]||labels.invoice,items=d.items;const noTable=d.layoutMode==="no-table";document.body.classList.toggle("layout-no-table",noTable);$("lembar").classList.toggle("layout-no-table",noTable);$("pTeksPenutupKiri").textContent=d.teksPenutupKiri??"Hormat kami,";$("pTeksPenutupKanan").textContent=d.teksPenutupKanan??"Mengetahui,";const total=items.reduce((s,x)=>s+quantityNumber(x.qty)*(priceNumber(x.harga)),0);const tax=total*(Number(d.pajak)||0)/100,disc=Number(d.diskon)||0,grand=Math.max(0,total+tax-disc);
const letterTypes=["penawaran","penagihan","beritaacara","kontrak","surattugas","permohonan","resmi","suratperingatan","suratundangan","suratkuasa","suratketerangan","memointernal","suratpengantar","spk","bast"];
const reportTypes=["rab","laporanprogress","laporanhari","laporanbiaya","checklistqc","rekapitulasi"];
const kind=letterTypes.includes(type)?"letter":reportTypes.includes(type)?"report":["invoice","kuitansi","purchaseorder","tandaterima","deliveryorder","notadebit","notakredit","invoicetermin","suratjalan"].includes(type)?"transaction":"general";
const format2=d.layoutMode==="no-table";const activeTemplate=format2?($("templateFormat2")?.value||"f2-polos"):d.template;$("lembar").className="paper template-"+activeTemplate+" doc-type-"+type+" doc-kind-"+kind+(customTemplate?" has-custom-template":"")+(format2?" format2-paper":"");
const logoBox=$("pLogo");logoBox.innerHTML="";if(companyLogo){logoBox.classList.add("has-image");const img=document.createElement("img");img.src=companyLogo;img.alt="Logo perusahaan";img.className="logo-img";logoBox.append(img);}else{logoBox.classList.remove("has-image");logoBox.textContent=(d.perusahaan||"NP").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"NP";}
$("pPerusahaan").textContent=d.perusahaan||"NAMA PERUSAHAAN";$("pAlamat").textContent=d.alamatPerusahaan||"";$("pKontak").textContent=[d.teleponPerusahaan,d.emailPerusahaan].filter(Boolean).join(" · ");$("pJudul").textContent=L.title;$("pNomor").textContent="No: "+(d.nomorDokumen||"-");$("pTanggal").textContent="Tanggal: "+fmtDate(d.tanggalDokumen);$("pLabelPihak").textContent=format2?"KEPADA YTH.":L.party;$("pPihak").textContent=d.pihak||"Nama pelanggan / penerima";$("pAlamatPihak").textContent=d.alamatPihak||"";$("pJatuhTempoBox").querySelector("small").textContent=L.right;$("pJatuhTempo").textContent=fmtDate(["invoice","penagihan","invoicetermin"].includes(type)?d.jatuhTempo:d.tanggalDokumen);$("pJatuhTempoBox").style.display=format2?"none":["suratjalan","resmi","permohonan","surattugas","beritaacara","kontrak","spk","bast","laporanprogress","laporanhari","permintaanpembelian","suratperingatan","suratundangan","suratkuasa","suratketerangan","memointernal","suratpengantar","checklistqc","laporanbiaya","rekapitulasi"].includes(type)?"none":"flex";$("pKeterangan").textContent=d.keterangan||"";$("pCatatanLabel").textContent=noTable?"Lampiran / Catatan":L.notes;$("pCatatan").textContent=d.catatan||"-";$("pTtdKiri").textContent="Hormat kami,";$("pTtdKanan").textContent=L.rightSign;$("pNamaTtd").textContent=d.penanggungJawab||"(................................)";$("pJabatanTtd").textContent=d.penanggungJawab?(d.jabatan||""):"";const stampImage=$("pStampImage");if(stampImage){const stampSlot=stampImage.closest(".signature-stamp-slot");const uploadedStamp=Boolean(format1UploadedStamp&&!useReferenceStamp);if(uploadedStamp){if(stampSlot)stampSlot.hidden=false;stampImage.onerror=()=>{stampImage.hidden=true;if(stampSlot)stampSlot.hidden=true;const status=$("statusStempel");if(status)status.textContent="Stempel tersimpan, tetapi gambar tidak dapat dibaca browser. Coba unggah ulang dalam PNG atau JPG.";console.error("Gambar stempel unggahan gagal dimuat.");};if(stampImage.getAttribute("src")!==format1UploadedStamp)stampImage.src=format1UploadedStamp;stampImage.hidden=false;stampImage.removeAttribute("hidden");}else{stampImage.hidden=true;stampImage.removeAttribute("src");stampImage.onerror=null;if(stampSlot)stampSlot.hidden=true;}}const f2StampImage=$("f2StampImage");if(f2StampImage){f2StampImage.onerror=()=>{f2StampImage.hidden=true;console.error("Gambar stempel unggahan Format 2 gagal dimuat.");};if(companyStamp){if(f2StampImage.getAttribute("src")!==companyStamp)f2StampImage.src=companyStamp;f2StampImage.hidden=false;f2StampImage.removeAttribute("hidden");}else{f2StampImage.hidden=true;f2StampImage.removeAttribute("src");f2StampImage.onerror=null;}}$("pFooter").textContent=[d.alamatPerusahaan,d.teleponPerusahaan,d.emailPerusahaan].filter(Boolean).join(" | ");
const wordContent=$("pWordContent");if(wordContent&&!wordContent.dataset.bound){wordContent.dataset.bound="1";wordContent.addEventListener("input",()=>{$("rincianBebas").value=wordContent.innerHTML;});}
 ["pWordContent","f2WordContent"].forEach(id=>{
  const editor=$(id);if(!editor||editor.dataset.safePasteBound)return;editor.dataset.safePasteBound="1";
  editor.addEventListener("paste",event=>{
   const html=event.clipboardData?.getData("text/html")||"";
   const plain=event.clipboardData?.getData("text/plain")||"";
   if(!html&&!plain)return;
   event.preventDefault();
   const safe=html?sanitizeDocumentHtml(html):document.createTextNode(plain).textContent.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");
   document.execCommand("insertHTML",false,safe);
   editor.dispatchEvent(new Event("input",{bubbles:true}));
  });
 });

 const head=$("pHeadTabel"),plainItems=$("pItemsPlain");plainItems.textContent="";const columns=getEditorColumns();head.innerHTML="";const hr=document.createElement("tr");const numberHead=document.createElement("th");numberHead.textContent="No.";hr.append(numberHead);columns.forEach(col=>{const th=document.createElement("th");th.textContent=col.label;hr.append(th);});head.append(hr);
 $("pItems").innerHTML="";
 items.forEach((x,i)=>{
  const tr=document.createElement("tr"),num=document.createElement("td");num.textContent=String(i+1);tr.append(num);
  columns.forEach(col=>{const td=document.createElement("td");let value="";
   if(col.kind==="name")value=x.nama||"";
   else if(col.kind==="qty")value=x.qty??"";
   else if(col.kind==="harga")value=amountDisplay(x.harga,type);
   else if(col.kind==="extra")value=x.custom?.[col.id]??"";
   else value=amountDisplay(quantityNumber(x.qty)*(priceNumber(x.harga)),type);
   td.textContent=value;tr.append(td);
  });
  $("pItems").append(tr);
  const line=document.createElement("p");line.className="plain-item";line.textContent=[(i+1)+". "+(x.nama||"-"),(type==="suratjalan"?"Jumlah":(d.kolomJumlahLabel||"Qty/Vol"))+": "+(x.qty??""),(type==="suratjalan"?"Qty":(d.kolomHargaLabel||"Harga"))+": "+amountDisplay(x.harga,type),"Total: "+amountDisplay(quantityNumber(x.qty)*priceNumber(x.harga),type),...extraItemColumns.map(col=>col.label+": "+(x.custom?.[col.id]??""))].filter(Boolean).join("  ·  ");if(!noTable&&!d.rincianBebas)plainItems.append(line);
 });
 if(noTable){const freeText=String(d.rincianBebas||"").trim();if(freeText)plainItems.textContent=freeText;else items.forEach((x,i)=>{const line=document.createElement("p");line.className="plain-item";line.textContent=[(i+1)+". "+(x.nama||"-"),(d.jenis==="suratjalan"?"Jumlah":"Qty/Vol")+": "+(x.qty??""),(d.jenis==="suratjalan"?"Qty":"Harga")+": "+amountDisplay(x.harga,d.jenis),"Total: "+amountDisplay(quantityNumber(x.qty)*priceNumber(x.harga),d.jenis)].join("  ·  ");plainItems.append(line);});}
 plainItems.style.display=noTable?"block":"none";
$("pTotals").style.display=noTable||noMoneyTypes.includes(type)?"none":"block";$("pTotals").innerHTML='<div class="total-line"><span>Subtotal</span><b>'+money(total)+'</b></div><div class="total-line"><span>Pajak ('+(Number(d.pajak)||0)+'%)</span><b>'+money(tax)+'</b></div><div class="total-line"><span>Diskon</span><b>- '+money(disc)+'</b></div><div class="total-line grand"><span>Total</span><b>'+money(grand)+'</b></div>';
$("labelPihak").firstChild.textContent=["suratjalan","deliveryorder","suratpengantar"].includes(type)?"Nama penerima":type==="penawaran"?"Nama pelanggan":["kuitansi","tandaterima","bast"].includes(type)?"Nama pemberi":["spk","rab","laporanprogress","laporanhari","laporanbiaya","checklistqc"].includes(type)?"Nama proyek / lokasi":type==="permintaanpembelian"?"Nama pemohon":type==="memointernal"?"Nama penerima memo":"Nama pelanggan / penerima";$("labelJatuhTempo").style.display=(["invoice","penagihan","invoicetermin"].includes(type))?"block":"none";renderFormat2Preview(d,L);alignStampTopToGreeting();watchStampAlignment()}
let stampAlignFrame=0,stampAlignObserver=null;
function alignStampTopToGreeting(){
 if(stampAlignFrame)cancelAnimationFrame(stampAlignFrame);
 stampAlignFrame=requestAnimationFrame(()=>{
  stampAlignFrame=0;
  const paper=$("lembar"),owner=paper?.querySelector(".signature-owner"),greeting=$("pTtdKiri"),slot=$("pStampImage")?.closest(".signature-stamp-slot");
  if(!paper||paper.classList.contains("format2-paper")||paper.classList.contains("layout-no-table")||!owner||!greeting||!slot)return;
  const ownerRect=owner.getBoundingClientRect(),greetingRect=greeting.getBoundingClientRect();
  slot.style.setProperty("top",Math.max(0,greetingRect.top-ownerRect.top)+"px","important");
 });
}
function watchStampAlignment(){
 const owner=$("lembar")?.querySelector(".signature-owner"),greeting=$("pTtdKiri");
 if(!owner||!greeting||typeof ResizeObserver==="undefined")return;
 if(stampAlignObserver)stampAlignObserver.disconnect();
 stampAlignObserver=new ResizeObserver(()=>alignStampTopToGreeting());
 stampAlignObserver.observe(owner);stampAlignObserver.observe(greeting);
 alignStampTopToGreeting();
}
window.addEventListener("resize",alignStampTopToGreeting,{passive:true});
window.addEventListener("beforeprint",alignStampTopToGreeting);

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
async function importCompanyStamp(file){
 if(!file)return;
 const fileName=String(file.name||"").toLowerCase();
 const allowedType=["image/png","image/jpeg","image/webp"].includes(file.type);
 const allowedExtension=/\.(png|jpe?g|webp)$/.test(fileName);
 if(!allowedType&&!allowedExtension){alert("Stempel harus berupa PNG, JPG, atau WEBP.");$("fileStempel").value="";return;}
 if(file.size>5*1024*1024){alert("Ukuran gambar stempel maksimal 5 MB.");$("fileStempel").value="";return;}
 try{
  const objectUrl=URL.createObjectURL(file),img=new Image();
  try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error("File gambar tidak dapat dibaca sebagai gambar. Coba simpan ulang sebagai PNG atau JPG."));img.src=objectUrl;});}
  finally{URL.revokeObjectURL(objectUrl);}
  if(!img.naturalWidth||!img.naturalHeight)throw new Error("Ukuran gambar tidak valid.");
  let scale=Math.min(1,900/img.naturalWidth,650/img.naturalHeight),saved=false;
  while(scale>=.12&&!saved){
   const canvas=document.createElement("canvas");
   canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
   canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext("2d");
   if(!ctx)throw new Error("Browser tidak dapat memproses gambar stempel.");
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const encoded=canvas.toDataURL("image/png");
   try{localStorage.setItem("stempelPerusahaanBisnis",encoded);localStorage.setItem(STAMP_UPLOAD_MARKER,"1");companyStamp=encoded;format1UploadedStamp=encoded;saved=true;}
   catch(error){scale*=.72;}
  }
  if(!saved)throw new Error("Gambar terlalu besar untuk penyimpanan perangkat. Pilih gambar yang lebih kecil.");
  useReferenceStamp=false;
  const preview=$("pStampImage"),slot=preview?.closest(".signature-stamp-slot");
  if(slot){slot.style.display="block";slot.style.visibility="visible";}
  if(preview){
   preview.onerror=()=>{preview.hidden=true;const status=$("statusStempel");if(status)status.textContent="Stempel tersimpan, tetapi gagal dimuat pada pratinjau. Coba unggah ulang sebagai PNG."};
   preview.onload=()=>{preview.hidden=false;const status=$("statusStempel");if(status)status.textContent="Stempel berhasil diunggah dan tampil di pratinjau Format 1."};
   preview.hidden=false;preview.removeAttribute("hidden");preview.src=companyStamp;
  }
  render();
  const status=$("statusStempel");
  if(status&&preview&&!preview.complete)status.textContent="Stempel disimpan, sedang dimuat ke pratinjau Format 1...";
  else if(status&&preview&&preview.complete&&preview.naturalWidth)status.textContent="Stempel berhasil diunggah dan tampil di pratinjau Format 1.";
 }catch(error){alert("Gagal mengunggah stempel: "+error.message);const status=$("statusStempel");if(status)status.textContent="Upload gagal: "+error.message;}
 $("fileStempel").value="";
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
function readDocumentHistory(){
 try{const value=JSON.parse(localStorage.getItem("dokumenBisnis")||"[]");return Array.isArray(value)?value:[];}
 catch(error){console.warn("Arsip dokumen tidak dapat dibaca:",error);return [];}
}
function history(){
 const list=readDocumentHistory();
 $("riwayat").innerHTML="";
 if(!list.length){$("riwayat").textContent="Belum ada dokumen tersimpan.";return}
 list.map((d,index)=>({d,index})).reverse().forEach(({d,index})=>{
  const row=document.createElement("div");row.className="history-row";
  const info=document.createElement("span");info.className="history-info";
  const title=document.createElement("strong");title.textContent=labels[d.jenis]?.title||d.jenis||"Dokumen";
  const meta=document.createElement("small");meta.textContent=(d.nomorDokumen||"Tanpa nomor")+" · "+(d.pihak||"Belum ada penerima");
  info.append(title,meta);
  const actions=document.createElement("div");actions.className="history-actions";
  const view=document.createElement("button");view.type="button";view.textContent="Lihat";
  view.setAttribute("aria-label","Lihat "+(d.nomorDokumen||"dokumen"));
  view.onclick=()=>{setData(d);const preview=document.querySelector(".preview-wrap");preview?.scrollIntoView({behavior:"smooth",block:"start"});};
  const edit=document.createElement("button");edit.type="button";edit.textContent="Edit";edit.className="history-edit";
  edit.setAttribute("aria-label","Edit "+(d.nomorDokumen||"dokumen"));
  edit.onclick=()=>{setData(d);document.querySelector(".panel")?.scrollIntoView({behavior:"smooth",block:"start"});};
  const del=document.createElement("button");del.type="button";del.textContent="Hapus";del.className="history-delete";
  del.setAttribute("aria-label","Hapus "+(d.nomorDokumen||"dokumen"));
  del.onclick=()=>{
   if(!confirm("Hapus dokumen "+(d.nomorDokumen||"ini")+" dari riwayat?"))return;
   const current=readDocumentHistory();
   current.splice(index,1);
   try{localStorage.setItem("dokumenBisnis",JSON.stringify(current));history();}
   catch(error){alert("Arsip tidak dapat diperbarui. Periksa ruang penyimpanan browser.");}
  };
  actions.append(view,edit,del);row.append(info,actions);$("riwayat").append(row);
 });
}
function save(){
 const d=readData();
 if(!d.nomorDokumen.trim()){alert("Isi nomor dokumen terlebih dahulu.");$("nomorDokumen").focus();return;}
 const list=readDocumentHistory();
 const i=list.findIndex(x=>x.jenis===d.jenis&&x.nomorDokumen===d.nomorDokumen);
 if(i>=0)list[i]=d;else list.push(d);
 try{localStorage.setItem("dokumenBisnis",JSON.stringify(list));history();alert("Dokumen berhasil disimpan di perangkat ini.");}
 catch(error){alert("Dokumen belum dapat disimpan. Ruang penyimpanan browser mungkin penuh.");console.error("Gagal menyimpan arsip dokumen:",error);}
}
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
function newDoc(){if(!confirm("Buat dokumen baru? Perubahan yang belum disimpan akan hilang."))return;const keep={perusahaan:$("perusahaan").value,alamatPerusahaan:$("alamatPerusahaan").value,teleponPerusahaan:$("teleponPerusahaan").value,emailPerusahaan:$("emailPerusahaan").value,penanggungJawab:$("penanggungJawab").value,jabatan:$("jabatan").value||"Direktur"};["pihak","alamatPihak","nomorDokumen","tanggalDokumen","jatuhTempo","keterangan","pajak","diskon","catatan"].forEach(id=>$(id).value="");$("layoutMode").value="table";if($("pWordContent"))$("pWordContent").innerHTML="";if($("f2WordContent"))$("f2WordContent").innerHTML="";$("rincianBebas").value="";$("teksPenutupKiri").value="Hormat kami,";$("teksPenutupKanan").value="Mengetahui,";Object.entries(keep).forEach(([id,value])=>$(id).value=value);restoreCompanyProfile();$("tanggalDokumen").value=today();$("nomorDokumen").value=makeNumber();$("barisItem").innerHTML="";addItem();render()}
$("fileStempel").addEventListener("change",e=>importCompanyStamp(e.target.files[0]));$("hapusStempel").onclick=()=>{companyStamp="";useReferenceStamp=true;localStorage.removeItem("stempelPerusahaanBisnis");localStorage.removeItem(STAMP_UPLOAD_MARKER);format1UploadedStamp="";$("statusStempel").textContent="Belum ada stempel diunggah";render();};$("fileTemplateCanva").addEventListener("change",e=>importCanvaTemplate(e.target.files[0]));$("fileLogoPerusahaan").addEventListener("change",e=>importCompanyLogo(e.target.files[0]));$("hapusLogoPerusahaan").onclick=()=>{companyLogo="";localStorage.removeItem("logoPerusahaanBisnis");$("statusLogoPerusahaan").textContent="Belum ada logo diunggah";render();};$("hapusTemplateCanva").onclick=()=>{customTemplate="";localStorage.removeItem("templateCanvaBisnis");applyCustomTemplate();render()};$("tambahItem").onclick=()=>addItem();$("tambahKolom").onclick=()=>{extraItemColumns.push({id:safeColumnId(),label:"Kolom baru"});renderExtraColumnManager();$("barisItem").querySelectorAll("tr").forEach(tr=>{const td=document.createElement("td");const input=document.createElement("input");input.type="text";input.className="item-extra";input.dataset.extra=extraItemColumns[extraItemColumns.length-1].id;input.addEventListener("input",render);td.append(input);tr.insertBefore(td,tr.lastElementChild);});render();};$("simpan").onclick=save;async function exportFormat2PDF(source,filename){
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
$("cetak").onclick=()=>{
 const p=numberParts(),n=(Number(localStorage.getItem(p.key))||0)+1;
 $("nomorDokumen").value=nextDocumentNumber(n);
 render();
 // Format 1 dan Format 2 sama-sama membuka dialog pratinjau cetak browser.
 // Pengguna dapat memeriksa dokumen dahulu lalu memilih printer atau Simpan sebagai PDF.
 localStorage.setItem(p.key,String(n));
 window.print();
 $("nomorDokumen").value=nextDocumentNumber(n+1);
 render();
};$("baru").onclick=newDoc;$("jenis").onchange=()=>{if(!$("nomorDokumen").value||$("nomorDokumen").value.includes("/"))$("nomorDokumen").value=makeNumber();applyDefaultColumnLabels();render()};$("template").onchange=render;$("templateFormat2").onchange=render;function syncFormatMode(){const f2=$("layoutMode").value==="no-table";if($("previewTitle"))$("previewTitle").textContent=f2?"Pratinjau Format 2":"Pratinjau Format 1";$("templateBuiltInWrap").querySelector("select").hidden=f2;$("templateFormat2").hidden=!f2;$("templateBuiltInWrap").querySelector("label").firstChild.textContent=f2?"Template Format 2":"Template bawaan";document.body.classList.toggle("format2-editor",f2);}fieldIds.forEach(id=>$(id).addEventListener("input",render));
COMPANY_PROFILE_FIELDS.forEach(id=>{const el=$(id);if(el){el.addEventListener("input",saveCompanyProfile);el.addEventListener("change",saveCompanyProfile);}});$("layoutMode").addEventListener("change",()=>{syncFormatMode();render()});syncFormatMode();applyDefaultColumnLabels();["kolomNamaLabel","kolomJumlahLabel","kolomHargaLabel"].forEach(id=>$(id).addEventListener("input",render));renderExtraColumnManager();$("tanggalDokumen").value=today();$("nomorDokumen").value=makeNumber();$("perusahaan").addEventListener("input",()=>{$("nomorDokumen").value=makeNumber();render();});$("tanggalDokumen").addEventListener("change",()=>{$("nomorDokumen").value=makeNumber();render();});addItem();history();
async function getDocumentAuthHeaders(){
 const client=window.azxOfficeSupabase;
 if(!client)throw new Error("Koneksi akun belum siap. Muat ulang halaman setelah login.");
 const {data,error}=await client.auth.getSession();
 if(error||!data?.session?.access_token)throw new Error("Sesi login berakhir. Silakan login kembali.");
 return {Authorization:"Bearer "+data.session.access_token};
}
function isGeminiQuotaExhausted(message){return /RESOURCE_EXHAUSTED|(?:quota|kuota).{0,50}(?:exceed(?:ed)?|limit|habis|mencapai.{0,5}(?:batas|limit)|tercapai|terlampaui|penuh|reached|exhausted)|(?:batas|limit).{0,30}penggunaan.{0,30}(?:harian|daily).{0,20}(?:tercapai|habis|exceed(?:ed)?|reached)|daily.{0,30}(?:usage|limit).{0,30}(?:reached|exceeded|exhausted)/i.test(String(message||""));}
function shouldRetryAIResponse(status,message){return [502,503,504].includes(Number(status))||(Number(status)===429&&!isGeminiQuotaExhausted(message));}
function getAIRetryDelayMs(response,payload,attempt,nowMs=Date.now()){const headerValue=response?.headers?.get?.("Retry-After");const headerText=String(headerValue??"").trim();const headerSeconds=/^\d+(?:\.\d+)?$/.test(headerText)?Number(headerText):NaN;const headerDateMs=/^[A-Za-z]{3},\s+\d{2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT$/i.test(headerText)?Date.parse(headerText):NaN;const hasValidHeader=(Number.isFinite(headerSeconds)&&headerSeconds>=0)||Number.isFinite(headerDateMs);const headerDelayMs=Number.isFinite(headerSeconds)&&headerSeconds>=0?headerSeconds*1000:Number.isFinite(headerDateMs)?Math.max(0,headerDateMs-nowMs):NaN;const rawBodySeconds=payload?.retry_after;const bodySeconds=rawBodySeconds===undefined||rawBodySeconds===null||rawBodySeconds===""?NaN:Number(rawBodySeconds);const hasValidBody=Number.isFinite(bodySeconds)&&bodySeconds>=0;const retryAfterMs=hasValidHeader?headerDelayMs:hasValidBody?bodySeconds*1000:NaN;if(Number.isFinite(retryAfterMs))return Math.min(Math.max(retryAfterMs,0),60000);return 1500*Math.pow(2,Math.max(0,Number(attempt)||1)-1);}
const DOCUMENT_AI_REQUEST_TIMEOUT_MS=90000;
async function requestAIWithRetry(url,options,status){
 const maxAttempts=3;
 let lastError;
 for(let attempt=1;attempt<=maxAttempts;attempt++){
  let timeoutId=null;
  try{
   if(typeof AbortController!=="function")throw new Error("Browser belum mendukung batas waktu AI. Perbarui browser lalu coba lagi.");
   const controller=new AbortController();
   timeoutId=setTimeout(()=>controller.abort(),DOCUMENT_AI_REQUEST_TIMEOUT_MS);
   const response=await fetch(url,{...options,signal:controller.signal});
   let payload=null;
   try{payload=await response.clone().json();}catch(_){}
   if(response.ok){
    if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error("Respons AI Dokumen tidak valid atau tidak dapat dibaca. Silakan coba lagi.");
    return payload;
   }
   const message=payload?.error||payload?.message||("Permintaan AI gagal (HTTP "+response.status+").");
   const detail=String(message);
   const temporary=shouldRetryAIResponse(response.status,detail);
   if(!temporary||attempt===maxAttempts)throw new Error(detail);
   const delay=getAIRetryDelayMs(response,payload,attempt);
   status.textContent=response.status===429
    ?"Permintaan AI terlalu cepat. Menunggu sebelum mencoba kembali..."
    :"Layanan Gemini sedang sibuk. Mencoba kembali ("+attempt+"/"+(maxAttempts-1)+")...";
   clearTimeout(timeoutId);timeoutId=null;
   await new Promise(resolve=>setTimeout(resolve,delay));
  }catch(error){
   if(error?.name==="AbortError"){
    throw new Error("Waktu tunggu AI Dokumen habis setelah 90 detik. Permintaan tidak diulang otomatis agar tidak menggandakan proses Gemini. Periksa koneksi lalu coba lagi.");
   }
   if(error instanceof TypeError){
    lastError=error;
    if(attempt<maxAttempts){
     if(timeoutId!==null){clearTimeout(timeoutId);timeoutId=null;}
     status.textContent="Koneksi AI terganggu. Mencoba kembali ("+attempt+"/"+(maxAttempts-1)+")...";
     await new Promise(resolve=>setTimeout(resolve,1500*Math.pow(2,attempt-1)));
     continue;
    }
   }
   throw error;
  }finally{
   if(timeoutId!==null)clearTimeout(timeoutId);
  }
 }
 throw lastError||new Error("AI belum dapat dihubungi. Silakan coba lagi.");
}
async function generateWithAI(){
 const prompt=$("aiPrompt").value.trim(),accessCode=getAIAccessCode(),btn=$("aiGenerate"),status=$("aiStatus");
 if(!prompt){alert("Tulis perintah untuk AI terlebih dahulu.");$("aiPrompt").focus();return}
 if(!accessCode)return;
 btn.disabled=true;status.textContent="AI sedang menyusun dokumen...";
 try{
  const current=readData(),format2=current.layoutMode==="no-table";
  const aiInstruction=format2
   ?prompt+"\\n\\nMODE FORMAT 2: Buat isi dokumen dalam bentuk teks/HTML Word yang rapi untuk area isi bebas. Jangan membuat tabel barang, rincian harga, total, tanda tangan, atau blok penutup. Pertahankan kategori dokumen yang dipilih. Kembalikan isi utama pada rincianFormat2 atau rincianBebas."
   :prompt;
  const result=await requestAIWithRetry("https://nqwqlhcwiwprsbcdadhy.supabase.co/functions/v1/dokumen-ai",{
   method:"POST",headers:{"Content-Type":"application/json","x-ai-access-code":accessCode,...await getDocumentAuthHeaders()},
   body:JSON.stringify({instruction:aiInstruction,currentDocument:{...current,formatMode:format2?"format2":"format1",templateSource:format2?"Template Format 2 (isi bebas tanpa tabel dan tanda tangan)":customTemplate?"Canva (desain latar dipertahankan; isi dokumen dapat diedit)":"Template bawaan"}})
  },status);
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
 }catch(error){
  const message=String(error.message||error);
  if(/401|403|unauthorized|kode akses|access code/i.test(message)){
   clearSavedAIAccessCode();
   status.textContent="Kode akses ditolak. Masukkan kode AZX yang benar satu kali; kode lama sudah dihapus dari perangkat.";
  }else if(/batas.{0,20}penggunaan.{0,20}harian/i.test(message)){
   status.textContent="Batas penggunaan AI harian AZX tercapai. Silakan coba lagi besok.";
  }else if(/RESOURCE_EXHAUSTED|quota|kuota|limit/i.test(message)){
   status.textContent="Batas penggunaan Gemini tercapai. Periksa kuota API Gemini atau coba lagi nanti.";
  }else if(/permintaan AI terlalu cepat/i.test(message)){
   status.textContent="Permintaan AI terlalu cepat. Tunggu sebentar sebelum mencoba lagi.";
  }else if(/503|UNAVAILABLE|overloaded|busy/i.test(message)){
   status.textContent="Layanan Gemini sedang sibuk atau melewati batas waktu. Coba lagi beberapa saat.";
  }else{
   status.textContent="Belum berhasil: "+message;
  }
 }finally{btn.disabled=false}
}
$("aiGenerate").onclick=generateWithAI;
applyCustomTemplate();
if(companyLogo)$("statusLogoPerusahaan").textContent="Logo tersimpan di perangkat";if(companyStamp)$("statusStempel").textContent="Stempel tersimpan di perangkat";


// Perintah suara Bahasa Indonesia (Web Speech API).
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let voiceRecognition=null,voiceFinalText="",voiceShouldSubmit=false,voiceTargetLayoutMode="table";
function voiceStatus(message){$("voiceStatus").textContent=message;}
let voiceRecorder=null,voiceStream=null,voiceChunks=[],voiceAudioContext=null,voiceSilenceTimer=null,voiceSpeechDetected=false,voiceLastSoundAt=0;
async function startRecordedVoiceCommand(){
 voiceTargetLayoutMode=$("layoutMode").value;
 if(!window.isSecureContext){voiceStatus("Mikrofon hanya dapat digunakan melalui HTTPS atau localhost.");return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){voiceStatus("Perekam suara tidak didukung browser ini. Coba Chrome Android terbaru melalui HTTPS.");return;}
 if(!getAIAccessCode()){voiceStatus("Masukkan kode akses AI terlebih dahulu.");return;}
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
     method:"POST",headers:{"Content-Type":"application/json","x-ai-access-code":getAIAccessCode(),...await getDocumentAuthHeaders()},
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
 if(!getAIAccessCode()){voiceStatus("Masukkan kode akses AI terlebih dahulu.");return;}
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


/* AZX Inventory → Surat Jalan: impor batch secara otomatis ke arsip dan pratinjau. */
(function(){
 const OUTBOX_KEY="azx_inventory_surat_jalan_outbox",IMPORTED_KEY="azx_inventory_surat_jalan_imported";
 function syncOutbox(){
  try{
   const batches=JSON.parse(localStorage.getItem(OUTBOX_KEY)||"[]");
   const imported=JSON.parse(localStorage.getItem(IMPORTED_KEY)||"[]");
   const docs=readDocumentHistory();
   const profile={...readCompanyProfile(),...([...docs].reverse().find(d=>d&&d.perusahaan&&d.perusahaan!=="NAMA PERUSAHAAN")||{})};
   // Nilai profil aktif yang tersimpan memiliki prioritas atas salinan profil pada dokumen lama.
   Object.assign(profile,readCompanyProfile());
   const created=[];
   batches.forEach(batch=>{
    if(!batch?.id||!Array.isArray(batch.items)||!batch.items.length||imported.includes(batch.id)||docs.some(d=>d.sourceInventoryBatchId===batch.id))return;
    const date=batch.date||today();
    const number=batch.number||("SJ-"+date.replace(/-/g,"")+"-"+String(batch.id).slice(-8));
    const d={
     jenis:"suratjalan",template:profile.template||"standar",templateFormat2:profile.templateFormat2||"f2-polos",
     perusahaan:profile.perusahaan||"NAMA PERUSAHAAN",alamatPerusahaan:profile.alamatPerusahaan||"",
     teleponPerusahaan:profile.teleponPerusahaan||"",emailPerusahaan:profile.emailPerusahaan||"",
     penanggungJawab:profile.penanggungJawab||"",jabatan:profile.jabatan||"Direktur",
     pihak:batch.person||"",alamatPihak:"",nomorDokumen:number,tanggalDokumen:date,jatuhTempo:"",
     keterangan:"Dibuat otomatis dari transaksi Inventory "+batch.id,pajak:"0",diskon:"0",
     catatan:batch.notes||"",kolomNamaLabel:"Kode / Nama Barang",kolomJumlahLabel:"Jumlah",
     kolomHargaLabel:"Harga",layoutMode:"table",rincianBebas:"",
     teksPenutupKiri:"Hormat kami,",teksPenutupKanan:"Penerima,",
     items:batch.items.map(x=>({nama:[x.sku,x.name].filter(Boolean).join(" — "),qty:[x.qty,x.unit,x.variant].filter(Boolean).join(" "),harga:0})),
     sourceInventoryBatchId:batch.id,inventoryCreatedAt:batch.createdAt||new Date().toISOString()
    };
    docs.push(d);created.push(d);imported.push(batch.id);
   });
   if(created.length){
    localStorage.setItem("dokumenBisnis",JSON.stringify(docs));
    localStorage.setItem(IMPORTED_KEY,JSON.stringify(imported));
    history();
    const latest=created[created.length-1];
    setData(latest);
    const notice=document.createElement("div");
    notice.className="inventory-sync-notice";
    notice.textContent=created.length+" Surat Jalan dari Inventory berhasil masuk ke Arsip dan ditampilkan pada pratinjau.";
    document.querySelector(".panel")?.prepend(notice);
    if(new URLSearchParams(location.search).has("fromInventory")){
     setTimeout(()=>document.querySelector(".preview-wrap")?.scrollIntoView({behavior:"smooth",block:"start"}),150);
    }
   }
  }catch(error){
   console.error("Sinkronisasi Surat Jalan Inventory gagal:",error);
   const notice=document.createElement("div");notice.className="inventory-sync-notice";
   notice.textContent="Surat Jalan belum berhasil disinkronkan: "+(error.message||"Periksa ruang penyimpanan browser.");
   document.querySelector(".panel")?.prepend(notice);
  }
 }
 window.addEventListener("storage",e=>{if(e.key===OUTBOX_KEY)syncOutbox();});
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",syncOutbox);else syncOutbox();
})();

// Pulihkan posisi halaman AZX Office setelah refresh (hanya pada tab/perangkat yang sama).
(()=>{
 const KEY="azxOfficePagePositionV1";
 const panel=document.querySelector(".panel");
 const read=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||"{}")}catch(e){return {}}};
 const saved=read();
 const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify({x:window.scrollX||0,y:window.scrollY||0,panel:panel?.scrollTop||0}))}catch(e){}};
 window.addEventListener("scroll",save,{passive:true});
 panel?.addEventListener("scroll",save,{passive:true});
 window.addEventListener("pagehide",save);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(Number.isFinite(saved.y))window.scrollTo(saved.x||0,saved.y);
  if(panel&&Number.isFinite(saved.panel))panel.scrollTop=saved.panel;
 }));
})();
