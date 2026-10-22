// ===== ตั้งค่า: ใส่ URL Web App ที่ได้จากการ Deploy Apps Script =====
const API_URL = 'https://script.google.com/macros/s/AKfycbwuCFRaLfcmcPJT0_bttrBrZcGr8TARxirGPEXayLVywOuw0yHHNKIkLGhKDyMyxF-O/exec';
const MAX_BYTES = 1000 * 1024;   // ≤ 1 MB
const MAX_DIM   = 1920;
const MAX_FILES = 10;

const ITEMS = [
  ['1-50-001-0001','เศษสายอลูมิเนียมเปลือยชำรุด','กก.',79],
  ['1-50-001-0002','เศษสายอลูมิเนียมหุ้มพีวีซี, สีดำชำรุด','กก.',51],
  ['1-50-001-0003','เศษสายอลูมิเนียมหุ้มพีวีซี, สีฟ้าชำรุด','กก.',25],
  ['1-50-001-0004','เศษสายอลูมิเนียมแกนเหล็กชำรุด','กก.',51],
  ['1-50-001-0005','เศษสายอลูมิเนียมหุ้มไม่เต็มพิกัดชำรุด','กก.',51],
  ['1-50-001-0006','เศษสายเคเบิ้ลอากาศชำรุด','กก.',34],
  ['1-50-001-0007','เศษสายอลูมิเนียมอัลลอยชำรุด','กก.',68],
  ['1-50-001-0008','เศษสายทองแดงเปลือยชำรุด','กก.',281],
  ['1-50-001-0009','เศษสายทองแดงหุ้มพีวีซี.ชำรุด','กก.',178],
  ['1-50-001-0010','เศษลวดทองแดงชำรุดไม่รวมสิ่งห่อหุ้มและน้ำมัน','กก.',281],
  ['1-50-001-0011','เศษลวดทองแดงชำรุดรวมสิ่งห่อหุ้มและน้ำมัน','กก.',247],
  ['1-50-001-0012','เศษสายเคเบิ้ลใต้ดินทองแดงชำรุด','กก.',178],
  ['1-50-001-0013','เศษสายคอนโทรลทองแดงชำรุด','กก.',150],
  ['1-50-001-0014','เศษสายอลูมิเนียมหุ้มพีวีซี, สีขาวชำรุด','กก.',51],
  ['1-50-002-0001','เศษเหล็กและเศษวัสดุ','กก.',null],
  ['1-50-002-0002','เศษอลูมิเนียม','กก.',28],
  ['1-50-005-0007','แบตเตอรี่ชำรุด ขนาดเล็ก ตั้งแต่ 30-80 A','ลูก',195],
  ['1-50-005-0008','แบตเตอรี่ชำรุด ขนาดกลาง ตั้งแต่ 100-110 A','ลูก',241],
  ['1-50-005-0009','แบตเตอรี่ชำรุด ขนาดใหญ่ ตั้งแต่ 120 A ขึ้นไป','ลูก',253],
  ['1-50-005-0010','ยางรถยนต์ชำรุด ตั้งแต่ขนาด 7.50/14 ลงมา','เส้น',188],
  ['1-50-005-0011','ยางรถยนต์ชำรุด ตั้งแต่ขนาด 7.50/15 และ 7.50/16','เส้น',216],
  ['1-50-005-0012','ยางรถยนต์ชำรุด ตั้งแต่ขนาด 7.50/17 - 7.50/19','เส้น',223],
  ['1-50-005-0013','ยางรถยนต์ชำรุด ตั้งแต่ขนาด 8.25/20 ขึ้นไป','เส้น',333],
  ['1-50-005-0014','ยางรถยกชำรุด ตั้งแต่ขนาด 6.5/8-9/10','เส้น',238],
  ['1-50-005-0015','ยางรถยกชำรุด ตั้งแต่ขนาดมากกว่า 9/10 ขึ้นไป','เส้น',215],
  ['1-50-006-0004','เสาคอนกรีตชำรุด ขนาด 8-9 เมตร','ต้น',370],
  ['1-50-006-0005','เสาคอนกรีตชำรุด ขนาด 12 เมตร ขึ้นไป','ต้น',556]
].map(([code,name,unit,price]) => ({ code, name, unit, price }));

const $ = id => document.getElementById(id);
const photos = { item: [], slip: [] };

