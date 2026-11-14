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
function movementSum(type,from){return transactions.filter(t=>(!type||movementType(t.transaction_type)===type)&&(!from||t.transaction_date>=from)).reduce((s,t)=>s+Number(t.quantity||0),0)}
function monthStart(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),"01"].join("-")}
function showAuth(){ $("appPanel").hidden=true;$("accountArea").hidden=true;location.replace("index.html?next=inventory.html")}
function showApp(){ $("appPanel").hidden=false;$("accountArea").hidden=false;$("userEmail").textContent=session?.user?.email||"";loadAll()}
async function fetchAllRows(table,orderColumn,ascending){const all=[];const pageSize=1000;for(let offset=0;;offset+=pageSize){const {data,error}=await supabase.from(table).select("*").order(orderColumn,{ascending}).order("id",{ascending:true}).range(offset,offset+pageSize-1);if(error)throw error;const page=data||[];all.push(...page);if(page.length<pageSize)break}return all}
async function loadAll(){try{const [i,t]=await Promise.all([fetchAllRows("inventory_items","name",true),fetchAllRows("inventory_transactions","created_at",false)]);items=i;transactions=t;rebuildStockCache();syncSuratJalanDocsFromTransactions();renderAll();renderSuratJalanArchive()}catch(e){toast("Gagal memuat data: "+(e.message||"Periksa koneksi."),true)}}
function renderAll(){const inMonth=movementSum("masuk",monthStart()),outMonth=movementSum("keluar",monthStart());$("statKinds").textContent=fmt(items.length);$("statStock").textContent=fmt(items.reduce((sum,i)=>sum+stockOf(i),0));$("statIn").textContent=fmt(inMonth);$("statOut").textContent=fmt(outMonth);renderStock();renderItemList();renderSelects();renderHistory();if(reportReady)buildReport()}
function statusOf(item){const s=stockOf(item),min=Number(item.minimum_stock||0);return s<=0?["Kosong","zero"]:min>0&&s<=min?["Menipis","low"]:["Tersedia","ok"]}
function renderStock(){const q=$("stockSearch").value.toLowerCase().trim(),filter=$("stockFilter").value;const rows=items.filter(i=>{const s=stockOf(i),status=statusOf(i)[1];return(!q||[i.sku,i.parent_sku,i.name,i.variant_name,i.category].join(" ").toLowerCase().includes(q))&&(filter==="all"||(filter==="low"&&status==="low")||(filter==="zero"&&status==="zero"))});$("stockRows").innerHTML=rows.length?rows.map(i=>{const st=statusOf(i);return `<tr><td><b>${esc(i.parent_sku||i.sku)}</b>${i.parent_sku?`<br><small>SKU: ${esc(i.sku)}</small>`:""}</td><td><b>${esc(i.name)}</b>${i.variant_name?`<br><small>Varian: ${esc(i.variant_name)}</small>`:""}</td><td>${esc(i.category||"—")}</td><td><b>${fmt(stockOf(i))} ${esc(i.unit)}</b></td><td>${fmt(i.minimum_stock)} ${esc(i.unit)}</td><td><span class="status ${st[1]}">${st[0]}</span></td></tr>`}).join(""):'<tr><td colspan="6" class="empty">Tidak ada barang yang cocok.</td></tr>'}
function renderItemList(){$("itemRows").innerHTML=items.length?items.map(i=>`<tr><td><b>${esc(i.parent_sku||i.sku)}</b>${i.parent_sku?`<br><small>${esc(i.sku)}</small>`:""}</td><td><b>${esc(i.name)}</b><br><small>${esc(i.variant_name||i.category||"")}</small></td><td>${esc(i.unit)}</td><td><b>${fmt(stockOf(i))}</b></td><td class="item-actions"><button class="btn btn-add" data-add-item="${i.id}">＋ Tambah</button><button class="btn btn-reduce" data-reduce-item="${i.id}">− Kurangi</button><button class="btn btn-light" data-edit-item="${i.id}">Edit</button></td></tr>`).join(""):'<tr><td colspan="5" class="empty">Belum ada barang.</td></tr>'}
let reduceItem=null, addItem=null;
function openAddModal(item){addItem=item;$("addItemInfo").textContent=item.name+(item.variant_name?" · "+item.variant_name:"")+" | Kode: "+item.sku+" | Stok saat ini: "+fmt(stockOf(item))+" "+item.unit;$("addQuantity").value="";$("addPerson").value="";$("addNotes").value="";$("addModal").hidden=false;setTimeout(()=>$("addQuantity").focus(),30)}
function closeAddModal(){$("addModal").hidden=true;addItem=null}
$("itemRows").addEventListener("click",e=>{const add=e.target.closest("[data-add-item]");if(add){const item=items.find(i=>i.id===add.dataset.addItem);if(item)openAddModal(item);return;}});
$("closeAddModal").addEventListener("click",closeAddModal);$("cancelAdd").addEventListener("click",closeAddModal);
$("addModal").addEventListener("click",e=>{if(e.target===$("addModal"))closeAddModal()});
$("addForm").addEventListener("submit",async e=>{e.preventDefault();if(!addItem)return;const qty=Number($("addQuantity").value);if(!Number.isFinite(qty)||qty<=0)return toast("Masukkan jumlah yang benar.",true);const unit=addItem.unit;const button=$("saveAdd");button.disabled=true;button.textContent="Menyimpan…";try{const {error}=await supabase.from("inventory_transactions").insert({user_id:session.user.id,item_id:addItem.id,transaction_type:"masuk",quantity:qty,transaction_date:today(),person_or_destination:$("addPerson").value.trim(),notes:$("addNotes").value.trim()});if(error)throw error;closeAddModal();await loadAll();toast("Stok berhasil ditambahkan "+fmt(qty)+" "+unit+".")}catch(err){toast("Gagal menambahkan stok: "+err.message,true)}finally{button.disabled=false;button.textContent="Simpan barang masuk"}});
function openReduceModal(item){reduceItem=item;$("reduceItemInfo").textContent=item.name+(item.variant_name?" · "+item.variant_name:"")+" | Kode: "+item.sku+" | Stok tersedia: "+fmt(stockOf(item))+" "+item.unit;$("reduceQuantity").value="";$("reduceQuantity").max=String(Math.max(0,stockOf(item)));$("reducePerson").value="";$("reduceNotes").value="";$("reduceModal").hidden=false;setTimeout(()=>$("reduceQuantity").focus(),30)}
function closeReduceModal(){$("reduceModal").hidden=true;reduceItem=null}
$("itemRows").addEventListener("click",e=>{const reduce=e.target.closest("[data-reduce-item]");if(reduce){const item=items.find(i=>i.id===reduce.dataset.reduceItem);if(item)openReduceModal(item);return;}});
$("closeReduceModal").addEventListener("click",closeReduceModal);$("cancelReduce").addEventListener("click",closeReduceModal);
$("reduceModal").addEventListener("click",e=>{if(e.target===$("reduceModal"))closeReduceModal()});
$("reduceForm").addEventListener("submit",async e=>{e.preventDefault();if(!reduceItem)return;const qty=Number($("reduceQuantity").value),before=stockOf(reduceItem),type="keluar";if(!Number.isFinite(qty)||qty<=0)return toast("Masukkan jumlah yang benar.",true);if(qty>before)return toast("Stok tidak cukup. Tersedia "+fmt(before)+" "+reduceItem.unit+".",true);const button=$("saveReduce");button.disabled=true;button.textContent="Menyimpan…";try{const {error}=await supabase.from("inventory_transactions").insert({user_id:session.user.id,item_id:reduceItem.id,transaction_type:type,quantity:qty,transaction_date:today(),person_or_destination:$("reducePerson").value.trim(),notes:$("reduceNotes").value.trim()});if(error)throw error;closeReduceModal();await loadAll();toast("Stok berhasil dikurangi "+fmt(qty)+" "+reduceItem.unit+".")}catch(err){toast("Gagal mengurangi stok: "+err.message,true)}finally{button.disabled=false;button.textContent="Simpan pengurangan"}});

