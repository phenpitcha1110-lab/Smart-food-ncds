const fs = require('fs');
const path = require('path');

// 1. BEVERAGES (74 รายการ)
const rawBeverages = [
  { id: 1, name: "น้ำเปล่า", nameEn: "Plain Water", volumeMl: 500, kcal: 0, group: "water_soda", groupThai: "น้ำเปล่า & โซดา" },
  { id: 2, name: "น้ำแร่", nameEn: "Mineral Water", volumeMl: 500, kcal: 0, group: "water_soda", groupThai: "น้ำเปล่า & โซดา" },
  { id: 3, name: "น้ำอัดลม", nameEn: "Cola / Carbonated Soft Drink", volumeMl: 325, kcal: 140, group: "water_soda", groupThai: "น้ำเปล่า & โซดา" },
  { id: 4, name: "น้ำอัดลมสูตรไม่มีน้ำตาล", nameEn: "Zero Sugar Soda", volumeMl: 325, kcal: 0, group: "water_soda", groupThai: "น้ำเปล่า & โซดา" },
  { id: 5, name: "น้ำหวาน", nameEn: "Sweet Flavored Drink", volumeMl: 250, kcal: 120, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 6, name: "น้ำแดง", nameEn: "Red Sala Syrup Drink", volumeMl: 250, kcal: 120, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 7, name: "น้ำเขียว", nameEn: "Green Cream Soda Syrup Drink", volumeMl: 250, kcal: 120, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 8, name: "น้ำส้ม", nameEn: "Orange Juice Drink", volumeMl: 250, kcal: 110, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 9, name: "น้ำมะนาว", nameEn: "Lime Juice (Sweetened)", volumeMl: 250, kcal: 100, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 10, name: "น้ำมะนาวไม่ใส่น้ำตาล", nameEn: "Fresh Lime Juice (No Sugar)", volumeMl: 250, kcal: 10, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 11, name: "น้ำผึ้งมะนาว", nameEn: "Honey Lime Drink", volumeMl: 250, kcal: 130, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 12, name: "น้ำกระเจี๊ยบ", nameEn: "Roselle Juice", volumeMl: 250, kcal: 100, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 13, name: "น้ำเก๊กฮวย", nameEn: "Chrysanthemum Tea", volumeMl: 250, kcal: 100, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 14, name: "น้ำใบเตย", nameEn: "Pandan Leaf Drink", volumeMl: 250, kcal: 80, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 15, name: "น้ำอัญชันมะนาว", nameEn: "Butterfly Pea Lime Juice", volumeMl: 250, kcal: 90, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 16, name: "น้ำตะไคร้", nameEn: "Lemongrass Drink", volumeMl: 250, kcal: 80, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 17, name: "น้ำมะตูม", nameEn: "Bael Fruit Drink", volumeMl: 250, kcal: 100, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 18, name: "น้ำลำไย", nameEn: "Longan Juice", volumeMl: 250, kcal: 140, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 19, name: "น้ำเฉาก๊วย", nameEn: "Grass Jelly Drink", volumeMl: 250, kcal: 120, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 20, name: "น้ำบ๊วย", nameEn: "Plum Drink", volumeMl: 250, kcal: 120, group: "herbal_sweet", groupThai: "น้ำสมุนไพร & น้ำหวาน" },
  { id: 21, name: "น้ำบ๊วยโซดา", nameEn: "Plum Soda", volumeMl: 300, kcal: 130, group: "water_soda", groupThai: "น้ำเปล่า & โซดา" },
  { id: 22, name: "แดงโซดา", nameEn: "Red Syrup Soda", volumeMl: 300, kcal: 100, group: "water_soda", groupThai: "น้ำเปล่า & โซดา" },
  { id: 23, name: "เขียวโซดา", nameEn: "Green Syrup Soda", volumeMl: 300, kcal: 100, group: "water_soda", groupThai: "น้ำเปล่า & โซดา" },
  { id: 24, name: "น้ำผึ้งมะนาวโซดา", nameEn: "Honey Lemon Soda", volumeMl: 300, kcal: 120, group: "water_soda", groupThai: "น้ำเปล่า & โซดา" },
  { id: 25, name: "กาแฟดำ", nameEn: "Black Coffee", volumeMl: 240, kcal: 5, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 26, name: "อเมริกาโน่ไม่หวาน", nameEn: "Iced / Hot Americano (Unsweetened)", volumeMl: 240, kcal: 5, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 27, name: "อเมริกาโน่น้ำผึ้ง", nameEn: "Honey Americano", volumeMl: 240, kcal: 80, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 28, name: "กาแฟโบราณ", nameEn: "Traditional Thai Coffee (Sweetened)", volumeMl: 250, kcal: 150, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 29, name: "โอเลี้ยง", nameEn: "O-Liang (Thai Iced Black Coffee)", volumeMl: 250, kcal: 120, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 30, name: "กาแฟเย็น", nameEn: "Thai Iced Coffee with Milk", volumeMl: 250, kcal: 180, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 31, name: "คาปูชิโน่", nameEn: "Cappuccino", volumeMl: 240, kcal: 120, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 32, name: "ลาเต้", nameEn: "Caffe Latte", volumeMl: 240, kcal: 130, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 33, name: "มอคค่า", nameEn: "Caffe Mocha", volumeMl: 240, kcal: 180, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 34, name: "เอสเพรสโซ่", nameEn: "Espresso Shot", volumeMl: 30, kcal: 5, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 35, name: "ชาร้อนไม่หวาน", nameEn: "Hot Tea (Unsweetened)", volumeMl: 240, kcal: 2, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 36, name: "ชาเขียวไม่หวาน", nameEn: "Green Tea (Unsweetened)", volumeMl: 240, kcal: 2, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 37, name: "ชาเขียวเย็น", nameEn: "Iced Green Tea (Mild)", volumeMl: 250, kcal: 100, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 38, name: "ชาเขียวหวาน", nameEn: "Sweet Iced Green Tea", volumeMl: 250, kcal: 120, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 39, name: "ชาไทยเย็น", nameEn: "Thai Iced Milk Tea", volumeMl: 250, kcal: 180, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 40, name: "ชานม", nameEn: "Milk Tea", volumeMl: 250, kcal: 180, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 41, name: "ชามะนาว", nameEn: "Lemon Iced Tea", volumeMl: 250, kcal: 100, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 42, name: "ชาดำเย็น", nameEn: "Black Iced Tea", volumeMl: 250, kcal: 120, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 43, name: "ชานมไข่มุก", nameEn: "Bubble Pearl Milk Tea", volumeMl: 500, kcal: 350, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 44, name: "มัทฉะลาเต้", nameEn: "Matcha Latte", volumeMl: 300, kcal: 180, group: "coffee_tea", groupThai: "กาแฟ & ชา" },
  { id: 45, name: "นมสดรสจืด", nameEn: "Plain Fresh Milk", volumeMl: 250, kcal: 150, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 46, name: "นมพร่องมันเนย", nameEn: "Low Fat Milk", volumeMl: 250, kcal: 110, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 47, name: "นมขาดมันเนย", nameEn: "Skim Milk", volumeMl: 250, kcal: 90, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 48, name: "นมรสหวาน", nameEn: "Sweetened Flavored Milk", volumeMl: 250, kcal: 180, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 49, name: "นมช็อกโกแลต", nameEn: "Chocolate Milk", volumeMl: 250, kcal: 190, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 50, name: "นมสตรอว์เบอร์รี", nameEn: "Strawberry Milk", volumeMl: 250, kcal: 180, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 51, name: "นมถั่วเหลืองไม่หวาน", nameEn: "Soy Milk (Unsweetened)", volumeMl: 250, kcal: 100, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 52, name: "นมถั่วเหลืองหวาน", nameEn: "Soy Milk (Sweetened)", volumeMl: 250, kcal: 140, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 53, name: "นมอัลมอนด์ไม่หวาน", nameEn: "Almond Milk (Unsweetened)", volumeMl: 250, kcal: 40, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 54, name: "นมอัลมอนด์หวาน", nameEn: "Almond Milk (Sweetened)", volumeMl: 250, kcal: 100, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 55, name: "โกโก้ร้อน", nameEn: "Hot Cocoa", volumeMl: 250, kcal: 150, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 56, name: "โกโก้เย็น", nameEn: "Iced Cocoa", volumeMl: 250, kcal: 200, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 57, name: "ไมโลร้อน", nameEn: "Hot Milo", volumeMl: 250, kcal: 160, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 58, name: "ไมโลเย็น", nameEn: "Iced Milo", volumeMl: 250, kcal: 200, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 59, name: "นมเย็น", nameEn: "Thai Iced Pink Milk (Nom Yen)", volumeMl: 250, kcal: 180, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 60, name: "นมชมพู", nameEn: "Pink Milk (Nom Chompoo)", volumeMl: 250, kcal: 180, group: "milk_cocoa", groupThai: "นม & โกโก้" },
  { id: 61, name: "น้ำมะพร้าว", nameEn: "Fresh Coconut Water", volumeMl: 250, kcal: 45, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 62, name: "น้ำส้มคั้น", nameEn: "Fresh Squeezed Orange Juice", volumeMl: 250, kcal: 110, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 63, name: "น้ำแอปเปิล", nameEn: "Apple Juice", volumeMl: 250, kcal: 115, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 64, name: "น้ำองุ่น", nameEn: "Grape Juice", volumeMl: 250, kcal: 150, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 65, name: "น้ำทับทิม", nameEn: "Pomegranate Juice", volumeMl: 250, kcal: 135, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 66, name: "น้ำแตงโมปั่น", nameEn: "Watermelon Smoothie", volumeMl: 300, kcal: 120, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 67, name: "น้ำสับปะรดปั่น", nameEn: "Pineapple Smoothie", volumeMl: 300, kcal: 160, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 68, name: "น้ำมะม่วงปั่น", nameEn: "Mango Smoothie", volumeMl: 300, kcal: 200, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 69, name: "น้ำกล้วยปั่น", nameEn: "Banana Smoothie", volumeMl: 300, kcal: 220, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 70, name: "น้ำมะละกอปั่น", nameEn: "Papaya Smoothie", volumeMl: 300, kcal: 160, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 71, name: "น้ำฝรั่งปั่น", nameEn: "Guava Smoothie", volumeMl: 300, kcal: 140, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 72, name: "น้ำสตรอว์เบอร์รีปั่น", nameEn: "Strawberry Smoothie", volumeMl: 300, kcal: 150, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 73, name: "น้ำเสาวรสปั่น", nameEn: "Passion Fruit Smoothie", volumeMl: 300, kcal: 160, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
  { id: 74, name: "สมูทตี้ผลไม้รวม", nameEn: "Mixed Fruit Smoothie", volumeMl: 300, kcal: 180, group: "juice_smoothie", groupThai: "น้ำผลไม้ & สมูทตี้" },
];

function buildBeverageNutrition(b) {
  let carbs = 0, sugar = 0, protein = 0, fat = 0, fiber = 0, sodium = 10;
  let gi = 'low';
  let suitability = 'good';
  let note = '';

  if (b.kcal === 0 || b.kcal <= 5) {
    carbs = 0; sugar = 0; protein = 0; fat = 0; sodium = b.name.includes('แร่') ? 15 : 5;
    gi = 'low';
    suitability = 'good';
    note = 'ปราศจากน้ำตาลและพลังงาน ปลอดภัยสูงสุดสำหรับผู้เป็นเบาหวาน';
  } else if (b.group === 'milk_cocoa') {
    if (b.name.includes('ไม่หวาน')) {
      carbs = Math.round(b.kcal * 0.04);
      sugar = 1;
      protein = b.name.includes('ถั่วเหลือง') ? 7 : (b.name.includes('อัลมอนด์') ? 1.5 : 8);
      fat = Math.round((b.kcal - (protein * 4 + carbs * 4)) / 9);
      gi = 'low';
      suitability = 'good';
      note = 'โปรตีนคุณภาพสูง น้ำตาลต่ำมาก เหมาะสำหรับดื่มเสริมมื้ออาหาร';
    } else {
      carbs = Math.round(b.kcal * 0.14);
      sugar = Math.round(carbs * 0.85);
      protein = 6;
      fat = Math.max(1, Math.round((b.kcal - (carbs * 4 + protein * 4)) / 9));
      gi = b.kcal > 160 ? 'high' : 'medium';
      suitability = b.kcal > 160 ? 'caution' : 'moderate';
      note = 'มีน้ำตาลและนมผสม ควรควบคุมปริมาณและจิบทีละน้อย';
    }
  } else if (b.group === 'juice_smoothie') {
    carbs = Math.round(b.kcal * 0.24);
    sugar = Math.round(carbs * 0.85);
    fiber = b.name.includes('ปั่น') || b.name.includes('สมูทตี้') ? 2 : 0.5;
    protein = 1;
    fat = 0;
    gi = b.sugar > 25 ? 'high' : 'medium';
    suitability = b.kcal > 150 ? 'caution' : 'moderate';
    note = 'มีฟรุกโตสและน้ำตาลธรรมชาติจากผลไม้ ควรระวังปริมาณคาร์บรวม';
  } else if (b.group === 'coffee_tea') {
    if (b.name.includes('ไม่หวาน') || b.kcal <= 10) {
      carbs = 0.5; sugar = 0; protein = 0.3; fat = 0;
      gi = 'low';
      suitability = 'good';
      note = 'ช่วยกระตุ้นการเผาผลาญ ไม่มีน้ำตาล ไม่ส่งผลต่อน้ำตาลในเลือด';
    } else {
      carbs = Math.round(b.kcal * 0.16);
      sugar = Math.round(carbs * 0.85);
      protein = b.name.includes('นม') || b.name.includes('ลาเต้') ? 4 : 1;
      fat = Math.max(0, Math.round((b.kcal - (carbs * 4 + protein * 4)) / 9));
      gi = b.kcal > 160 ? 'high' : 'medium';
      suitability = b.kcal > 160 ? 'caution' : 'moderate';
      note = 'มีน้ำตาล/นมข้นหวานผสม ควรจำกัดไม่เกิน 1 แก้วเล็ก';
    }
  } else {
    // water_soda or herbal_sweet
    if (b.kcal === 0 || b.name.includes('ไม่ใส่น้ำตาล')) {
      carbs = 1; sugar = 0; gi = 'low'; suitability = 'good';
      note = 'ไม่มีน้ำตาลผสม เหมาะสำหรับผู้ควบคุมเบาหวาน';
    } else {
      carbs = Math.round(b.kcal * 0.25);
      sugar = carbs;
      gi = 'high';
      suitability = 'caution';
      note = 'น้ำตาลสูง ดูดซึมเร็ว อาจทำให้ระดับน้ำตาลในเลือดพุ่งสูงขึ้นอย่างรวดเร็ว';
    }
  }

  return {
    id: `bev_${b.id}`,
    name: b.name,
    nameEn: b.nameEn,
    volumeMl: b.volumeMl,
    kcal: b.kcal,
    carbsG: carbs,
    sugarG: sugar,
    proteinG: protein,
    fatG: Math.max(0, fat),
    fiberG: fiber,
    sodiumMg: sodium,
    gi: gi,
    diabetesSuitability: suitability,
    categoryGroup: b.group,
    categoryGroupThai: b.groupThai,
    servingDesc: `${b.volumeMl} มล.`,
    healthNote: note,
  };
}

const beverageDataOutput = `export interface BeverageItem {
  id: string;
  name: string;
  nameEn: string;
  volumeMl: number;
  kcal: number;
  carbsG: number;
  sugarG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  gi: 'low' | 'medium' | 'high';
  diabetesSuitability: 'good' | 'moderate' | 'caution';
  categoryGroup: 'water_soda' | 'herbal_sweet' | 'coffee_tea' | 'milk_cocoa' | 'juice_smoothie';
  categoryGroupThai: string;
  servingDesc: string;
  healthNote: string;
}

export const BEVERAGE_MASTER_LIST: BeverageItem[] = ${JSON.stringify(rawBeverages.map(buildBeverageNutrition), null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/beverageData.ts'), beverageDataOutput);
console.log('Successfully wrote beverageData.ts with', rawBeverages.length, 'beverages');
