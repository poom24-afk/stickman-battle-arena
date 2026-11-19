export const W = 1280, H = 720, GROUND = 560, STAGE_L = 170, STAGE_R = 1110;
export const FONT = '"Dela Gothic One", "Kanit", Impact, "Arial Black", sans-serif';
export const COLORS = ['#3dd6ff', '#ff2d55', '#ffd24a', '#7dff6b', '#c46bff', '#ff8a3d', '#ffffff', '#ff6bd6'];

/* สกิลสไตล์ Jujutsu Kaisen (รวมสกิลคัตซีน 10 แบบ!) */
export const SKILLS = {
  blackflash: { name: 'Black Flash', short: 'BLACK FLASH', cd: 5, color: '#ff1744', kind: 'melee', pose: 'fire', fx: 'bf', dur: 0.45, win: [0.12, 0.24], dmg: 15, kb: 780, stun: 0.5, reach: 80, y: [-125, -35], lunge: 380, desc: 'พุ่งต่อยด้วยสายฟ้าดำ-แดง ดาเมจสูงมาก + หยุดเวลาสั้นๆ' },
  divergent: { name: 'Divergent Fist', short: 'DIVERGENT', cd: 4, color: '#ffab40', kind: 'melee', pose: 'punch', fx: 'impact', dur: 0.75, win: [0.1, 0.2], dmg: 6, kb: 150, stun: 0.6, reach: 70, y: [-125, -35], delay: 0.35, dmg2: 11, kb2: 700, desc: 'หมัดสองจังหวะ แรงกระแทกลูกที่ 2 มาช้ากว่า' },
  cleave: { name: 'Cleave', short: 'CLEAVE', cd: 3.5, color: '#ffffff', kind: 'melee', pose: 'fire', fx: 'slash', dur: 0.5, win: [0.15, 0.28], dmg: 12, kb: 500, stun: 0.4, reach: 130, y: [-125, 0], desc: 'ฟันกว้าง ระยะไกลกว่าหมัดธรรมดา' },
  dismantle: { name: 'Dismantle', short: 'DISMANTLE', cd: 5, color: '#e0f7fa', kind: 'slashes', pose: 'cast', dur: 0.7, fireAt: 0.25, dmg: 14, kb: 420, stun: 0.45, range: 440, n: 9, desc: 'ฟันอากาศเป็นสายฟาดตัดทั้งแนวหน้า' },
  blue: { name: 'Blue', short: 'BLUE', cd: 6.5, color: '#40c4ff', kind: 'blue', pose: 'cast', dur: 0.5, fireAt: 0.25, charge: 36, hold: 1.1, dmg: 9, kb: 600, desc: 'ลูกแรงดึงดูด ดูดคู่ต่อสู้เข้าหาแล้วระเบิด' },
  red: { name: 'Red', short: 'RED', cd: 6, color: '#ff3d3d', kind: 'proj', style: 'red', pose: 'cast', dur: 0.55, fireAt: 0.3, charge: 30, speed: 640, dmg: 14, kb: 950, stun: 0.55, r: 30, life: 2, boom: 90, vy: 380, desc: 'ลูกแรงผลัก ระเบิดกระเด็นแรง' },
  purple: { name: 'Hollow Purple', short: 'PURPLE', cd: 16, color: '#d500f9', kind: 'beam', style: 'purple', pose: 'cast', dur: 1.6, fireAt: 1.0, charge: 70, th: 120, vis: 0.7, dmg: 32, kb: 1100, stun: 0.9, vy: 600, desc: 'รวมน้ำเงิน+แดง ลำแสงม่วงทำลายล้าง (ชาร์จนาน โดนตีแล้วหลุด)' },
  piercing: { name: 'Piercing Blood', short: 'PIERCING', cd: 4, color: '#ff5252', kind: 'beam', style: 'piercing', pose: 'cast', dur: 0.6, fireAt: 0.3, charge: 14, th: 18, vis: 0.28, dmg: 14, kb: 420, stun: 0.4, desc: 'ลำเลือดบางเฉียบ ยิงเร็วทะลุทั้งจอ' },
  fuga: { name: 'Fuga', short: 'FUGA', cd: 9, color: '#ff9100', kind: 'proj', style: 'firearrow', pose: 'cast', dur: 0.8, fireAt: 0.5, charge: 28, speed: 1100, dmg: 22, kb: 850, stun: 0.6, r: 26, life: 1.6, boom: 200, arrow: true, vy: 420, desc: 'ลูกธนูเพลิง พุ่งเร็ว ระเบิดไฟลูกใหญ่' },
  boogie: { name: 'Boogie Woogie', short: 'BOOGIE', cd: 6, color: '#00e676', kind: 'warp', pose: 'clap', dur: 0.55, fireAt: 0.25, dmg: 6, kb: 250, stun: 0.6, desc: 'ตบมือสลับตำแหน่งกับคู่ต่อสู้ แล้วสวนทันที' },
  dogs: { name: 'Divine Dogs', short: 'DOGS', cd: 7, color: '#b0bec5', kind: 'dogs', pose: 'cast', dur: 0.6, fireAt: 0.2, dmg: 9, kb: 400, stun: 0.4, desc: 'เรียกหมาป่าเงา 2 ตัววิ่งกัดตามพื้น (กระโดดหลบได้)' },
  speech: { name: 'Cursed Speech', short: 'SPEECH', cd: 11, color: '#ffffff', kind: 'speech', pose: 'cast', dur: 0.55, fireAt: 0.25, dmg: 3, stunTime: 1.2, range: 650, desc: 'คำสาปเสียง "อย่าขยับ" คู่ต่อสู้ขยับไม่ได้ 1.2 วิ (ป้องกันไม่ได้)' },
  ratio: { name: 'Ratio 7:3', short: '7:3', cd: 5, color: '#ffd54f', kind: 'melee', pose: 'fire', fx: 'ratio', dur: 0.5, win: [0.15, 0.27], dmg: 14, kb: 380, stun: 0.45, reach: 95, y: [-125, -30], desc: 'ฟาดจุดอ่อนที่สัดส่วน 7:3 แม่นยำ ดาเมจหนัก' },
  hairpin: { name: 'Hairpin', short: 'HAIRPIN', cd: 6, color: '#ffab91', kind: 'proj', style: 'nail', pose: 'cast', dur: 0.7, fireAt: 0.25, charge: 14, speed: 900, dmg: 6, kb: 120, stun: 0.15, r: 12, life: 1.6, vy: 0, n: 4, gap: 0.24, offs: [-25, 0, 25, 0], arrow: true, small: true, desc: 'ตอกตะปู 4 เล่มรัวไล่ระดับ ดาเมจเบาแต่ต่อเนื่อง' },
  resonance: { name: 'Resonance', short: 'RESONANCE', cd: 9, color: '#ff6e40', kind: 'proj', style: 'nail', pose: 'cast', dur: 0.7, fireAt: 0.35, charge: 18, speed: 800, dmg: 7, kb: 200, stun: 0.3, r: 16, life: 1.8, vy: 200, echo: 0.9, dmg2: 15, kb2: 700, arrow: true, desc: 'ตอกตะปู แล้วตุ๊กตาฟางสะท้อนระเบิดซ้ำอีกครั้งช้าๆ' },
  supernova: { name: 'Supernova', short: 'SUPERNOVA', cd: 10, color: '#ff1744', kind: 'proj', style: 'blood', pose: 'cast', dur: 0.9, fireAt: 0.45, charge: 24, speed: 520, dmg: 5, kb: 220, stun: 0.2, r: 16, life: 2, boom: 50, vy: 0, n: 5, gap: 0.22, offs: [-50, -25, 0, 25, 50], desc: 'ลูกเลือด 5 ลูกยิงไล่ความสูงต่างกัน ระเบิดทีละลูก' },
  uzumaki: { name: 'Max: Uzumaki', short: 'UZUMAKI', cd: 14, color: '#69f0ae', kind: 'beam', style: 'uzumaki', pose: 'cast', dur: 1.2, fireAt: 0.8, charge: 50, th: 90, vis: 0.6, dmg: 26, kb: 900, stun: 0.8, vy: 450, desc: 'รวมวิญญาณคำสาปเป็นลำเกลียวขนาดใหญ่ ชาร์จนาน แรงสูง' },
  rika: { name: 'Rika Beam', short: 'RIKA', cd: 10, color: '#ff80ab', kind: 'beam', style: 'rika', pose: 'cast', dur: 1.0, fireAt: 0.6, charge: 40, th: 60, vis: 0.5, dmg: 20, kb: 800, stun: 0.7, vy: 350, desc: 'ปลดปล่อยพลังสาปจำนวนมหาศาล ลำแสงขนาดกลาง' },
  worldslash: { name: 'World Cutting Slash', short: 'WORLD SLASH', cd: 15, color: '#ff8a80', kind: 'slashes', pose: 'cast', dur: 1.0, fireAt: 0.55, dmg: 26, kb: 700, stun: 0.7, range: 1300, n: 16, desc: 'ฟันตัดโลก แนวฟันพาดไกลทั้งสนาม หลบยาก (ป้องกันได้)' },
  infinity: { name: 'Infinity', short: 'INFINITY', cd: 13, color: '#4fc3f7', kind: 'buff', pose: 'cast', dur: 0.4, fireAt: 0.15, time: 1.8, desc: 'ลิมิตเลส สร้างบาเรียไร้ขีดจำกัด อมตะ 1.8 วิ (ยกเว้น Domain)' },
  rct: { name: 'Reverse Technique', short: 'RCT HEAL', cd: 20, color: '#76ff03', kind: 'heal', pose: 'cast', dur: 0.9, fireAt: 0.6, heal: 22, desc: 'พลังสาปย้อนกลับ ฟื้น HP 22 (ถ้าโดนตีขณะร่ายจะขาด)' },
  nue: { name: 'Nue', short: 'NUE', cd: 7, color: '#ffee58', kind: 'strike', pose: 'cast', dur: 0.5, fireAt: 0.25, delay: 0.7, radius: 90, dmg: 15, kb: 450, stun: 0.5, vy: 500, desc: 'เรียกนกสายฟ้า ฟ้าผ่าลงจุดที่ศัตรูยืนอยู่ (เดินหลบได้)' },
  meteor: { name: 'Max: Meteor', short: 'METEOR', cd: 14, color: '#ff6d00', kind: 'strike', pose: 'cast', dur: 0.7, fireAt: 0.4, delay: 1.1, radius: 130, dmg: 26, kb: 800, stun: 0.8, vy: 600, desc: 'อุกกาบาตลาวาตกลงจุดที่ศัตรูยืนอยู่ ใหญ่และช้า' },
  mahoraga: { name: 'Mahoraga Sword', short: 'MAHORAGA', cd: 11, color: '#ffd54f', kind: 'melee', pose: 'fire', fx: 'slash', dur: 0.6, win: [0.2, 0.36], dmg: 20, kb: 750, stun: 0.6, reach: 170, y: [-135, 0], desc: 'ดาบสังหารมาโฮราก้า ฟันกว้างสุดๆ ดาเมจหนัก' },
  projection: { name: 'Projection Sorcery', short: 'PROJECTION', cd: 5, color: '#ffee58', kind: 'melee', pose: 'kick', fx: 'speed', dur: 0.4, win: [0.05, 0.28], dmg: 11, kb: 450, stun: 0.4, reach: 80, y: [-120, -10], lunge: 1800, desc: 'พุ่งด้วยความเร็ว 24 เฟรม/วิ ทะยานเข้าใส่ทันที' },
  invspear: { name: 'Inverted Spear', short: 'INV SPEAR', cd: 11, color: '#90a4ae', kind: 'melee', pose: 'fire', fx: 'nullify', dur: 0.45, win: [0.12, 0.25], dmg: 8, kb: 300, stun: 0.4, reach: 110, y: [-125, -20], desc: 'หอกลบเทคนิค โดนแล้ว Cursed Energy ศัตรูเหลือ 0 + สกิลติดคูลดาวน์เพิ่ม 3 วิ' },
  idle: { name: 'Idle Transfiguration', short: 'IDLE', cd: 8, color: '#9ccc65', kind: 'melee', pose: 'punch', fx: 'soul', dur: 0.45, win: [0.1, 0.22], dmg: 7, kb: 100, stun: 1.1, reach: 75, y: [-125, -30], desc: 'แตะแล้วบิดรูปวิญญาณ คู่ต่อสู้สตันนาน 1.1 วิ' },
  jackpot: { name: 'Jackpot', short: 'JACKPOT', cd: 18, color: '#ffd600', kind: 'jackpot', pose: 'clap', dur: 0.7, fireAt: 0.3, desc: 'สุ่มสล็อต! 30% แจ็กพอต = HP +25 และอมตะ 2.5 วิ ไม่งั้น Cursed Energy +35' },
  manji: { name: 'Manji Kick', short: 'MANJI', cd: 5, color: '#ff7043', kind: 'melee', pose: 'kick', fx: 'impact', dur: 0.5, win: [0.1, 0.3], dmg: 13, kb: 620, stun: 0.5, reach: 95, y: [-100, -10], lunge: 520, desc: 'เตะหมุนพุ่งเข้าใส่ ท่าถนัดของยูจิ' },
  nailhammer: { name: 'Hammer & Nails', short: 'HAMMER', cd: 6, color: '#ff8a65', kind: 'melee', pose: 'fire', fx: 'impact', dur: 0.6, win: [0.2, 0.34], dmg: 17, kb: 700, stun: 0.55, reach: 100, y: [-125, -20], desc: 'ทุบด้วยค้อนและตะปูของโนบาระ ดาเมจหนัก' },
  playful: { name: 'Playful Cloud', short: 'CLOUD', cd: 6, color: '#cfd8dc', kind: 'melee', pose: 'fire', fx: 'slash', dur: 0.55, win: [0.15, 0.34], dmg: 15, kb: 600, stun: 0.5, reach: 150, y: [-130, -5], desc: 'หอกสามท่อนสังหาร ฟาดกว้างระยะไกล' },
  isomer: { name: 'Polymorphic Soul Isomer', short: 'ISOMER', cd: 9, color: '#b2ff59', kind: 'melee', pose: 'punch', fx: 'drain', dur: 0.5, win: [0.1, 0.24], dmg: 9, kb: 200, stun: 0.8, reach: 85, y: [-125, -30], desc: 'บิดวิญญาณ ดูด Cursed Energy ศัตรู 40 และฟื้น HP ให้ตัวเอง 5' },
  executioner: { name: "Executioner's Sword", short: 'EXECUTE', cd: 12, color: '#ffe082', kind: 'melee', pose: 'fire', fx: 'nullify', dur: 0.65, win: [0.25, 0.42], dmg: 20, kb: 800, stun: 0.7, reach: 150, y: [-135, 0], desc: 'ดาบประหาร ฟันหนัก ยึดเทคนิคศัตรู (CE = 0 สกิลติดคูลดาวน์เพิ่ม)' },
  chain: { name: 'Chain of a Thousand Miles', short: 'CHAIN', cd: 7, color: '#b0bec5', kind: 'proj', style: 'chain', pose: 'cast', dur: 0.5, fireAt: 0.2, charge: 10, speed: 1300, dmg: 7, kb: -650, stun: 0.6, r: 16, life: 1.2, vy: 0, small: true, arrow: true, desc: 'โซ่พันไมล์ ฟาดแล้วลากคู่ต่อสู้เข้ามาหาตัว' },
  blastaway: { name: 'Blast Away', short: 'BLAST', cd: 6, color: '#ffffff', kind: 'proj', style: 'sonic', pose: 'cast', dur: 0.45, fireAt: 0.2, charge: 22, speed: 900, dmg: 9, kb: 1000, stun: 0.4, r: 44, life: 0.9, vy: 300, boom: 80, desc: 'คลื่นเสียงอัดกระแทก ผลักคู่ต่อสู้กระเด็นไกล' },
  crush: { name: 'Get Crushed', short: 'CRUSH', cd: 9, color: '#e0e0e0', kind: 'strike', pose: 'cast', dur: 0.45, fireAt: 0.2, delay: 0.45, radius: 80, dmg: 17, kb: 300, stun: 0.9, vy: 200, desc: 'คำสาป "จงบี้แบน" แรงอัดทับจุดที่ศัตรูยืน เร็วกว่า Nue' },
  ember: { name: 'Ember Insects', short: 'EMBER', cd: 7, color: '#ff9100', kind: 'proj', style: 'insect', pose: 'cast', dur: 0.7, fireAt: 0.25, charge: 14, speed: 760, dmg: 4.5, kb: 160, stun: 0.15, r: 12, life: 1.6, vy: 0, n: 6, gap: 0.1, offs: [-40, 10, -15, 35, -30, 0], small: true, desc: 'แมลงเพลิง 6 ตัวบินพุ่ง ดาเมจเบาแต่หลบยาก' },
  eruption: { name: 'Eruption', short: 'ERUPT', cd: 10, color: '#ff5722', kind: 'strike', pose: 'cast', dur: 0.6, fireAt: 0.3, delay: 0.8, radius: 105, dmg: 20, kb: 650, stun: 0.7, vy: 550, desc: 'ลาวาพุ่งจากพื้น ระเบิดใต้เท้าศัตรู' },
  tide: { name: 'Disaster Tide', short: 'TIDE', cd: 10, color: '#29b6f6', kind: 'proj', style: 'wave', pose: 'cast', dur: 0.8, fireAt: 0.45, charge: 34, speed: 620, dmg: 16, kb: 800, stun: 0.5, r: 48, life: 2, boom: 140, vy: 350, desc: 'คลื่นน้ำมหึมาจากคำสาปภัยพิบัติ ซัดทุกอย่างกระเด็น' },
  shoal: { name: 'Shikigami Shoal', short: 'SHOAL', cd: 8, color: '#4dd0e1', kind: 'proj', style: 'fish', pose: 'cast', dur: 0.8, fireAt: 0.25, charge: 14, speed: 820, dmg: 4, kb: 140, stun: 0.15, r: 12, life: 1.6, vy: 0, n: 7, gap: 0.09, offs: [-50, -30, -10, 10, 30, 50, 0], small: true, arrow: true, desc: 'ฝูงปลาชิกิงามิ 7 ตัว พุ่งไล่ต่อเนื่อง' },
  swarm: { name: 'Cursed Spirit Swarm', short: 'SWARM', cd: 9, color: '#9575cd', kind: 'proj', style: 'spirit', pose: 'cast', dur: 0.8, fireAt: 0.3, charge: 20, speed: 560, dmg: 5.5, kb: 220, stun: 0.2, r: 16, life: 2, vy: 0, n: 5, gap: 0.16, offs: [-55, -25, 0, 25, 55], small: true, desc: 'ปล่อยวิญญาณคำสาปที่ดูดซับไว้ 5 ตัวไล่โจมตี' },
  overtime: { name: 'Overtime', short: 'OVERTIME', cd: 15, color: '#ffeb3b', kind: 'amp', pose: 'cast', dur: 0.4, fireAt: 0.15, time: 5, mul: 1.3, desc: 'ทำงานล่วงเวลา ดาเมจทุกอย่าง +30% นาน 5 วิ' },
  train: { name: 'Private Pure Love Train', short: 'LOVE TRAIN', cd: 16, color: '#ff4081', kind: 'amp', pose: 'clap', dur: 0.5, fireAt: 0.2, time: 4, mul: 1.2, inv: 1.2, spd: 1.25, desc: 'รถไฟแห่งรักบริสุทธิ์ อมตะ 1.2 วิ ดาเมจ +20% วิ่งเร็วขึ้น 4 วิ' },
  flowing: { name: 'Flowing Red Scale', short: 'RED SCALE', cd: 14, color: '#e53935', kind: 'amp', pose: 'cast', dur: 0.4, fireAt: 0.15, time: 5, mul: 1.25, spd: 1.3, desc: 'เลือดไหลเวียนเร่งความเร็ว ดาเมจ +25% วิ่งเร็วขึ้น 5 วิ' },

  /* ---- สกิลคัตซีนสุดอลังการ 10 แบบ ---- */
  maxbf: { name: 'Black Flash: Overdrive', short: 'MAX BLACK FLASH', cd: 16, color: '#ff1744', kind: 'cutmelee', cut: 'bf3', pose: 'fire', fx: 'bf', dur: 0.52, win: [0.1, 0.28], dmg: 35, kb: 980, stun: 0.8, reach: 105, y: [-125, -20], lunge: 540, jp: '黒閃・極', desc: 'พุ่งคว้าตัวเข้าสู่คัตซีน Black Flash 3 จังหวะต่อเนื่อง ดาเมจแรง 35' },
  malevolentcut: { name: 'World Bisect', short: 'WORLD BISECT', cd: 17, color: '#ff5252', kind: 'cutmelee', cut: 'bisect', pose: 'fire', fx: 'slash', dur: 0.55, win: [0.12, 0.3], dmg: 33, kb: 920, stun: 0.85, reach: 145, y: [-130, 0], lunge: 420, jp: '世界を断つ斬撃', desc: 'ฟันผ่ามิติ เมื่อโดนเข้าสู่คัตซีนฉีกฉาก ดาเมจแรง 33' },
  hollowmax: { name: 'Unlimited Hollow', short: 'HOLLOW NUKE', cd: 18, color: '#d500f9', kind: 'cutblast', cut: 'hollow', pose: 'cast', dur: 0.95, fireAt: 0.45, charge: 56, dmg: 34, kb: 1060, stun: 0.9, range: 560, jp: '虚式・無限茈', desc: 'รวมน้ำเงิน+แดงเข้าสู่คัตซีน ระเบิดพลังม่วงทำลายทั้งฉาก ดาเมจ 34' },
  jacobs: { name: "Jacob's Ladder", short: 'JACOB LADDER', cd: 17, color: '#ffe57f', kind: 'cutblast', cut: 'jacob', pose: 'cast', dur: 0.9, fireAt: 0.4, charge: 48, dmg: 33, kb: 940, stun: 0.9, range: 580, jp: '邪去侮の梯子', desc: 'เสาแสงสวรรค์ทำลายล้างคำสาป + ล้างบัฟและลด CE ศัตรู 40 ดาเมจ 33' },
  mahoragacut: { name: 'Mahoraga: Divine Wheel', short: 'DIVINE WHEEL', cd: 16, color: '#ffd54f', kind: 'cutmelee', cut: 'mahoraga', pose: 'fire', fx: 'slash', dur: 0.55, win: [0.12, 0.3], dmg: 33, kb: 940, stun: 0.85, reach: 155, y: [-135, 0], lunge: 460, jp: '八握剣・魔虚羅', desc: 'กงล้อธรรมจักรหมุน 3 ครั้งแล้วอัญเชิญมาโฮราก้าฟันยับ ดาเมจ 33' },
  soulperfection: { name: '0.2s Soul Shatter', short: 'SOUL SHATTER', cd: 16, color: '#9ccc65', kind: 'cutmelee', cut: 'soul', pose: 'punch', fx: 'soul', dur: 0.5, win: [0.1, 0.28], dmg: 30, kb: 780, stun: 1.2, reach: 100, y: [-125, -20], lunge: 520, jp: '無為転変・極', desc: 'สัมผัสบิดเบือนวิญญาณเข้าคัตซีนแตกร้าว สตันยาว 1.2 วิ ดาเมจ 30' },
  maxmeteorcut: { name: 'Meteor Apocalypse', short: 'APOCALYPSE', cd: 18, color: '#ff6d00', kind: 'cutblast', cut: 'meteor', pose: 'cast', dur: 0.95, fireAt: 0.45, charge: 52, dmg: 36, kb: 1050, stun: 0.9, range: 560, jp: '極ノ番「隕」', desc: 'อุกกาบาตยักษ์ตกกระแทกกลางจอในคัตซีน ดาเมจสูงสุด 36' },
  uzumakicut: { name: 'Maximum: Uzumaki Vortex', short: 'MAX UZUMAKI', cd: 17, color: '#69f0ae', kind: 'cutblast', cut: 'uzumaki', pose: 'cast', dur: 0.9, fireAt: 0.45, charge: 52, dmg: 34, kb: 980, stun: 0.85, range: 560, jp: '極ノ番「うずまき」', desc: 'เกลียววิญญาณคำสาปนับพันกลืนกินศัตรูในคัตซีน ดาเมจ 34' },
  truegamble: { name: 'Fever Jackpot 777', short: 'FEVER 777', cd: 17, color: '#ff4081', kind: 'cutmelee', cut: 'gamble', pose: 'clap', fx: 'impact', dur: 0.5, win: [0.1, 0.28], dmg: 28, kb: 900, stun: 0.8, reach: 110, y: [-125, -15], lunge: 560, jp: '坐殺博徒・連撃', desc: 'ซัดเข้าคัตซีนสล็อต 777 ฟื้น HP ตัวเอง +12 และฟาดปิดท้าย ดาเมจ 28' },
  bloodrain: { name: 'Crimson Convergence', short: 'BLOOD LOTUS', cd: 16, color: '#ff2d55', kind: 'cutblast', cut: 'blood', pose: 'cast', dur: 0.85, fireAt: 0.4, charge: 44, dmg: 32, kb: 920, stun: 0.85, range: 560, jp: '穿血・百斂', desc: 'บีบอัดเลือดยิงทะลุรอบทิศในคัตซีน ดาเมจ 32' },
};
export const SKILL_IDS = Object.keys(SKILLS);

