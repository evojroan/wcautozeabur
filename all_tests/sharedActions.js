import alltests from "./alltests.js";
import allconsts from "./allconsts.js";
import { test,logisticsType,autoIssue } from "./config.js";
import fs from "fs"; // 引入 Node.js 的檔案系統模組
import path from "path"; // 引入 Node.js 的路徑模組
import { createWorker } from "tesseract.js";
import sharp from "sharp";

import dotenv from 'dotenv';
dotenv.config();

// --- 新增日誌記錄功能 ---
let logFilePath = null; // 將 logFilePath 的計算延遲
const originalConsoleLog = console.log; // 保存原始的 console.log 功能

console.log = function (...args) {
  // 第一次呼叫 console.log 時才計算 logFilePath 並確保目錄存在
  if (!logFilePath) {
    try {
      // 檢查 test 是否已定義
      if (typeof test === "undefined") {
        throw new Error("從 test000.js 匯入的 'test' 變數尚未準備好。");
      }
      const recordsDir = path.join(process.cwd(), "records", test);
      // 確保日誌目錄存在，如果不存在則創建 (recursive: true 會創建所有層級的目錄)
      if (!fs.existsSync(recordsDir)) {
        fs.mkdirSync(recordsDir, { recursive: true });
        originalConsoleLog(`已創建日誌目錄: ${recordsDir}`); // 增加提示訊息
      }
      logFilePath = path.join(recordsDir, `${test}_log.txt`); // 計算完整的日誌檔案路徑
    } catch (error) {
      originalConsoleLog("初始化日誌檔案路徑時發生錯誤:", error);
      // 如果初始化失敗，仍然執行原始的 console.log
      originalConsoleLog.apply(console, args);
      return; // 終止此次日誌記錄到檔案的動作
    }
  }

  const timestamp = new Date().toISOString(); // 獲取 ISO 格式的時間戳
  // 將所有參數轉換為字串，物件會用 JSON.stringify 處理
  const message = args
    .map((arg) => {
      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2); // 美化 JSON 輸出
        } catch (e) {
          return "[無法序列化的物件]"; // 處理循環引用等錯誤
        }
      }
      return String(arg); // 其他類型直接轉字串
    })
    .join(" "); // 用空格連接多個參數

  const logLine = `[${timestamp}] ${message}\n`; // 組合日誌行

  try {
    // 確保 logFilePath 已經成功設定
    if (logFilePath) {
      fs.appendFileSync(logFilePath, logLine); // 同步寫入檔案（追加模式）
    } else {
      originalConsoleLog("日誌檔案路徑未設定，無法寫入檔案。");
    }
  } catch (err) {
    // 如果寫入檔案失敗，在原始 console 輸出錯誤訊息
    originalConsoleLog("無法寫入日誌檔案:", err, "路徑:", logFilePath);
  }

  // 執行原始的 console.log，確保訊息仍然顯示在終端機
  originalConsoleLog.apply(console, args);
};
// --- 日誌記錄功能結束 ---

// --- 安全截圖功能 ---
async function safeScreenshot(page, locator, options = {}) {
  const { 
    path, 
    timeout = 15000, 
    retries = 2, 
    fallbackToPage = true,
    waitForStable = true 
  } = options;
  
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      if (waitForStable && locator) {
        // 如果是 locator 截圖，確保元素穩定
        await locator.waitFor({ state: 'visible', timeout: timeout / 2 });
        await page.waitForTimeout(300); // 減少等待時間，從1000ms降至300ms
      }
      
      if (locator) {
        // 元素截圖
        await locator.screenshot({ path, timeout });
      } else {
        // 頁面截圖
        await page.screenshot({ path, timeout, fullPage: true });
      }
      
      console.log(`截圖成功: ${path}`);
      return true;
      
    } catch (error) {
      attempt++;
      console.log(`截圖失敗 (第${attempt}次嘗試): ${error.message}`);
      
      if (attempt <= retries) {
        console.log("等待後重試...");
        await page.waitForTimeout(2000);
      } else if (fallbackToPage && locator) {
        // 如果是元素截圖失敗，嘗試頁面截圖
        try {
          const fallbackPath = path.replace('.png', '_fullpage.png');
          await page.screenshot({ 
            path: fallbackPath, 
            timeout, 
            fullPage: true 
          });
          console.log(`已改用頁面截圖: ${fallbackPath}`);
          return true;
        } catch (pageError) {
          console.log(`頁面截圖也失敗: ${pageError.message}`);
          return false;
        }
      } else {
        console.log(`所有截圖嘗試都失敗了: ${path}`);
        return false;
      }
    }
  }
  return false;
}
// --- 安全截圖功能結束 ---

// --- 安全元素等待功能 ---
async function safeWaitForSelector(page, selector, options = {}) {
  const {
    state = 'visible',
    timeout = 15000,
    retries = 3,
    reloadOnFail = true,
    description = selector
  } = options;
  
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      console.log(`等待元素 ${description}... (嘗試 ${attempt + 1}/${retries})`);
      await page.waitForSelector(selector, { state, timeout });
      console.log(`元素 ${description} 已載入`);
      return true;
      
    } catch (error) {
      attempt++;
      console.log(`等待元素 ${description} 失敗 (第${attempt}次): ${error.message}`);
      
      if (attempt < retries) {
        if (reloadOnFail) {
          console.log("嘗試重新整理頁面...");
          await page.reload({ waitUntil: 'networkidle' });
          await page.waitForTimeout(3000);
        } else {
          await page.waitForTimeout(2000);
        }
      }
    }
  }
  
  console.log(`已達最大重試次數，元素 ${description} 仍未出現`);
  return false;
}
// --- 安全元素等待功能結束 ---

// --- 頁面診斷功能 ---
async function diagnosePage(page, test, description = "頁面診斷") {
  console.log(`🔬 開始${description}...`);
  
  try {
    // 1. 截圖當前頁面狀態
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    await page.screenshot({ 
      path: `records/${test}/診斷-${description}-${timestamp}.png`,
      fullPage: true 
    });
   
    
    // 2. 獲取頁面基本資訊
    const pageInfo = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      hasErrors: !!document.querySelector('.woocommerce-error, .error, [class*="error"]')
    }));
   
    
    // 3. 檢查所有表單元素
    const formElements = await page.$$eval('select, input[type="text"], input[type="email"], input[type="radio"], input[type="checkbox"]', elements =>
      elements.map(el => ({
        tag: el.tagName,
        type: el.type || 'select',
        id: el.id,
        name: el.name,
        className: el.className,
        visible: el.offsetWidth > 0 && el.offsetHeight > 0,
        options: el.tagName === 'SELECT' ? Array.from(el.options).map(opt => ({ value: opt.value, text: opt.textContent.trim() })) : null
      }))
    );
  
    
    // 4. 檢查是否有錯誤訊息
    const errorMessages = await page.$$eval('.woocommerce-error, .error, [class*="error"]', elements =>
      elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
    );
    if (errorMessages.length > 0) {
      console.log("❌ 發現錯誤訊息:", errorMessages);
    }
    
  } catch (error) {
    console.log("診斷過程發生錯誤:", error.message);
  }
}
// --- 頁面診斷功能結束 ---

//登入綠界廠商管理後台的圖片辨識 - Captcha
async function preprocessImage(imageBuffer, method = 'aggressive') {
  try {
      console.log(`開始圖像預處理 (${method} 模式)...`);
      
      let processedBuffer;
      
      if (method === 'aggressive') {
          // 激進模式 - 強力移除線條
          processedBuffer = await sharp(imageBuffer)
              .greyscale()
              .resize(300, 120, { // 更大的放大倍數
                  kernel: sharp.kernel.cubic,
                  fit: 'fill'
              })
              .normalize()
              .gamma(1.5) // 更強的 gamma 調整
              .blur(0.3) // 輕微模糊以連接斷開的字符
              .threshold(100) // 更低的閾值
              .median(2) // 更強的中值濾波
              // 連續使用多個卷積核移除不同方向的線條
              .convolve({ // 移除水平線
                  width: 5,
                  height: 1,
                  kernel: [-1, -1, -1, -1, -1]
              })
              .convolve({ // 移除垂直線
                  width: 1,
                  height: 5,
                  kernel: [-1, -1, -1, -1, -1]
              })
              .convolve({ // 銳化數字邊緣
                  width: 3,
                  height: 3,
                  kernel: [
                      -1, -2, -1,
                      -2, 13, -2,
                      -1, -2, -1
                  ]
              })
              .threshold(130)
              .median(1) // 最後清理
              .png()
              .toBuffer();
      } else if (method === 'conservative') {
          // 保守模式 - 溫和處理
          processedBuffer = await sharp(imageBuffer)
              .greyscale()
              .resize(240, 96, {
                  kernel: sharp.kernel.nearest,
                  fit: 'fill'
              })
              .normalize()
              .gamma(1.3)
              .threshold(115)
              .median(1)
              .convolve({
                  width: 3,
                  height: 3,
                  kernel: [
                      0, -1, 0,
                      -1, 5, -1,
                      0, -1, 0
                  ]
              })
              .threshold(128)
              .png()
              .toBuffer();
      } else {
          // 原始模式 - 基本處理
          processedBuffer = await sharp(imageBuffer)
              .greyscale()
              .resize(200, 80, {
                  kernel: sharp.kernel.nearest,
                  fit: 'fill'
              })
              .normalize()
              .threshold(120)
              .png()
              .toBuffer();
      }
      
      console.log(`圖像預處理完成 (${method} 模式)`);
      return processedBuffer;
  } catch (error) {
      console.error("圖像預處理失敗:", error);
      return imageBuffer;
  }
}

