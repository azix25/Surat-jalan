(() => {
"use strict";
const SUPABASE_URL = "https://nqwqlhcwiwprsbcdadhy.supabase.co";
const SUPABASE_KEY = "sb_publishable_HSLy26SUHWwpow0smZrB2Q_sNchYRDx";
const AI_FUNCTION_URL = SUPABASE_URL + "/functions/v1/inventory-ai";
const $ = id => document.getElementById(id);
const AI_CODE_STORAGE_KEY="azx_ai_access_code";
function getAIAccessCode(){
 const input=$("aiAccessCode");
 const code=(localStorage.getItem(AI_CODE_STORAGE_KEY)||input?.value||"").trim();
 if(!code){toast("Masukkan kode akses AI AZX Office satu kali.",true);input?.focus();return "";}
 localStorage.setItem(AI_CODE_STORAGE_KEY,code);
 if(input){input.value=code;const row=input.closest(".ai-search");if(row)row.hidden=true;}
 return code;
}
function clearSavedAIAccessCode(){
 localStorage.removeItem(AI_CODE_STORAGE_KEY);
 const input=$("aiAccessCode");
 if(input){input.value="";const row=input.closest(".ai-search");if(row)row.hidden=false;}
}
(()=>{
 const saved=localStorage.getItem(AI_CODE_STORAGE_KEY),input=$("aiAccessCode");
 if(saved&&input){input.value=saved;const row=input.closest(".ai-search");if(row)row.hidden=true;}
})();

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = n => new Intl.NumberFormat("id-ID",{maximumFractionDigits:3}).format(Number(n)||0);
const today = () => new Date().toLocaleDateString("en-CA");
const typeNames = {masuk:"Barang masuk",keluar:"Barang keluar",diambil:"Barang keluar",rusak:"Barang keluar",koreksi_tambah:"Barang masuk",koreksi_kurang:"Barang keluar"};
function movementType(type){return type==="masuk"||type==="koreksi_tambah"?"masuk":"keluar"}
function movementTime(t){const d=t.created_at?new Date(t.created_at):new Date((t.transaction_date||today())+"T00:00:00");return d.toLocaleString("id-ID",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}
const supabase = window.supabase?.createClient(SUPABASE_URL,SUPABASE_KEY);
let authMode = "login", session = null, items = [], transactions = [], reportReady = false, toastTimer;
function toast(message,error=false){const el=$("toast");el.textContent=message;el.className="toast show"+(error?" error":"");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className="toast",3500)}
let stockCache = new Map();
function rebuildStockCache(){const totals=new Map();for(const t of transactions){const delta=((t.transaction_type==="masuk"||t.transaction_type==="koreksi_tambah")?1:-1)*Number(t.quantity||0);totals.set(t.item_id,(totals.get(t.item_id)||0)+delta)}stockCache=new Map(items.map(item=>[item.id,Number(item.opening_stock||0)+(totals.get(item.id)||0)]))}
function stockOf(item){return stockCache.has(item.id)?stockCache.get(item.id):Number(item.opening_stock||0)}
function movementSum(type,from){return transactions.filter(t=>(!type||movementType(t.transaction_type)===type)&&(!from||t.transaction_date>=from)).reduce((sum,t)=>{const item=items.find(i=>i.id===t.item_id);const packSize=Math.max(1,Number(item?.pack_size)||1);return sum+Number(t.quantity||0)/packSize},0)}
function monthStart(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),"01"].join("-")}
function showAuth(){ $("appPanel").hidden=true;$("accountArea").hidden=true;location.replace("index.html?next=inventory.html")}
function showApp(){ $("appPanel").hidden=false;$("accountArea").hidden=false;$("userEmail").textContent=session?.user?.email||"";restoreInventoryPosition();loadAll().finally(restoreInventoryScroll)}
async function fetchAllRows(table,orderColumn,ascending){const all=[];const pageSize=1000;for(let offset=0;;offset+=pageSize){const {data,error}=await supabase.from(table).select("*").order(orderColumn,{ascending}).order("id",{ascending:true}).range(offset,offset+pageSize-1);if(error)throw error;const page=data||[];all.push(...page);if(page.length<pageSize)break}return all}
async function loadAll(){try{const [i,t]=await Promise.all([fetchAllRows("inventory_items","name",true),fetchAllRows("inventory_transactions","created_at",false)]);items=i;transactions=t;rebuildStockCache();syncSuratJalanDocsFromTransactions();renderAll();renderSuratJalanArchive()}catch(e){toast("Gagal memuat data: "+(e.message||"Periksa koneksi."),true)}}
function renderAll(){const inMonth=movementSum("masuk",monthStart()),outMonth=movementSum("keluar",monthStart());$("statKinds").textContent=fmt(items.length);$("statStock").textContent=fmt(items.reduce((sum,i)=>sum+stockOf(i)/Math.max(1,Number(i.pack_size)||1),0));$("statIn").textContent=fmt(inMonth);$("statOut").textContent=fmt(outMonth);renderStock();renderItemList();renderSelects();renderHistory();if(reportReady)buildReport()}
function statusOf(item){const s=stockOf(item),min=Number(item.minimum_stock||0);return s<=0?["Kosong","zero"]:min>0&&s<=min?["Menipis","low"]:["Tersedia","ok"]}
function renderStock(){const q=$("stockSearch").value.toLowerCase().trim(),filter=$("stockFilter").value;const rows=items.filter(i=>{const s=stockOf(i),status=statusOf(i)[1];return(!q||[i.sku,i.parent_sku,i.name,i.variant_name,i.category].join(" ").toLowerCase().includes(q))&&(filter==="all"||(filter==="low"&&status==="low")||(filter==="zero"&&status==="zero"))});$("stockRows").innerHTML=rows.length?rows.map(i=>{const st=statusOf(i);return `<tr><td><b>${esc(i.parent_sku||i.sku)}</b>${i.parent_sku?`<br><small>SKU: ${esc(i.sku)}</small>`:""}</td><td><b>${esc(i.name)}</b>${i.variant_name?`<br><small>Varian: ${esc(i.variant_name)}</small>`:""}</td><td>${esc(i.category||"—")}</td><td><b>${fmt(stockOf(i)/Math.max(1,Number(i.pack_size)||1))} ${esc(i.unit)}</b><small> (${fmt(stockOf(i))} pcs)</small></td><td>${fmt(Number(i.minimum_stock||0)/Math.max(1,Number(i.pack_size)||1))} ${esc(i.unit)}</td><td><span class="status ${st[1]}">${st[0]}</span></td></tr>`}).join(""):'<tr><td colspan="6" class="empty">Tidak ada barang yang cocok.</td></tr>'}
function renderItemList(){$("itemRows").innerHTML=items.length?items.map(i=>{const size=Math.max(1,Number(i.pack_size)||1);return `<tr><td><b>${esc(i.parent_sku||i.sku)}</b>${i.parent_sku?`<br><small>${esc(i.sku)}</small>`:""}</td><td><b>${esc(i.name)}</b><br><small>${esc(i.variant_name||"")}</small></td><td>${esc(i.unit)}</td><td>${fmt(size)} pcs</td><td><b>${fmt(stockOf(i)/size)} ${esc(i.unit)}</b></td><td class="item-actions"><button class="btn btn-add" data-add-item="${i.id}">＋ Tambah</button><button class="btn btn-reduce" data-reduce-item="${i.id}">− Kurangi</button><button class="btn btn-light" data-edit-item="${i.id}">Edit</button></td></tr>`}).join(""):'<tr><td colspan="6" class="empty">Belum ada barang.</td></tr>'}
let reduceItem=null, addItem=null;
function openAddModal(item){addItem=item;$("addItemInfo").textContent=item.name+(item.variant_name?" · "+item.variant_name:"")+" | Kode: "+item.sku+" | Stok saat ini: "+fmt(stockOf(item)/Math.max(1,Number(item.pack_size)||1))+" "+item.unit+" (1 "+item.unit+" = "+fmt(item.pack_size||1)+" pcs)";$("addQuantity").value="";$("addPerson").value="";$("addNotes").value="";$("addModal").hidden=false;setTimeout(()=>$("addQuantity").focus(),30)}
function closeAddModal(){$("addModal").hidden=true;addItem=null}
$("itemRows").addEventListener("click",e=>{const add=e.target.closest("[data-add-item]");if(add){const item=items.find(i=>i.id===add.dataset.addItem);if(item)openAddModal(item);return;}});
$("closeAddModal").addEventListener("click",closeAddModal);$("cancelAdd").addEventListener("click",closeAddModal);
$("addModal").addEventListener("click",e=>{if(e.target===$("addModal"))closeAddModal()});
$("addForm").addEventListener("submit",async e=>{e.preventDefault();if(!addItem)return;const packages=Number($("addQuantity").value),qty=packages*Math.max(1,Number(addItem.pack_size)||1);if(!Number.isFinite(packages)||packages<=0)return toast("Masukkan jumlah yang benar.",true);const unit=addItem.unit;const button=$("saveAdd");button.disabled=true;button.textContent="Menyimpan…";try{const {error}=await supabase.from("inventory_transactions").insert({user_id:session.user.id,item_id:addItem.id,transaction_type:"masuk",quantity:qty,transaction_date:today(),person_or_destination:$("addPerson").value.trim(),notes:$("addNotes").value.trim()});if(error)throw error;closeAddModal();await loadAll();toast("Stok berhasil ditambahkan "+fmt(packages)+" "+unit+" ("+fmt(qty)+" pcs).")}catch(err){toast("Gagal menambahkan stok: "+err.message,true)}finally{button.disabled=false;button.textContent="Simpan barang masuk"}});
function openReduceModal(item){reduceItem=item;const size=Math.max(1,Number(item.pack_size)||1);$("reduceItemInfo").textContent=item.name+(item.variant_name?" · "+item.variant_name:"")+" | Kode: "+item.sku+" | Stok tersedia: "+fmt(stockOf(item)/size)+" "+item.unit+" ("+fmt(stockOf(item))+" pcs)";$("reduceQuantity").value="";$("reduceQuantity").max=String(Math.max(0,stockOf(item)/size));$("reducePerson").value="";$("reduceNotes").value="";$("reduceModal").hidden=false;setTimeout(()=>$("reduceQuantity").focus(),30)}
function closeReduceModal(){$("reduceModal").hidden=true;reduceItem=null}
$("itemRows").addEventListener("click",e=>{const reduce=e.target.closest("[data-reduce-item]");if(reduce){const item=items.find(i=>i.id===reduce.dataset.reduceItem);if(item)openReduceModal(item);return;}});
$("closeReduceModal").addEventListener("click",closeReduceModal);$("cancelReduce").addEventListener("click",closeReduceModal);
$("reduceModal").addEventListener("click",e=>{if(e.target===$("reduceModal"))closeReduceModal()});
$("reduceForm").addEventListener("submit",async e=>{e.preventDefault();if(!reduceItem)return;const packages=Number($("reduceQuantity").value),qty=packages*Math.max(1,Number(reduceItem.pack_size)||1),before=stockOf(reduceItem),type="keluar";if(!Number.isFinite(packages)||packages<=0)return toast("Masukkan jumlah yang benar.",true);if(qty>before)return toast("Stok tidak cukup. Tersedia "+fmt(before/Math.max(1,Number(reduceItem.pack_size)||1))+" "+reduceItem.unit+".",true);const button=$("saveReduce");button.disabled=true;button.textContent="Menyimpan…";try{const {error}=await supabase.from("inventory_transactions").insert({user_id:session.user.id,item_id:reduceItem.id,transaction_type:type,quantity:qty,transaction_date:today(),person_or_destination:$("reducePerson").value.trim(),notes:$("reduceNotes").value.trim()});if(error)throw error;closeReduceModal();await loadAll();toast("Stok berhasil dikurangi "+fmt(packages)+" "+reduceItem.unit+" ("+fmt(qty)+" pcs).")}catch(err){toast("Gagal mengurangi stok: "+err.message,true)}finally{button.disabled=false;button.textContent="Simpan pengurangan"}});