/* ticks: n ครั้งกระจายช่วง 1.15–3.5 วิ แล้วปิดท้ายด้วย final ที่ 3.85 วิ ก่อนเข้าสู่ช่วง Domain Linger (สู้กันต่อในโดเมน!) */
const spread = (n, dmg, fin, t0 = 1.15, t1 = 3.5, tf = 3.85) => [
  ...Array.from({ length: n }, (_, i) => ({ t: n > 1 ? t0 + (i * (t1 - t0)) / (n - 1) : t0, dmg, final: false })),
  { t: tf, dmg: fin, final: true },
];
/* โดเมน 13 แบบ — หลังเปิดโดเมนเสร็จ จะไม่หมดทันที แต่ค้างเป็นสนามสู้ต่อ 3.8-4.5 วิ พร้อมความสามารถพิเศษเฉพาะตัว! */
export const DOMAINS = {
  void: { name: 'Infinite Void', jp: '無量空処', sub: 'พรมแดนไร้ขีดจำกัด · ข้อมูลนิรันดร์', sign: 'cross', color: '#80d8ff',
    lingerDur: 4.2, dot: 1.3, ability: 'slow', lingerDesc: 'ค้าง 4.2 วิ: ศัตรูวิ่งช้าลง 45% + คูลดาวน์เดินช้าลงครึ่งหนึ่ง',
    desc: 'อวกาศไร้ขอบเขต ข้อมูลท่วมสมอง ค้างสนามหน่วงความเร็วศัตรู',
    ticks: spread(6, 2.8, 11), art: { name: 'Information Overload', fx: 'zap', dmg: 4, desc: 'ข้อมูลทะลักเข้าสมอง สายฟ้าฟาดใส่ตัวศัตรู' } },
  shrine: { name: 'Malevolent Shrine', jp: '伏魔御廚子', sub: 'ศาลเจ้ามารซ่อนเร้น · อารามต้องสาป', sign: 'enmaten', color: '#ff1744',
    lingerDur: 4.2, dot: 2.0, ability: 'slash', lingerDesc: 'ค้าง 4.2 วิ: ใบมีดสุ่มฟันต่อเนื่องแรงสุด + ทะลุเกราะป้องกัน',
    desc: 'ศาลเจ้าอาถรรพ์ ฟันสับไม่หยุดทั้งสนาม ค้างสนามปล่อยใบมีดถี่',
    ticks: spread(10, 2.0, 8), art: { name: 'Dismantle Barrage', fx: 'slash', dmg: 4, desc: 'ฟันถี่รัวทั่วร่างศัตรู' } },
  coffin: { name: 'Coffin of the Iron Mountain', jp: '蓋棺鉄囲山', sub: 'ภูเขาเหล็กลาวา · โลงศพเพลิงนรก', sign: 'raise', color: '#ff6d00',
    lingerDur: 4.2, dot: 1.5, ability: 'lava', lingerDesc: 'ค้าง 4.2 วิ: เสาลาวาปะทุใต้เท้าศัตรูเป็นระยะ (กระโดดหลบได้)',
    desc: 'ภูเขาเหล็กลาวา เสาไฟปะทุใส่คู่ต่อสู้ ค้างสนามปล่อยเสาลาวาต่อเนื่อง',
    ticks: spread(5, 5.0, 9), art: { name: 'Meteor Rain', fx: 'pillar', dmg: 5, desc: 'เสาไฟ 3 ต้นปะทุใต้เท้าศัตรู' } },
  gamble: { name: 'Idle Death Gamble', jp: '坐殺博徒', sub: 'บ่อนพนันมรณะ · แจ็กพอตนิรันดร์', sign: 'ring', color: '#ff4081', bg: ['#14001f', '#ff0080'],
    lingerDur: 4.5, dot: 1.2, ability: 'fever', lingerDesc: 'ค้าง 4.5 วิ: ผู้กางวิ่งเร็ว +25% และฟื้น HP +2.6/วิ ตลอดโดเมน',
    desc: 'สล็อตมรณะ โจมตีรัวถี่ ค้างสนามเข้าสู่ Fever ฟื้น HP ต่อเนื่อง',
    ticks: spread(14, 1.3, 11), art: { name: 'Jackpot Rush', fx: 'coin', dmg: 3, desc: 'ลุ้นแจ็กพอต ฟื้น HP ให้ตัวเอง 3' } },
  mahito: { name: 'Self-Embodiment of Perfection', jp: '自閉円頓裏', sub: 'สุญญตาบิดเบี้ยว · พรมแดนวิญญาณ', sign: 'mouth', color: '#9ccc65', bg: ['#0f1a10', '#5d4037'],
    lingerDur: 4.2, dot: 1.5, ability: 'drain', lingerDesc: 'ค้าง 4.2 วิ: ดูด CE ศัตรูตลอดเวลา + ฟื้น HP ผู้กางเล็กน้อย',
    desc: 'ดินแดนวิญญาณ บิดรูปวิญญาณ ค้างสนามดูด CE และกัดกร่อนต่อเนื่อง',
    ticks: spread(8, 2.4, 9), art: { name: 'Soul Distortion', fx: 'warp', dmg: 4, desc: 'บิดวิญญาณ ศัตรูสตันเพิ่ม 1 วิ' } },
  chimera: { name: 'Chimera Shadow Garden', jp: '嵌合暗翳庭', sub: 'สวนเงาอสูร · สิบเงาไร้ขอบเขต', sign: 'shadow', color: '#7c4dff', bg: ['#02020a', '#1b0f2e'],
    lingerDur: 4.4, dot: 1.3, ability: 'shadow', lingerDesc: 'ค้าง 4.4 วิ: คูลดาวน์สกิลผู้กางเร็วขึ้น 2 เท่า + หมาป่าเงาพุ่งกัด',
    desc: 'สวนเงามืด ชิกิงามิจากเงา ค้างสนามรีสกิลไว 2 เท่า + หมาป่าเงา',
    ticks: spread(8, 2.7, 9), art: { name: 'Shadow Wolves', fx: 'shadow', dmg: 4, desc: 'หมาป่าเงาพุ่งทะลุพื้นขึ้นมากัด' } },
  sentence: { name: 'Deadly Sentencing', jp: '誅伏賜死', sub: 'ศาลพิพากษาแห่งความตาย · ตัดสินผิด', sign: 'gavel', color: '#ffca28', bg: ['#0a0000', '#3a0a0a'],
    lingerDur: 4.0, dot: 1.2, ability: 'guilty', lingerDesc: 'ค้าง 4.0 วิ: ยึด CE ศัตรูเป็น 0 + ผู้กางตีแรงขึ้น +25%',
    desc: 'ศาลพิพากษา ปิดท้ายคำตัดสิน "ผิด" ค้างสนามยึด CE และตีแรงขึ้น',
    ticks: spread(5, 3.6, 11), art: { name: 'Gavel Strike', fx: 'gavel', dmg: 6, desc: 'ตุลาการทุบค้อน ดาเมจแรงสุดและหน้าจอค้าง' } },
  skandha: { name: 'Horizon of the Captivating Skandha', jp: '蕩蘊平線', sub: 'ขอบฟ้ามหานที · ทะเลลึกภัยพิบัติ', sign: 'raise', color: '#29b6f6', bg: ['#00111f', '#00518f'],
    lingerDur: 4.2, dot: 1.3, ability: 'tide', lingerDesc: 'ค้าง 4.2 วิ: ฝูงปลาชิกิงามิว่ายพุ่งชนจากขอบสนามต่อเนื่อง',
    desc: 'ทะเลลึกภัยพิบัติ ค้างสนามปล่อยฝูงปลาโจมตีทั้งสองฝั่ง',
    ticks: spread(12, 2.0, 8), art: { name: 'Disaster Tide', fx: 'wave', dmg: 4, desc: 'คลื่นยักษ์ซัดซ้ำหลายระลอก' } },
  mutual: { name: 'Authentic Mutual Love', jp: '真贋相愛', sub: 'รักแท้ไม่เสื่อมคลาย · พันธะแห่งริกะ', sign: 'ring', color: '#ff6bd6', bg: ['#1a0a2e', '#ff5ca8'],
    lingerDur: 4.2, dot: 1.4, ability: 'mutual', lingerDesc: 'ค้าง 4.2 วิ: ฟื้น HP +1.5/วิ + ผู้กางตีแรงขึ้น +20%',
    desc: 'ความรักที่แท้จริง ริกะช่วยโจมตี ค้างสนามฟื้น HP และเพิ่มดาเมจ',
    ticks: spread(7, 3.1, 11), art: { name: "Rika's Embrace", fx: 'rika', dmg: 5, desc: 'ริกะรัดร่างศัตรู ฟื้น HP ให้ตัวเอง 2' } },

  /* ---- โดเมนใหม่ 4 แบบ ---- */
  moon: { name: 'Time Cell Moon Palace', jp: '時胞月宮殿', sub: 'พระราชวังจันทรา · กฎ 24 เฟรม', sign: 'cross', color: '#ffee58', bg: ['#141008', '#423208'],
    lingerDur: 4.2, dot: 1.5, ability: 'fps', lingerDesc: 'ค้าง 4.2 วิ: ผู้กางเร็ว +35% + สุ่มแช่แข็งศัตรูในกรอบฟิล์ม 0.65 วิ',
    desc: 'บังคับกฎ 24 เฟรม/วิ ศัตรูขยับพลาดถูกแช่แข็งเป็นกรอบภาพ',
    ticks: spread(9, 2.2, 9), art: { name: '24 FPS Freeze', fx: 'zap', dmg: 4, desc: 'แช่แข็งศัตรูในเฟรมฟิล์มแล้วฟาดกระแทก' } },
  womb: { name: 'Womb Profusion', jp: '胎蔵遍野', sub: 'ครรภ์จักรวาล · แรงโน้มถ่วงบดขยี้', sign: 'enmaten', color: '#b388ff', bg: ['#0e0418', '#3c1556'],
    lingerDur: 4.2, dot: 1.5, ability: 'gravity', lingerDesc: 'ค้าง 4.2 วิ: แรงโน้มถ่วงศัตรูหนัก 2.2 เท่า + คลื่นแรงอัดกดลงพื้น',
    desc: 'เสาวิญญาณบดขยี้ด้วยแรงโน้มถ่วง ค้างสนามกดศัตรูให้กระโดดไม่ขึ้น',
    ticks: spread(6, 3.2, 10), art: { name: 'Gravity Crush', fx: 'gavel', dmg: 5, desc: 'แรงโน้มถ่วงอัดกระแทกศัตรูลงพื้นอย่างแรง' } },
  sphere: { name: 'Threefold Affliction', jp: '三重疾苦', sub: 'สามทุกขเวทนา · ทรงกลมสมบูรณ์', sign: 'raise', color: '#e0e0e0', bg: ['#0b0c10', '#2b303a'],
    lingerDur: 4.3, dot: 1.8, ability: 'sphere', lingerDesc: 'ค้าง 4.3 วิ: โลหะเหลวและทรงกลมสมบูรณ์พุ่งไล่ชนศัตรูไม่หยุด',
    desc: 'ทรงกลมแรงดันอนันต์ ค้างสนามยิงกระสุนโลหะเหลวจากขอบจอ',
    ticks: spread(8, 2.5, 10), art: { name: 'True Sphere', fx: 'warp', dmg: 5, desc: 'ทรงกลมสมบูรณ์บดอัดอากาศรอบตัวศัตรู' } },
  singularity: { name: 'Star Rage: Event Horizon', jp: '星の怒り・地平', sub: 'มวลอนันต์ · หลุมดำดูดกลืน', sign: 'mouth', color: '#00e5ff', bg: ['#00040f', '#002c4d'],
    lingerDur: 4.2, dot: 1.5, ability: 'pull', lingerDesc: 'ค้าง 4.2 วิ: หลุมดำดูดศัตรูเข้ากลางสนาม + หมัดเตะผู้กางแรง +35%',
    desc: 'เพิ่มมวลเสมือนสู่ขอบฟ้าเหตุการณ์ ค้างสนามดูดศัตรูเข้ากลางและตีหนักขึ้น',
    ticks: spread(7, 2.8, 11), art: { name: 'Virtual Mass Slam', fx: 'pillar', dmg: 5, desc: 'ทุ่มมวลมหาศาลระเบิดหลุมดำกลางสนาม' } },
};
export const DOMAIN_IDS = Object.keys(DOMAINS);