function renderSelects(){const opts=items.map(i=>`<option value="${i.id}">${esc(i.sku)} — ${esc(i.name)}${i.variant_name?" · "+esc(i.variant_name):""} (${fmt(stockOf(i))} ${esc(i.unit)})</option>`).join("");$("txItem").innerHTML='<option value="">Pilih barang</option>'+opts;$("reportItem").innerHTML='<option value="all">Semua barang</option>'+opts;document.querySelectorAll(".out-item").forEach(select=>{const current=select.value;select.innerHTML='<option value="">Pilih kode / warna</option>'+items.map(i=>`<option value="${esc(i.id)}">${esc(i.sku)} — ${esc(i.name)}${i.variant_name?" · "+esc(i.variant_name):""}</option>`).join("");select.value=current;const row=select.closest("tr"),item=items.find(i=>i.id===select.value),stock=row?.querySelector(".out-stock");if(stock)stock.textContent=item?fmt(stockOf(item))+" "+item.unit:"Pilih barang";});}
function renderHistory(){const q=$("historySearch").value.toLowerCase().trim(),type=$("historyType").value,from=$("historyFrom").value,to=$("historyTo").value;const rows=transactions.filter(t=>{const i=items.find(x=>x.id===t.item_id)||{};const hay=[i.sku,i.parent_sku,i.name,i.variant_name,t.person_or_destination,t.reference_no,t.notes].join(" ").toLowerCase();return(!q||hay.includes(q))&&(type==="all"||movementType(t.transaction_type)===type)&&(!from||t.transaction_date>=from)&&(!to||t.transaction_date<=to)});$("historyRows").innerHTML=rows.length?rows.map(t=>{const i=items.find(x=>x.id===t.item_id)||{};return `<tr><td>${esc(movementTime(t))}</td><td><b>${esc(i.parent_sku||i.sku||"—")}</b>${i.parent_sku?`<br><small>${esc(i.sku)}</small>`:""}<br>${esc(i.name||"Barang")}${i.variant_name?" · "+esc(i.variant_name):""}</td><td>${esc(typeNames[t.transaction_type]||"Barang keluar")}</td><td>${fmt(t.quantity)} ${esc(i.unit||"")}</td><td>${esc(t.person_or_destination||"—")}</td><td>${esc([t.reference_no,t.notes].filter(Boolean).join(" · ")||"—")}</td></tr>`}).join(""):'<tr><td colspan="6" class="empty">Belum ada transaksi yang cocok.</td></tr>'}
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
  groups.get(id).push({itemId:t.item_id,sku:item.sku||"",name:item.name||"Barang",variant:item.variant_name||"",unit:item.unit||"",qty:Number(t.quantity)||0});
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
function switchView(name){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));if(name==="reports")buildReport()}
$("logoutBtn").addEventListener("click",async()=>{await supabase.auth.signOut();session=null;location.replace("index.html")});
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.goto)));
$("refreshBtn").addEventListener("click",loadAll);
$("stockSearch").addEventListener("input",renderStock);$("stockFilter").addEventListener("change",renderStock);
$("historySearch").addEventListener("input",renderHistory);["historyType","historyFrom","historyTo"].forEach(id=>$(id).addEventListener("change",renderHistory));
$("itemForm").addEventListener("submit",async e=>{e.preventDefault();const baseSku=$("itemSku").value.trim().toUpperCase(),name=$("itemName").value.trim(),variantText=$("itemVariants").value.trim(),variants=variantText?variantText.split(/[\r\n,;]+/).map(part=>part.trim()).filter(Boolean).map(part=>{const match=part.match(/^(.+?)(?:\s*[=|:]\s*(.*))?$/),variantName=(match?.[1]||"").trim(),rawStock=match?.[2];return{name:variantName,opening:rawStock===undefined||rawStock.trim()===""?0:Number(rawStock.trim())}}):[];const base={user_id:session.user.id,name,category:$("itemCategory").value.trim(),unit:$("itemUnit").value.trim(),opening_stock:Number($("itemOpening").value),minimum_stock:Number($("itemMinimum").value||0),notes:$("itemNotes").value.trim()};const slug=v=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"");const payloads=variants.length?variants.map(v=>({...base,sku:baseSku+"-"+slug(v.name),parent_sku:baseSku,variant_name:v.name,opening_stock:v.opening})): [{...base,sku:baseSku,parent_sku:null,variant_name:null}];if(variants.some(v=>!v.name||!Number.isFinite(v.opening)||v.opening<0)||payloads.some(p=>!p.sku||p.sku.endsWith("-")) )return toast("Periksa varian: gunakan Nama=Stok, stok harus angka 0 atau lebih.",true);const existing=new Set(items.map(i=>i.sku.toUpperCase()));const newCodes=payloads.map(p=>p.sku.toUpperCase());if(existing.has(baseSku)||new Set(newCodes).size!==newCodes.length||newCodes.some(code=>existing.has(code)))return toast("Kode barang atau salah satu kode varian sudah digunakan.",true);try{const {error}=await supabase.from("inventory_items").insert(payloads);if(error)throw error;$("itemForm").reset();$("itemUnit").value="pcs";$("itemOpening").value=0;$("itemMinimum").value=0;await loadAll();toast(variants.length?variants.length+" varian barang berhasil disimpan.":"Barang berhasil disimpan.")}catch(err){toast("Gagal menyimpan barang: "+err.message,true)}});
$("itemRows").addEventListener("click",async e=>{const b=e.target.closest("[data-edit-item]");if(!b)return;const i=items.find(x=>x.id===b.dataset.editItem);if(!i)return;const name=prompt("Nama barang:",i.name);if(name===null)return;const category=prompt("Kategori:",i.category||"");if(category===null)return;const minimum=prompt("Batas minimum stok:",i.minimum_stock);if(minimum===null)return;try{const {error}=await supabase.from("inventory_items").update({name:name.trim(),category:category.trim(),minimum_stock:Number(minimum),updated_at:new Date().toISOString()}).eq("id",i.id);if(error)throw error;await loadAll();toast("Data barang diperbarui.")}catch(err){toast("Gagal mengubah barang: "+err.message,true)}});
function addMultiOutRow(selectedId=""){
 const row=document.createElement("tr");
 const options=items.map(i=>`<option value="${esc(i.id)}" ${i.id===selectedId?"selected":""}>${esc(i.sku)} — ${esc(i.name)}${i.variant_name?" · "+esc(i.variant_name):""}</option>`).join("");
 row.innerHTML=`<td><select class="out-item" required><option value="">Pilih kode / warna</option>${options}</select></td><td class="out-stock">Pilih barang</td><td><input class="out-qty" type="number" min="0.001" step="0.001" placeholder="Jumlah" required></td><td><button type="button" class="multi-out-remove" aria-label="Hapus baris">×</button></td>`;
 const select=row.querySelector(".out-item"),stock=row.querySelector(".out-stock");
 const updateStock=()=>{const item=items.find(i=>i.id===select.value);stock.textContent=item?fmt(stockOf(item))+" "+item.unit:"Pilih barang";};
 select.addEventListener("change",()=>{updateStock();updateMultiOutTotal()});
 row.querySelector(".out-qty").addEventListener("input",updateMultiOutTotal);
 row.querySelector(".multi-out-remove").addEventListener("click",()=>{row.remove();updateMultiOutTotal()});
 updateStock();$("multiOutRows").append(row);updateMultiOutTotal();
}
function updateMultiOutTotal(){const rows=[...$("multiOutRows").querySelectorAll("tr")],total=rows.reduce((sum,row)=>sum+(Number(row.querySelector(".out-qty").value)||0),0);$("multiOutTotal").textContent=rows.length+" jenis barang · "+fmt(total)+" total satuan";}
function updateTransactionMode(){const multi=$("txType").value==="keluar";$("multiOutWrap").hidden=!multi;$("singleTxItemLabel").hidden=multi;$("singleTxQuantityLabel").hidden=multi;$("txItem").required=!multi;$("txQuantity").required=!multi;if(multi&&!$("multiOutRows").children.length)addMultiOutRow();}
$("addOutRow").addEventListener("click",()=>addMultiOutRow());
$("quickMultiOut").addEventListener("click",()=>{$("txType").value="keluar";$("txType").dispatchEvent(new Event("change"));$("multiOutWrap").scrollIntoView({behavior:"smooth",block:"center"});$("multiOutRows").querySelector(".out-item")?.focus();});
$("txType").addEventListener("change",updateTransactionMode);updateTransactionMode();
$("transactionForm").addEventListener("submit",async e=>{
 e.preventDefault();const type=$("txType").value;
 if(type==="keluar"){
  const rows=[...$("multiOutRows").querySelectorAll("tr")];if(!rows.length)return toast("Tambahkan minimal satu barang keluar.",true);
  const selected=rows.map(row=>({item:items.find(i=>i.id===row.querySelector(".out-item").value),qty:Number(row.querySelector(".out-qty").value)}));
  if(selected.some(x=>!x.item||!Number.isFinite(x.qty)||x.qty<=0))return toast("Periksa kode barang dan jumlah setiap baris.",true);
  const totals=new Map();selected.forEach(x=>totals.set(x.item.id,(totals.get(x.item.id)||0)+x.qty));
  for(const [id,qty] of totals){const item=items.find(i=>i.id===id);if(qty>stockOf(item))return toast("Stok "+item.sku+" tidak cukup. Tersedia "+fmt(stockOf(item))+" "+item.unit+".",true);}
  const now=new Date(),batchId="AZX-SJ-"+now.getFullYear()+String(now.getMonth()+1).padStart(2,"0")+String(now.getDate()).padStart(2,"0")+"-"+now.getTime().toString(36).toUpperCase();
  const person=$("txPerson").value.trim(),notes=$("txNotes").value.trim(),date=$("txDate").value;
  const payload=selected.map(x=>({user_id:session.user.id,item_id:x.item.id,transaction_type:"keluar",quantity:x.qty,transaction_date:date,person_or_destination:person,reference_no:batchId,notes}));
  const button=$("transactionForm").querySelector('button[type="submit"]');button.disabled=true;button.textContent="Menyimpan semua barang…";
  const suratJalan={id:batchId,number:batchId,date,person,notes,createdAt:now.toISOString(),items:selected.map(x=>({itemId:x.item.id,sku:x.item.sku,name:x.item.name,variant:x.item.variant_name||"",unit:x.item.unit,qty:x.qty}))};
  try{
   if(!date||Number.isNaN(Date.parse(date+"T00:00:00")))throw new Error("Tanggal transaksi tidak valid.");
   const {error}=await supabase.from("inventory_transactions").insert(payload);
   if(error)throw error;
   const archiveSaved=saveSuratJalanDoc(suratJalan);
   let outboxSaved=true;
   try{publishSuratJalanOutbox(suratJalan);}catch(storageError){outboxSaved=false;console.error("Gagal mengirim Surat Jalan ke arsip Dokumen:",storageError);}
   $("transactionForm").reset();$("txDate").value=today();$("multiOutRows").innerHTML="";updateTransactionMode();
   renderSuratJalanArchive();showSuratJalan(suratJalan.id);switchView("delivery");
   await loadAll();
   if(archiveSaved&&outboxSaved)toast("Berhasil: barang keluar dicatat dan Surat Jalan dibuat.");
   else toast("Transaksi tersimpan di database, tetapi arsip lokal atau sinkronisasi Surat Jalan perlu diperiksa.",true);
  }catch(err){toast("Gagal membuat Surat Jalan / menyimpan barang keluar: "+(err.message||"Periksa koneksi."),true)}
  finally{button.disabled=false;button.textContent="Simpan transaksi"}
  return;
 }
 const item=items.find(i=>i.id===$("txItem").value),qty=Number($("txQuantity").value);
 if(!item)return toast("Pilih barang terlebih dahulu.",true);
 if(!Number.isFinite(qty)||qty<=0)return toast("Jumlah transaksi harus lebih besar dari nol.",true);
 if(!$("txDate").value||Number.isNaN(Date.parse($("txDate").value+"T00:00:00")))return toast("Tanggal transaksi tidak valid.",true);
 const before=stockOf(item),reduces=type!=="masuk";if(reduces&&qty>before)return toast("Stok tidak cukup. Stok tersedia "+fmt(before)+" "+item.unit+".",true);
 const payload={user_id:session.user.id,item_id:item.id,transaction_type:type,quantity:qty,transaction_date:$("txDate").value,person_or_destination:$("txPerson").value.trim(),reference_no:$("txReference").value.trim(),notes:$("txNotes").value.trim()};
 try{const {error}=await supabase.from("inventory_transactions").insert(payload);if(error)throw error;$("transactionForm").reset();$("txDate").value=today();await loadAll();toast("Transaksi berhasil dicatat. Stok diperbarui.")}catch(err){toast("Gagal menyimpan transaksi: "+err.message,true)}
});
$("txDate").value=today();
function buildReport(){const type=$("reportType").value,from=$("reportFrom").value,to=$("reportTo").value,itemId=$("reportItem").value;let rows;if(type==="stock"){rows=items.filter(i=>itemId==="all"||i.id===itemId).map(i=>({date:"—",sku:i.sku,name:i.name+(i.variant_name?" · "+i.variant_name:""),kind:"Posisi stok",qty:stockOf(i),unit:i.unit,person:"—",note:"Batas minimum: "+fmt(i.minimum_stock)}))}else{rows=transactions.filter(t=>(type==="all"||movementType(t.transaction_type)===type)&&(!from||t.transaction_date>=from)&&(!to||t.transaction_date<=to)&&(itemId==="all"||t.item_id===itemId)).map(t=>{const i=items.find(x=>x.id===t.item_id)||{};return{date:movementTime(t),sku:i.sku||"",name:(i.name||"")+(i.variant_name?" · "+i.variant_name:""),kind:typeNames[t.transaction_type]||"Barang keluar",qty:t.quantity,unit:i.unit||"",person:t.person_or_destination||"—",note:[t.reference_no,t.notes].filter(Boolean).join(" · ")||"—"}})}const labels={stock:"LAPORAN POSISI STOK",all:"RIWAYAT BARANG MASUK & KELUAR",masuk:"LAPORAN BARANG MASUK",keluar:"LAPORAN BARANG KELUAR"};$("reportPaper").innerHTML=`<div class="report-head"><h2>AZX OFFICE · INVENTORY</h2><p>${labels[type]}</p></div><div class="report-meta"><span>Periode: ${esc(from||"Semua tanggal")} s.d. ${esc(to||"Sekarang")}</span><span>Dicetak: ${new Date().toLocaleString("id-ID")}</span></div><table><thead><tr><th>Tanggal</th><th>Kode</th><th>Nama barang</th><th>Jenis</th><th>Jumlah / Stok</th><th>Orang / Tujuan</th><th>Keterangan</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.sku)}</td><td>${esc(r.name)}</td><td>${esc(r.kind)}</td><td>${fmt(r.qty)} ${esc(r.unit)}</td><td>${esc(r.person)}</td><td>${esc(r.note)}</td></tr>`).join(""):'<tr><td colspan="7" class="empty">Tidak ada data pada filter ini.</td></tr>'}</tbody><tfoot><tr><td colspan="4">Jumlah baris</td><td colspan="3">${rows.length}</td></tr></tfoot></table><p style="margin-top:35px;text-align:right;font-size:10px">Mengetahui,<br><br><br>(........................................)</p>`;reportReady=true}
$("previewReport").addEventListener("click",buildReport);$("printReport").addEventListener("click",()=>{if(!reportReady)buildReport();window.print()});["reportType","reportFrom","reportTo","reportItem"].forEach(id=>$(id).addEventListener("change",()=>{if(reportReady)buildReport()}));
async function runAI(question){if(!session)return;const accessCode=getAIAccessCode();if(!accessCode)return;const btn=$("aiSearchBtn"),answer=$("aiAnswer");if(!question.trim())return toast("Tulis pertanyaan pencarian terlebih dahulu.",true);btn.disabled=true;btn.textContent="Mencari…";answer.hidden=false;answer.textContent="AZX AI sedang membaca data inventaris…";try{const {data:{session:current}}=await supabase.auth.getSession();const response=await fetch(AI_FUNCTION_URL,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+current.access_token,"x-ai-access-code":accessCode},body:JSON.stringify({question})});const data=await response.json();if(!response.ok){if(response.status===401)clearSavedAIAccessCode();throw new Error(data.error||"Pencarian AI gagal.");}answer.textContent=data.answer+(data.suggestion?"\n\nSaran: "+data.suggestion:"");const ids=new Set(data.matched_item_ids||[]);if(ids.size){const found=items.filter(i=>ids.has(i.id));answer.textContent+="\n\nBarang terkait:\n"+found.map(i=>"• "+i.name+(i.variant_name?" · "+i.variant_name:"")+" ("+i.sku+") — "+fmt(stockOf(i))+" "+i.unit).join("\n");} }catch(err){answer.textContent=err.message;toast(err.message,true)}finally{btn.disabled=false;btn.textContent="Cari dengan AI"}}
$("aiSearchBtn").addEventListener("click",()=>runAI($("aiQuestion").value));$("aiQuestion").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();runAI(e.target.value)}});document.querySelectorAll("[data-ask]").forEach(b=>b.addEventListener("click",()=>{$("aiQuestion").value=b.dataset.ask;runAI(b.dataset.ask)}));
if(supabase){supabase.auth.getSession().then(({data})=>{session=data.session;if(session)showApp();else showAuth()});supabase.auth.onAuthStateChange((_event,newSession)=>{session=newSession;if(session)showApp();else showAuth()})}else showAuth();
})();