// ===== วันที่อัตโนมัติ =====
function setDate() {
  const d = new Date();
  const s = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()+543}`;
  $('date').value = s;
  $('dateDisplay').textContent = s;
}

// ===== รายการพัสดุ + ค้นหา =====
function renderOptions(keyword = '') {
  const kw = keyword.trim().toLowerCase();
  const current = $('item').value;
  $('item').innerHTML = '<option value="">-- เลือกรายการ --</option>' +
    ITEMS.filter(i => !kw || i.code.includes(kw) || i.name.toLowerCase().includes(kw))
      .map(i => `<option value="${i.code}">${i.code} : ${i.name}</option>`).join('');
  $('item').value = current;
}

function getSelected() { return ITEMS.find(i => i.code === $('item').value); }

function updateItemInfo() {
  const it = getSelected();
  if (!it) { $('itemInfo').classList.add('hidden'); $('unitLabel').textContent = 'หน่วย'; updateTotal(); return; }
  $('itemInfo').innerHTML = `<b>รหัส:</b> ${it.code}<br><b>หน่วยนับ:</b> ${it.unit} &nbsp; <b>ราคา/หน่วย:</b> ${it.price != null ? it.price.toLocaleString('th-TH') + ' บาท' : '-'}`;
  $('itemInfo').classList.remove('hidden');
  $('unitLabel').textContent = it.unit;
  updateTotal();
}

function updateTotal() {
  const it = getSelected(), q = parseFloat($('qty').value);
  if (it && it.price != null && q > 0) {
    $('totalVal').textContent = (it.price * q).toLocaleString('th-TH', { maximumFractionDigits: 2 });
    $('totalBox').classList.remove('hidden');
  } else $('totalBox').classList.add('hidden');
}

// ===== บีบอัดรูป ≤ 1MB =====
function loadImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(img.src); res(img); };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

async function compressImage(file) {
  const img = await loadImage(file);
  let { width: w, height: h } = img;
  const r = Math.min(1, MAX_DIM / Math.max(w, h));
  w = Math.round(w * r); h = Math.round(h * r);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let quality = 0.85, dataUrl, bytes;

  for (let i = 0; i < 12; i++) {
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    dataUrl = canvas.toDataURL('image/jpeg', quality);
    bytes = Math.round((dataUrl.length - 23) * 3 / 4);
    if (bytes <= MAX_BYTES) break;
    if (quality > 0.5) quality -= 0.1;
    else { w = Math.round(w * 0.8); h = Math.round(h * 0.8); }
  }
  return { data: dataUrl, size: bytes };
}

async function handleFiles(type, files) {
  const list = photos[type];
  if (list.length + files.length > MAX_FILES) return toast(`แนบได้สูงสุด ${MAX_FILES} รูป`, 'err');
  showOverlay('กำลังบีบอัดรูป...');
  try {
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      list.push(await compressImage(f));
    }
  } catch { toast('ไม่สามารถอ่านไฟล์รูปบางไฟล์ได้', 'err'); }
  hideOverlay();
  renderPreview(type);
}

function renderPreview(type) {
  const box = $(type + 'Preview');
  box.innerHTML = photos[type].map((p, i) => `
    <div class="thumb">
      <img src="${p.data}" alt="">
      <span class="size">${(p.size / 1024).toFixed(0)} KB</span>
      <button type="button" data-type="${type}" data-i="${i}">×</button>
    </div>`).join('');
}

// ===== ส่งข้อมูล =====
function validate() {
  let ok = true;
  ['item','network','wbs','qty','supervisor'].forEach(id => {
    const el = $(id), bad = !el.value.trim() || (id === 'qty' && !(parseFloat(el.value) > 0));
    el.classList.toggle('invalid', bad);
    if (bad) ok = false;
  });
  if (!ok) { toast('กรุณากรอกข้อมูลให้ครบ', 'err'); return false; }
  if (!photos.item.length) { toast('กรุณาแนบรูปพัสดุอย่างน้อย 1 รูป', 'err'); return false; }
  if (!photos.slip.length) { toast('กรุณาแนบรูปสลิปอย่างน้อย 1 รูป', 'err'); return false; }
  return true;
}

async function submitForm(e) {
  e.preventDefault();
  if (!validate()) return;
  const it = getSelected();
  const payload = {
    code: it.code, name: it.name, unit: it.unit, price: it.price,
    qty: $('qty').value, network: $('network').value.trim(), wbs: $('wbs').value.trim(),
    supervisor: $('supervisor').value.trim(),
    itemPhotos: photos.item.map(p => ({ data: p.data })),
    slipPhotos: photos.slip.map(p => ({ data: p.data }))
  };

  $('submitBtn').disabled = true;
  showOverlay('กำลังอัปโหลดและบันทึก...');
  try {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) }); // text/plain → ไม่ติด CORS
    const out = await res.json();
    if (!out.ok) throw new Error(out.error);
    localStorage.setItem('supervisor', payload.supervisor);
    toast('✅ บันทึกข้อมูลสำเร็จ', 'ok');
    resetForm();
  } catch (err) {
    toast('❌ ผิดพลาด: ' + err.message, 'err');
  } finally {
    hideOverlay();
    $('submitBtn').disabled = false;
  }
}

function resetForm() {
  $('mainForm').reset();
  photos.item = []; photos.slip = [];
  renderPreview('item'); renderPreview('slip');
  renderOptions(); updateItemInfo(); setDate();
  $('supervisor').value = localStorage.getItem('supervisor') || '';
}

// ===== UI helpers =====
function showOverlay(t) { $('overlayText').textContent = t; $('overlay').classList.remove('hidden'); }
function hideOverlay() { $('overlay').classList.add('hidden'); }
let tTimer;
function toast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg; t.className = `toast show ${type}`;
  clearTimeout(tTimer); tTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  setDate(); renderOptions();
  $('supervisor').value = localStorage.getItem('supervisor') || '';
  $('itemSearch').addEventListener('input', e => renderOptions(e.target.value));
  $('item').addEventListener('change', updateItemInfo);
  $('qty').addEventListener('input', updateTotal);
  ['item','slip'].forEach(t => {
    $(t + 'Photos').addEventListener('change', e => { handleFiles(t, [...e.target.files]); e.target.value = ''; });
    $(t + 'Preview').addEventListener('click', e => {
      if (e.target.tagName !== 'BUTTON') return;
      photos[e.target.dataset.type].splice(+e.target.dataset.i, 1);
      renderPreview(e.target.dataset.type);
    });
  });
  document.querySelectorAll('input,select').forEach(el => el.addEventListener('input', () => el.classList.remove('invalid')));
  $('mainForm').addEventListener('submit', submitForm);
});