/* ด่าน 10 แบบ ข้อมูลล้วน วาดโดย drawBg (รวมด่านเกาะลอยฟ้าที่มีจุดปีน!) */
export const ARENAS = [
  { id: 'neon', name: 'Neon City', top: '#0a0030', bot: '#ff0080', floor: '#1a1033', edge: '#00e5ff', orbs: [{ x: 640, y: 340, r: 150, c: '#ffee58' }], city: { c: '#100826', w: ['#00e5ff', '#ff4081'] } },
  { id: 'skyisle', name: 'Floating Sanctum', top: '#0c1c3d', bot: '#69e2ff', floor: '#324256', edge: '#7dffb3', orbs: [{ x: 640, y: 190, r: 210, c: '#a7ffeb' }], clouds: true, stars: true,
    parts: { t: 'petal', c: '#b9f6ca' }, extra: 'sanctum',
    platforms: [
      { x1: 55, x2: 245, y: 445, theme: 'isle' },
      { x1: 155, x2: 345, y: 315, theme: 'isle' },
      { x1: 1035, x2: 1225, y: 445, theme: 'isle' },
      { x1: 935, x2: 1125, y: 315, theme: 'isle' },
      { x1: 510, x2: 770, y: 245, theme: 'shrine' },
    ],
    climbs: [
      { x: 205, y1: 315, y2: 560, kind: 'vine' },
      { x: 1075, y1: 315, y2: 560, kind: 'vine' },
      { x: 560, y1: 245, y2: 560, kind: 'chain' },
      { x: 720, y1: 245, y2: 560, kind: 'chain' },
    ] },
  { id: 'volcano', name: 'Volcano Arena', top: '#1a0500', bot: '#ff4500', floor: '#2b1109', edge: '#ff9100', orbs: [{ x: 640, y: 230, r: 190, c: '#ff6d00' }], mount: [{ c: '#1b0a06', base: 60, amp: 260, f: 0.0045, s: 1.2 }], parts: { t: 'ember', c: '#ffab40' }, extra: 'lava' },
  { id: 'sky', name: 'Sky Temple', top: '#1e3c72', bot: '#ffd1a9', floor: '#8d7b68', edge: '#fff59d', orbs: [{ x: 960, y: 200, r: 190, c: '#fff59d' }], clouds: true, extra: 'columns' },
  { id: 'shibuya', name: 'Shibuya Ruins', top: '#12001f', bot: '#7a1030', floor: '#241a28', edge: '#ff5252', orbs: [{ x: 300, y: 220, r: 130, c: '#ff8a80' }], city: { c: '#0b0610', w: ['#ff9100', '#ff5252'], broken: true }, parts: { t: 'ash', c: '#b0a0a8' } },
  { id: 'jjkhigh', name: 'Jujutsu High', top: '#3b1a5a', bot: '#ff9a5a', floor: '#3a2a20', edge: '#ffd180', orbs: [{ x: 640, y: 300, r: 170, c: '#ffe0b2' }], mount: [{ c: '#2a1838', base: 140, amp: 150, f: 0.004, s: 2 }, { c: '#1b0f26', base: 40, amp: 110, f: 0.006, s: 5 }], extra: 'torii', parts: { t: 'petal', c: '#ffb7c5' } },
  { id: 'colony', name: 'Culling Colony', top: '#001a14', bot: '#00c97a', floor: '#02241c', edge: '#00ffa6', city: { c: '#03140f', w: ['#00ffa6', '#00b8d4'] }, extra: 'grid', parts: { t: 'data', c: '#00ff9d' } },
  { id: 'void', name: 'Infinite Void', top: '#000010', bot: '#4a148c', floor: '#10002a', edge: '#ffffff', stars: true, orbs: [{ x: 420, y: 260, r: 230, c: '#7c4dff' }, { x: 900, y: 380, r: 190, c: '#00e5ff' }] },
  { id: 'tundra', name: 'Frozen Peak', top: '#06142e', bot: '#7fd8ff', floor: '#cfe9f5', edge: '#ffffff', stars: true, mount: [{ c: '#1c3a5e', base: 120, amp: 240, f: 0.004, s: 3 }, { c: '#2d5f8f', base: 40, amp: 140, f: 0.007, s: 7 }], extra: 'aurora', parts: { t: 'snow', c: '#ffffff' } },
  { id: 'graves', name: 'Cursed Graveyard', top: '#0a0010', bot: '#3d0a2e', floor: '#1c1424', edge: '#b388ff', orbs: [{ x: 640, y: 230, r: 150, c: '#ff1744' }], extra: 'graves', parts: { t: 'ash', c: '#b388ff' } },
];

