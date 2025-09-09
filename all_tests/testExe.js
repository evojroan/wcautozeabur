//npm install dovenv
//npm install playwright@latest
import { test,logisticsType } from "./config.js";
//💥提醒：把瀏覽器最大化，不要最小化，否則網頁元素會抓不到💥

import alltests from "./alltests.js";

import { chromium } from "@playwright/test";
//引用環境變數

async function testProcess() {
  const browser = await chromium.launch({
    headless: false, // 顯示瀏覽器執行過程
   // slowMo: 1000, // 放慢執行速度，方便觀察
    args: [
      '--start-maximized',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ], // 視窗最大化
  });

  let page;
  try {
    // 創建新的上下文並設置視窗大小
    const context = await browser.newContext({
      viewport: null, // 使用實際螢幕尺寸，不限制 viewport
    });

    // 在上下文中創建新頁面
    page = await context.newPage();

    //零、是否需要事先設定
    if (alltests[test].beforeSetupOption) {
      await alltests[test].beforeSetup(page, alltests[test].beforeSetupOption);
    }

    // 一、 開啟瀏覽器，進入商品頁面
    await alltests[test].goShopping(page);
    console.log(`${test} 測試下單開始`);

    // 二、 WooCommercer 購物車下單結帳
    await alltests[test].wcShopping(page, test);
    console.log("結帳作業結束，進入付款階段");

    // 三、付款
    if (alltests[test].purchaseOption) {
      await alltests[test].purchaseOption(page, test);
      console.log("付款作業結束，進入後台查看");
    } else if (!alltests[test].purchaseOption) {
      console.log("不用全方位金流付款");
    }

    // 四、進入 WooCommerce 後台檢查訂單
    const orderData = await alltests[test].checkWCBackStage(page, test);
    console.log("WooCommerce 後台作業結束，進入綠界廠商管理後台查看");

    //五、進入廠商管理後台檢查金流訂單

    if (alltests[test].purchaseOption) {
      await alltests[test].ECPayBackStageLogin(page, "Payment", logisticsType);
      await alltests[test].checkECPayBackStage(
        page,
        "Payment",
        orderData,
        logisticsType
      );
    } else if (!alltests[test].purchaseOption) {
      console.log("不用全方位金流付款，不至廠商管理後台檢查");
    }

    //六、進入廠商管理後台檢查物流訂單
    if (alltests[test].logisticsOption) {
      await alltests[test].ECPayBackStageLogin(
        page,
        "Logistics",
        logisticsType
      );
      await alltests[test].checkECPayBackStage(
        page,
        "Logistics",
        orderData,
        logisticsType
      );
    }

    //六-2、進入廠商管理後台檢查 C2C 物流訂單
    //await alltests[test].checkECPayBackStage(page, "C2CLogistics", logisticsType, orderData);

    //七、進入廠商管理後台檢查電子發票
    if (logisticsType != "B2C") {
      await alltests[test].ECPayBackStageLogin(page, "Invoice", logisticsType);
    }
    await alltests[test].checkECPayBackStage(
      page,
      "Invoice",
      orderData,
      logisticsType
    );

    ///////////////////////////////////////////////////////////單次結帳自動化結束 ///////////////////////////////////////////////////////////

    console.log(`測試 ${test} 結束。關閉視窗`);
    await page.waitForTimeout(500);
  } catch (error) {
    console.error("自動化過程發生錯誤:", error);
  } finally {
    console.log("單次自動化作業結束");
    await browser.close();
  }
}

// 執行自動化
testProcess();
