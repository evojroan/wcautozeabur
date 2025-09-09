import allconsts from "./allconsts.js";
import sharedActions from "./sharedActions.js";
import { test, logisticsType } from "./config.js";

// 測試工廠函數
function createTest(actions) {
  return {
    // 共享步驟
    beforeSetup: sharedActions.beforeSetup,
    goShopping: sharedActions.goShopping,
    wcShopping: sharedActions.wcShopping,
    checkWCBackStage: sharedActions.checkWCBackStage,
    ECPayBackStageLogin: sharedActions.ECPayBackStageLogin,
    checkECPayBackStage: sharedActions.checkECPayBackStage,

    ...actions,
  };
}

const alltests = {
  test000: createTest({
    beforeSetupOption: 1,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logistics711,
    paymentOption: allconsts.ecpayOptions.paymentCredit,

    paymentScreenshotAIO: "2A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "2B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "2C", //廠商管理後台查詢結果截圖檔名

    logisticsScreenshotWCBackStageBefore: "建立物流訂單以前",
    logisticsScreenshotWCBackStage: `${
      logisticsType === "C2C" ? "51A" : "63A"
    }`, //WC 訂單內頁截圖檔名
    logisticsScreenshotECPayBackStage: `${
      logisticsType === "C2C" ? "51B" : "63B"
    }`, //廠商管理後台查詢結果截圖檔名

    logisticsScreenshotPrintLabel: `${
      logisticsType === "C2C" ? "52A" : "64A"
    }`,

    invoiceManualWCBefore: "79A",
    invoiceManualWCAfter: "79B",
    invoiceManualECPay:"79C",
    invoiceAutoWCAfter:"85A",
    invoiceAutoECPay: "85B",
  }),

  test001: createTest({
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "1",
    logisticsOption: allconsts.ecpayOptions.logisticsFamily,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "3",
    paymentScreenshotAIO: "3A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "3B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "3C", //廠商管理後台查詢結果截圖檔名

    logisticsScreenshotWCBackStage: `${
      logisticsType === "C2C" ? "54A" : "66A"
    }`, //WC 訂單內頁截圖檔名
    logisticsScreenshotECPayBackStage: `${
      logisticsType === "C2C" ? "54B" : "66B"
    }`, //廠商管理後台查詢結果截圖檔名

    logisticsScreenshotPrintLabel: `${
      logisticsType === "C2C" ? "55A" : "67A"
    }`,

    invoiceManualWCBefore: "80A",
    invoiceManualWCAfter: "80B",
    invoiceManualECPay:"80C",
    invoiceAutoWCAfter:"86A",
    invoiceAutoECPay: "86B",

 

  
  }),

  test002: createTest({
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "p", //發票：個人
    carrierTypeSelect: "2", //自然人憑證
    logisticsOption: allconsts.ecpayOptions.logisticsHilife,

    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "6",
    paymentScreenshotAIO: "4A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "4B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "4C", //廠商管理後台查詢結果截圖檔名
  }),

  test003: createTest({
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "3",
    logisticsOption: allconsts.ecpayOptions.logisticsOkmart,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "12",
    paymentScreenshotAIO: "5A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "5B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "5C", //廠商管理後台查詢結果截圖檔名
  }),

  test004: createTest({
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "c", //發票：公司
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "18",
    paymentScreenshotAIO: "6A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "6B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "6C", //廠商管理後台查詢結果截圖檔名
  }),
  test005: createTest({
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "d", //捐贈
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsPost,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "24",
    paymentScreenshotAIO: "7A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "7B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "7C", //廠商管理後台查詢結果截圖檔名
  }),

  test006: createTest({
    beforeSetupOption: 1,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsPost,
    paymentOption: allconsts.ecpayOptions.paymentCreditDCA,
    paymentScreenshotAIO: "8A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "8B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "8C", //廠商管理後台查詢結果截圖檔名
  }),
  test007: createTest({
    beforeSetupOption: 2,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsPost,
    paymentOption: allconsts.ecpayOptions.paymentCreditDCA,
    paymentScreenshotAIO: "9A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "9B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "9C", //廠商管理後台查詢結果截圖檔名
  }),
  test008: createTest({
    beforeSetupOption: 3,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.aioCheckOutCreditCard,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsPost,
    paymentOption: allconsts.ecpayOptions.paymentCreditDCA,
    paymentScreenshotAIO: "10A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "10B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "10C", //廠商管理後台查詢結果截圖檔名
  }),

  test009: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDVirtual,
    purchaseOption: sharedActions.webATM,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    // logisticsOption: allconsts.ecpayOptions.logistics711,
    paymentOption: allconsts.ecpayOptions.paymentWebatm,
    paymentScreenshotAIO: "12A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "12B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "12C", //廠商管理後台查詢結果截圖檔名
  }),

  test010: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDLow,
    purchaseOption: sharedActions.ATM,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    paymentOption: allconsts.ecpayOptions.paymentAtm,
    paymentScreenshotAIO: "13A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotMock: "13B",
    paymentScreenshotWCBackStage: "13C", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "13D", //廠商管理後台查詢結果截圖檔名
  }),

  test011: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.CVS,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    paymentOption: allconsts.ecpayOptions.paymentCvs,
    paymentScreenshotAIO: "14A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotMock: "14B",
    paymentScreenshotWCBackStage: "14C", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "14D", //廠商管理後台查詢結果截圖檔名
  }),

  test012: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.BARCODE,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    paymentOption: allconsts.ecpayOptions.paymentBarcode,
    paymentScreenshotAIO: "15A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotMock: "15B",
    paymentScreenshotWCBackStage: "15C", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "15D", //廠商管理後台查詢結果截圖檔名
  }),

  test013: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.TWQR,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    paymentOption: allconsts.ecpayOptions.paymentTwqr,
    paymentScreenshotAIO: "16A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "16B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "16C", //廠商管理後台查詢結果截圖檔名
  }),

  test014: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.BNPL,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    paymentOption: allconsts.ecpayOptions.paymentBnpl,
    paymentScreenshotAIO: "17A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "17B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "17C", //廠商管理後台查詢結果截圖檔名
  }),

  test015: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDHigh,
    purchaseOption: sharedActions.WeiXin,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    paymentOption: allconsts.ecpayOptions.paymentWeixin,
    paymentScreenshotAIO: "18A", //全方位金流付款結果頁面截圖檔名
    paymentScreenshotWCBackStage: "18B", //WC 訂單內頁截圖檔名
    paymentScreenshotECPayBackStage: "18C", //廠商管理後台查詢結果截圖檔名
    
  }),

  test016: createTest({
    beforeSetupOption: true,
    productID: allconsts.productIDHigh,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logistics711,
    paymentOption: allconsts.ecpayOptions.paymentCod,
    logisticsScreenshotWCBackStage: `${
      logisticsType === "C2C" ? "50A" : "62A"
    }`, //WC 訂單內頁截圖檔名
    logisticsScreenshotECPayBackStage: `${
      logisticsType === "C2C" ? "50B" : "62B"
    }`, //廠商管理後台查詢結果截圖檔名
    invoiceScreenshotWCBackStage: "invoiceScreenshotWCBackStage",
    invoiceScreenshotECPayBackStage: "invoiceScreenshotECPayBackStage",
  }),

  test017: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDHigh,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsFamily,
    paymentOption: allconsts.ecpayOptions.paymentCod,
  }),

  test018: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDHigh,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsHilife,
    paymentOption: allconsts.ecpayOptions.paymentCod,
  }),

  test019: createTest({
    beforeSetupOption: false,
    productID: allconsts.productIDHigh,
    invoiceTypeSelect: "p",
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsOkmart,
    paymentOption: allconsts.ecpayOptions.paymentCod,
  }),
};

export default alltests;
