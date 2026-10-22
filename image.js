// ===== บีบอัดรูป: ย่อขนาด + ลดคุณภาพ JPEG จนไม่เกิน CONFIG.MAX_BYTES =====
function loadBitmap(file) {
  // ใช้ <img> เป็นหลัก — เบราว์เซอร์รุ่นใหม่หมุนรูปตาม EXIF ให้เอง (รองรับ iOS/Android/Desktop)
  return new Promise(function (resolve, reject) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      // สำรอง: createImageBitmap
      if (window.createImageBitmap) {
        createImageBitmap(file).then(resolve, function () { reject(new Error('อ่านไฟล์รูปไม่ได้')); });
      } else { reject(new Error('อ่านไฟล์รูปไม่ได้')); }
    };
    img.src = url;
  });
}

function dataUrlToBlob(dataUrl) {
  var p = dataUrl.split(','), mime = p[0].match(/:(.*?);/)[1], bin = atob(p[1]), n = bin.length, u8 = new Uint8Array(n);
  while (n--) u8[n] = bin.charCodeAt(n);
  return new Blob([u8], { type: mime });
}

function canvasToBlob(canvas, quality) {
  return new Promise(function (resolve) {
    if (canvas.toBlob) canvas.toBlob(resolve, 'image/jpeg', quality);
    else resolve(dataUrlToBlob(canvas.toDataURL('image/jpeg', quality)));   // เบราว์เซอร์เก่า
  });
}

async function compressImage(file) {
  var src = await loadBitmap(file);
  var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
  var scale = Math.min(1, CONFIG.MAX_DIMENSION / Math.max(sw, sh));
  var quality = 0.85, blob = null;
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');

  for (var i = 0; i < 16; i++) {
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    blob = await canvasToBlob(canvas, quality);
    if (blob && blob.size <= CONFIG.MAX_BYTES) break;
    if (quality > 0.5) quality -= 0.1; else scale *= 0.85;
  }
  if (src.close) src.close();
  canvas.width = canvas.height = 1;   // คืนหน่วยความจำ (สำคัญบน iOS)
  if (!blob) throw new Error('บีบอัดรูปไม่สำเร็จ');
  return blob;
}

function blobToBase64(blob) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(String(r.result).split(',')[1]); };
    r.onerror = function () { reject(new Error('แปลงไฟล์ไม่สำเร็จ')); };
    r.readAsDataURL(blob);
  });
}
