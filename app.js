(function () {
  'use strict';

  // ===== Helpers =====
  var $ = function (id) { return document.getElementById(id); };
  var photos = { item: [], slip: [] };            // { blob, url, name, busy, uploaded, folderUrl }
  var LABEL = { item: 'พัสดุ', slip: 'สลิป' };
  var ID = { item: { thumbs: 'thumbsItem', count: 'countItem', card: 'f-photoItem' },
             slip: { thumbs: 'thumbsSlip', count: 'countSlip', card: 'f-photoSlip' } };
  var sid = newSid();
  var toastTimer;

  var MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  var DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var kb = function (n) { return n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.round(n / 1024) + ' KB'; };

  function newSid() {
    var d = new Date();
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
           pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '-' + Math.random().toString(36).slice(2, 6);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  // ===== วันที่ (อัตโนมัติ, พ.ศ.) =====
  function tickClock() {
    var d = new Date();
    $('now').textContent = '📅 วัน' + DAYS[d.getDay()] + 'ที่ ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' +
                           (d.getFullYear() + 543) + '  ⏰ ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' น.';
  }
  tickClock(); setInterval(tickClock, 20000);

  // ===== ออนไลน์/ออฟไลน์ =====
  function netState() { $('offline').hidden = navigator.onLine !== false; }
  window.addEventListener('online', netState); window.addEventListener('offline', netState); netState();

  // ===== Toast =====
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.hidden = false; buzz(60);
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 5000);
  }

  // ===== ตัวเลือกรายการ (bottom sheet + ค้นหา) =====
  function renderList(q) {
    q = (q || '').trim().toLowerCase();
    var box = $('itemList'), html = '', last = '', n = 0, cur = $('item').value;
    ITEMS.forEach(function (it, i) {
      if (q && (it.name + ' ' + it.code + ' ' + it.group).toLowerCase().indexOf(q) < 0) return;
      if (it.group !== last) { html += '<div class="grp">' + esc(it.group) + '</div>'; last = it.group; }
      html += '<button type="button" class="opt' + (String(i) === cur ? ' sel' : '') + '" data-i="' + i + '">' +
              '<span>' + esc(it.name) + '<small>' + esc(it.code) + '</small></span><span class="u">' + esc(it.unit) + '</span></button>';
      n++;
    });
    box.innerHTML = n ? html : '<div class="empty">ไม่พบรายการที่ค้นหา</div>';
  }
  function openSheet() {
    $('search').value = ''; renderList('');
    $('sheet').hidden = false; document.body.classList.add('lock');
    setTimeout(function () { var s = $('itemList').querySelector('.sel'); if (s) s.scrollIntoView({ block: 'center' }); }, 30);
  }
  function closeSheet() { $('sheet').hidden = true; document.body.classList.remove('lock'); $('itemBtn').focus(); }
  function selectItem(i) {
    var it = ITEMS[i];
    $('item').value = i;
    $('itemText').textContent = it.name; $('itemText').className = '';
    $('unit').textContent = '(' + it.unit + ')';
    var info = $('itemInfo'); info.textContent = 'รหัส ' + it.code + ' • หน่วย ' + it.unit; info.hidden = false;
    setInvalid('f-item', '');
    closeSheet();
  }
  $('itemBtn').addEventListener('click', openSheet);
  $('sheetClose').addEventListener('click', closeSheet);
  $('sheetBackdrop').addEventListener('click', closeSheet);
  $('search').addEventListener('input', function (e) { renderList(e.target.value); });
  $('itemList').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.opt') : null;
    if (b) selectItem(+b.getAttribute('data-i'));
  });

  // ===== ตัวเพิ่ม/ลดจำนวน =====
  function stepQty(d) {
    var v = parseFloat($('qty').value) || 0;
    v = Math.max(0, Math.round((v + d) * 100) / 100);
    $('qty').value = v || ''; setInvalid('f-qty', ''); buzz(10);
  }
  $('qMinus').addEventListener('click', function () { stepQty(-1); });
  $('qPlus').addEventListener('click', function () { stepQty(1); });

  // จำชื่อผู้ควบคุมไว้ในเครื่อง
  try { $('supervisor').value = localStorage.getItem('supervisor') || ''; } catch (e) {}

  // เคลียร์ error เมื่อพิมพ์
  ['network', 'wbs', 'qty', 'supervisor'].forEach(function (id) {
    $(id).addEventListener('input', function () { setInvalid('f-' + id, ''); });
  });

  // ===== รูปภาพ =====
  function updateSummary() {
    $('summary').innerHTML = 'พัสดุ <b>' + photos.item.length + '</b> • สลิป <b>' + photos.slip.length + '</b>';
  }
  function renderThumbs(kind) {
    var box = $(ID[kind].thumbs); box.innerHTML = '';
    photos[kind].forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'thumb' + (p.busy ? ' busy' : '');
      d.innerHTML = '<img alt="รูป' + LABEL[kind] + '"><span class="size">' + (p.busy ? '...' : kb(p.blob.size)) +
                    '</span><button type="button" class="rm" aria-label="ลบรูป">×</button>';
      var img = d.querySelector('img');
      if (p.url) { img.src = p.url; img.onclick = function () { $('lightImg').src = p.url; $('lightbox').hidden = false; }; }
      d.querySelector('.rm').onclick = function (ev) {
        ev.stopPropagation();
        if (p.url) URL.revokeObjectURL(p.url);
        photos[kind] = photos[kind].filter(function (x) { return x !== p; });
        renderThumbs(kind);
      };
      box.appendChild(d);
    });
    $(ID[kind].count).textContent = photos[kind].length + ' รูป';
    updateSummary();
  }
  async function addFiles(kind, list) {
    var files = Array.prototype.slice.call(list).filter(function (f) { return !f.type || f.type.indexOf('image/') === 0; });
    for (var i = 0; i < files.length; i++) {
      if (photos[kind].length >= CONFIG.MAX_PHOTOS) { toast('เพิ่มรูป' + LABEL[kind] + 'ได้สูงสุด ' + CONFIG.MAX_PHOTOS + ' รูป'); break; }
      var p = { busy: true, name: files[i].name };
      photos[kind].push(p); renderThumbs(kind); setCardInvalid(kind, false);
      try {
        p.blob = await compressImage(files[i]);
        p.url = URL.createObjectURL(p.blob);
        p.busy = false;
      } catch (e) {
        photos[kind] = photos[kind].filter(function (x) { return x !== p; });
        toast('ไฟล์ ' + files[i].name + ': ' + e.message);
      }
      renderThumbs(kind);
    }
  }
  [['camItem', 'item'], ['fileItem', 'item'], ['camSlip', 'slip'], ['fileSlip', 'slip']].forEach(function (x) {
    $(x[0]).addEventListener('change', function (e) { addFiles(x[1], e.target.files); e.target.value = ''; });
  });
  $('lightbox').addEventListener('click', function () { $('lightbox').hidden = true; });

  // ===== Validate =====
  function setInvalid(fid, msg) {
    var f = $(fid); if (!f) return;
    f.classList.toggle('invalid', !!msg);
    var m = f.querySelector('.msg'); if (m) m.textContent = msg || '';
  }
  function setCardInvalid(kind, msg) {
    var c = $(ID[kind].card); c.classList.toggle('invalid', !!msg);
    c.querySelector('.msg').textContent = msg || '';
  }
  function validate() {
    var bad = [];
    if (!$('item').value) { setInvalid('f-item', 'กรุณาเลือกรายการพัสดุ'); bad.push('f-item'); } else setInvalid('f-item', '');
    [['network', 'กรุณากรอกโครงข่าย'], ['wbs', 'กรุณากรอก WBS'], ['supervisor', 'กรุณากรอกชื่อผู้ควบคุม']].forEach(function (x) {
      if (!$(x[0]).value.trim()) { setInvalid('f-' + x[0], x[1]); bad.push('f-' + x[0]); } else setInvalid('f-' + x[0], '');
    });
    if (!(parseFloat($('qty').value) > 0)) { setInvalid('f-qty', 'จำนวนต้องมากกว่า 0'); bad.push('f-qty'); } else setInvalid('f-qty', '');
    ['item', 'slip'].forEach(function (k) {
      if (photos[k].some(function (p) { return p.busy; })) { setCardInvalid(k, 'กำลังบีบอัดรูป กรุณารอสักครู่'); bad.push(ID[k].card); }
      else if (photos[k].length < CONFIG.MIN_PHOTOS) { setCardInvalid(k, 'กรุณาเพิ่มรูปถ่าย' + LABEL[k] + 'อย่างน้อย ' + CONFIG.MIN_PHOTOS + ' รูป'); bad.push(ID[k].card); }
      else setCardInvalid(k, false);
    });
    if (bad.length) {
      var el = $(bad[0]); buzz([40, 40, 40]);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('กรุณากรอกข้อมูลให้ครบถ้วน');
      return false;
    }
    return true;
  }

  // ===== ส่งไป Apps Script (text/plain → ไม่มี CORS preflight) =====
  async function post(payload, tries) {
    tries = tries || 2;
    for (var t = 1; ; t++) {
      try {
        var ctl = window.AbortController ? new AbortController() : null;
        var timer = ctl ? setTimeout(function () { ctl.abort(); }, 120000) : null;
        var res = await fetch(CONFIG.APPS_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined });
        if (timer) clearTimeout(timer);
        var json = await res.json();
        if (!json.ok) throw new Error(json.error || 'เซิร์ฟเวอร์ตอบกลับผิดพลาด');
        return json;
      } catch (e) {
        var netErr = e.name === 'AbortError' || e.name === 'TypeError' || e instanceof SyntaxError;
        if (!netErr || t >= tries) throw netErr ? new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่') : e;
        await new Promise(function (r) { setTimeout(r, 1200); });
      }
    }
  }
  function setProgress(done, total, text) {
    $('bar').style.width = Math.round(done / total * 100) + '%';
    $('overlayText').textContent = text;
  }

  // ===== Submit =====
  $('form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validate()) return;
    if (navigator.onLine === false) { toast('ไม่มีสัญญาณอินเทอร์เน็ต'); return; }
    if (CONFIG.APPS_SCRIPT_URL.indexOf('xxxxxxxx') > -1) { toast('ยังไม่ได้ตั้งค่า APPS_SCRIPT_URL ใน js/config.js'); return; }

    var it = ITEMS[$('item').value];
    var all = photos.item.map(function (p) { return ['item', p]; }).concat(photos.slip.map(function (p) { return ['slip', p]; }));
    var total = all.length + 1, done = 0, folderUrl = '', idx = { item: 0, slip: 0 };

    $('overlay').hidden = false; document.body.classList.add('lock');
    $('spinner').hidden = false; $('doneIcon').hidden = true; $('again').hidden = true;
    $('barWrap').hidden = false; $('overlaySub').hidden = false; $('submit').disabled = true;
    setProgress(0, total, 'กำลังอัปโหลดรูป...');

    try {
      for (var i = 0; i < all.length; i++) {
        var kind = all[i][0], p = all[i][1], n = ++idx[kind];
        if (!p.uploaded) {                         // ส่งซ้ำ → ข้ามรูปที่อัปโหลดสำเร็จแล้ว
          var r = await post({ action: 'upload', sid: sid, kind: kind,
            name: LABEL[kind] + '_' + pad(n) + '.jpg', mime: 'image/jpeg', data: await blobToBase64(p.blob) });
          p.uploaded = r.url; p.folderUrl = r.folderUrl;
        }
        folderUrl = p.folderUrl;
        setProgress(++done, total, 'อัปโหลดรูป ' + done + '/' + all.length);
      }
      setProgress(done, total, 'กำลังบันทึกข้อมูล...');
      await post({
        action: 'submit', sid: sid,
        item: { code: it.code, name: it.name, unit: it.unit },
        network: $('network').value.trim(), wbs: $('wbs').value.trim(),
        qty: parseFloat($('qty').value), supervisor: $('supervisor').value.trim(),
        itemUrls: photos.item.map(function (p) { return p.uploaded; }),
        slipUrls: photos.slip.map(function (p) { return p.uploaded; }),
        folderUrl: folderUrl
      });
      try { localStorage.setItem('supervisor', $('supervisor').value.trim()); } catch (er) {}

      setProgress(total, total, 'ส่งข้อมูลเรียบร้อยแล้ว');
      $('spinner').hidden = true; $('doneIcon').hidden = false; $('barWrap').hidden = true;
      $('overlaySub').hidden = true; $('again').hidden = false; buzz([80, 40, 80]);
    } catch (err) {
      $('overlay').hidden = true; document.body.classList.remove('lock');
      toast('ส่งไม่สำเร็จ: ' + err.message + ' — กดส่งอีกครั้งได้ (รูปที่อัปโหลดแล้วจะไม่ส่งซ้ำ)');
    } finally {
      $('submit').disabled = false;
    }
  });

  // ===== เริ่มรายการใหม่ =====
  $('again').addEventListener('click', function () {
    ['item', 'slip'].forEach(function (k) {
      photos[k].forEach(function (p) { if (p.url) URL.revokeObjectURL(p.url); });
      photos[k] = []; renderThumbs(k);
    });
    ['network', 'wbs', 'qty'].forEach(function (id) { $(id).value = ''; });
    $('item').value = ''; $('itemText').textContent = 'แตะเพื่อเลือกรายการ'; $('itemText').className = 'placeholder';
    $('itemInfo').hidden = true; $('unit').textContent = '';
    sid = newSid();
    $('overlay').hidden = true; document.body.classList.remove('lock');
    window.scrollTo(0, 0);
  });

  // ===== ปุ่ม ESC =====
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('lightbox').hidden) $('lightbox').hidden = true;
    else if (!$('sheet').hidden) closeSheet();
  });

  updateSummary();
})();
