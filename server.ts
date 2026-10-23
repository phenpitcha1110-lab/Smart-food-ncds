import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
// In development, bind to port 3000 as required by the dev environment proxy.
// In production Cloud Run, listen on process.env.PORT (defaults to 8080).
const PORT = isProduction ? (Number(process.env.PORT) || 8080) : 3000;

// Body parser middleware with generous limits for image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Server-side Gemini API client helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoints (compatible with Cloud Run health probes & AI Studio)
app.get(["/health", "/api/health"], (_req, res) => {
  res.status(200).json({ status: "ok", mode: process.env.NODE_ENV || "development", timestamp: new Date().toISOString() });
});

// API Route: Analyze Meal Box Photo
// API Route: Analyze Meal Box Photo with Strict Food Image Identification & Calorie Analysis Rules
app.post("/api/analyze-meal-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", userProfile, customPrompt, loadCellWeights, hasLoadCell = false } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 in request body" });
    }

    // Clean base64 string if data URL prefix exists
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

    const ai = getGeminiClient();

    const systemInstruction = `
SYSTEM INSTRUCTION: AI NUTRITIONIST & FOOD IMAGE CALORIE ESTIMATOR
คุณคือ “AI นักโภชนาการคลินิก” (Clinical AI Nutritionist) ห้ามเดาแคลอรีรวมมั่วๆ ให้ตอบผู้ใช้ตามขั้นตอนต่อไปนี้เสมอ:

========================
ขั้นตอนการวิเคราะห์ 4 ขั้นตอน (MANDATORY 4 STEPS)
========================
1. บอกชื่อเมนูที่เห็นในรูป (ทั้งภาษาไทย และ ภาษาอังกฤษ)
   - ระบุชื่อเมนูให้ชัดเจน เช่น "ผัดกะเพราไก่ไข่ดาว (Stir-Fried Holy Basil with Chicken and Fried Egg)"
   - หากเห็นหลายเมนู ให้ระบุเมนูหลักและเมนูประกอบให้ครบถ้วน

2. แยกวัตถุดิบออกเป็นชิ้นๆ / ส่วนประกอบที่มองเห็นในภาพ และประเมินน้ำหนักเป็นกรัม (Estimated Weight in Grams)
   - แยกแจกแจงตามชิ้นส่วนจริง เช่น ข้าวสวย, อกไก่หั่นชิ้น, ใบกะเพราและพริกกระเทียม, ไข่ดาวทอดกรอบ, น้ำมันพืชสำหรับผัด, ผักเคียงแตงกวา
   - ประเมินน้ำหนักแต่ละชิ้นเป็นกรัมตามสัดส่วนมาตรฐานที่มองเห็นในจาน

3. ทำตารางสรุป แคลอรี (kcal), โปรตีน (g), คาร์บ (g), ไขมัน (g) ของวัตถุดิบแต่ละชิ้น
   - คำนวณคุณค่าทางโภชนาการของแต่ละชิ้นส่วนอย่างแม่นยำตามฐานข้อมูลโภชนาการ

4. รวมแคลอรีทั้งหมดเป็น "ช่วง" (เช่น "450 - 500 kcal" หรือ "520 - 580 kcal")
   - เนื่องจากปัจจัยที่มองไม่เห็นด้วยตาเปล่า เช่น ปริมาณน้ำมันที่ซึมในเนื้อสัตว์, น้ำตาลในซอสปรุงรส, หรือความเข้มข้นของเครื่องแกง

========================
คำแนะนำสำหรับผู้ป่วยเบาหวาน
========================
- ประเมินดัชนีน้ำตาล (Glycemic Index: low / medium / high)
- คำนวณคะแนนความปลอดภัยสำหรับเบาหวาน (diabetesSafetyScore 0-100)
- ให้คำแนะนำการปรับมื้ออาหาร เช่น "ลดข้าวสวยลง 1 ทัพพี", "ซับน้ำมันจากไข่ดาว", "เพิ่มผักต้มเคียง"
`;

    const userPromptText = `
กรุณาวิเคราะห์รูปภาพอาหารนี้ตามขั้นตอน AI นักโภชนาการ 4 ขั้นตอน:
1. บอกชื่อเมนูที่เห็นในรูป (ทั้งไทยและอังกฤษ)
2. แยกวัตถุดิบออกเป็นชิ้นๆ ที่มองเห็นในภาพ และประเมินน้ำหนักเป็นกรัม
3. ทำตารางสรุป แคลอรี, โปรตีน, คาร์บ, ไขมัน ของวัตถุดิบแต่ละชิ้น
4. รวมแคลอรีทั้งหมดเป็น "ช่วง" (เช่น 450 - 500 แคล)
- ประเมินน้ำหนักและแคลอรีได้ทันทีโดยไม่ต้องใช้เครื่องชั่งน้ำหนัก
- ข้อมูลผู้ป่วย: ${userProfile ? JSON.stringify(userProfile) : "ผู้ป่วยเบาหวาน ต้องการคุมคาร์บและน้ำตาล"}
${customPrompt ? `- รายละเอียดเพิ่มเติมที่ผู้ใช้ระบุ: ${customPrompt}` : ""}
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: userPromptText,
          },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isImageUnclear: {
              type: Type.BOOLEAN,
              description: "true หากภาพเบลอ มืด จนไม่เห็นอาหาร",
            },
            unclearImageMessage: {
              type: Type.STRING,
              description: "ข้อความหากภาพไม่ชัดเจน",
            },
            overallConfidence: {
              type: Type.STRING,
              description: "HIGH | MEDIUM | LOW",
            },
            dishNameThai: {
              type: Type.STRING,
              description: "ชื่อเมนูภาษาไทย เช่น ผัดกะเพราไก่ไข่ดาว",
            },
            dishNameEn: {
              type: Type.STRING,
              description: "ชื่อเมนูภาษาอังกฤษ เช่น Stir-Fried Holy Basil with Chicken and Fried Egg",
            },
            calorieRange: {
              type: Type.STRING,
              description: "ช่วงแคลอรีรวม เช่น 450 - 500 kcal",
            },
            overview: {
              type: Type.STRING,
              description: "สรุปภาพรวมของมื้ออาหาร",
            },
            formattedSummary: {
              type: Type.STRING,
              description: "ข้อความสรุปผลการวิเคราะห์ 4 ขั้นตอนแบบสมบูรณ์พร้อมตาราง",
            },
            ingredientsTable: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "ชื่อวัตถุดิบภาษาไทย" },
                  nameEn: { type: Type.STRING, description: "ชื่อวัตถุดิบภาษาอังกฤษ" },
                  estimatedWeightG: { type: Type.NUMBER, description: "น้ำหนักประเมิน (g)" },
                  kcal: { type: Type.NUMBER, description: "แคลอรี (kcal)" },
                  proteinG: { type: Type.NUMBER, description: "โปรตีน (g)" },
                  carbsG: { type: Type.NUMBER, description: "คาร์โบไฮเดรต (g)" },
                  fatG: { type: Type.NUMBER, description: "ไขมัน (g)" },
                  note: { type: Type.STRING, description: "หมายเหตุวัตถุดิบ" },
                },
                required: ["name", "estimatedWeightG", "kcal", "proteinG", "carbsG", "fatG"],
              },
            },
            diabetesSafetyScore: {
              type: Type.NUMBER,
              description: "คะแนนความเหมาะสมสำหรับเบาหวาน (0-100)",
            },
            clinicalSummary: {
              type: Type.STRING,
              description: "สรุปทางโภชนาการสำหรับผู้ป่วยเบาหวาน",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "คำแนะนำทางการแพทย์ 3-4 ข้อ",
            },
            notes: {
              type: Type.STRING,
              description: "หมายเหตุเพิ่มเติม เช่น ปัจจัยที่มองไม่เห็นด้วยตาเปล่า",
            },
            identifiedCompartments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slot: {
                    type: Type.STRING,
                    description: "carb | protein | vegetable | fruit",
                  },
                  slotTitleThai: {
                    type: Type.STRING,
                  },
                  foodName: {
                    type: Type.STRING,
                    description: "ชื่ออาหารในช่อง",
                  },
                  foodNameEn: {
                    type: Type.STRING,
                    description: "ชื่ออาหารภาษาอังกฤษ",
                  },
                  identificationStatus: {
                    type: Type.STRING,
                    description: "confirmed | ambiguous | not_found | unclear_image",
                  },
                  confidence: {
                    type: Type.STRING,
                    description: "HIGH | MEDIUM | LOW",
                  },
                  description: {
                    type: Type.STRING,
                  },
                  estimatedWeightG: {
                    type: Type.NUMBER,
                  },
                  glycemicIndex: {
                    type: Type.STRING,
                    description: "low | medium | high",
                  },
                  kcalPer100g: {
                    type: Type.NUMBER,
                  },
                  carbsPer100g: {
                    type: Type.NUMBER,
                  },
                  sugarPer100g: {
                    type: Type.NUMBER,
                  },
                  proteinPer100g: {
                    type: Type.NUMBER,
                  },
                  fatPer100g: {
                    type: Type.NUMBER,
                  },
                  fiberPer100g: {
                    type: Type.NUMBER,
                  },
                  sodiumPer100g: {
                    type: Type.NUMBER,
                  },
                  adviceForDiabetes: {
                    type: Type.STRING,
                  },
                  note: {
                    type: Type.STRING,
                  },
                },
                required: [
                  "slot",
                  "slotTitleThai",
                  "foodName",
                  "identificationStatus",
                  "confidence",
                  "description",
                  "estimatedWeightG",
                  "glycemicIndex",
                  "kcalPer100g",
                  "carbsPer100g",
                  "sugarPer100g",
                  "proteinPer100g",
                  "fatPer100g",
                  "fiberPer100g",
                  "sodiumPer100g",
                  "adviceForDiabetes",
                ],
              },
            },
          },
          required: [
            "isImageUnclear",
            "overallConfidence",
            "dishNameThai",
            "dishNameEn",
            "calorieRange",
            "overview",
            "formattedSummary",
            "ingredientsTable",
            "diabetesSafetyScore",
            "clinicalSummary",
            "recommendations",
            "identifiedCompartments",
          ],
        },
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    res.json({
      success: true,
      result: parsedData,
    });
  } catch (error: any) {
    console.error("Error analyzing meal photo:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze meal photo",
    });
  }
});

// API Route: Calculate Meal Nutrition with AI (Gemini 3.7 Flash)
app.post("/api/calculate-meal-nutrition", async (req, res) => {
  try {
    const { dishName, totalWeightG, calculationMode, ingredients, userProfile, additionalFoods } = req.body;

    if (!dishName && (!additionalFoods || additionalFoods.length === 0)) {
      return res.status(400).json({ error: "Missing dishName or additional foods" });
    }

    const ai = getGeminiClient();

    const additionalFoodsStr = Array.isArray(additionalFoods) && additionalFoods.length > 0
      ? additionalFoods.map((item: any) => typeof item === 'string' ? item : `${item.name || ''} ${item.weightG ? `(${item.weightG}g)` : ''}`).filter(Boolean).join(", ")
      : "";

    const systemInstruction = `
