//npm install dovenv
//npm install playwright@latest

import config from "./config.js";
//💥提醒：把瀏覽器最大化，不要最小化，否則網頁元素會抓不到💥

import alltests from "./alltests.js";
import allconsts from './allconsts.js'
import { chromium } from "@playwright/test";

async function testProcess(item) {
  const browser = await chromium.launch({
    headless: false, // 顯示瀏覽器執行過程
    //slowMo: 1000, // 放慢執行速度，方便觀察
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
    if (alltests[item].beforeSetupOption) {
      await alltests[item].beforeSetup(page, alltests[item].beforeSetupOption);
    }

    // 一、 開啟瀏覽器，進入商品頁面
    await alltests[item].goShopping(page);
    console.log(`${item} 測試下單開始`);

    // 二、 WooCommercer 購物車下單結帳
    await alltests[item].wcShopping(page, item);
    console.log("結帳作業結束，進入付款階段");

    // 三、付款
    if (alltests[item].paymentAction) {
      await alltests[item].paymentAction(page, item);
      console.log("付款作業結束，進入後台查看");
    } else if (!alltests[item].paymentAction) {
      console.log("不用全方位金流付款");
    }

    // 四、進入 WooCommerce 後台檢查訂單
    const orderData = await alltests[item].checkWCBackStage(page, item);
    console.log("WooCommerce 後台作業結束，進入綠界廠商管理後台查看");

    //五、進入廠商管理後台檢查金流訂單

    if (alltests[item].paymentAction && alltests[item].needECPayPaymentScreeshot) {
      await alltests[item].ECPayBackStageLogin(page, "Payment", config.logisticsType);
      await alltests[item].checkECPayBackStage(
        page,
        "Payment",
        orderData,
        config.logisticsType,
        item
      );
    } else if (alltests[item].paymentOption == allconsts.ecpayOptions.paymentCod) {
      console.log("不用全方位金流付款，不至廠商管理後台檢查");
    } else { console.log("不用到廠商管理後台查看金流訂單") }

    //六、進入廠商管理後台檢查物流訂單
    if (alltests[item].logisticsOption && alltests[item].needLogiScreenshot) {
      await alltests[item].ECPayBackStageLogin(
        page,
        "Logistics",
        config.logisticsType
      );
      await alltests[item].checkECPayBackStage(
        page,
        "Logistics",
        orderData,
        config.logisticsType,
        item
      );
    } else { console.log("不用到廠商管理後台查看物流訂單") }

    //六-2、進入廠商管理後台檢查 C2C 物流訂單
    //await alltests[item].checkECPayBackStage(page, "C2CLogistics", config.logisticsType, orderData);

    //七、進入廠商管理後台檢查電子發票
    if (alltests[item].needInvoiceScreenshot) {
      if (config.logisticsType === "C2C") {
        await alltests[item].ECPayBackStageLogin(page, "Invoice", config.logisticsType);
      }

      await alltests[item].checkECPayBackStage(
        page,
        "Invoice",
        orderData,
        config.logisticsType,
        item
      );
    }
    else if (alltests[item].paymentOption == allconsts.ecpayOptions.paymentCod) { console.log("貨到付款，不至廠商管理後台檢查"); }
    else { console.log("不用到廠商管理後台查看電子發票") }




    ///////////////////////////////////////////////////////////單次結帳自動化結束 ///////////////////////////////////////////////////////////

    console.log(`測試 ${item} 結束。關閉視窗`);
    await page.waitForTimeout(500);
  } catch (error) {
    console.error("自動化過程發生錯誤:", error);
  } finally {
    console.log("單次自動化作業結束");
    await browser.close();
  }
}



//依序執行每個測試
(async () => {
  for (const test of config.testArray) {
    await testProcess(test);
  }
  console.log('所有測試執行完畢');
})();