function renderSelects(){const opts=items.map(i=>`<option value="${i.id}">${esc(i.sku)} — ${esc(i.name)}${i.variant_name?" · "+esc(i.variant_name):""} (${fmt(stockOf(i)/Math.max(1,Number(i.pack_size)||1))} ${esc(i.unit)})</option>`).join("");$("txItem").innerHTML='<option value="">Pilih barang</option>'+opts;$("reportItem").innerHTML='<option value="all">Semua barang</option>'+opts;document.querySelectorAll(".out-item").forEach(select=>{const current=select.value;select.innerHTML='<option value="">Pilih kode / warna</option>'+items.map(i=>`<option value="${esc(i.id)}">${esc(i.sku)} — ${esc(i.name)}${i.variant_name?" · "+esc(i.variant_name):""}</option>`).join("");select.value=current;const row=select.closest("tr"),item=items.find(i=>i.id===select.value),stock=row?.querySelector(".out-stock"),qty=Number(row?.querySelector(".out-qty")?.value)||0,pcs=row?.querySelector(".out-pcs");if(stock)stock.textContent=item?fmt(stockOf(item)/Math.max(1,Number(item.pack_size)||1))+" "+item.unit:"Pilih barang";if(pcs)pcs.textContent=fmt(qty*Math.max(1,Number(item?.pack_size)||1))+" pcs";});if(typeof updateMultiOutTotal==="function"&&$("multiOutRows"))updateMultiOutTotal();}
function renderHistory(){const q=$("historySearch").value.toLowerCase().trim(),type=$("historyType").value,from=$("historyFrom").value,to=$("historyTo").value;const rows=transactions.filter(t=>{const i=items.find(x=>x.id===t.item_id)||{};const hay=[i.sku,i.parent_sku,i.name,i.variant_name,t.person_or_destination,t.reference_no,t.notes].join(" ").toLowerCase();return(!q||hay.includes(q))&&(type==="all"||movementType(t.transaction_type)===type)&&(!from||t.transaction_date>=from)&&(!to||t.transaction_date<=to)});$("historyRows").innerHTML=rows.length?rows.map(t=>{const i=items.find(x=>x.id===t.item_id)||{};return `<tr><td>${esc(movementTime(t))}</td><td><b>${esc(i.parent_sku||i.sku||"—")}</b>${i.parent_sku?`<br><small>${esc(i.sku)}</small>`:""}<br>${esc(i.name||"Barang")}${i.variant_name?" · "+esc(i.variant_name):""}</td><td>${esc(typeNames[t.transaction_type]||"Barang keluar")}</td><td>${fmt(Number(t.quantity||0)/Math.max(1,Number(i.pack_size)||1))} ${esc(i.unit||"")} <small>(${fmt(t.quantity)} pcs)</small></td><td>${esc(t.person_or_destination||"—")}</td><td>${esc([t.reference_no,t.notes].filter(Boolean).join(" · ")||"—")}</td></tr>`}).join(""):'<tr><td colspan="6" class="empty">Belum ada transaksi yang cocok.</td></tr>'}
const SURAT_JALAN_KEY="azx_inventory_surat_jalan_docs";
let suratJalanMemory=[];
function getSuratJalanDocs(){
 try{const stored=JSON.parse(localStorage.getItem(SURAT_JALAN_KEY)||"[]");return Array.isArray(stored)?stored:suratJalanMemory.slice()}
 catch(e){return suratJalanMemory.slice()}
}
function publishSuratJalanOutbox(doc){
 const key="azx_inventory_surat_jalan_outbox";
 let batches=[];
 try{const saved=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(saved))batches=saved;}catch(error){console.warn("Outbox Surat Jalan tidak valid; membuat arsip baru.",error);}
 batches=batches.filter(item=>item&&item.id!==doc.id);
 batches.push(doc);
 if(batches.length>200)batches=batches.slice(-200);
 localStorage.setItem(key,JSON.stringify(batches));
}
function saveSuratJalanDoc(doc){
 const current=getSuratJalanDocs().filter(x=>x.id!==doc.id);
 suratJalanMemory=[doc,...current];
 try{localStorage.setItem(SURAT_JALAN_KEY,JSON.stringify(suratJalanMemory));return true}
 catch(e){toast("Surat Jalan dibuat, tetapi arsip browser tidak dapat disimpan. Periksa ruang penyimpanan browser.",true);return false}
}
function syncSuratJalanDocsFromTransactions(){
 const groups=new Map();
 transactions.filter(t=>t.transaction_type==="keluar"&&String(t.reference_no||"").startsWith("AZX-SJ-")).forEach(t=>{
  const id=t.reference_no;if(!groups.has(id))groups.set(id,[]);
  const item=items.find(x=>x.id===t.item_id)||{};
  const size=Math.max(1,Number(item.pack_size)||1);
  const note=String(t.notes||"");
  const packMatch=note.match(/Kemasan:\\s*([0-9.]+(?:,[0-9]+)?)\\s+(dus|ball)\\s*[×x]\\s*([0-9.]+)\\s*pcs/i);
  const parseLocal=value=>Number(String(value||"0").replace(/\\./g,"").replace(",","."));
  const packages=packMatch?parseLocal(packMatch[1]):Number(t.quantity||0)/size;
  const originalPackSize=packMatch?parseLocal(packMatch[3]):size;
  groups.get(id).push({itemId:t.item_id,sku:item.sku||"",name:item.name||"Barang",variant:item.variant_name||"",unit:item.unit||"",qty:packages,pcs:Number(t.quantity)||0,packSize:originalPackSize});
 });
 const existing=getSuratJalanDocs(),byId=new Map(existing.map(d=>[d.id,d]));
 for(const [id,lines] of groups){
  const tx=transactions.filter(t=>t.reference_no===id);
  const first=tx[0]||{};
  const doc={id,number:id,date:first.transaction_date||today(),person:first.person_or_destination||"",notes:first.notes||"",createdAt:first.created_at||"",items:lines};
  byId.set(id,doc);
 }
 suratJalanMemory=[...byId.values()].sort((a,b)=>String(b.createdAt||b.date).localeCompare(String(a.createdAt||a.date)));
 try{localStorage.setItem(SURAT_JALAN_KEY,JSON.stringify(suratJalanMemory));}catch(error){console.warn("Arsip lokal penuh; Surat Jalan tetap dapat dipulihkan dari database transaksi.",error);}
}
function renderSuratJalanArchive(){
 const rows=$("suratJalanRows"),docs=getSuratJalanDocs();
 if(!rows)return;
 rows.innerHTML=docs.length?docs.map(d=>`<tr><td><b>${esc(d.number||d.id)}</b></td><td>${esc(d.date||"—")}</td><td>${esc(d.person||"—")}</td><td>${(d.items||[]).length} jenis</td><td><button type="button" class="btn btn-light" data-open-sj="${esc(d.id)}">Lihat</button></td></tr>`).join(""):'<tr><td colspan="5" class="empty">Belum ada Surat Jalan.</td></tr>';
}
function showSuratJalan(id){
 const d=getSuratJalanDocs().find(x=>x.id===id);if(!d)return;
 const paper=$("suratJalanPaper");if(!paper)return;
 paper.innerHTML=`<div class="report-head"><h2>SURAT JALAN</h2><p>BUKTI PENGELUARAN BARANG · AZX INVENTORY</p></div>
 <div class="sj-meta"><div><b>Nomor:</b> ${esc(d.number||d.id)}</div><div><b>Tanggal:</b> ${esc(d.date||"—")}</div></div>
 <p><b>Kepada / Tujuan:</b> ${esc(d.person||"—")}</p>
 <div class="table-wrap"><table><thead><tr><th>No.</th><th>Kode Barang</th><th>Nama Barang / Varian</th><th>Jumlah</th><th>Satuan</th></tr></thead><tbody>${(d.items||[]).map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.sku)}</td><td>${esc(x.name)}${x.variant?`<br><small>${esc(x.variant)}</small>`:""}</td><td>${fmt(x.qty)}</td><td>${esc(x.unit||"—")}</td></tr>`).join("")}</tbody></table></div>
 ${d.notes?`<p><b>Keterangan:</b> ${esc(d.notes)}</p>`:""}
 <div class="sj-sign"><div>Petugas Gudang<br><br><br>(________________)</div><div>Penerima<br><br><br>(________________)</div></div>
 <p class="sj-foot">Dokumen dibuat otomatis oleh AZX Inventory.</p>`;
 $("printSuratJalan").disabled=false;$("downloadSuratJalan").disabled=false;
}
$("downloadSuratJalan")?.addEventListener("click",()=>{
 const paper=$("suratJalanPaper");
 if(!paper||!paper.querySelector(".sj-meta"))return toast("Pilih Surat Jalan terlebih dahulu sebelum mengunduh.",true);
 const title=paper.querySelector(".sj-meta")?.textContent?.replace(/\\s+/g," ").trim()||"Surat-Jalan";
 const standalone='<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><style>body{font:14px Arial,sans-serif;color:#182230;margin:24px}h2{text-align:center;margin:0}.report-head{text-align:center;border-bottom:2px solid #142b4a;padding-bottom:12px;margin-bottom:18px}.report-head p{font-size:11px}.sj-meta{display:flex;justify-content:space-between;margin:18px 0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #aab4c0;padding:9px;text-align:left;font-size:12px}th{background:#eef2f6}.sj-sign{display:flex;justify-content:space-between;text-align:center;margin:55px 5px 20px}.sj-foot{text-align:center;color:#687385;font-size:10px;margin-top:28px}@media print{body{margin:12mm}}</style></head><body>'+paper.innerHTML+'</body></html>';
 const blob=new Blob([standalone],{type:"text/html;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=(title.replace(/[^a-z0-9-]+/gi,"_")||"Surat-Jalan")+".html";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);toast("File Surat Jalan berhasil diunduh.");
});
$("printSuratJalan")?.addEventListener("click",()=>{
 const paper=$("suratJalanPaper");
 if(!paper||!paper.querySelector(".sj-meta"))return toast("Pilih Surat Jalan terlebih dahulu sebelum mencetak.",true);
 document.body.dataset.printTarget="delivery";
 const cleanup=()=>{delete document.body.dataset.printTarget;window.removeEventListener("afterprint",cleanup);};
 window.addEventListener("afterprint",cleanup);
 window.print();

});
$("suratJalanRows")?.addEventListener("click",e=>{const b=e.target.closest("[data-open-sj]");if(b)showSuratJalan(b.dataset.openSj)});
$("createSuratJalan")?.addEventListener("click",()=>{
 $("txType").value="keluar";
 $("txType").dispatchEvent(new Event("change"));
 switchView("transaction");
 $("txPerson").focus();
 toast("Isi penerima, pilih beberapa barang, lalu Simpan transaksi untuk membuat Surat Jalan.");
});
renderSuratJalanArchive();
function switchView(name){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));try{sessionStorage.setItem("azxInventoryLastViewV1",name)}catch(e){}if(name==="reports")buildReport()}

// Simpan dan pulihkan menu aktif serta posisi gulir setelah refresh.
function restoreInventoryPosition(){
 let name="overview";
 try{name=sessionStorage.getItem("azxInventoryLastViewV1")||"overview"}catch(e){}
 if(!document.getElementById("view-"+name))name="overview";
 switchView(name);
}
function restoreInventoryScroll(){
 let saved=0;
 try{saved=Number(sessionStorage.getItem("azxInventoryScrollYV1"))||0}catch(e){}
 requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,saved)));
}
(()=>{
 const save=()=>{try{sessionStorage.setItem("azxInventoryScrollYV1",String(window.scrollY||0))}catch(e){}};
 window.addEventListener("scroll",save,{passive:true});
 window.addEventListener("pagehide",save);
})();
$("logoutBtn").addEventListener("click",async()=>{await supabase.auth.signOut();session=null;location.replace("index.html")});
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.goto)));
$("refreshBtn").addEventListener("click",loadAll);
$("stockSearch").addEventListener("input",renderStock);$("stockFilter").addEventListener("change",renderStock);
$("historySearch").addEventListener("input",renderHistory);["historyType","historyFrom","historyTo"].forEach(id=>$(id).addEventListener("change",renderHistory));

$("itemForm").addEventListener("submit",async e=>{e.preventDefault();const baseSku=$("itemSku").value.trim().toUpperCase(),name=$("itemName").value.trim(),variantText=$("itemVariants").value.trim(),packSize=Number($("itemPackSize").value),unit=$("itemUnit").value,variants=variantText?variantText.split(/[\r\n,;]+/).map(part=>part.trim()).filter(Boolean).map(name=>({name})):[];if(!baseSku||!name)return toast("Kode dan nama barang wajib diisi.",true);if(!Number.isInteger(packSize)||packSize<1)return toast("Qty harus angka bulat minimal 1 pcs.",true);const base={user_id:session.user.id,name,category:"",unit,opening_stock:0,pack_size:packSize,max_stock:0,minimum_stock:0,notes:$("itemNotes").value.trim()};const slug=v=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"");const payloads=variants.length?variants.map(v=>({...base,sku:baseSku+"-"+slug(v.name),parent_sku:baseSku,variant_name:v.name})): [{...base,sku:baseSku,parent_sku:null,variant_name:null}];if(variants.some(v=>!v.name.trim()||!slug(v.name)))return toast("Periksa nama varian barang.",true);if(payloads.some(p=>!p.sku||p.sku.endsWith("-")))return toast("Periksa kode barang dan nama varian.",true);const existing=new Set(items.map(i=>i.sku.toUpperCase()));const newCodes=payloads.map(p=>p.sku.toUpperCase());if(existing.has(baseSku)||new Set(newCodes).size!==newCodes.length||newCodes.some(code=>existing.has(code)))return toast("Kode barang atau salah satu kode varian sudah digunakan.",true);try{const {error}=await supabase.from("inventory_items").insert(payloads);if(error)throw error;$("itemForm").reset();$("itemUnit").value="dus";$("itemPackSize").value=100;await loadAll();toast(variants.length?variants.length+" varian barang berhasil disimpan. Stok awal 0; catat stok melalui transaksi.":"Barang berhasil disimpan. Stok awal 0; catat stok melalui transaksi.")}catch(err){toast("Gagal menyimpan barang: "+err.message,true)}});
$("itemRows").addEventListener("click",async e=>{const b=e.target.closest("[data-edit-item]");if(!b)return;const i=items.find(x=>x.id===b.dataset.editItem);if(!i)return;const name=prompt("Nama barang:",i.name);if(name===null)return;const category=prompt("Kategori:",i.category||"");if(category===null)return;const unit=prompt("Satuan (dus/ball):",i.unit||"dus");if(unit===null)return;if(!["dus","ball"].includes(unit.trim().toLowerCase()))return toast("Satuan harus dus atau ball.",true);const packSize=prompt("Qty / isi per satuan (pcs):",i.pack_size||1);if(packSize===null)return;if(!Number.isInteger(Number(packSize))||Number(packSize)<1)return toast("Qty harus angka bulat minimal 1 pcs.",true);try{const {error}=await supabase.from("inventory_items").update({name:name.trim(),category:category.trim(),unit:unit.trim().toLowerCase(),pack_size:Number(packSize),updated_at:new Date().toISOString()}).eq("id",i.id);if(error)throw error;await loadAll();toast("Data barang diperbarui.")}catch(err){toast("Gagal mengubah barang: "+err.message,true)}});
function addMultiOutRow(selectedId=""){
 const row=document.createElement("tr");
 const options=items.map(i=>`<option value="${esc(i.id)}" ${i.id===selectedId?"selected":""}>${esc(i.sku)} — ${esc(i.name)}${i.variant_name?" · "+esc(i.variant_name):""}</option>`).join("");
 row.innerHTML=`<td><select class="out-item" required><option value="">Pilih kode / warna</option>${options}</select></td><td class="out-stock">Pilih barang</td><td><input class="out-qty" type="number" min="0.001" step="0.001" placeholder="Jumlah dus/ball" required></td><td class="out-pcs">0 pcs</td><td><button type="button" class="multi-out-remove" aria-label="Hapus baris">×</button></td>`;
 const select=row.querySelector(".out-item"),stock=row.querySelector(".out-stock"),qtyInput=row.querySelector(".out-qty"),pcs=row.querySelector(".out-pcs");
 const update=()=>{const item=items.find(i=>i.id===select.value),size=Math.max(1,Number(item?.pack_size)||1),packages=Number(qtyInput.value)||0;stock.textContent=item?fmt(stockOf(item)/size)+" "+item.unit:"Pilih barang";pcs.textContent=fmt(packages*size)+" pcs";};
 select.addEventListener("change",()=>{update();updateMultiOutTotal()});qtyInput.addEventListener("input",()=>{update();updateMultiOutTotal()});
 row.querySelector(".multi-out-remove").addEventListener("click",()=>{row.remove();updateMultiOutTotal()});
 update();$("multiOutRows").append(row);updateMultiOutTotal();
}
function updateMultiOutTotal(){const rows=[...$("multiOutRows").querySelectorAll("tr")],total=rows.reduce((sum,row)=>{const item=items.find(i=>i.id===row.querySelector(".out-item").value);return sum+(Number(row.querySelector(".out-qty").value)||0)*Math.max(1,Number(item?.pack_size)||1)},0);$("multiOutTotal").textContent=rows.length+" jenis barang · "+fmt(total)+" pcs total";}
function updateTransactionMode(){const multi=$("txType").value==="keluar";$("multiOutWrap").hidden=!multi;$("singleTxItemLabel").hidden=multi;$("singleTxQuantityLabel").hidden=multi;$("txPackPreview").hidden=multi;$("txItem").required=!multi;$("txQuantity").required=!multi;if(multi&&!$("multiOutRows").children.length)addMultiOutRow();}
$("addOutRow").addEventListener("click",()=>addMultiOutRow());
$("quickMultiOut").addEventListener("click",()=>{$("txType").value="keluar";$("txType").dispatchEvent(new Event("change"));$("multiOutWrap").scrollIntoView({behavior:"smooth",block:"center"});$("multiOutRows").querySelector(".out-item")?.focus();});
$("txType").addEventListener("change",updateTransactionMode);updateTransactionMode();
const updateSinglePack=()=>{const item=items.find(i=>i.id===$("txItem").value);$("txPackPreview").textContent=item?"1 "+item.unit+" = "+fmt(item.pack_size||1)+" pcs · Stok: "+fmt(stockOf(item)/Math.max(1,Number(item.pack_size)||1))+" "+item.unit:"Pilih barang untuk melihat satuan dan isi per satuan.";};$("txItem").addEventListener("change",updateSinglePack);
$("transactionForm").addEventListener("submit",async e=>{
 e.preventDefault();const type=$("txType").value;
 if(type==="keluar"){
  const rows=[...$("multiOutRows").querySelectorAll("tr")];if(!rows.length)return toast("Tambahkan minimal satu barang keluar.",true);
  const selected=rows.map(row=>{const item=items.find(i=>i.id===row.querySelector(".out-item").value),packages=Number(row.querySelector(".out-qty").value);return{item,packages,qty:packages*Math.max(1,Number(item?.pack_size)||1)}});
  if(selected.some(x=>!x.item||!Number.isFinite(x.qty)||x.qty<=0))return toast("Periksa kode barang dan jumlah setiap baris.",true);
  const totals=new Map();selected.forEach(x=>totals.set(x.item.id,(totals.get(x.item.id)||0)+x.qty));
  for(const [id,qty] of totals){const item=items.find(i=>i.id===id);if(qty>stockOf(item))return toast("Stok "+item.sku+" tidak cukup. Tersedia "+fmt(stockOf(item))+" "+item.unit+".",true);}
  const now=new Date(),batchId="AZX-SJ-"+now.getFullYear()+String(now.getMonth()+1).padStart(2,"0")+String(now.getDate()).padStart(2,"0")+"-"+now.getTime().toString(36).toUpperCase();
  const person=$("txPerson").value.trim(),notes=$("txNotes").value.trim(),date=$("txDate").value;
  const payload=selected.map(x=>({user_id:session.user.id,item_id:x.item.id,transaction_type:"keluar",quantity:x.qty,transaction_date:date,person_or_destination:person,reference_no:batchId,notes:["Kemasan: "+fmt(x.packages)+" "+x.item.unit+" × "+fmt(x.item.pack_size||1)+" pcs = "+fmt(x.qty)+" pcs",notes].filter(Boolean).join(" | ")}));
  const button=$("transactionForm").querySelector('button[type="submit"],button:not([type])');if(!button)return toast("Tombol Simpan transaksi tidak ditemukan. Muat ulang halaman Inventory.",true);button.disabled=true;button.textContent="Menyimpan semua barang…";
  const suratJalan={id:batchId,number:batchId,date,person,notes,createdAt:now.toISOString(),items:selected.map(x=>({itemId:x.item.id,sku:x.item.sku,name:x.item.name,variant:x.item.variant_name||"",unit:x.item.unit,qty:x.packages,pcs:x.qty,packSize:x.item.pack_size||1}))};
  try{
   if(!date||Number.isNaN(Date.parse(date+"T00:00:00")))throw new Error("Tanggal transaksi tidak valid.");
   const {error}=await supabase.from("inventory_transactions").insert(payload);
   if(error)throw error;
   const archiveSaved=saveSuratJalanDoc(suratJalan);
   let outboxSaved=true;
   try{publishSuratJalanOutbox(suratJalan);}catch(storageError){outboxSaved=false;console.error("Gagal mengirim Surat Jalan ke arsip Dokumen:",storageError);}
   $("transactionForm").reset();$("txDate").value=today();$("multiOutRows").innerHTML="";updateTransactionMode();
   await loadAll();
   renderSuratJalanArchive();showSuratJalan(suratJalan.id);switchView("delivery");
   if(archiveSaved&&outboxSaved)toast("Berhasil: barang keluar dicatat dan Surat Jalan dibuat.");
   else toast("Transaksi tersimpan di database, tetapi arsip lokal atau sinkronisasi Surat Jalan perlu diperiksa.",true);
  }catch(err){toast("Gagal membuat Surat Jalan / menyimpan barang keluar: "+(err.message||"Periksa koneksi."),true)}
  finally{button.disabled=false;button.textContent="Simpan transaksi"}
  return;
 }
 const item=items.find(i=>i.id===$("txItem").value);const packages=Number($("txQuantity").value),qty=packages*Math.max(1,Number(item?.pack_size)||1);
 if(!item)return toast("Pilih barang terlebih dahulu.",true);
 if(!Number.isFinite(packages)||packages<=0)return toast("Jumlah transaksi harus lebih besar dari nol.",true);
 if(!$("txDate").value||Number.isNaN(Date.parse($("txDate").value+"T00:00:00")))return toast("Tanggal transaksi tidak valid.",true);
 const before=stockOf(item),reduces=type!=="masuk";if(reduces&&qty>before)return toast("Stok tidak cukup. Stok tersedia "+fmt(before/Math.max(1,Number(item.pack_size)||1))+" "+item.unit+".",true);
 const packNote="Kemasan: "+fmt(packages)+" "+item.unit+" × "+fmt(item.pack_size||1)+" pcs = "+fmt(qty)+" pcs";const payload={user_id:session.user.id,item_id:item.id,transaction_type:type,quantity:qty,transaction_date:$("txDate").value,person_or_destination:$("txPerson").value.trim(),reference_no:$("txReference").value.trim(),notes:[packNote,$("txNotes").value.trim()].filter(Boolean).join(" | ")};
 try{const {error}=await supabase.from("inventory_transactions").insert(payload);if(error)throw error;$("transactionForm").reset();$("txDate").value=today();await loadAll();toast("Transaksi berhasil dicatat: "+fmt(packages)+" "+item.unit+" ("+fmt(qty)+" pcs). Stok diperbarui.")}catch(err){toast("Gagal menyimpan transaksi: "+err.message,true)}
});
$("txDate").value=today();
function buildReport(){const type=$("reportType").value,from=$("reportFrom").value,to=$("reportTo").value,itemId=$("reportItem").value;let rows;if(type==="stock"){rows=items.filter(i=>itemId==="all"||i.id===itemId).map(i=>({date:"—",sku:i.sku,name:i.name+(i.variant_name?" · "+i.variant_name:""),kind:"Posisi stok",qty:stockOf(i)/Math.max(1,Number(i.pack_size)||1),unit:i.unit,person:"—",note:"Setara "+fmt(stockOf(i))+" pcs · Batas minimum: "+fmt(Number(i.minimum_stock||0)/Math.max(1,Number(i.pack_size)||1))+" "+i.unit}))}else{rows=transactions.filter(t=>(type==="all"||movementType(t.transaction_type)===type)&&(!from||t.transaction_date>=from)&&(!to||t.transaction_date<=to)&&(itemId==="all"||t.item_id===itemId)).map(t=>{const i=items.find(x=>x.id===t.item_id)||{};return{date:movementTime(t),sku:i.sku||"",name:(i.name||"")+(i.variant_name?" · "+i.variant_name:""),kind:typeNames[t.transaction_type]||"Barang keluar",qty:Number(t.quantity||0)/Math.max(1,Number(i.pack_size)||1),unit:i.unit||"",person:t.person_or_destination||"—",note:[t.reference_no,t.notes].filter(Boolean).join(" · ")||"—"}})}const labels={stock:"LAPORAN POSISI STOK",all:"RIWAYAT BARANG MASUK & KELUAR",masuk:"LAPORAN BARANG MASUK",keluar:"LAPORAN BARANG KELUAR"};$("reportPaper").innerHTML=`<div class="report-head"><h2>AZX OFFICE · INVENTORY</h2><p>${labels[type]}</p></div><div class="report-meta"><span>Periode: ${esc(from||"Semua tanggal")} s.d. ${esc(to||"Sekarang")}</span><span>Dicetak: ${new Date().toLocaleString("id-ID")}</span></div><table><thead><tr><th>Tanggal</th><th>Kode</th><th>Nama barang</th><th>Jenis</th><th>Jumlah / Stok</th><th>Orang / Tujuan</th><th>Keterangan</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.sku)}</td><td>${esc(r.name)}</td><td>${esc(r.kind)}</td><td>${fmt(r.qty)} ${esc(r.unit)}</td><td>${esc(r.person)}</td><td>${esc(r.note)}</td></tr>`).join(""):'<tr><td colspan="7" class="empty">Tidak ada data pada filter ini.</td></tr>'}</tbody><tfoot><tr><td colspan="4">Jumlah baris</td><td colspan="3">${rows.length}</td></tr></tfoot></table><p style="margin-top:35px;text-align:right;font-size:10px">Mengetahui,<br><br><br>(........................................)</p>`;reportReady=true}
$("previewReport").addEventListener("click",buildReport);$("printReport").addEventListener("click",()=>{if(!reportReady)buildReport();window.print()});["reportType","reportFrom","reportTo","reportItem"].forEach(id=>$(id).addEventListener("change",()=>{if(reportReady)buildReport()}));
// Perintah suara AI Inventory memakai jalur transkripsi Whisper yang sama dengan AI Dokumen.
let inventoryVoiceRecorder=null,inventoryVoiceStream=null,inventoryVoiceChunks=[],inventoryVoiceAudioContext=null,inventoryVoiceSilenceTimer=null,inventoryVoiceSpeechDetected=false,inventoryVoiceLastSoundAt=0;
function inventoryVoiceStatus(message){const el=$("inventoryVoiceStatus");if(el)el.textContent=message;}
function inventoryAIState(message,state="idle"){const el=$("inventoryAIState");if(!el)return;const time=new Date().toLocaleTimeString("id-ID");const styles={idle:["#eef2f7","#526174"],running:["#fff4d6","#875600"],recording:["#e7f1ff","#1456a0"],success:["#e7f7ed","#17663a"],error:["#fdeaea","#a12626"]};const [background,color]=styles[state]||styles.idle;el.textContent="● "+message+" · "+time;el.style.background=background;el.style.color=color;}
async function startInventoryVoice(){
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
  inventoryVoiceStatus("Mikrofon memerlukan Chrome terbaru melalui HTTPS atau localhost.");return;
 }
 if(!session)return inventoryVoiceStatus("Silakan masuk terlebih dahulu.");
 if(!getAIAccessCode())return inventoryVoiceStatus("Masukkan kode akses AI terlebih dahulu.");
 try{
  inventoryVoiceStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  const types=["audio/webm;codecs=opus","audio/webm","audio/mp4"];
  const mime=types.find(type=>MediaRecorder.isTypeSupported(type))||"";
  inventoryVoiceRecorder=new MediaRecorder(inventoryVoiceStream,mime?{mimeType:mime}:undefined);
  inventoryVoiceChunks=[];
  // Otomatis berhenti dan memproses perintah setelah 3 detik hening sesudah ucapan terdeteksi.
  inventoryVoiceSpeechDetected=false;inventoryVoiceLastSoundAt=0;
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(AudioCtx){
   inventoryVoiceAudioContext=new AudioCtx();
   if(inventoryVoiceAudioContext.state==="suspended")await inventoryVoiceAudioContext.resume();
   const source=inventoryVoiceAudioContext.createMediaStreamSource(inventoryVoiceStream),analyser=inventoryVoiceAudioContext.createAnalyser();
   analyser.fftSize=1024;source.connect(analyser);
   const samples=new Uint8Array(analyser.fftSize);
   inventoryVoiceSilenceTimer=setInterval(()=>{
    if(!inventoryVoiceRecorder||inventoryVoiceRecorder.state!=="recording")return;
    analyser.getByteTimeDomainData(samples);
    let sum=0;for(let i=0;i<samples.length;i++){const v=(samples[i]-128)/128;sum+=v*v;}
    const level=Math.sqrt(sum/samples.length);
    if(level>0.025){inventoryVoiceSpeechDetected=true;inventoryVoiceLastSoundAt=Date.now();}
    if(inventoryVoiceSpeechDetected&&Date.now()-inventoryVoiceLastSoundAt>=3000){
     inventoryAIState("Ucapan selesai — otomatis memproses perintah","running");
     inventoryVoiceStatus("Tidak ada suara selama 3 detik. Menghentikan rekaman dan menjalankan AI...");
     inventoryVoiceRecorder.stop();
    }
   },120);
  }
  inventoryVoiceRecorder.ondataavailable=event=>{if(event.data?.size)inventoryVoiceChunks.push(event.data);};
  inventoryVoiceRecorder.onerror=()=>inventoryVoiceStatus("Perekaman gagal. Periksa izin mikrofon perangkat.");
  inventoryVoiceRecorder.onstart=()=>{
   $("inventoryVoiceStart").disabled=true;$("inventoryVoiceStop").disabled=false;
   inventoryAIState("Mikrofon aktif — menunggu ucapan","recording");
   inventoryVoiceStatus("Silakan bicara. Perintah otomatis diproses setelah 3 detik tanpa suara.");
  };
  inventoryVoiceRecorder.onstop=async()=>{
   $("inventoryVoiceStart").disabled=false;$("inventoryVoiceStop").disabled=true;
   if(inventoryVoiceSilenceTimer){clearInterval(inventoryVoiceSilenceTimer);inventoryVoiceSilenceTimer=null;}
   if(inventoryVoiceAudioContext){inventoryVoiceAudioContext.close().catch(()=>{});inventoryVoiceAudioContext=null;}
   inventoryVoiceStream?.getTracks().forEach(track=>track.stop());inventoryVoiceStream=null;
   const blob=new Blob(inventoryVoiceChunks,{type:inventoryVoiceRecorder?.mimeType||"audio/webm"});
   if(!blob.size){inventoryVoiceStatus("Suara tidak terekam. Silakan coba lagi.");return;}
   if(blob.size>4*1024*1024){inventoryVoiceStatus("Rekaman terlalu besar. Gunakan perintah yang lebih singkat.");return;}
   inventoryAIState("AI sedang mengubah suara menjadi teks","running");
    inventoryVoiceStatus("Mengubah suara menjadi teks...");
   try{
    const bytes=new Uint8Array(await blob.arrayBuffer());let binary="";
    for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));
    const {data:{session:current}}=await supabase.auth.getSession();
    if(!current?.access_token)throw new Error("Sesi login berakhir. Silakan masuk kembali.");
    const accessCode=getAIAccessCode();if(!accessCode)throw new Error("Kode akses AI belum tersedia.");
    const response=await fetch(SUPABASE_URL+"/functions/v1/dokumen-ai",{
     method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+current.access_token,"x-ai-access-code":accessCode},
     body:JSON.stringify({audioBase64:btoa(binary),mimeType:blob.type||"audio/webm"})
    });
    const result=await response.json();if(!response.ok)throw new Error(result.error||"Suara gagal ditranskripsikan.");
    const transcript=String(result.transcript||"").trim();
    if(!transcript)throw new Error("Tidak ada ucapan yang terdeteksi.");
    $("aiQuestion").value=transcript;
    inventoryVoiceStatus("Perintah tertangkap: "+transcript+" — AI Inventory sedang memproses...");
    await runAI(transcript);
    inventoryVoiceStatus("Perintah suara selesai diproses. Periksa jawaban AI Inventory.");
   }catch(error){inventoryAIState("Gagal memproses suara","error");inventoryVoiceStatus("Gagal memproses suara: "+error.message);toast(error.message,true);}
  };
  inventoryVoiceRecorder.start();
 }catch(error){
  if(inventoryVoiceSilenceTimer){clearInterval(inventoryVoiceSilenceTimer);inventoryVoiceSilenceTimer=null;}
  if(inventoryVoiceAudioContext){inventoryVoiceAudioContext.close().catch(()=>{});inventoryVoiceAudioContext=null;}
  inventoryVoiceStream?.getTracks().forEach(track=>track.stop());inventoryVoiceStream=null;
  const reason=error.name==="NotAllowedError"?"Izin mikrofon ditolak. Izinkan mikrofon pada pengaturan situs.":error.name==="NotFoundError"?"Mikrofon tidak ditemukan.":"Tidak bisa membuka mikrofon: "+error.message;
  inventoryVoiceStatus(reason);
 }
}
function stopInventoryVoice(){
 if(inventoryVoiceRecorder&&inventoryVoiceRecorder.state==="recording"){
  inventoryVoiceStatus("Mengirim rekaman untuk diproses...");
  inventoryVoiceRecorder.stop();
 }
}
$("inventoryVoiceStart")?.addEventListener("click",()=>{primeInventorySpeech();startInventoryVoice();});
$("inventoryVoiceStop")?.addEventListener("click",stopInventoryVoice);
window.addEventListener("pagehide",()=>{
 if(inventoryVoiceRecorder&&inventoryVoiceRecorder.state==="recording")inventoryVoiceRecorder.stop();
 if(inventoryVoiceSilenceTimer){clearInterval(inventoryVoiceSilenceTimer);inventoryVoiceSilenceTimer=null;}
 if(inventoryVoiceAudioContext){inventoryVoiceAudioContext.close().catch(()=>{});inventoryVoiceAudioContext=null;}
 inventoryVoiceStream?.getTracks().forEach(track=>track.stop());
});
// Pembaca jawaban AI Inventory: otomatis setelah jawaban diterima.
let inventoryAnswerUtterance=null,inventorySpeechPrimed=false,inventorySpeechRunId=0;
function inventoryAnswerAudioStatus(message){const el=$("inventoryAnswerAudioStatus");if(el)el.textContent=message;}
function primeInventorySpeech(){
 if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window))return;
 try{const engine=window.speechSynthesis;engine.resume();if(inventorySpeechPrimed)return;
  const primer=new SpeechSynthesisUtterance(" ");primer.lang="id-ID";primer.volume=0;
  primer.onstart=()=>{inventorySpeechPrimed=true;engine.cancel();engine.resume();};
  primer.onerror=()=>{inventorySpeechPrimed=true;};engine.speak(primer);
  setTimeout(()=>{if(!inventorySpeechPrimed){inventorySpeechPrimed=true;engine.cancel();engine.resume();}},700);
 }catch(error){console.warn("Inisialisasi TTS Inventory gagal:",error);}
}
function stopInventoryAnswerSpeech(){
 inventorySpeechRunId++;if("speechSynthesis" in window)window.speechSynthesis.cancel();inventoryAnswerUtterance=null;
 const speak=$("inventorySpeakAnswer"),stop=$("inventoryStopAnswer");
 if(speak)speak.disabled=!($("aiAnswer")?.textContent||"").trim();if(stop)stop.disabled=true;
}
function waitInventoryVoices(){return new Promise(resolve=>{
 if(!("speechSynthesis" in window)){resolve([]);return;}
 const engine=window.speechSynthesis,existing=engine.getVoices();if(existing.length){resolve(existing);return;}
 let finished=false;const done=()=>{if(finished)return;finished=true;clearTimeout(timer);engine.removeEventListener?.("voiceschanged",check);resolve(engine.getVoices());};
 const check=()=>{if(engine.getVoices().length)done();};const timer=setTimeout(done,1200);engine.addEventListener?.("voiceschanged",check);
});}
async function speakInventoryAIAnswer(){
 const text=String($("aiAnswer")?.textContent||"").trim();if(!text)return inventoryAnswerAudioStatus("Belum ada jawaban untuk dibacakan.");
 if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){inventoryAnswerAudioStatus("Perangkat ini tidak menyediakan TTS browser. Diperlukan dukungan TTS Android/WebView.");return;}
 stopInventoryAnswerSpeech();const runId=inventorySpeechRunId;inventoryAnswerAudioStatus("Menyiapkan suara Bahasa Indonesia…");
 const voices=await waitInventoryVoices();if(runId!==inventorySpeechRunId)return;
 const voice=voices.find(v=>/^id([-_]|$)/i.test(v.lang))||voices.find(v=>/indonesia/i.test(v.name));
 const utterance=new SpeechSynthesisUtterance(text);inventoryAnswerUtterance=utterance;
 utterance.lang="id-ID";utterance.rate=0.96;utterance.pitch=1;utterance.volume=1;if(voice)utterance.voice=voice;
 utterance.onstart=()=>{if(runId!==inventorySpeechRunId)return;inventoryAnswerAudioStatus("🔊 AI Inventory sedang membacakan jawaban…");const stop=$("inventoryStopAnswer");if(stop)stop.disabled=false;};
 utterance.onend=()=>{if(runId!==inventorySpeechRunId)return;inventoryAnswerUtterance=null;const stop=$("inventoryStopAnswer");if(stop)stop.disabled=true;inventoryAnswerAudioStatus("Pembacaan jawaban selesai.");};
 utterance.onerror=event=>{if(runId!==inventorySpeechRunId)return;inventoryAnswerUtterance=null;const stop=$("inventoryStopAnswer");if(stop)stop.disabled=true;inventoryAnswerAudioStatus("Suara gagal diputar ("+(event.error||"TTS")+"). Periksa mesin Text-to-Speech Android.");};
 try{window.speechSynthesis.resume();window.speechSynthesis.speak(utterance);}catch(error){inventoryAnswerAudioStatus("Gagal menjalankan suara: "+error.message);}
}
$("inventorySpeakAnswer")?.addEventListener("click",()=>{primeInventorySpeech();speakInventoryAIAnswer();});
$("inventoryStopAnswer")?.addEventListener("click",()=>{stopInventoryAnswerSpeech();inventoryAnswerAudioStatus("Pembacaan dihentikan.");});
window.addEventListener("pagehide",stopInventoryAnswerSpeech);
window.speechSynthesis?.addEventListener?.("voiceschanged",()=>{if(window.speechSynthesis.getVoices().length)inventoryAnswerAudioStatus("Suara perangkat siap.");});
async function runAI(question){if(!session){inventoryAIState("Menunggu login","error");return;}const accessCode=getAIAccessCode();if(!accessCode){inventoryAIState("Kode akses AI belum diisi","error");return;}const btn=$("aiSearchBtn"),answer=$("aiAnswer");if(!question.trim())return toast("Tulis pertanyaan pencarian terlebih dahulu.",true);btn.disabled=true;btn.textContent="Mencari…";inventoryAIState("AI Inventory sedang berjalan","running");answer.hidden=false;answer.textContent="AZX AI sedang membaca data inventaris…";try{const {data:{session:current}}=await supabase.auth.getSession();const response=await fetch(AI_FUNCTION_URL,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+current.access_token,"x-ai-access-code":accessCode},body:JSON.stringify({question})});const data=await response.json();if(!response.ok){if(response.status===401)clearSavedAIAccessCode();throw new Error(data.error||"Pencarian AI gagal.");}answer.textContent=data.answer+(data.suggestion?"\n\nSaran: "+data.suggestion:"");const ids=new Set(data.matched_item_ids||[]);if(ids.size){const found=items.filter(i=>ids.has(i.id));answer.textContent+="\n\nBarang terkait:\n"+found.map(i=>"• "+i.name+(i.variant_name?" · "+i.variant_name:"")+" ("+i.sku+") — "+fmt(stockOf(i)/Math.max(1,Number(i.pack_size)||1))+" "+i.unit+" ("+fmt(stockOf(i))+" pcs)").join("\n");}const audioControls=$("inventoryAnswerAudioControls");if(audioControls)audioControls.hidden=false;const speakButton=$("inventorySpeakAnswer");if(speakButton)speakButton.disabled=false;inventoryAIState("AI Inventory selesai — jawaban tersedia","success");speakInventoryAIAnswer();}catch(err){answer.textContent=err.message;inventoryAIState("AI Inventory gagal: "+err.message,"error");toast(err.message,true)}finally{btn.disabled=false;btn.textContent="Cari dengan AI"}}
$("aiSearchBtn").addEventListener("click",()=>{primeInventorySpeech();runAI($("aiQuestion").value)});$("aiQuestion").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();primeInventorySpeech();runAI(e.target.value)}});document.querySelectorAll("[data-ask]").forEach(b=>b.addEventListener("click",()=>{$("aiQuestion").value=b.dataset.ask;primeInventorySpeech();runAI(b.dataset.ask)}));
if(supabase){supabase.auth.getSession().then(({data})=>{session=data.session;if(session)showApp();else showAuth()});supabase.auth.onAuthStateChange((_event,newSession)=>{session=newSession;if(session)showApp();else showAuth()})}else showAuth();
})();