คุณเป็นนักกำหนดอาหารคลินิกและผู้เชี่ยวชาญโรคเบาหวาน (Clinical Nutritionist & Certified Diabetes Specialist)
หน้าที่ของคุณคือประเมินและคำนวณคุณค่าทางโภชนาการที่แม่นยำทางคลินิกสำหรับมื้ออาหารของผู้ป่วยเบาหวาน
โดยผู้ใช้ระบุ:
1. ชื่อเมนูอาหารหลัก (dishName) และรายการอาหารเสริม/เครื่องดื่ม/ของว่างอื่นในมื้อเดียวกัน (additionalFoods)
2. วัตถุดิบและส่วนประกอบที่เลือกหรือมีในเมนู (ingredients)
3. ระบบจะประเมินแคลอรีและสารอาหารจากชื่อเมนูและสัดส่วนวัตถุดิบมาตรฐาน (ไม่ต้องชั่งน้ำหนักจริง)

ให้ประเมินและคำนวณ:
- totalKcal: พลังงานรวมประเมินของมื้อนี้ (kcal)
- totalCarbsG: คาร์โบไฮเดรตรวม (g)
- totalSugarG: น้ำตาลอิสระรวม (g)
- totalProteinG: โปรตีนรวม (g)
- totalFatG: ไขมันรวม (g)
- totalFiberG: ใยอาหารรวม (g)
- totalSodiumMg: โซเดียมรวม (mg)
- glycemicIndex: 'low' | 'medium' | 'high'
- diabetesSafetyScore: คะแนนความปลอดภัยสำหรับผู้ป่วยเบาหวาน (0 - 100)
- status: 'optimal' | 'warning' | 'danger'
- alertTitle: หัวข้อประเมินความปลอดภัยมื้อนี้ (สั้น กระชับ ชัดเจน)
- alertDescription: คำอธิบายและคำแนะนำสัดส่วนอาหารสำหรับผู้ป่วยเบาหวาน
- ingredientBreakdown: รายการวัตถุดิบแต่ละชนิดที่ประเมิน พร้อมน้ำหนักประเมิน (g), แคลอรี (kcal), และคาร์บ (g)

