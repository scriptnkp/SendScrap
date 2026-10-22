// ===== ตั้งค่า =====
const CONFIG = {
  // URL จากการ Deploy Apps Script เป็น Web app (ลงท้ายด้วย /exec)
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwuCFRaLfcmcPJT0_bttrBrZcGr8TARxirGPEXayLVywOuw0yHHNKIkLGhKDyMyxF-O/exec',

  MAX_BYTES: 900 * 1024,   // ขนาดสูงสุดต่อรูป (เผื่อไว้ต่ำกว่า 1 MB)
  MAX_DIMENSION: 1600,     // ด้านยาวสุดของรูป (px) ก่อนเริ่มบีบ
  MAX_PHOTOS: 10,          // จำนวนรูปสูงสุดต่อหมวด
  MIN_PHOTOS: 1            // จำนวนรูปขั้นต่ำต่อหมวด
};