async function recognizeWithMultipleConfigs(imageBuffer) {
  const configs = [
      {
          name: "激進清理配置",
          params: {
              tessedit_char_whitelist: "0123456789",
              tessedit_pageseg_mode: "6",
              tessedit_ocr_engine_mode: "1",
              classify_enable_learning: "0",
              classify_enable_adaptive_matcher: "0",
              textord_noise_rejwords: "1",
              textord_noise_rejrows: "1",
              textord_noise_normratio: "2",
              textord_noise_syfract: "0.2",
              textord_noise_sizefract: "0.1"
          }
      },
      {
          name: "單字模式強化",
          params: {
              tessedit_char_whitelist: "0123456789",
              tessedit_pageseg_mode: "8",
              tessedit_ocr_engine_mode: "2",
              classify_max_rating: "10.0",
              classify_max_certainty_margin: "4.5",
              textord_noise_rejwords: "1",
              edges_max_children_per_outline: "10"
          }
      },
      {
          name: "原始引擎配置",
          params: {
              tessedit_char_whitelist: "0123456789",
              tessedit_pageseg_mode: "7",
              tessedit_ocr_engine_mode: "0", // 只使用傳統引擎
              classify_enable_learning: "0",
              textord_noise_rejwords: "1",
              textord_noise_rejrows: "1"
          }
      },
      {
          name: "混合引擎配置",
          params: {
              tessedit_char_whitelist: "0123456789",
              tessedit_pageseg_mode: "13", // Raw line. Treat the image as a single text line
              tessedit_ocr_engine_mode: "2",
              preserve_interword_spaces: "0",
              textord_noise_rejwords: "1"
          }
      },
      {
          name: "字符分割配置",
          params: {
              tessedit_char_whitelist: "0123456789",
              tessedit_pageseg_mode: "10", // Treat the image as a single character
              tessedit_ocr_engine_mode: "1",
              classify_enable_learning: "0"
          }
      }
  ];

  const results = [];
  
  for (const config of configs) {
      try {
          console.log(`嘗試${config.name}識別...`);
          const worker = await createWorker("eng", 1);
          await worker.setParameters(config.params);
          
          const { data: { text, confidence } } = await worker.recognize(imageBuffer);
          await worker.terminate();
          
          const cleanedText = text.replace(/\D/g, "");
          
          if (cleanedText.length >= 3 && cleanedText.length <= 5) { // 放寬條件
              results.push({
                  text: cleanedText,
                  confidence: confidence,
                  config: config.name,
                  length: cleanedText.length
              });
              console.log(`${config.name}識別結果: ${cleanedText} (信心度: ${confidence.toFixed(2)}%, 長度: ${cleanedText.length})`);
          }
      } catch (error) {
          console.error(`${config.name}識別失敗:`, error);
      }
  }
  
  if (results.length === 0) {
      return null;
  }
  
  // 優先選擇4位數的結果，其次選擇信心度最高的
  const fourDigitResults = results.filter(r => r.length === 4);
  
  if (fourDigitResults.length > 0) {
      const bestFourDigit = fourDigitResults.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
      );
      console.log(`最佳4位數結果: ${bestFourDigit.text} (${bestFourDigit.config}, 信心度: ${bestFourDigit.confidence.toFixed(2)}%)`);
      return bestFourDigit.text;
  }
  
  // 如果沒有4位數結果，選擇信心度最高的並調整
  const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
  );
  
  let finalResult = bestResult.text;
  if (finalResult.length > 4) {
      finalResult = finalResult.substring(0, 4);
      console.log(`截取前4位: ${finalResult}`);
  } else if (finalResult.length === 3) {
      // 如果只有3位，可能是識別遺漏，但仍然嘗試
      console.log(`只識別到3位數字: ${finalResult}，將嘗試使用`);
  }
  
  console.log(`最終識別結果: ${finalResult} (${bestResult.config}, 信心度: ${bestResult.confidence.toFixed(2)}%)`);
  return finalResult;
}

async function recognizeWithMultipleStrategies(captchaBuffer) {
  const strategies = [
      { name: "激進預處理", preprocess: "aggressive" },
      { name: "保守預處理", preprocess: "conservative" },
      { name: "原始預處理", preprocess: "original" }
  ];
  
  const allResults = [];
  
  for (const strategy of strategies) {
      try {
          console.log(`\n=== 嘗試${strategy.name} ===`);
          const processedBuffer = await preprocessImage(captchaBuffer, strategy.preprocess);
          
          // 可選：保存調試圖像
          // await saveDebugImage(processedBuffer, strategy.name);
          
          const result = await recognizeWithMultipleConfigs(processedBuffer);
          
          if (result && result.length >= 3) {
              allResults.push({
                  text: result,
                  strategy: strategy.name,
                  length: result.length
              });
              console.log(`${strategy.name}成功: ${result}`);
              
              // 如果得到4位數字，立即返回
              if (result.length === 4) {
                  console.log(`✅ ${strategy.name}獲得完美結果: ${result}`);
                  return result;
              }
          } else {
              console.log(`${strategy.name}失敗`);
          }
      } catch (error) {
          console.error(`${strategy.name}出錯:`, error);
      }
  }
  
  // 如果沒有完美的4位數結果，選擇最佳的
  if (allResults.length > 0) {
      // 優先選擇4位數，其次選擇最長的
      const best = allResults.reduce((best, current) => {
          if (best.length === 4 && current.length !== 4) return best;
          if (best.length !== 4 && current.length === 4) return current;
          return current.length >= best.length ? current : best;
      });
      
      console.log(`\n🎯 多重策略最終結果: ${best.text} (${best.strategy})`);
      return best.text.length === 4 ? best.text : (best.text + "0000").substring(0, 4);
  }
  
  return null;
}