ตอบเป็น JSON ที่ตรงตาม schema กำหนดเท่านั้น
`;

    const promptText = `
กรุณาประเมินโภชนาการสำหรับมื้ออาหารนี้:
- ชื่อเมนูอาหารหลัก: "${dishName || 'มื้ออาหารสุขภาพ'}"
${additionalFoodsStr ? `- รายการอาหารอื่นๆ ที่รับประทานร่วมในมื้อนี้: "${additionalFoodsStr}"` : ""}
- สัดส่วน/วัตถุดิบที่เลือก: ${ingredients && ingredients.length > 0 ? JSON.stringify(ingredients) : "ประเมินตามสูตรและขนาดบริโภคมาตรฐานของเมนู"}
- ข้อมูลผู้ป่วย: ${userProfile ? `อายุ ${userProfile.age} ปี, ภาวะ: ${userProfile.condition}, เป้าหมายคาร์บต่อมื้อ: ${userProfile.targetCarbsPerMealG || 35}g` : "ผู้ป่วยเบาหวานทั่วไป"}
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalKcal: { type: Type.NUMBER, description: "พลังงานรวม (kcal)" },
            totalCarbsG: { type: Type.NUMBER, description: "คาร์โบไฮเดรตรวม (g)" },
            totalSugarG: { type: Type.NUMBER, description: "น้ำตาลรวม (g)" },
            totalProteinG: { type: Type.NUMBER, description: "โปรตีนรวม (g)" },
            totalFatG: { type: Type.NUMBER, description: "ไขมันรวม (g)" },
            totalFiberG: { type: Type.NUMBER, description: "ใยอาหารรวม (g)" },
            totalSodiumMg: { type: Type.NUMBER, description: "โซเดียมรวม (mg)" },
            glycemicIndex: { type: Type.STRING, description: "low | medium | high" },
            diabetesSafetyScore: { type: Type.NUMBER, description: "0 - 100" },
            status: { type: Type.STRING, description: "optimal | warning | danger" },
            alertTitle: { type: Type.STRING },
            alertDescription: { type: Type.STRING },
            ingredientBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  weightGrams: { type: Type.NUMBER },
                  kcal: { type: Type.NUMBER },
                  carbsG: { type: Type.NUMBER },
                  proteinG: { type: Type.NUMBER },
                  sugarG: { type: Type.NUMBER },
                },
                required: ["name", "weightGrams", "kcal", "carbsG"],
              },
            },
          },
          required: [
            "totalKcal",
            "totalCarbsG",
            "totalSugarG",
            "totalProteinG",
            "totalFatG",
            "totalFiberG",
            "totalSodiumMg",
            "glycemicIndex",
            "diabetesSafetyScore",
            "status",
            "alertTitle",
            "alertDescription",
            "ingredientBreakdown",
          ],
        },
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    res.json({
      success: true,
      result: parsedData,
    });
  } catch (error: any) {
    console.error("Error calculating meal nutrition with AI:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to calculate nutrition with AI",
    });
  }
});

