(function(){
"use strict";
const $=id=>document.getElementById(id);
const DRAFT_KEY="azxOfficeAutoDraftV1";
const HISTORY_KEY="dokumenBisnis";
const safeRead=()=>{try{return typeof window.readData==="function"?window.readData():null}catch(e){return null}};
const safeWrite=(key,value)=>{try{localStorage.setItem(key,value);return true}catch(e){return false}};
function updateStats(){
 let docs=[];try{docs=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");if(!Array.isArray(docs))docs=[]}catch(e){}
 const now=new Date(),month=now.getMonth(),year=now.getFullYear();
 const count=docs.filter(d=>{const raw=d.tanggalDokumen||d.savedAt||"";const dt=new Date(raw);return !isNaN(dt)&&dt.getMonth()===month&&dt.getFullYear()===year}).length;
 const cats=new Set(docs.map(d=>d.jenis).filter(Boolean));
 $("azxStatTotal").textContent=docs.length;
 $("azxStatMonth").textContent=count;
 $("azxStatCategories").textContent=cats.size;
}
let saveTimer=null;
function saveDraft(){
 const data=safeRead();if(!data)return;
 const payload={version:1,savedAt:new Date().toISOString(),data};
 const ok=safeWrite(DRAFT_KEY,JSON.stringify(payload));
 $("azxAutosaveStatus").textContent=ok?"Draf otomatis tersimpan di perangkat · "+new Date().toLocaleTimeString("id-ID"):"Penyimpanan perangkat penuh. Cadangkan atau hapus data lama.";
}
function scheduleDraft(){clearTimeout(saveTimer);saveTimer=setTimeout(saveDraft,650)}
document.addEventListener("input",e=>{if(e.target.closest(".azx-extra-tools"))return;scheduleDraft()},true);
document.addEventListener("change",e=>{if(e.target.closest(".azx-extra-tools"))return;scheduleDraft()},true);
$("azxRestoreDraft").addEventListener("click",()=>{
 let saved;try{saved=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null")}catch(e){}
 if(!saved||!saved.data){alert("Belum ada draf otomatis yang dapat dipulihkan.");return}
 if(!confirm("Pulihkan draf terakhir yang tersimpan pada "+new Date(saved.savedAt).toLocaleString("id-ID")+"? Isi formulir saat ini akan diganti."))return;
 if(typeof window.setData==="function"){window.setData(saved.data);if(typeof window.syncFormatMode==="function")window.syncFormatMode();$("azxAutosaveStatus").textContent="Draf berhasil dipulihkan.";}
});
$("azxDuplicate").addEventListener("click",()=>{
 const data=safeRead();if(!data)return;
 if(!confirm("Buat salinan dokumen saat ini? Dokumen asli tidak akan diubah."))return;
 data.nomorDokumen=typeof window.makeNumber==="function"?window.makeNumber():"";
 data.tanggalDokumen=data.tanggalDokumen||new Date().toISOString().slice(0,10);
 if(typeof window.setData==="function"){window.setData(data);if(typeof window.syncFormatMode==="function")window.syncFormatMode();$("azxAutosaveStatus").textContent="Salinan dibuat. Periksa nomor dokumen sebelum menyimpan.";}
});
$("azxHistorySearch").addEventListener("input",()=>{
 const q=$("azxHistorySearch").value.toLocaleLowerCase("id");
 document.querySelectorAll("#riwayat .history-row").forEach(row=>{row.hidden=!row.textContent.toLocaleLowerCase("id").includes(q)});
});
$("azxBackupExport").addEventListener("click",()=>{
 const keys=[HISTORY_KEY,"logoPerusahaanBisnis","templateCanvaBisnis","azxOfficeFormat2Alignment",DRAFT_KEY];
 const backup={app:"AZX Office",formatVersion:1,createdAt:new Date().toISOString(),data:{}};
 keys.forEach(k=>{const v=localStorage.getItem(k);if(v!==null)backup.data[k]=v});
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="AZX-Office-backup-"+new Date().toISOString().slice(0,10)+".json";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
});
$("azxBackupImport").addEventListener("change",async e=>{
 const file=e.target.files&&e.target.files[0];if(!file)return;
 try{
  if(file.size>15*1024*1024)throw new Error("Ukuran cadangan maksimal 15 MB.");
  const backup=JSON.parse(await file.text());
  if(backup.app!=="AZX Office"||!backup.data||typeof backup.data!=="object")throw new Error("File bukan cadangan AZX Office yang valid.");
  if(!confirm("Pulihkan cadangan AZX Office? Data arsip, logo, template, dan draf pada perangkat ini dapat diganti."))return;
  for(const [key,value] of Object.entries(backup.data)){
   if([HISTORY_KEY,"logoPerusahaanBisnis","templateCanvaBisnis","azxOfficeFormat2Alignment",DRAFT_KEY].includes(key)&&typeof value==="string")localStorage.setItem(key,value);
  }
  alert("Cadangan berhasil dipulihkan. Halaman akan dimuat ulang.");
  location.reload();
 }catch(err){alert("Gagal memulihkan cadangan: "+err.message)}
 finally{e.target.value=""}
});
function updateMark(){
 const watermark=$("azxWatermarkText").value.trim(),stamp=$("azxStampText").value.trim();
 ["lembar","lembarFormat2"].forEach(id=>{
  const paper=$(id);if(!paper)return;
  let w=paper.querySelector(":scope > .azx-watermark-layer"),s=paper.querySelector(":scope > .azx-stamp-layer");
  if(watermark){if(!w){w=document.createElement("div");w.className="azx-watermark-layer";w.setAttribute("aria-hidden","true");paper.append(w)}w.innerHTML="";const span=document.createElement("span");span.textContent=watermark;w.append(span)}else w&&w.remove();
  if(stamp){if(!s){s=document.createElement("div");s.className="azx-stamp-layer";s.setAttribute("aria-hidden","true");paper.append(s)}s.textContent=stamp}else s&&s.remove();
 });
 try{localStorage.setItem("azxOfficeMarks",JSON.stringify({watermark,stamp}))}catch(e){}
}
["azxWatermarkText","azxStampText"].forEach(id=>$(id).addEventListener("input",updateMark));
try{const marks=JSON.parse(localStorage.getItem("azxOfficeMarks")||"{}");$("azxWatermarkText").value=marks.watermark||"";$("azxStampText").value=marks.stamp||""}catch(e){}
updateMark();
const historyNode=$("riwayat");if(historyNode){new MutationObserver(()=>{updateStats();const q=$("azxHistorySearch").value.toLocaleLowerCase("id");if(q)historyNode.querySelectorAll(".history-row").forEach(row=>row.hidden=!row.textContent.toLocaleLowerCase("id").includes(q))}).observe(historyNode,{childList:true,subtree:true});}
updateStats();
window.addEventListener("beforeunload",()=>{if(saveTimer){clearTimeout(saveTimer);saveDraft()}});
})();