async function Captcha(page) {

  console.log("開始執行 Captcha")
  //  Captcha - 專門處理4位數字驗證碼
  let captchaText = "";
  let maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // 等待驗證碼圖片載入，增加更長的超時時間
      await page.waitForSelector(".dcp-pic img", { timeout: 10000 });

      // 額外等待，確保驗證碼圖片完全加載
      await page.waitForTimeout(2000);

      // 截圖驗證碼，增加額外的等待和錯誤處理
      const captchaElement = await page.$(".dcp-pic img");

      // 確保元素可見且穩定
      await captchaElement.waitForElementState("visible", { timeout: 10000 });
      await captchaElement.waitForElementState("stable", { timeout: 10000 });

      // 使用更短的超時時間進行截圖，並添加重試機制
      let captchaBuffer;
      try {
        captchaBuffer = await captchaElement.screenshot({ timeout: 15000 });
      } catch (screenshotError) {
        console.log(`截圖失敗，嘗試重新載入驗證碼: ${screenshotError.message}`);
        // 刷新驗證碼後重試
        await page.click(".drf-link");
        await page.waitForTimeout(3000);
        continue;
      }

      // 使用超級多重策略識別
      console.log("\n🚀 啟動超級多重策略識別系統...");
      let cleanedText = await recognizeWithMultipleStrategies(captchaBuffer);
      
      // 如果多重策略失敗，使用終極備用方案
      if (!cleanedText || cleanedText.length < 3) {
        console.log("\n⚠️ 多重策略失敗，啟動終極備用識別...");
        
        // 終極備用方案：嘗試不同的圖像處理組合
        const backupStrategies = [
          { 
            name: "極度激進處理",
            process: async (buffer) => {
              return await sharp(buffer)
                .greyscale()
                .resize(400, 160, { kernel: sharp.kernel.cubic, fit: 'fill' })
                .normalize()
                .gamma(2.0)
                .threshold(90)
                .median(3)
                .blur(0.5)
                .threshold(140)
                .png()
                .toBuffer();
            }
          },
          {
            name: "反轉色彩處理",
            process: async (buffer) => {
              return await sharp(buffer)
                .greyscale()
                .resize(250, 100, { kernel: sharp.kernel.nearest, fit: 'fill' })
                .negate() // 反轉顏色
                .normalize()
                .threshold(100)
                .median(2)
                .png()
                .toBuffer();
            }
          }
        ];
        
        for (const strategy of backupStrategies) {
          try {
            console.log(`嘗試${strategy.name}...`);
            const processedBuffer = await strategy.process(captchaBuffer);
            
            const worker = await createWorker("eng", 1);
            await worker.setParameters({
              tessedit_char_whitelist: "0123456789",
              tessedit_pageseg_mode: "6",
              tessedit_ocr_engine_mode: "1",
              classify_enable_learning: "0"
            });
            
            const { data: { text } } = await worker.recognize(processedBuffer);
            await worker.terminate();
            
            const backupResult = text.replace(/\D/g, "");
            if (backupResult.length >= 3) {
              cleanedText = backupResult.length === 4 ? backupResult : (backupResult + "0000").substring(0, 4);
              console.log(`✅ ${strategy.name}成功: ${cleanedText}`);
              break;
            }
          } catch (error) {
            console.error(`${strategy.name}失敗:`, error);
          }
        }
        
        // 如果所有方法都失敗，使用原始方法作為最後手段
        if (!cleanedText || cleanedText.length < 3) {
          console.log("\n🔄 所有策略失敗，使用原始方法最後嘗試...");
          try {
            const worker = await createWorker("eng", 1);
            await worker.setParameters({
              tessedit_char_whitelist: "0123456789",
              tessedit_pageseg_mode: "8",
              tessedit_ocr_engine_mode: "1"
            });
            
            const { data: { text } } = await worker.recognize(captchaBuffer);
            await worker.terminate();
            cleanedText = text.replace(/\D/g, "");
          } catch (error) {
            console.error("原始方法也失敗:", error);
            cleanedText = "";
          }
        }
      }

      // 更寬鬆的驗證邏輯
      if (cleanedText && cleanedText.length >= 3) {
        if (cleanedText.length === 4) {
          captchaText = cleanedText;
          console.log(`✅ 識別到完美的4位數驗證碼: ${captchaText}`);
          break; // 成功識別到4位數字，跳出循環
        } else if (cleanedText.length === 3) {
          // 如果只有3位，補一個0或者直接嘗試
          captchaText = cleanedText + "0"; // 先嘗試補0
          console.log(`⚠️ 識別到3位數字，補0嘗試: ${captchaText}`);
          break;
        } else if (cleanedText.length > 4) {
          // 如果識別到超過4位數字，使用前4位
          captchaText = cleanedText.substring(0, 4);
          console.log(`⚠️ 識別到${cleanedText.length}位數字，使用前4位: ${captchaText}`);
          break;
        } else if (cleanedText.length === 5) {
          // 5位數字，可能是多識別了一個，嘗試不同的4位組合
          const combinations = [
            cleanedText.substring(0, 4),
            cleanedText.substring(1, 5)
          ];
          captchaText = combinations[0]; // 先嘗試前4位
          console.log(`⚠️ 識別到5位數字: ${cleanedText}，嘗試前4位: ${captchaText}`);
          break;
        }
      } else {
        console.log(`❌ 識別失敗或結果太短: ${cleanedText || '空'} (長度: ${cleanedText ? cleanedText.length : 0})`);
      }

      retryCount++;
      if (retryCount < maxRetries) {
        console.log(
          `驗證碼識別失敗，重新刷新驗證碼 (第 ${retryCount + 1} 次嘗試)`
        );
        // 刷新驗證碼
        await page.click(".drf-link");
        await page.waitForTimeout(3000);
      }
    } catch (error) {
      console.error(`驗證碼識別錯誤 (第 ${retryCount + 1} 次嘗試):`, error);
      retryCount++;

      if (retryCount < maxRetries) {
        console.log("嘗試刷新驗證碼重試...");
        try {
          // 刷新驗證碼重試
          await page.click(".drf-link");
          await page.waitForTimeout(3000);
        } catch (reloadError) {
          console.error("刷新驗證碼失敗:", reloadError);
        }
      }
    }
  }

  if (captchaText === "" || captchaText.length !== 4) {
    throw new Error(
      `無法識別到有效的4位數驗證碼，已達到最大重試次數。最後識別結果: ${captchaText}`
    );
  }
  return captchaText;
}