// API Route: AI Lookup Ingredient Density (user only types ingredient name)
app.post("/api/ai-lookup-ingredient", async (req, res) => {
  try {
    const { ingredientName } = req.body;
    if (!ingredientName) {
      return res.status(400).json({ error: "Missing ingredientName" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
คุณเป็นผู้เชี่ยวชาญด้านฐานข้อมูลอาหารและโภชนาการไทย (Thai Food Nutrition Database)
ให้ระบุค่าโภชนาการมาตรฐานต่อ 100 กรัม (per 100g) สำหรับวัตถุดิบ/อาหารที่ระบุ
ตอบเป็น JSON เท่านั้น
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `กรุณาระบุค่าโภชนาการต่อ 100g สำหรับวัตถุดิบ: "${ingredientName}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING, description: "carb | protein | vegetable | fruit | condiment | fat" },
            kcalPer100g: { type: Type.NUMBER },
            carbsPer100g: { type: Type.NUMBER },
            sugarPer100g: { type: Type.NUMBER },
            proteinPer100g: { type: Type.NUMBER },
            fatPer100g: { type: Type.NUMBER },
            fiberPer100g: { type: Type.NUMBER },
            sodiumPer100g: { type: Type.NUMBER },
            glycemicIndex: { type: Type.STRING, description: "low | medium | high" },
            giNote: { type: Type.STRING },
          },
          required: [
            "name",
            "category",
            "kcalPer100g",
            "carbsPer100g",
            "sugarPer100g",
            "proteinPer100g",
            "fatPer100g",
            "fiberPer100g",
            "sodiumPer100g",
            "glycemicIndex",
          ],
        },
      },
    });

    const responseText = response.text || "{}";
    const parsedData = JSON.parse(responseText);

    res.json({
      success: true,
      result: parsedData,
    });
  } catch (error: any) {
    console.error("Error looking up ingredient with AI:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to lookup ingredient",
    });
  }
});

async function startServer() {
  // Vite middleware in dev
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const candidatePaths = [
      path.join(process.cwd(), "dist"),
      __dirname,
      path.join(__dirname, "dist"),
    ];
    const distPath = candidatePaths.find((p) => fs.existsSync(path.join(p, "index.html"))) || candidatePaths[0];

    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("AI Nutrition Meal Estimator Service is active");
      }
    });
  }

  // Primary listener
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} [mode: ${process.env.NODE_ENV || "development"}]`);
  });

  // In production, if PORT is not 3000, also bind 3000 as secondary listener
  // to ensure backwards compatibility with any local reverse proxy
  if (isProduction && PORT !== 3000) {
    try {
      const secondaryServer = app.listen(3000, "0.0.0.0", () => {
        console.log(`Secondary listener active on http://0.0.0.0:3000`);
      });
      secondaryServer.on("error", (err: any) => {
        // Port 3000 might already be occupied; safe to continue on primary port
        console.log(`Secondary port 3000 notice: ${err.message}`);
      });
    } catch (e: any) {
      console.log(`Secondary listener setup skipped: ${e.message}`);
    }
  }
}

startServer();
