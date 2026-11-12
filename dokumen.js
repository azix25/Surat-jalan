const $=id=>document.getElementById(id);
let customTemplate=localStorage.getItem("templateCanvaBisnis")||"";
let companyLogo=localStorage.getItem("logoPerusahaanBisnis")||"";
if(window.pdfjsLib){pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";}
const fieldIds=["perusahaan","alamatPerusahaan","teleponPerusahaan","emailPerusahaan","penanggungJawab","jabatan","pihak","alamatPihak","nomorDokumen","tanggalDokumen","jatuhTempo","keterangan","pajak","diskon","catatan"];
const labels={invoice:{title:"INVOICE",party:"DITAGIHKAN KEPADA",right:"JATUH TEMPO",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Catatan / Ketentuan"},suratjalan:{title:"SURAT JALAN",party:"DIKIRIM KEPADA",right:"TANGGAL PENGIRIMAN",leftSign:"Pengirim,",rightSign:"Penerima,",notes:"Catatan Pengiriman"},penawaran:{title:"SURAT PENAWARAN",party:"KEPADA YTH.",right:"TANGGAL PENAWARAN",leftSign:"Hormat kami,",rightSign:"Menyetujui,",notes:"Syarat dan Ketentuan"},penagihan:{title:"SURAT PENAGIHAN",party:"DITAGIHKAN KEPADA",right:"BATAS PEMBAYARAN",leftSign:"Hormat kami,",rightSign:"Penerima,",notes:"Informasi Pembayaran"}};
function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")}
function money(n){return (Number(n)||0).toLocaleString("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0})}
function addItem(item={}){const tr=document.createElement("tr");tr.innerHTML='<td><input class="item-name" placeholder="Nama barang / jasa"></td><td><input class="item-qty" type="number" min="0" step="any" value="1"></td><td><input class="item-price" type="number" min="0" value="0"></td><td><button type="button" aria-label="Hapus item">×</button></td>';tr.querySelector(".item-name").value=item.nama||"";tr.querySelector(".item-qty").value=item.qty??1;tr.querySelector(".item-price").value=item.harga??0;tr.querySelectorAll("input").forEach(el=>el.addEventListener("input",render));tr.querySelector("button").onclick=()=>{tr.remove();render()};$("barisItem").append(tr);render()}
function getItems(){return [...$("barisItem").rows].map(r=>({nama:r.querySelector(".item-name").value,qty:r.querySelector(".item-qty").value,harga:r.querySelector(".item-price").value}))}
function readData(){const d={jenis:$("jenis").value,template:$("template").value};fieldIds.forEach(id=>d[id]=$(id).value);d.items=getItems();return d}
function setData(d){$("jenis").value=d.jenis||"invoice";$("template").value=d.template||"standar";applyCustomTemplate();fieldIds.forEach(id=>$(id).value=d[id]??"");$("barisItem").innerHTML="";(d.items||[]).forEach(addItem);if(!d.items?.length)addItem();render()}
function fmtDate(v){if(!v)return "-";const d=new Date(v+"T00:00:00");return d.toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}
function render(){const d=readData(),type=d.jenis,L=labels[type],items=d.items;const total=items.reduce((s,x)=>s+(Number(x.qty)||0)*(Number(x.harga)||0),0);const tax=total*(Number(d.pajak)||0)/100,disc=Number(d.diskon)||0,grand=Math.max(0,total+tax-disc);
$("lembar").className="paper template-"+d.template+(customTemplate?" has-custom-template":"");
const logoBox=$("pLogo");logoBox.innerHTML="";if(companyLogo){logoBox.classList.add("has-image");const img=document.createElement("img");img.src=companyLogo;img.alt="Logo perusahaan";img.className="logo-img";logoBox.append(img);}else{logoBox.classList.remove("has-image");logoBox.textContent=(d.perusahaan||"NP").trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]||"").join("").toUpperCase()||"NP";}
$("pPerusahaan").textContent=d.perusahaan||"NAMA PERUSAHAAN";$("pAlamat").textContent=d.alamatPerusahaan||"";$("pKontak").textContent=[d.teleponPerusahaan,d.emailPerusahaan].filter(Boolean).join(" · ");$("pJudul").textContent=L.title;$("pNomor").textContent="No: "+(d.nomorDokumen||"-");$("pTanggal").textContent="Tanggal: "+fmtDate(d.tanggalDokumen);$("pLabelPihak").textContent=L.party;$("pPihak").textContent=d.pihak||"Nama pelanggan / penerima";$("pAlamatPihak").textContent=d.alamatPihak||"";$("pJatuhTempoBox").querySelector("small").textContent=L.right;$("pJatuhTempo").textContent=fmtDate(type==="invoice"||type==="penagihan"?d.jatuhTempo:d.tanggalDokumen);$("pJatuhTempoBox").style.display=type==="suratjalan"?"none":"flex";$("pKeterangan").textContent=d.keterangan||"";$("pCatatanLabel").textContent=L.notes;$("pCatatan").textContent=d.catatan||"-";$("pTtdKiri").textContent=L.leftSign;$("pTtdKanan").textContent=L.rightSign;$("pNamaTtd").textContent=d.penanggungJawab||"(................................)";$("pJabatanTtd").textContent=d.penanggungJawab?(d.jabatan||""):"";$("pFooter").textContent=[d.alamatPerusahaan,d.teleponPerusahaan,d.emailPerusahaan].filter(Boolean).join(" | ");
const head=$("pHeadTabel");head.innerHTML=type==="suratjalan"?"<tr><th>No.</th><th>Nama barang</th><th>Jumlah</th><th>Ukuran / Keterangan</th></tr>":"<tr><th>No.</th><th>Deskripsi barang / jasa</th><th>Qty</th><th>Harga satuan</th><th>Jumlah</th></tr>";
$("pItems").innerHTML="";items.forEach((x,i)=>{const tr=document.createElement("tr");if(type==="suratjalan"){tr.innerHTML="<td>"+(i+1)+"</td><td></td><td></td><td></td>";tr.cells[1].textContent=x.nama;tr.cells[2].textContent=x.qty;tr.cells[3].textContent=x.harga?x.harga:""}else{tr.innerHTML="<td>"+(i+1)+"</td><td></td><td></td><td></td><td></td>";tr.cells[1].textContent=x.nama;tr.cells[2].textContent=x.qty;tr.cells[3].textContent=money(x.harga);tr.cells[4].textContent=money((Number(x.qty)||0)*(Number(x.harga)||0))}$("pItems").append(tr)});
$("pTotals").style.display=type==="suratjalan"?"none":"block";$("pTotals").innerHTML='<div class="total-line"><span>Subtotal</span><b>'+money(total)+'</b></div><div class="total-line"><span>Pajak ('+(Number(d.pajak)||0)+'%)</span><b>'+money(tax)+'</b></div><div class="total-line"><span>Diskon</span><b>- '+money(disc)+'</b></div><div class="total-line grand"><span>Total</span><b>'+money(grand)+'</b></div>';
$("labelPihak").firstChild.textContent=type==="suratjalan"?"Nama penerima":type==="penawaran"?"Nama pelanggan": "Nama pelanggan / penerima";$("judulKolomHarga").textContent=type==="suratjalan"?"Ukuran / keterangan":"Harga satuan";$("labelJatuhTempo").style.display=(type==="invoice"||type==="penagihan")?"block":"none"}
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
function history(){const list=JSON.parse(localStorage.getItem("dokumenBisnis")||"[]");$("riwayat").innerHTML="";if(!list.length){$("riwayat").textContent="Belum ada dokumen tersimpan.";return}list.slice().reverse().forEach(d=>{const row=document.createElement("div");row.className="history-row";const info=document.createElement("span");info.textContent=(labels[d.jenis]?.title||d.jenis)+" · "+(d.nomorDokumen||"Tanpa nomor")+" · "+(d.pihak||"-");const btn=document.createElement("button");btn.textContent="Buka";btn.onclick=()=>setData(d);row.append(info,btn);$("riwayat").append(row)})}
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
function newDoc(){if(!confirm("Buat dokumen baru? Perubahan yang belum disimpan akan hilang."))return;fieldIds.forEach(id=>$(id).value="");$("perusahaan").value="NAMA PERUSAHAAN";$("jabatan").value="Direktur";$("tanggalDokumen").value=today();$("nomorDokumen").value=makeNumber();$("barisItem").innerHTML="";addItem();render()}
$("fileTemplateCanva").addEventListener("change",e=>importCanvaTemplate(e.target.files[0]));$("fileLogoPerusahaan").addEventListener("change",e=>importCompanyLogo(e.target.files[0]));$("hapusLogoPerusahaan").onclick=()=>{companyLogo="";localStorage.removeItem("logoPerusahaanBisnis");$("statusLogoPerusahaan").textContent="Belum ada logo diunggah";render();};$("hapusTemplateCanva").onclick=()=>{customTemplate="";localStorage.removeItem("templateCanvaBisnis");applyCustomTemplate();render()};$("tambahItem").onclick=()=>addItem();$("simpan").onclick=save;$("cetak").onclick=()=>{const p=numberParts(),n=(Number(localStorage.getItem(p.key))||0)+1;$("nomorDokumen").value=nextDocumentNumber(n);render();localStorage.setItem(p.key,String(n));window.print();$("nomorDokumen").value=nextDocumentNumber(n+1);render();};$("baru").onclick=newDoc;$("jenis").onchange=()=>{if(!$("nomorDokumen").value||$("nomorDokumen").value.includes("/"))$("nomorDokumen").value=makeNumber();render()};$("template").onchange=render;fieldIds.forEach(id=>$(id).addEventListener("input",render));$("tanggalDokumen").value=today();$("nomorDokumen").value=makeNumber();$("perusahaan").addEventListener("input",()=>{$("nomorDokumen").value=makeNumber();render();});$("tanggalDokumen").addEventListener("change",()=>{$("nomorDokumen").value=makeNumber();render();});addItem();history();
async function generateWithAI(){
 const prompt=$("aiPrompt").value.trim(),accessCode=$("aiAccessCode").value.trim(),btn=$("aiGenerate"),status=$("aiStatus");
 if(!prompt){alert("Tulis perintah untuk AI terlebih dahulu.");$("aiPrompt").focus();return}
 if(!accessCode){alert("Masukkan kode akses AI.");$("aiAccessCode").focus();return}
 btn.disabled=true;status.textContent="AI sedang menyusun dokumen...";
 try{
  const response=await fetch("https://nqwqlhcwiwprsbcdadhy.supabase.co/functions/v1/dokumen-ai",{
   method:"POST",headers:{"Content-Type":"application/json","x-ai-access-code":accessCode},
   body:JSON.stringify({instruction:prompt,currentDocument:{...readData(),templateSource:customTemplate?"Canva (desain latar dipertahankan; isi dokumen dapat diedit)":"Template bawaan"}})
  });
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||"Permintaan AI gagal.");
  const d=result.document||{};
  const merged={...readData(),...d,items:Array.isArray(d.items)?d.items:readData().items};
  setData(merged);
  status.textContent=result.message||"Draf AI sudah dimasukkan. Periksa kembali data dan nominal sebelum digunakan.";
 }catch(error){status.textContent="Belum berhasil: "+error.message}
 finally{btn.disabled=false}
}
$("aiGenerate").onclick=generateWithAI;
applyCustomTemplate();
if(companyLogo)$("statusLogoPerusahaan").textContent="Logo tersimpan di perangkat";