//所有自動化動作
const sharedActions = {
  //零、事先設定(未完成)
  beforeSetup: async function (page, setUpOption) {
    await page.goto(`${allconsts.baseURL}/wp-admin`);
    switch (setUpOption) {
      case 1:
        console.log("beforeSetup=1");
        break;
      case 2:
        console.log("beforeSetup=2");
        break;
      case 3:
        console.log("beforeSetup=3");
        break;
      default:
        console.log("未知的設定選項:", setUpOption);
        break;
    }
  },

  //一、 開啟瀏覽器，進入商品頁面
  goShopping: async function (page) {
    await page.goto(`${allconsts.baseURL}/?post_type=product`);
  },

  //二、WooCommercer 購物車下單結帳
  wcShopping: async function (page, test) {
    await page.waitForTimeout(1000);
    try {
      // 如果有 Visit Site 按鈕，則先按下
      const visitSiteButton = await page.$('button:has-text("Visit Site")');
      if (visitSiteButton) {
        await visitSiteButton.click();
      }

      //如果你的連線不是私人連線，則繼續前往
      const connectionWarning = await page.$('button:has-text("進階")');
      if (connectionWarning) {
        await connectionWarning.click();
        await page.waitForTimeout(500);
        await page.click('a:has-text("繼續前往 localhost 網站 (不安全)")');
      }

      // 2. 將商品加入購物車
      console.log(`🛍️ 加入商品到購物車 (ID: ${alltests[test].productID})`);
      const addToCartBtn = `button[data-product_id="${alltests[test].productID}"]`;
      
      const cartBtnReady = await safeWaitForSelector(page, addToCartBtn, {
        timeout: 10000,
        retries: 2,
        description: `加入購物車按鈕 (商品ID: ${alltests[test].productID})`
      });
      
      if (!cartBtnReady) {
        await diagnosePage(page, test, "找不到加入購物車按鈕");
        throw new Error(`找不到商品ID ${alltests[test].productID} 的加入購物車按鈕`);
      }
      
      await page.click(addToCartBtn);
      await page.waitForTimeout(2000); // 等待加入購物車完成
      console.log("✅ 商品已加入購物車");

      // 3. 結帳
      console.log("🛒 點擊結帳按鈕...");
      await page.click('a:has-text("結帳")');
      
      // 等待結帳頁面載入
      console.log("⏳ 等待結帳頁面載入...");
      await page.waitForTimeout(3000); // 增加等待時間
      
      // 檢查是否成功跳轉到結帳頁面
      const currentUrl = page.url();
    
      
      if (!currentUrl.includes('checkout')) {
        console.log("⚠️ 可能未正確跳轉到結帳頁面");
        await diagnosePage(page, test, "結帳頁面跳轉檢查");
      }

      //4. 結帳：發票開立
      console.log("🔍 開始尋找發票開立選項...");
      
      // 嘗試主要選擇器
      let invoiceReady = await safeWaitForSelector(page, allconsts.invoiceOptions.invoiceTypeInput, {
        timeout: 15000,
        retries: 2,
        reloadOnFail: false,
        description: `發票開立選項 (主要) (${allconsts.invoiceOptions.invoiceTypeInput})`
      });
      
      let invoiceSelector = allconsts.invoiceOptions.invoiceTypeInput;
      
      // 如果主要選擇器失敗，嘗試替代選擇器
      if (!invoiceReady) {
        console.log("⚠️ 主要發票選擇器失敗，嘗試替代選擇器...");
        const altSelectors = allconsts.invoiceOptions.invoiceTypeInputAlt.split(', ');
        
        for (const altSelector of altSelectors) {
          console.log(`🔍 嘗試替代選擇器: ${altSelector}`);
          invoiceReady = await safeWaitForSelector(page, altSelector, {
            timeout: 8000,
            retries: 1,
            reloadOnFail: false,
            description: `發票開立選項 (替代) (${altSelector})`
          });
          
          if (invoiceReady) {
            invoiceSelector = altSelector;
            console.log(`✅ 替代選擇器成功: ${altSelector}`);
            break;
          }
        }
      }
      
      if (!invoiceReady) {
        await diagnosePage(page, test, "找不到發票選項");
        throw new Error(`無法找到發票開立選項，已嘗試所有選擇器`);
      }
      await page.selectOption(
        invoiceSelector, // 使用成功的選擇器
        alltests[test].invoiceTypeSelect
      );
      console.log(
        `選擇發票開立類型：${
          alltests[test].invoiceTypeSelect === "c"
            ? "公司"
            : alltests[test].invoiceTypeSelect === "p"
            ? "個人"
            : alltests[test].invoiceTypeSelect === "d"
            ? "捐贈"
            : ""
        }`
      );

      //5. 結帳：載具類型
      console.log("🔍 開始尋找載具類型選項...");
      try {
        const carrierReady = await safeWaitForSelector(page, allconsts.invoiceOptions.carrierTypeInput, {
          timeout: 10000,
          retries: 2,
          reloadOnFail: false,
          description: `載具類型選項 (${allconsts.invoiceOptions.carrierTypeInput})`
        });
        
        if (carrierReady) {
          await page.selectOption(
            allconsts.invoiceOptions.carrierTypeInput,
            alltests[test].carrierTypeSelect
          );
          console.log(`✅ 選擇載具類型：${alltests[test].carrierTypeSelect}`);
        } else {
          console.log("⚠️ 載具類型選擇器不存在，跳過此步驟");
        }
      } catch (error) {
        console.log("⚠️ 載具類型選擇發生錯誤:", error.message);
      }

      //如果要打統編
      try {
        // 使用 getByText 查找標籤
        if (await page.getByText("公司行號").isVisible()) {
          console.log("要打統編");
          // 使用 getByLabel 定位輸入欄位
          await page.getByLabel("公司行號").fill(allconsts.wcInput.companyName);
          await page
            .getByLabel("統一編號")
            .fill(allconsts.wcInput.identifierNumber);
          console.log("已輸入統編");
        }
      } catch (error) {
        console.log("未找到公司名稱欄位，跳過此步驟");
      }

      //如果要填寫載具編號
      try {
        // 使用 getByLabel 尋找載具編號輸入欄位

        const carrierInput = page.getByLabel("載具編號");
        if (await carrierInput.isVisible()) {
          console.log("要輸入載具編號");
          if (
            alltests[test].carrierTypeSelect == "2" ||
            alltests[test].carrierTypeSelect == "3"
          ) {
            await carrierInput.fill(
              alltests[test].carrierTypeSelect == "2"
                ? allconsts.wcInput.carrierNumberCitizen
                : allconsts.wcInput.carrierNumberCell
            );
            console.log("已輸入完載具編號");
          } else console.log("不用輸入載具編號");
        }
      } catch (error) {
        console.log("未找到載具編號欄位，跳過此步驟");
      }

      //如果要捐贈發票
      try {
        // 使用 getByText 查找標籤
        if (await page.getByText("捐贈碼").isVisible()) {
          console.log("要捐贈發票");
          // 使用 getByLabel 定位輸入欄位
          await page.getByLabel("捐贈碼").fill(allconsts.wcInput.loveCode);
          console.log("已輸入捐贈碼");
        }
      } catch (error) {
        console.log("未找到捐贈碼欄位，跳過此步驟");
      }

      //6. 結帳：填寫收件人資料
      if (alltests[test].logisticsOption) {
        await page.fill("#email", allconsts.wcInput.email);
        await page.fill(
          "#shipping-first_name",
          allconsts.wcInput.shippingFirstName
        );
        await page.fill(
          "#shipping-last_name",
          allconsts.wcInput.shippingLastName
        );
        await page.fill(
          "#shipping-address_1",
          allconsts.wcInput.shippingAddress1
        );
        await page.fill("#shipping-city", allconsts.wcInput.shippingCity);
        await page.fill("#shipping-state", allconsts.wcInput.shippingState);
        await page.fill(
          "#shipping-postcode",
          allconsts.wcInput.shippingPostcode
        );
        await page.fill("#shipping-phone", allconsts.wcInput.shippingPhone);
      } else if (!alltests[test].logisticsOption) {
        await page.fill("#email", allconsts.wcInput.email);
        await page.fill(
          "#billing-first_name",
          allconsts.wcInput.shippingFirstName
        );
        await page.fill(
          "#billing-last_name",
          allconsts.wcInput.shippingLastName
        );
        await page.fill(
          "#billing-address_1",
          allconsts.wcInput.shippingAddress1
        );
        await page.fill("#billing-city", allconsts.wcInput.shippingCity);
        await page.fill("#billing-state", allconsts.wcInput.shippingState);
        await page.fill(
          "#billing-postcode",
          allconsts.wcInput.shippingPostcode
        );
        await page.fill("#billing-phone", allconsts.wcInput.shippingPhone);
      }

      // 檢查核取方塊的狀態，只有在未勾選時才進行勾選

      if (await page.$("#checkbox-control-8")) {
        const isChecked = await page.$eval(
          "#checkbox-control-8",
          (checkbox) => checkbox.checked
        );
        if (!isChecked) {
          await page.check("#checkbox-control-8");
        }
        console.log("使用相同的地址接收帳單");
      }

      await page.waitForTimeout(1500); // 等待，讓運送選項讀取完

      // 根據 HTML，運送區塊的 ID 為 shipping-option，以此判斷區塊是否存在且可見
      const shippingOptionsSection = page.locator("#shipping-option");
      if (await shippingOptionsSection.isVisible()) {
        console.log("偵測到「運送選項」區塊，開始選擇物流...");
        await page.click(`input[value^="${alltests[test].logisticsOption}"]`); // 選擇物流方式
        await page.waitForTimeout(1500);
        // await shippingOptionsSection.screenshot({
        //   path: `records/${test}/screenshot-shipping-option.png`,
        // });
      } else {
        console.log(
          "未偵測到「運送選項」區塊（可能為虛擬商品），跳過物流選擇。"
        );
      }

      await page.waitForTimeout(1500); // 等待，讓付款選項讀取完
      await page.click(`input[value="${alltests[test].paymentOption}"]`); // 選擇付款方式
      console.log(alltests[test].paymentOption);
      await page.waitForTimeout(1000);
      // await page.locator("#payment-method").screenshot({
      //   path: `records/${test}/screenshot-payment-method.png`,
      // });
      await page.click(
        `.${"wc-block-components-button wp-element-button wc-block-components-checkout-place-order-button contained"
          .split(" ")
          .join(".")}`
      ); // 下單購買

      // 等待新頁面載入並點擊確定門市按鈕
      await page.waitForTimeout(2000);
      try {
        // 設置較短的超時時間，避免長時間等待
        await page.waitForSelector('input[type="button"]', { timeout: 5000 });

        await page
          .locator("body")
          .screenshot({ path: `records/${test}/超.png` });

        await page.click('input[type="button"]'); //本寫法僅供測試環境的物流。正式環境要另外寫。
        await page.waitForTimeout(1500);
      } catch (error) {
        console.log("宅配不用選擇門市");
      }

      //如果有警告頁面
      // const connectionWarning2 = await page.$('button:has-text("進階")');

      // if (connectionWarning2) {
      //   await connectionWarning2.click();

      //   // 等待詳細資訊區塊出現
      //   await page.waitForSelector("#details:not(.hidden)", { timeout: 5000 });

      //   // 找到並點擊「繼續前往」連結
      //   const proceedLink = await page.waitForSelector("#proceed-link", {
      //     visible: true,
      //     timeout: 5000,
      //   });
      //   if (proceedLink) {
      //     await proceedLink.click();
      //   }

      //   console.log("WooCommerce 下單完成");
      // }
      await page.waitForTimeout(3000);
    } catch (error) {
      console.error(error);
    }
  },

  //三、付款
  // 3.1 信用卡付款 - 一次付清
  aioCheckOutCreditCard: async function (page, test) {
    try {
      try {
        await page.selectOption(
          "#selectInstallments",
          alltests[test].creditInstallment
        );
      } catch (error) {
        console.log("不是分期付款，繼續執行");
      }
      // 檢查是否有分期付款選項且該元素是可見的

      // 使用安全元素等待功能
      const cardInputReady = await safeWaitForSelector(page, ".pay-card-num", {
        timeout: 15000,
        retries: 3,
        description: "信用卡輸入區域"
      });
      
      if (!cardInputReady) {
        await diagnosePage(page, test, "找不到信用卡輸入區域");
        throw new Error("無法載入信用卡輸入區域，付款流程無法繼續");
      }

      //信用卡一
      await page.fill("#CCpart1", "4311");
      await page.locator("#CCpart1").click();
      await page.press("#CCpart1", "ArrowRight");
      await page.fill("#CCpart2", "9522");
      await page.locator("#CCpart2").click();
      await page.press("#CCpart2", "ArrowRight");
      await page.fill("#CCpart3", "2222");
      await page.locator("#CCpart3").click();
      await page.press("#CCpart3", "ArrowRight");
      await page.fill("#CCpart4", "2222");
      await page.locator("#CCpart4").click();
      await page.press("#CCpart4", "ArrowRight");

      await page.fill("#creditMM", "12");
      await page.fill("#creditYY", "99");
      await page.fill("#CreditBackThree", "999");
      await page.fill(
        "#CCHolderTemp",
        allconsts.wcInput.shippingLastName + allconsts.wcInput.shippingFirstName
      );
      await page.fill("#CellPhoneCheck", allconsts.wcInput.shippingPhone);
      await page.fill("#EmailTemp", allconsts.wcInput.email);
      await page.fill("#Address", allconsts.wcInput.shippingAddress1);

      await page.getByRole("link", { name: "立即付款" }).click();
      await page.getByRole("button", { name: "關閉" }).click();
      await page.getByRole("link", { name: "立即付款" }).click();
      await page.getByRole("button", { name: "確定" }).click();

      await page
        .getByRole("link", { name: "取得OTP服務密碼(Get the password)" })
        .click();
      await page
        .getByRole("textbox", {
          name: "請輸入網路刷卡OTP服務密碼 (Please enter",
        })
        .click();
      await page
        .getByRole("textbox", {
          name: "請輸入網路刷卡OTP服務密碼 (Please enter",
        })
        .fill("1234");
      await page.getByRole("link", { name: "送出(Submit)" }).click();
      await page.waitForTimeout(1500);
      await page.locator(".site-content").screenshot({
        path: `records/${test}/${alltests[test].paymentScreenshotAIO}.png`,
      });
      await page.waitForSelector('a.btn:has-text("返回商店")');
      await page.click('a.btn:has-text("返回商店")');
      await page.locator("main").screenshot({
        path: `records/${test}/WC付款成功.png`,
      });
    } catch (error) {
      console.error("自動化過程發生錯誤:", error);
    }
  },

  //3.2 WebATM
  webATM: async function (page, test) {
    await page.waitForSelector("#selWebATMBank");
    await page.selectOption("#selWebATMBank", "10001@2010@WebATM_LAND");
    await page.click("#WebATMPaySubmit");
    await page.getByRole("button", { name: "關閉" }).click();
    await page.waitForTimeout(2000);
    await page.waitForSelector('input[type="submit"]', { timeout: 5000 });
    await page.click('input[type="submit"]');
    await page.locator(".site-content").screenshot({
      path: `records/${test}/${alltests[test].paymentScreenshotAIO}.png`,
    });
    await page.waitForSelector(
      'a.btn.btn-deep-gray.btn-en:has-text("返回商店")'
    );
    await page.getByRole("link", { name: "返回商店" }).click();
    await page.locator("main").screenshot({
      path: `records/${test}/購物完成.png`,
    });
  },

  //3.3 ATM 櫃員機(仍有  bug)
  ATM: async function (page, test) {
    await page.waitForTimeout(2000);
    await page
      .getByLabel(
        "請選擇銀行 台灣土地銀行 板信銀行 台灣銀行 國泰世華銀行 中國信託 第一銀行 其他金融機構"
      )
      .selectOption("10002@11@ATM_LAND");
    await page.getByRole("link", { name: "取得繳費帳號" }).click();

    // 等待頁面導航完成
    await page.waitForNavigation({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 使用頁面截圖而不是元素截圖
    await page.screenshot({
      path: `records/${test}/${alltests[test].paymentScreenshotAIO}.png`,
    });

    let MerchantTradeNo = "";

    try {
      // 尋找包含訂單編號的元素
      const merchantTradeNoElement = await page.$('dl dt:has-text("訂單編號")');
      if (merchantTradeNoElement) {
        // 獲取下一個 dd 元素的內容，這應該是訂單編號的值
        MerchantTradeNo = await page.evaluate((el) => {
          const ddElement = el.nextElementSibling;
          return ddElement ? ddElement.textContent.trim() : "";
        }, merchantTradeNoElement);

        console.log("已抓取訂單編號:", MerchantTradeNo);
      }
    } catch (error) {
      console.error("抓取訂單編號時發生錯誤:", error);
    }

    await page.waitForSelector('a.btn:has-text("返回商店")');
    await page.click('a.btn:has-text("返回商店")');
    await page.locator("main").screenshot({
      path: `records/${test}/WC購買完成.png`,
    });

    //銷帳
    await sharedActions.mockMerchant(page, test, "ATM", MerchantTradeNo);
  },

  //3.4 CVS
  CVS: async function (page, test) {
    await page.waitForTimeout(2000);

    await page.getByRole("link", { name: "取得繳費代碼" }).click();
    console.log("已點擊取得繳費代碼")

    // 等待頁面導航完成
    await page.waitForNavigation({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 使用頁面截圖而不是元素截圖
    await page.screenshot({
      path: `records/${test}/${alltests[test].paymentScreenshotAIO}.png`,
    });

    let MerchantTradeNo = "";

    try {
      // 尋找包含訂單編號的元素
      const merchantTradeNoElement = await page.$('dl dt:has-text("訂單編號")');
      if (merchantTradeNoElement) {
        // 獲取下一個 dd 元素的內容，這應該是訂單編號的值
        MerchantTradeNo = await page.evaluate((el) => {
          const ddElement = el.nextElementSibling;
          return ddElement ? ddElement.textContent.trim() : "";
        }, merchantTradeNoElement);

        console.log("已抓取訂單編號:", MerchantTradeNo);
      }
    } catch (error) {
      console.error("抓取訂單編號時發生錯誤:", error);
    }

    await page.waitForSelector('a.btn:has-text("返回商店")');
    await page.click('a.btn:has-text("返回商店")');
    await page.locator("main").screenshot({
      path: `records/${test}/WC 建立訂單成功.png`,
    });

    //銷帳
    await sharedActions.mockMerchant(page, test, "CVS", MerchantTradeNo);
  },

  //3.5 Barcode
  BARCODE: async function (page, test) {
    await page.waitForTimeout(2000);

    await page.getByRole("link", { name: "取得繳費條碼" }).click();

    // 等待頁面導航完成
    await page.waitForNavigation({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 使用頁面截圖而不是元素截圖
    await page.screenshot({
      path: `records/${test}/${alltests[test].paymentScreenshotAIO}.png`,
    });

    let MerchantTradeNo = "";

    try {
      // 尋找包含訂單編號的元素
      const merchantTradeNoElement = await page.$('dl dt:has-text("訂單編號")');
      if (merchantTradeNoElement) {
        // 獲取下一個 dd 元素的內容，這應該是訂單編號的值
        MerchantTradeNo = await page.evaluate((el) => {
          const ddElement = el.nextElementSibling;
          return ddElement ? ddElement.textContent.trim() : "";
        }, merchantTradeNoElement);

        console.log("已抓取訂單編號:", MerchantTradeNo);
      }
    } catch (error) {
      console.error("抓取訂單編號時發生錯誤:", error);
    }

    await page.waitForSelector('a.btn:has-text("返回商店")');
    await page.click('a.btn:has-text("返回商店")');
    await page.locator("main").screenshot({
      path: `records/${test}/WC建立訂單成功}.png`,
    });

    //銷帳
    await sharedActions.mockMerchant(page, test, "BARCODE", MerchantTradeNo);
  },

  //3.6 TWQR
  TWQR: async function (page, test) {
    try {
      await page.click('a.btn:has-text("測試付款請點此")');
      const pages = page.context().pages();
      if (pages.length > 1) {
        const newPage = pages[pages.length - 1];
        await page.waitForTimeout(1000);
        await newPage.waitForLoadState("networkidle");
        await newPage.click("#inputTwqrMockPaidSuccess");
        console.log("已點擊交易成功按鈕");
        console.log("TWQR 付款流程完成");

        await page.locator(".site-content").screenshot({
          path: `records/${test}/${alltests[test].paymentScreenshotAIO}.png`,
        });
        await page.waitForSelector('a.btn:has-text("返回商店")');
        await page.click('a.btn:has-text("返回商店")');
        await page.locator("main").screenshot({
          path: `records/${test}/付款完成頁面.png`,
        });
      }
    } catch (error) {
      console.log("TWQR 付款異常:", error.message);
    }
  },

  //3.7 BNPL
  BNPL: async function (page, test) {
    try {
      console.log("BNPL Start");
      await page.waitForTimeout(3000);
      // 先點擊無卡分期按鈕
      await page.click('li[title="BNPL"]#liBNPL.ptl-yurich');
      
      
      

      // 等待 BNPL 區域載入
      await page.waitForSelector("#BNPL", { state: "visible", timeout: 15000 });
      console.log("BNPL區域已載入");
      try {
        const labelElement = page.locator(
          'label.pib-radio:has(input[value="3"])'
        );
        await labelElement.waitFor({ state: "visible", timeout: 10000 });
        await labelElement.scrollIntoViewIfNeeded();
        await labelElement.click();
      } catch (error) {
        console.error(error);
      }
      await page.waitForTimeout(1000);

      // 勾選同意條款的 checkbox
      console.log("要勾選同意條款");
      await page.locator('label[for="note_check"]').click();
      await page.click("#BNPLPaySubmit");
      await page.waitForTimeout(3000);

      // 截圖交易申請結果
      await page.locator(".site-content").screenshot({
        path: `records/${test}/${alltests[test].paymentScreenshotAIO}.png`,
      });

      // 尋找返回商店按鈕
      await page.waitForSelector('a.btn:has-text("返回商店")', {
        timeout: 15000,
      });
      await page.click('a.btn:has-text("返回商店")');
      await page.locator("main").screenshot({
        path: `records/${test}/無卡分期交易申請已受理.png`,
      });

      console.log("BNPL 付款流程完成");
    } catch (error) {
      console.error("BNPL 付款流程發生錯誤:", error);
    }
  },

  //3.8 微信

  WeiXin: async function (page, test) {
    await page.click("#WeiXinPaySubmit");
    await page.waitForTimeout(2000);

    // 點選「測試付款請點此」，這會開啟新分頁
    await page.click('a:has-text("測試付款請點此")');

    // 等待新分頁開啟並獲取所有分頁
    await page.waitForTimeout(2000);
    const pages = page.context().pages();

    if (pages.length > 1) {
      // 切換到新分頁（最後一個分頁）
      const newPage = pages[pages.length - 1];
      await newPage.waitForLoadState("networkidle");

      // 在新分頁點選「成功交易模擬」按鈕
      await newPage.click('input[value="成功交易模擬"]');
      console.log("已在新分頁點選成功交易模擬按鈕");

      // 等待舊分頁內容更新
      await page.waitForTimeout(3000);
      await page.bringToFront()
    }

    console.log("微信支付付款流程完成");

    // 在原分頁（舊分頁）進行截圖
    await page.locator(".site-content").screenshot({
      path: `records/${test}/${alltests[test].paymentScreenshotAIO}.png`,
    });
    await page.waitForSelector('a.btn:has-text("返回商店")');
    await page.click('a.btn:has-text("返回商店")');
    await page.locator("main").screenshot({
      path: `records/${test}/付款完成頁面.png`,
    });
  },

  //ATM/CVS/BARCODE 銷帳
  mockMerchant: async function (page, test, method, MerchantTradeNo) {
    let paymentMethod =
      method == "ATM"
        ? "10002"
        : method == "CVS"
        ? "10003"
        : method == "BARCODE"
        ? "10004"
        : "";

    await page.goto(`${allconsts.mockMerchantURL}`);
    await page.fill("#MerchantID", "3002607");
    await page.fill("#MerchantTradeNo", MerchantTradeNo);
    await page.selectOption("#PaymentTypeID", paymentMethod);
    await page.click('input[type="button"][value="Create"]');
    await page.locator("body").screenshot({
      path: `records/${test}/${alltests[test].paymentScreenshotMock}.png`,
    });
    console.log("銷帳完畢");
  },

  //四、進入 WooCommerce 後台檢查訂單
  checkWCBackStage: async function (page, test) {
 
    //獲取三個變數的值
    let paymentMerchantTradeNo = "";
    let logisticsMerchantTradeNo = "";
    let invoiceNumber = "";

    try {
      
      await page.goto(`${allconsts.baseURL}/wp-login.php`);
      await page.fill("#user_login", allconsts.WCLogin.WC_UserName);
      await page.fill("#user_pass", allconsts.WCLogin.WC_PassWord);
      await page.click("input#wp-submit");
      await page.waitForTimeout(1000);

      // 檢查是否需要再次登入（如果登入頁面仍然存在）
      // const needRelogin = await page.$("#user_login");
      // if (needRelogin) {
      //   console.log("需要再次登入...");
      //   await page.fill("#user_login", allconsts.WCLogin.username);
      //   await page.fill("#user_pass", allconsts.WCLogin.password);
      //   await page.click("input#wp-submit");
      //   await page.waitForTimeout(2000);
      // }

      // 增加等待時間，確保登入過程完成
      await page.click('div.wp-menu-name:has-text("WooCommerce")');
      await page.waitForTimeout(2000);
      await page.waitForSelector('a:has-text("訂單")');
      await page.click('a:has-text("訂單")');
      await page.waitForTimeout(1500);
      await page.waitForSelector(".wp-list-table");
      await page.click(
        "table.wc-orders-list-table tbody tr:first-child td.order_number a.order-view"
      );
      await page.waitForTimeout(1500);

      //確定有建立 WC 訂單
      await page.locator("#order_data").screenshot({
        path: `records/${test}/${alltests[test].paymentScreenshotWCBackStage}.png`,
      });
      console.log("截圖：確定有建立 WC 訂單")



      //如果要手動建立物流訂單，就要按下建立物流訂單的按鈕
      try {
        const logisticsBtn = await page.$('input[value="建立物流訂單"]');
        if (logisticsBtn) {
          await page.locator("#order_data").screenshot({
            path: `records/${test}/${alltests[test].logisticsScreenshotWCBackStageBefore}.png`,
          });
          console.log("截圖：手動建立物流訂單以前")
          await logisticsBtn.click();
          await page.waitForTimeout(3000);
          console.log("手動建立物流訂單");
          await page.waitForTimeout(5000);
          await page.locator("#order_data").screenshot({
            path: `records/${test}/${alltests[test].logisticsScreenshotWCBackStage}.png`,
          });
      
          console.log("截圖：手動建立物流訂單以後");
        } else if (!logisticsBtn && alltests[test].logisticsOption) {
          await page.locator("#order_data").screenshot({
            path: `records/${test}/${alltests[test].logisticsScreenshotWCBackStage}.png`,
          });
          console.log("截圖：已自動建立物流單");
        }
      } catch (e) {
        console.log("自動建立物流訂單，不需要手動");
      }

      //如果要手動開發票，就要按下開立發票的按鈕
      try {
        const issueInvBtn = await page.$('input[value="開立發票"]');
        if (issueInvBtn) {
          await page.locator("#order_data").screenshot({
            path: `records/${test}/${alltests[test].invoiceManualWCBefore}.png`,
          });
          await issueInvBtn.click();
          await page.waitForTimeout(5000);
          console.log("手動開立發票");
         
        }
      } catch (e) {
        console.log("自動開立發票，不需要手動");
      }

      // 1. 抓取金流特店交易編號 (paymentMerchantTradeNo)
      try {
        const paymentElement = await page
          .locator(
            'ul.order_notes li .note_content p:has-text("綠界金流特店交易編號")'
          )
          .first();
        if (paymentElement) {
          const paymentText = await paymentElement.textContent();
          // 提取交易編號部分，去除前面的標籤文字
          paymentMerchantTradeNo = paymentText
            .replace(/^.*綠界金流特店交易編號\s+/, "")
            .trim();
        }
      } catch (e) {
        console.log("無法找到金流特店交易編號");
      }

      // 2. 抓取物流廠商交易編號 (logisticsMerchantTradeNo)
      try {
        const logisticsElement = await page
          .locator('div.logistic_button_display p:has-text("廠商交易編號:")')
          .first();
        if (logisticsElement) {
          const logisticsText = await logisticsElement.textContent();
          // 提取廠商交易編號部分，去除前面的標籤文字
          logisticsMerchantTradeNo = logisticsText
            .replace(/^.*廠商交易編號:/, "")
            .trim();
        }
      } catch (e) {
        console.log("無法找到物流廠商交易編號");
      }

      // 3. 抓取發票號碼 (invoiceNumber)
      try {
        const invoiceElement = await page
          .locator('div.logistic_button_display p:has-text("發票號碼:")')
          .first();
        if (invoiceElement) {
          const invoiceText = await invoiceElement.textContent();
          // 提取發票號碼部分，去除前面的標籤文字
          invoiceNumber = invoiceText.replace(/^.*發票號碼:/, "").trim();
        }
      } catch (e) {
        console.log("無法找到發票號碼");
      }

      // 輸出結果以供確認
      console.log("金流訂單編號：", paymentMerchantTradeNo);
      console.log(
        "物流訂單編號：",
        logisticsMerchantTradeNo == "" ? "沒有物流" : logisticsMerchantTradeNo
      );
      console.log("發票號碼：", invoiceNumber);

      // 使用安全截圖功能
      await safeScreenshot(page, page.locator("#order_data"), {
        path: `records/${test}/${autoIssue?alltests[test].invoiceAutoWCAfter:alltests[test].invoiceManualWCAfter}.png`,
        timeout: 15000,
        retries: 2
      });

     

      //點擊列印物流單按鈕
      try {
        const printLogisticsBtn = await page.$('input[value="列印物流單"]');
        if (printLogisticsBtn) {
          await printLogisticsBtn.click();
        }
        const pages = page.context().pages();
        if (pages.length > 1) {
          const newPage = pages[pages.length - 1];
          await page.waitForTimeout(3000);
          await newPage.waitForLoadState("networkidle");
         
          await newPage.screenshot({
            path: `records/${test}/${alltests[test].logisticsScreenshotPrintLabel}.png`,
          });
          console.log("已截圖物流單列印頁面");
          
          // 切換回原分頁，確保後續動作在正確的分頁執行
          await page.bringToFront();
       
        }
      } catch (error) {
        console.log("沒有列印物流單按鈕");
      }
    } catch (error) {
      console.error("後台檢查過程發生錯誤:", error);
    }

    return {
      paymentMerchantTradeNo,
      logisticsMerchantTradeNo,
      invoiceNumber,
    };
  },

  //五、進入廠商管理後台檢查金流訂單
  ECPayBackStageLogin: async function (page, service, logisticsType) {
    await page.bringToFront();
    await page.goto("https://vendor-stage.ecpay.com.tw/");

    await page.fill(
      'input[placeholder="請輸入6-20位英/數混合帳號"]',
      service == "Logistics"
        ? allconsts.ECPayLogin[service][logisticsType].username
        : allconsts.ECPayLogin[service].username
    );
    console.log(`登入廠商管理後台，輸入賣家帳號 ${ service == "Logistics"
      ? allconsts.ECPayLogin[service][logisticsType].username
      : allconsts.ECPayLogin[service].username}`)

    await page.click(".sf-btn a");
    await page.waitForTimeout(750);
    await page.fill(
      'input[placeholder="請輸入您的登入密碼"]',
      service == "Logistics"
        ? allconsts.ECPayLogin[service][logisticsType].password
        : allconsts.ECPayLogin[service].password
    );
    await page.waitForTimeout(750);
    await page.fill(
      'input[placeholder="請輸入您的統一編號"]',
      service == "Logistics"
        ? allconsts.ECPayLogin[service][logisticsType].identifier
        : allconsts.ECPayLogin[service].identifier
    );

    console.log(`已輸入統一編號：${ service == "Logistics"
      ? allconsts.ECPayLogin[service][logisticsType].identifier
      : allconsts.ECPayLogin[service].identifier}`)
    await page.waitForTimeout(750);

    // 驗證碼重試邏輯 - 不限制重試次數，直到成功為止
    let captchaRetries = 0;
    let loginSuccessful = false;

    while (!loginSuccessful) {
      try {
        await page.fill("#CaptchaValue", await Captcha(page));
        console.log(`已輸入驗證碼 (第${captchaRetries + 1}次嘗試)`);

        await page.click(".sf-btn a");

        // 等待頁面響應
        await page.waitForTimeout(2000);

        // 檢查是否出現驗證碼錯誤提示
        let errorDetected = false;
        
        try {
          // 等待可能出現的錯誤對話框
          await page.waitForSelector('.pp-container', { timeout: 3000 });
          
          // 檢查是否包含錯誤訊息
          const errorText = await page.textContent('.pp-container .ftp-txt');
          if (errorText && errorText.includes('驗證碼輸入錯誤')) {
            errorDetected = true;
          }
        } catch (e) {
          // 沒有找到錯誤對話框，繼續正常流程
        }
        
        if (errorDetected) {
          console.log(`驗證碼輸入錯誤，準備重試 (第${captchaRetries + 1}次)`);
          
          // 點擊確定按鈕關閉錯誤對話框
          await page.click('.popup-close.btn');
          await page.waitForTimeout(1000);
          
          captchaRetries++;
          
          // 重新輸入登入密碼（因為會被清空）
          await page.fill(
            'input[placeholder="請輸入您的登入密碼"]',
            service == "Logistics"
              ? allconsts.ECPayLogin[service][logisticsType].password
              : allconsts.ECPayLogin[service].password
          );
          console.log("已重新輸入登入密碼");
          
          // 重新輸入統一編號（因為會被清空）
          await page.fill(
            'input[placeholder="請輸入您的統一編號"]',
            service == "Logistics"
              ? allconsts.ECPayLogin[service][logisticsType].identifier
              : allconsts.ECPayLogin[service].identifier
          );
          console.log("已重新輸入統一編號");
          
          await page.waitForTimeout(750);
          
          // 刷新驗證碼後重試
          await page.click(".drf-link");
          await page.waitForTimeout(2000);
          continue;
        }

        // 如果沒有錯誤對話框，檢查是否進入下一步驗證
        try {
          // 選擇可見的驗證碼輸入框（第二個）
          await page.waitForSelector('input[placeholder="請輸入6位數驗證碼"]:visible', { timeout: 3000 });
          console.log("辨識成功，繼續輸入6位數驗證碼")
          await page.fill('input[placeholder="請輸入6位數驗證碼"]:visible', "123456");
          await page.click('a:has-text("完成驗證")');

          // 設置 Alert 對話框處理器
          page.once("dialog", async (dialog) => {
            await dialog.accept(); // 點擊確定按鈕
          });

          // 等待一下讓對話框處理完成
          await page.waitForTimeout(1000);
          
          loginSuccessful = true;
          console.log("綠界廠商管理後台登入成功");
          
        } catch (nextStepError) {
          console.log("等待下一步驗證失敗，可能已經成功登入");
          loginSuccessful = true;
          console.log("綠界廠商管理後台登入成功");
        }

      } catch (error) {
        console.log(`登入過程發生錯誤: ${error.message}`);
        captchaRetries++;
        
        // 刷新驗證碼後重試
        try {
          await page.click(".drf-link");
          await page.waitForTimeout(2000);
        } catch (refreshError) {
          console.log("刷新驗證碼失敗，繼續重試");
        }
      }
    }

  },

  checkECPayBackStage: async function (
    page,
    service,
    orderData,
    logisticsType
  ) {
    // 從 testExe.js 引入 test 變數
  
    if (service == "Payment") {
      console.log("開始檢查金流訂單");
      await page.waitForTimeout(5000);
      
      // 更強健的 iframe 等待機制
      let leftFrame = null;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries && !leftFrame) {
        try {
          console.log(`嘗試獲取 leftFrame iframe (第 ${retryCount + 1} 次)`);
          
          // 等待頁面基本載入，不依賴網路穩定狀態
          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
          } catch (loadError) {
            console.log("DOM 載入檢查超時，繼續嘗試...");
          }
          await page.waitForTimeout(3000);
          
          // 嘗試多種方式獲取 leftFrame
          leftFrame = await page.frame("leftFrame");
          
          if (!leftFrame) {
            // 如果直接獲取失敗，嘗試等待 iframe 出現
            await page.waitForSelector('iframe[name="leftFrame"]', { 
              state: 'attached', 
              timeout: 8000 
            });
            await page.waitForTimeout(1000);
            leftFrame = await page.frame("leftFrame");
          }
          
          // 驗證 iframe 是否真的可用
          if (leftFrame) {
            try {
              // 嘗試在 iframe 中查找一個基本元素來確認其已載入
              await leftFrame.waitForSelector('body', { timeout: 5000 });
              console.log("✅ leftFrame iframe 已成功載入");
              break;
            } catch (verifyError) {
              console.log("leftFrame iframe 存在但內容未載入，重試...");
              leftFrame = null;
            }
          }
        } catch (error) {
          console.log(`獲取 leftFrame 失敗 (第 ${retryCount + 1} 次): ${error.message}`);
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`等待 3 秒後重試...`);
          await page.waitForTimeout(3000);
        }
      }
      
      if (!leftFrame) {
        // 進行頁面診斷
        await diagnosePage(page, test, "找不到leftFrame-iframe");
        throw new Error(`經過 ${maxRetries} 次嘗試仍無法找到 leftFrame iframe`);
      }

      // 在 leftFrame 中等待並點擊「一般訂單查詢」展開菜單
      await leftFrame.waitForSelector('a:has-text("一般訂單查詢")', {
        state: "visible",
      });
      await leftFrame.click('a:has-text("一般訂單查詢")');

      // 等待「全方位金流訂單」子菜單可見，然後點擊
      await leftFrame.waitForSelector(
        'a[href="/TradeNoAio/Index"]:has-text("全方位金流訂單")',
        { state: "visible" }
      );
      await leftFrame.click(
        'a[href="/TradeNoAio/Index"]:has-text("全方位金流訂單")'
      );

      // 切換到內容 iframe 填寫表單
      await page.waitForTimeout(2000);
      const contentFrame = await page.frame("contentFrame");
      if (!contentFrame) {
        throw new Error("找不到 contentFrame iframe");
      }

      await contentFrame.waitForSelector("#MerchantTradeNo", {
        state: "visible",
      });
      await contentFrame.fill(
        "#MerchantTradeNo",
        orderData.paymentMerchantTradeNo
      );

      await contentFrame.click("#ListTradeSubmit");

      // 等待查詢結果載入並截圖
      await page.waitForTimeout(3500);
      try {
        // 等待查詢結果表格出現
        await contentFrame.waitForSelector(
          'div.mb20[style*="overflow-x:scroll"]',
          { state: "visible", timeout: 10000 }
        );

        // 對查詢結果表格進行截圖
        await contentFrame
          .locator('div.mb20[style*="overflow-x:scroll"]')

          .screenshot({
            path: `records/${test}/${alltests[test].paymentScreenshotECPayBackStage}.png`,
          });
        console.log("已截圖金流訂單查詢結果");
      } catch (error) {
        console.log("無法截圖查詢結果，可能沒有找到訂單:", error.message);
      }

      // 截圖完成後點擊登出
      await page.waitForTimeout(1000);

      try {
        await page.goto("https://vendor-stage.ecpay.com.tw/User/LogOff");
        console.log("直接登出");
      } catch (error) {
        console.log("導航到登出頁面失敗:", error.message);
      }

      console.log("綠界廠商管理後台金流訂單檢查結束。");
    } else if (service == "Logistics") {
      console.log(`開始檢查物流訂單`);

      await page.waitForTimeout(5000);

      // 檢查是否有實質受益人辨識的 popbox，如果有就關閉它
      const popbox = await page.$("#BeneficiaryTip");
      if (popbox && (await popbox.isVisible())) {
        console.log("發現實質受益人辨識彈出視窗，準備關閉");
        await page.click("#BeneficiaryTip .close-button a");
        await page.waitForTimeout(1000);
        console.log("已關閉實質受益人辨識彈出視窗");
      }

      await page.waitForTimeout(1000);
      
      // 更強健的 iframe 等待機制 (Logistics)
      let leftFrame = null;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries && !leftFrame) {
        try {
          console.log(`嘗試獲取 leftFrame iframe (物流，第 ${retryCount + 1} 次)`);
          
          // 等待頁面基本載入，不依賴網路穩定狀態
          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
          } catch (loadError) {
            console.log("DOM 載入檢查超時，繼續嘗試...");
          }
          await page.waitForTimeout(3000);
          
          // 嘗試獲取 leftFrame
          leftFrame = await page.frame("leftFrame");
          
          if (!leftFrame) {
            // 如果直接獲取失敗，嘗試等待 iframe 出現
            await page.waitForSelector('iframe[name="leftFrame"]', { 
              state: 'attached', 
              timeout: 8000 
            });
            await page.waitForTimeout(1000);
            leftFrame = await page.frame("leftFrame");
          }
          
          // 驗證 iframe 是否真的可用
          if (leftFrame) {
            try {
              await leftFrame.waitForSelector('body', { timeout: 5000 });
              console.log("✅ leftFrame iframe (物流) 已成功載入");
              break;
            } catch (verifyError) {
              console.log("leftFrame iframe 存在但內容未載入，重試...");
              leftFrame = null;
            }
          }
        } catch (error) {
          console.log(`獲取 leftFrame 失敗 (物流，第 ${retryCount + 1} 次): ${error.message}`);
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`等待 3 秒後重試...`);
          await page.waitForTimeout(3000);
        }
      }
      
      if (!leftFrame) {
        // 進行頁面診斷
        await diagnosePage(page, test, "找不到leftFrame-iframe-物流");
        throw new Error(`經過 ${maxRetries} 次嘗試仍無法找到 leftFrame iframe (物流)`);
      }

      // 在 leftFrame 中等待並點擊「一般訂單查詢」展開菜單
      await leftFrame.waitForSelector('a:has-text("物流管理")', {
        state: "visible",
      });
      await leftFrame.click('a:has-text("物流管理")');

      // 等待「物流建單及查詢」子菜單可見，然後點擊
      await leftFrame.waitForSelector(
        'a[href="/Logistics/QueryCheckAccounts"]:has-text("物流建單及查詢")',
        { state: "visible" }
      );
      await leftFrame.click(
        'a[href="/Logistics/QueryCheckAccounts"]:has-text("物流建單及查詢")'
      );
      console.log("預期出現廣告");

      //關掉公告頁面
      try {
        // 切換到 contentFrame
        const contentFrame = await page.frame("contentFrame");
        if (!contentFrame) {
          throw new Error("找不到 contentFrame iframe");
        }

        // 等待公告彈窗出現
        await contentFrame.waitForSelector("#BatchCloseTips2", {
          state: "visible",
          timeout: 10000,
        });
        console.log("公告彈窗已出現");

        // 等待確認按鈕可點擊
        await contentFrame.waitForSelector("#ignoreBatchCloseTips2", {
          state: "visible",
          timeout: 5000,
        });

        // 點擊第一個公告的確認按鈕
        await contentFrame.click("#ignoreBatchCloseTips2");
        console.log("已點擊第一個公告的確認按鈕");

        // 等待第二個公告出現
        await contentFrame.waitForTimeout(2000);

        // 檢查是否還有第二個公告需要關閉
        const secondNotice = await contentFrame.$("#ignoreBatchCloseTips2");
        if (secondNotice && (await secondNotice.isVisible())) {
          await contentFrame.click("#ignoreBatchCloseTips2");
          console.log("已點擊第二個公告的確認按鈕");
          await contentFrame.waitForTimeout(1000);
        }
// 檢查是否還有第三個公告需要關閉
        const thirdNotice = await contentFrame.$("#ignoreBatchCloseTips2");
        if (thirdNotice && (await thirdNotice.isVisible())) {
          await contentFrame.click("#ignoreBatchCloseTips2");
          console.log("已點擊第三個公告的確認按鈕");
          await contentFrame.waitForTimeout(1000);
        }

        console.log("公告頁面已關閉");
      } catch (error) {
        console.log("關閉彈窗時發生錯誤:", error.message);
      }

      // 切換到內容 iframe 填寫表單
      await page.waitForTimeout(2000);
      const contentFrame = await page.frame("contentFrame");
      if (!contentFrame) {
        throw new Error("找不到 contentFrame iframe");
      }

      await contentFrame.waitForSelector(".query-order-number", {
        state: "visible",
      });
      await contentFrame.fill(
        ".query-order-number",
        orderData.logisticsMerchantTradeNo
      );

      await contentFrame.click("#Query");

      // 等待查詢結果載入並截圖
      await page.waitForTimeout(5000);
      try {
        // 等待查詢結果表格出現
        await contentFrame.waitForSelector("div.scroll_x.mb20", {
          state: "visible",
          timeout: 10000,
        });

        // 對查詢結果表格進行截圖
        await contentFrame.locator("div.scroll_x.mb20").screenshot({
          path: `records/${test}/${alltests[test].logisticsScreenshotECPayBackStage}.png`,
        });
        console.log("已截圖物流訂單查詢結果");
      } catch (error) {
        console.log("無法截圖查詢結果，可能沒有找到訂單:", error.message);
      }
      if (logisticsType == "B2C") {
        console.log("物流為 B2C，不登出 2000132，維持登入");
      } else if (logisticsType != "B2C") {
        console.log("物流為 C2C，登出 2000132");
        await page.goto("https://vendor-stage.ecpay.com.tw/User/LogOff");
      }
      // 廠商管理後台查詢電子發票
    } else if (service == "Invoice") {
      await page.waitForTimeout(8000);
      console.log("開始檢查發票");
      
      // 更強健的 iframe 等待機制 (Invoice)
      let leftFrame = null;
      let retryCount = 0;
      const maxRetries = 5;
      
      while (retryCount < maxRetries && !leftFrame) {
        try {
          console.log(`嘗試獲取 leftFrame iframe (發票，第 ${retryCount + 1} 次)`);
          
          // 等待頁面基本載入，不依賴網路穩定狀態
          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
          } catch (loadError) {
            console.log("DOM 載入檢查超時，繼續嘗試...");
          }
          await page.waitForTimeout(3000);
          
          // 嘗試獲取 leftFrame
          leftFrame = await page.frame("leftFrame");
          
          if (!leftFrame) {
            // 如果直接獲取失敗，嘗試等待 iframe 出現
            await page.waitForSelector('iframe[name="leftFrame"]', { 
              state: 'attached', 
              timeout: 8000 
            });
            await page.waitForTimeout(1000);
            leftFrame = await page.frame("leftFrame");
          }
          
          // 驗證 iframe 是否真的可用
          if (leftFrame) {
            try {
              await leftFrame.waitForSelector('body', { timeout: 5000 });
              console.log("✅ leftFrame iframe (發票) 已成功載入");
              break;
            } catch (verifyError) {
              console.log("leftFrame iframe 存在但內容未載入，重試...");
              leftFrame = null;
            }
          }
        } catch (error) {
          console.log(`獲取 leftFrame 失敗 (發票，第 ${retryCount + 1} 次): ${error.message}`);
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`等待 3 秒後重試...`);
          await page.waitForTimeout(3000);
          
          // 如果已經嘗試超過一半次數，嘗試重新整理頁面
          if (retryCount >= Math.floor(maxRetries / 2)) {
            console.log("多次嘗試失敗，嘗試重新整理頁面...");
            try {
              await page.reload({ waitUntil: 'domcontentloaded', timeout: 10000 });
              await page.waitForTimeout(5000);
            } catch (reloadError) {
              console.log("頁面重新整理失敗:", reloadError.message);
            }
          }
        }
      }
      
      if (!leftFrame) {
        // 進行頁面診斷
        await diagnosePage(page, test, "找不到leftFrame-iframe-發票");
        throw new Error(`經過 ${maxRetries} 次嘗試仍無法找到 leftFrame iframe (發票)`);
      }
      
      await leftFrame.click('button:has-text("電子發票")');
      await page.waitForTimeout(2000);

      // 頁面導航後重新獲取 leftFrame - 使用相同的強健機制
      let newLeftFrame = null;
      retryCount = 0;
      
      while (retryCount < maxRetries && !newLeftFrame) {
        try {
          console.log(`嘗試重新獲取 leftFrame iframe (發票導航後，第 ${retryCount + 1} 次)`);
          
          // 等待頁面基本載入，不依賴網路穩定狀態
          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
          } catch (loadError) {
            console.log("DOM 載入檢查超時，繼續嘗試...");
          }
          await page.waitForTimeout(3000);
          
          newLeftFrame = await page.frame("leftFrame");
          
          if (newLeftFrame) {
            try {
              await newLeftFrame.waitForSelector('body', { timeout: 5000 });
              console.log("✅ newLeftFrame iframe (發票導航後) 已成功載入");
              break;
            } catch (verifyError) {
              console.log("newLeftFrame iframe 存在但內容未載入，重試...");
              newLeftFrame = null;
            }
          }
        } catch (error) {
          console.log(`重新獲取 leftFrame 失敗 (發票導航後，第 ${retryCount + 1} 次): ${error.message}`);
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`等待 3 秒後重試...`);
          await page.waitForTimeout(3000);
        }
      }
      
      if (!newLeftFrame) {
        await diagnosePage(page, test, "導航後找不到leftFrame-iframe-發票");
        throw new Error(`經過 ${maxRetries} 次嘗試仍無法找到導航後的 leftFrame iframe (發票)`);
      }

      // 在重新獲取的 leftFrame 中等待並點擊「一般訂單查詢」展開菜單
      await newLeftFrame.waitForSelector('a:has-text("B2C 電子發票")', {
        state: "visible",
      });
      await newLeftFrame.click('a:has-text("B2C 電子發票")');
      await newLeftFrame.waitForSelector('a:has-text("發票查詢與異動")', {
        state: "visible",
      });
      await newLeftFrame.click('a:has-text("發票查詢與異動")');

      // 切換到內容 iframe 填寫表單
      await page.waitForTimeout(2000);
      const contentFrame = await page.frame("contentFrame");
      if (!contentFrame) {
        throw new Error("找不到 contentFrame iframe");
      }

      await contentFrame.waitForSelector("#input_text", {
        state: "visible",
      });
      await contentFrame.fill("#input_text", orderData.invoiceNumber);

      await contentFrame.click("#btnSubmit");

      // 等待查詢結果載入並截圖
      await page.waitForTimeout(4000);
      try {
        // 等待查詢結果表格出現
        await contentFrame.waitForSelector("div.scroll_x.mb20.mt10", {
          state: "visible",
          timeout: 10000,
        });

        // 對查詢結果表格進行截圖
        await page.waitForTimeout(1000);
        await contentFrame.locator("div.scroll_x.mb20.mt10").screenshot({
          path: `records/${test}/${aotuIssue?alltests[test].invoiceAutoECPay:alltests[test].invoiceManualECPay}.png`,
        });
        console.log("已截圖電子發票查詢結果");
      } catch (error) {
        console.log("無法截圖查詢結果，可能沒有找到訂單:", error.message);
      }
    }
  },
};

export default sharedActions;
