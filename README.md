# STICKMAN BATTLE: LOCAL ARENA (JJK Edition)

```bash
npm install
npm run dev      # เปิด http://localhost:5173
npm run build    # ผลลัพธ์อยู่ใน dist/
```

## ปุ่มควบคุม (เปลี่ยนได้ที่ "ตั้งปุ่ม")
- P1: A/D เดิน · W กระโดด/ปีนขึ้น · S ป้องกัน/Parry/ปีนลง · F ต่อย · G เตะ · H/J/K สกิล 1-3 · L Domain
- P2: ลูกศร · Numpad1 ต่อย · Numpad2 เตะ · Numpad3/4/5 สกิล · Numpad6 Domain (หรือเลข 1-6 แถวบน)
- **QTE เกาะขอบแมพ**: เมื่อตกขอบสนาม ตัวละครจะคว้าขอบพื้น ให้กดปุ่ม **กระโดด / ต่อย / เตะ** รัวๆ ให้ทันเวลาเพื่อดึงตัวขึ้นมา
- Esc / P = หยุดเกม

## ฟีเจอร์หลัก
- **อนิเมชั่นต่อย-เตะใหม่ + Ragdoll Knockdown**: ท่าต่อยและเตะมีจังหวะง้าง-ซัด-ฟอลโลว์ทรูพร้อมเอฟเฟกต์ Impact, ถ้าโดนเตะ/หมัดคอมโบที่ 3/สกิลแรงจะกระเด็นล้มกลิ้งเป็น Ragdoll เด้งกับพื้นก่อนลุก
- **ระบบ Parry**: กดปุ่มป้องกันตรงจังหวะก่อนโดนตี = ปัดป้อง 0 ดาเมจ + ฟื้น CE + ศัตรูติดสตั้น
- **สกิลคัตซีน 10 แบบ**: `Black Flash: Overdrive`, `World Bisect`, `Unlimited Hollow`, `Jacob's Ladder`, `Mahoraga: Divine Wheel`, `0.2s Soul Shatter`, `Meteor Apocalypse`, `Maximum: Uzumaki Vortex`, `Fever Jackpot 777`, `Crimson Convergence`
- **สกินตัวละคร**: เปลี่ยนสกินได้ (เช่น Gojo 3 สกิน, Sukuna 3 สกิน, Yuji 3 สกิน และตัวอื่นครบทุกตัว) พร้อมพร็อพวาดบนตัว Stickman จริง
- **ด่าน Floating Sanctum**: เกาะลอยฟ้ารอบสนาม พร้อมเถาวัลย์และโซ่วิญญาณให้ปีนขึ้น-ลงได้จริง
- **Domain Expansion 13 แบบ + Domain Linger**: หลังจบช่วงเปิดและจังหวะโน้ต โดเมนจะ **ค้างเป็นสนามสู้ต่อ 4–4.5 วินาที** ทำดาเมจเล็กๆ ต่อเนื่องและใช้ความสามารถพิเศษประจำโดเมนระหว่างที่ทั้งสองฝ่ายสู้กันได้!

## โครงสร้างไฟล์
`src/game/{constants,game,keys,audio}.js` · `src/components/{Arena,Select,Settings}.jsx` · `src/{App,main}.jsx` · `src/styles.css`