export const CONTROLS = [
  { left: ['KeyA'], right: ['KeyD'], jump: ['KeyW'], block: ['KeyS'], punch: ['KeyF'], kick: ['KeyG'], s1: ['KeyH'], s2: ['KeyJ'], s3: ['KeyK'], dom: ['KeyL'] },
  { left: ['ArrowLeft'], right: ['ArrowRight'], jump: ['ArrowUp'], block: ['ArrowDown'], punch: ['Numpad1', 'Digit1'], kick: ['Numpad2', 'Digit2'],
    s1: ['Numpad3', 'Digit3'], s2: ['Numpad4', 'Digit4'], s3: ['Numpad5', 'Digit5'], dom: ['Numpad6', 'Digit6'] },
];

/* สกินของแต่ละตัวละคร (เปลี่ยนสี/พร็อพบนตัว Stickman จริงในสนาม!) */
export const SKINS = {
  gojo: [
    { id: 'default', name: 'Jujutsu Uniform', gear: 'blindfold', color: '#3dd6ff', desc: 'ผ้าปิดตาสีดำ + เนตรริคุกัน' },
    { id: 'shinjuku', name: 'Shinjuku White', gear: 'sunglasses', color: '#ffffff', desc: 'เสื้อคลุมขาวชินจูกุ + แว่นดำ' },
    { id: 'awakened', name: 'Honored One', gear: 'halo', color: '#c46bff', desc: 'ร่างตื่นรู้ + วงแหวนผู้ประเสริฐ' },
  ],
  sukuna: [
    { id: 'default', name: 'Yuji Vessel', gear: 'tattoos', color: '#ff2d55', desc: 'รอยสักราชาคำสาป + เนตรแดง' },
    { id: 'heian', name: 'Heian True Form', gear: 'heian', color: '#ff5252', desc: 'ร่างยุคเฮอัน 4 เนตรฉาน' },
    { id: 'meguna', name: 'Meguna (Shinjuku)', gear: 'wheel', color: '#ffd24a', desc: 'กงล้อธรรมจักรมาโฮราก้าบนศีรษะ' },
  ],
  yuji: [
    { id: 'default', name: 'Tokyo Uniform', gear: 'hoodie', color: '#ff8a3d', desc: 'ฮู้ดแดงโรงเรียนไสยเวท' },
    { id: 'shibuya', name: 'Black Flash Awake', gear: 'bfwrap', color: '#ff2d55', desc: 'ผ้าพันหมัดสายฟ้าดำ-แดง' },
    { id: 'shinjuku', name: 'Shinjuku Blood Arms', gear: 'claws', color: '#ff6bd6', desc: 'แขนกงเล็บโลหิต' },
  ],
  megumi: [
    { id: 'default', name: 'Ten Shadows', gear: 'shadowcape', color: '#c46bff', desc: 'ชุดนักไสยเวทเงา' },
    { id: 'mahoraga', name: 'Ritual Bearer', gear: 'wheel', color: '#ffd24a', desc: 'วงล้อพิธีกรรมสิบเงา' },
  ],
  nobara: [
    { id: 'default', name: 'Straw Doll', gear: 'ribbon', color: '#ff6bd6', desc: 'ชุดยูนิฟอร์มโตเกียว' },
    { id: 'shinjuku', name: 'Eyepatch Return', gear: 'eyepatch', color: '#ff8a3d', desc: 'ผ้าปิดตาซ้ายชินจูกุ' },
  ],
  nanami: [
    { id: 'default', name: 'Salaryman Sorcerer', gear: 'sunglasses', color: '#ffd24a', desc: 'แว่นกันแดด 7:3 + เนคไท' },
    { id: 'overtime', name: 'Overtime Unbound', gear: 'tie', color: '#ff8a3d', desc: 'เนคไทพันหมัดโหมดล่วงเวลา' },
  ],
  maki: [
    { id: 'default', name: 'Zenin Glasses', gear: 'sunglasses', color: '#7dff6b', desc: 'แว่นมองคำสาป' },
    { id: 'awakened', name: 'Perfect Restriction', gear: 'scarf', color: '#ffffff', desc: 'ผ้าพันคอผู้ไร้พลังสาปสมบูรณ์' },
  ],
  toji: [
    { id: 'default', name: 'Sorcerer Killer', gear: 'worm', color: '#ffffff', desc: 'วิญญาณคำสาปเก็บอาวุธพาดบ่า' },
    { id: 'shibuya', name: 'Shibuya Puppet', gear: 'scarf', color: '#ff2d55', desc: 'เสื้อยืดดำฟื้นคืนชีพ' },
  ],
  toge: [
    { id: 'default', name: 'High Collar', gear: 'collar', color: '#3dd6ff', desc: 'คอเสื้อปิดปากตรางู' },
    { id: 'jujutsu0', name: 'Vol. 0 Classic', gear: 'bandana', color: '#ffffff', desc: 'ชุดคลาสสิกภาค 0' },
  ],
  todo: [
    { id: 'default', name: 'Kyoto Muscle', gear: 'headband', color: '#ff8a3d', desc: 'ผ้าคาดหัว + ลวดลายต่อสู้' },
    { id: 'vibraslap', name: 'Shinjuku Vibraslap', gear: 'vibraslap', color: '#ffd24a', desc: 'มือขวา Vibraslap 50 ครั้ง/วิ' },
  ],
  yuta: [
    { id: 'default', name: 'Sendai White Coat', gear: 'whitecoat', color: '#ffffff', desc: 'เสื้อคลุมขาว + แหวนริกะ' },
    { id: 'rika', name: 'Ring Manifested', gear: 'halo', color: '#ff6bd6', desc: 'วงแหวนพลังคำสาปของริกะ' },
  ],
  mahito: [
    { id: 'default', name: 'Patchwork Curse', gear: 'stitches', color: '#7dff6b', desc: 'รอยเย็บบนใบหน้า' },
    { id: 'distorted', name: 'Instant Spirit Body', gear: 'armor', color: '#c46bff', desc: 'ร่างเกราะวิญญาณสมบูรณ์' },
  ],
  jogo: [
    { id: 'default', name: 'Volcano Head', gear: 'horns', color: '#ff8a3d', desc: 'ปล่องภูเขาไฟ + ตาเดียว' },
    { id: 'shibuya', name: 'Maximum Flame', gear: 'halo', color: '#ff2d55', desc: 'เปลวเพลิงภัยพิบัติเต็มขั้น' },
  ],
  hakari: [
    { id: 'default', name: 'Fight Club', gear: 'fur', color: '#ff6bd6', desc: 'เสื้อโค้ทขนฟูคลับใต้ดิน' },
    { id: 'jackpot', name: 'Immortal Fever', gear: 'halo', color: '#ffd24a', desc: 'ออร่าสล็อตอมตะ 4 นาที 11 วิ' },
  ],
  choso: [
    { id: 'default', name: 'Blood Brother', gear: 'pigtails', color: '#ff2d55', desc: 'แถบเลือดคาดสันจมูก' },
    { id: 'wingking', name: 'Wing King', gear: 'claws', color: '#ff8a3d', desc: 'ปีกโลหิตแห่งพี่น้องคำสาป' },
  ],
  higuruma: [
    { id: 'default', name: 'Defense Attorney', gear: 'tie', color: '#ffd24a', desc: 'ชุดสูททนาย + เข็มกลัด' },
    { id: 'shinjuku', name: 'Executioner', gear: 'halo', color: '#ffffff', desc: 'ผู้ถือดาบประหาร' },
  ],
  dagon: [
    { id: 'default', name: 'Cursed Womb', gear: 'tentacles', color: '#3dd6ff', desc: 'หนวดปลาหมึกวิญญาณคำสาป' },
    { id: 'evolved', name: 'Disaster Tide', gear: 'armor', color: '#7dff6b', desc: 'ร่างวิวัฒนาการเต็มตัว' },
  ],
  geto: [
    { id: 'default', name: 'Monk袈裟 Robe', gear: 'robe', color: '#c46bff', desc: 'จีวรนักบวชจอมบงการคำสาป' },
    { id: 'kenjaku', name: 'Kenjaku Stitch', gear: 'stitches', color: '#ff2d55', desc: 'รอยเย็บหน้าผาก + จีวรดำ' },
  ],
};

/* ตัวละคร: ชุดสกิล + Domain + พลังพิเศษประจำตัว */
export const CHARACTERS = {
  gojo: { name: 'GOJO', jp: '五条悟', color: '#3dd6ff', skills: ['blue', 'red', 'hollowmax'], domain: 'void', pas: { ce: 1.8 }, pasName: 'Six Eyes', pasDesc: 'Cursed Energy เต็มเร็วขึ้น ×1.8 กาง Domain ได้ไวกว่าใคร' },
  sukuna: { name: 'SUKUNA', jp: '両面宿儺', color: '#ff2d55', skills: ['cleave', 'malevolentcut', 'fuga'], domain: 'shrine', pas: { dmg: 1.1 }, pasName: 'King of Curses', pasDesc: 'ดาเมจทุกชนิด +10%' },
  yuji: { name: 'YUJI', jp: '虎杖悠仁', color: '#ff8a3d', skills: ['divergent', 'maxbf', 'manji'], domain: 'shrine', pas: { bf: 0.12 }, pasName: 'Black Flash Sense', pasDesc: 'ต่อย/เตะธรรมดามีโอกาส 12% เกิด Black Flash ดาเมจ ×2.2' },
  megumi: { name: 'MEGUMI', jp: '伏黒恵', color: '#c46bff', skills: ['dogs', 'nue', 'mahoragacut'], domain: 'chimera', pas: { cd: 0.85 }, pasName: 'Ten Shadows', pasDesc: 'คูลดาวน์สกิลลด 15%' },
  nobara: { name: 'NOBARA', jp: '釘崎野薔薇', color: '#ff6bd6', skills: ['hairpin', 'resonance', 'nailhammer'], domain: 'mahito', pas: { crit: 0.15 }, pasName: 'Straw Doll Aim', pasDesc: 'โจมตีมีโอกาส 15% ติดคริติคอล ดาเมจ ×1.6' },
  nanami: { name: 'NANAMI', jp: '七海建人', color: '#ffd24a', skills: ['ratio', 'overtime', 'cleave'], domain: 'sentence', pas: { crit: 0.25 }, pasName: 'Ratio Technique', pasDesc: 'จุดอ่อน 7:3 โอกาสคริติคอล 25% ดาเมจ ×1.6' },
  maki: { name: 'MAKI', jp: '禅院真希', color: '#7dff6b', skills: ['playful', 'mahoraga', 'projection'], domain: 'moon', pas: { speed: 1.3, basic: 1.25, ce: 0.5 }, pasName: 'Heavenly Restriction', pasDesc: 'วิ่งเร็ว ×1.3 ต่อย/เตะแรง +25% แต่ CE เต็มช้าลงครึ่งหนึ่ง' },
  toji: { name: 'TOJI', jp: '伏黒甚爾', color: '#ffffff', skills: ['invspear', 'playful', 'chain'], domain: 'void', pas: { speed: 1.35, basic: 1.35, ce: 0, guard: 0.9 }, pasName: 'Zero Cursed Energy', pasDesc: 'ไม่มี CE กาง Domain ไม่ได้ แต่วิ่ง ×1.35 ต่อย/เตะ +35% รับดาเมจ −10%' },
  toge: { name: 'TOGE', jp: '狗巻棘', color: '#3dd6ff', skills: ['speech', 'blastaway', 'crush'], domain: 'chimera', pas: { cd: 0.8 }, pasName: 'Cursed Speech', pasDesc: 'คูลดาวน์สกิลลด 20% ร่ายคำสาปถี่ขึ้น' },
  todo: { name: 'TODO', jp: '東堂葵', color: '#ff8a3d', skills: ['boogie', 'blackflash', 'divergent'], domain: 'singularity', pas: { basic: 1.15, bf: 0.1 }, pasName: 'Brotherhood', pasDesc: 'ต่อย/เตะ +15% และมีโอกาส 10% เกิด Black Flash' },
  yuta: { name: 'YUTA', jp: '乙骨憂太', color: '#ffffff', skills: ['rika', 'jacobs', 'dismantle'], domain: 'mutual', pas: { ce: 1.4 }, pasName: "Rika's Reserve", pasDesc: 'Cursed Energy มหาศาล เต็มเร็วขึ้น ×1.4' },
  mahito: { name: 'MAHITO', jp: '真人', color: '#7dff6b', skills: ['idle', 'soulperfection', 'rct'], domain: 'mahito', pas: { regen: 1.2 }, pasName: 'Soul Regeneration', pasDesc: 'ฟื้น HP 1.2 ต่อวินาที' },
  jogo: { name: 'JOGO', jp: '漏瑚', color: '#ff8a3d', skills: ['ember', 'maxmeteorcut', 'eruption'], domain: 'coffin', pas: { dmg: 1.06 }, pasName: 'Disaster Flames', pasDesc: 'ดาเมจทุกชนิด +6%' },
  hakari: { name: 'HAKARI', jp: '秤金次', color: '#ff6bd6', skills: ['train', 'jackpot', 'truegamble'], domain: 'gamble', pas: { regen: 1.5 }, pasName: 'Jackpot Body', pasDesc: 'ฟื้น HP 1.5 ต่อวินาที' },
  choso: { name: 'CHOSO', jp: '脹相', color: '#ff2d55', skills: ['piercing', 'bloodrain', 'flowing'], domain: 'sphere', pas: { guard: 0.9 }, pasName: 'Blood Armor', pasDesc: 'รับดาเมจลด 10%' },
  higuruma: { name: 'HIGURUMA', jp: '日車寛見', color: '#ffd24a', skills: ['executioner', 'cleave', 'invspear'], domain: 'sentence', pas: { dmg: 1.05, guard: 0.95 }, pasName: 'Judgeman', pasDesc: 'ดาเมจ +5% รับดาเมจ −5%' },
  dagon: { name: 'DAGON', jp: '陀艮', color: '#3dd6ff', skills: ['tide', 'shoal', 'rct'], domain: 'skandha', pas: { regen: 1 }, pasName: "Sea's Blessing", pasDesc: 'ฟื้น HP 1 ต่อวินาที' },
  geto: { name: 'GETO', jp: '夏油傑', color: '#c46bff', skills: ['uzumakicut', 'swarm', 'dogs'], domain: 'womb', pas: { cd: 0.9, ce: 1.2 }, pasName: 'Curse Manipulation', pasDesc: 'คูลดาวน์ลด 10% และ CE เต็มเร็วขึ้น ×1.2' },
};
export const CHAR_IDS = Object.keys(CHARACTERS);
