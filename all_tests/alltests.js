import allconsts from "./allconsts.js";
import sharedActions from "./sharedActions.js";
import config from "./config.js"
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

const defaulttest000 = {
  beforeSetupOption: 1,
  productID: allconsts.productIDHigh,
  paymentAction: sharedActions.aioCheckOutCreditCard,
  invoiceTypeSelect: "p",
  carrierTypeSelect: "0",
  logisticsOption: allconsts.ecpayOptions.logistics711,
  paymentOption: allconsts.ecpayOptions.paymentCredit,
  paymentAIO: "2A", //全方位金流付款結果頁面截圖檔名
  paymentWCResult: "41A",//付款完成，導回 WC 結果頁
  paymentWCBackStage: "2B", //WC 訂單內頁截圖檔名
  paymentECPayBackStage: "2C", //廠商管理後台查詢結果截圖檔名
  needECPayPaymentScreeshot: true,
  needLogiScreenshot: true,
  logisticsSelectStore: "44A",
  logisticsWCBackStageBefore: "49A",
  logisticsWCBackStageAfter: "49B",
  logisticsWCBackStage: `${config.logisticsType === "C2C" ? "53A" : "65A"}`, //WC 訂單內頁截圖檔名
  logisticsECPayBackStage: `${config.logisticsType === "C2C" ? "53B" : "65B"}`, //廠商管理後台查詢結果截圖檔名
  logisticsPrintLabel: `${config.logisticsType === "C2C" ? "54A" : "66A"}`,
  needInvoiceScreenshot: true,
  invoiceManualWCBefore: "81A",
  invoiceManualWCAfter: "81B",
  invoiceManualECPay: "81C",
  invoiceAutoWCAfter: "87A",
  invoiceAutoECPay: "87B",
};

const alltests = {
  test000: createTest(defaulttest000),
  test001: createTest({
    ...defaulttest000,
    carrierTypeSelect: "1",
    logisticsOption: allconsts.ecpayOptions.logisticsFamily,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "3",
    paymentAIO: "3A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "3B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "3C", //廠商管理後台查詢結果截圖檔名
    logisticsSelectStore: "45A",
    logisticsWCBackStage: `${config.logisticsType === "C2C" ? "56A" : "68A"
      }`, //WC 訂單內頁截圖檔名
    logisticsECPayBackStage: `${config.logisticsType === "C2C" ? "56B" : "68B"
      }`, //廠商管理後台查詢結果截圖檔名

    logisticsPrintLabel: `${config.logisticsType === "C2C" ? "57A" : "69A"
      }`,

    invoiceManualWCBefore: "82A",
    invoiceManualWCAfter: "82B",
    invoiceManualECPay: "82C",
    invoiceAutoWCAfter: "88A",
    invoiceAutoECPay: "88B",
  }
  ),



  test002: createTest({
    ...defaulttest000,
    carrierTypeSelect: "2", //自然人憑證
    logisticsOption: allconsts.ecpayOptions.logisticsHilife,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "6",
    paymentAIO: "4A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "4B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "4C", //廠商管理後台查詢結果截圖檔名
    logisticsSelectStore: "46A",
    logisticsWCBackStage: `${config.logisticsType === "C2C" ? "59A" : "71A"
      }`, //WC 訂單內頁截圖檔名
    logisticsECPayBackStage: `${config.logisticsType === "C2C" ? "59B" : "71B"
      }`, //廠商管理後台查詢結果截圖檔名

    logisticsPrintLabel: `${config.logisticsType === "C2C" ? "60A" : "72A"
      }`,
    invoiceManualWCBefore: "83A",
    invoiceManualWCAfter: "83B",
    invoiceManualECPay: "83C",
    invoiceAutoWCAfter: "89A",
    invoiceAutoECPay: "89B",
  }),

  test003: createTest({
    ...defaulttest000,
    carrierTypeSelect: "3",
    logisticsOption: config.logisticsType === "C2C" ? allconsts.ecpayOptions.logisticsOkmart : allconsts.ecpayOptions.logisticsHilife,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "12",
    paymentAIO: "5A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "5B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "5C", //廠商管理後台查詢結果截圖檔名
    logisticsSelectStore: "47A",
    logisticsWCBackStage: `${config.logisticsType === "C2C" ? "62A" : "71A"
      }`, //WC 訂單內頁截圖檔名
    logisticsECPayBackStage: `${config.logisticsType === "C2C" ? "62B" : "71B"
      }`, //廠商管理後台查詢結果截圖檔名

    logisticsPrintLabel: `${config.logisticsType === "C2C" ? "63A" : "72A"
      }`,
    invoiceManualWCBefore: "84A",
    invoiceManualWCAfter: "84B",
    invoiceManualECPay: "84C",
    invoiceAutoWCAfter: "90A",
    invoiceAutoECPay: "90B",
  }),

  test004: createTest({
    ...defaulttest000,
    invoiceTypeSelect: "c", //發票：公司
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "18",
    paymentAIO: "6A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "6B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "6C", //廠商管理後台查詢結果截圖檔名
    logisticsWCBackStage: "73A",
    logisticsECPayBackStage: "73B",
    logisticsPrintLabel: "75A",

    invoiceManualWCBefore: "85A",
    invoiceManualWCAfter: "85B",
    invoiceManualECPay: "85C",
    invoiceAutoWCAfter: "91A",
    invoiceAutoECPay: "91B",
  }),

  test005: createTest({
    ...defaulttest000,
    invoiceTypeSelect: "d", //捐贈
    logisticsOption: allconsts.ecpayOptions.logisticsPost,
    paymentOption: allconsts.ecpayOptions.paymentCreditInstallment,
    creditInstallment: "24",
    paymentAIO: "7A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "7B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "7C", //廠商管理後台查詢結果截圖檔名
    logisticsWCBackStage: "76A", //WC 訂單內頁截圖檔名
    logisticsECPayBackStage: "76B", //廠商管理後台查詢結果截圖檔名
    logisticsPrintLabel: "77A",
    invoiceManualWCBefore: "86A",
    invoiceManualWCAfter: "86B",
    invoiceManualECPay: "86C",
    invoiceAutoWCAfter: "92A",
    invoiceAutoECPay: "92B",
  }),

  test006: createTest({
    ...defaulttest000,
    beforeSetupOption: 1,
    paymentOption: allconsts.ecpayOptions.paymentCreditDCA,
    paymentAIO: "8A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "8B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "8C", //廠商管理後台查詢結果截圖檔名
    needLogiScreenshot: false,
    needInvoiceScreenshot: false,
  }),

  test007: createTest({
    ...defaulttest000,
    beforeSetupOption: 2,
    paymentOption: allconsts.ecpayOptions.paymentCreditDCA,
    paymentAIO: "9A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "9B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "9C", //廠商管理後台查詢結果截圖檔名
    needLogiScreenshot: false,
    needInvoiceScreenshot: false,
  }),

  test008: createTest({
    ...defaulttest000,
    beforeSetupOption: 3,
    paymentOption: allconsts.ecpayOptions.paymentCreditDCA,
    paymentAIO: "10A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "10B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "10C", //廠商管理後台查詢結果截圖檔名
    needLogiScreenshot: false,
    needInvoiceScreenshot: false,
  }),

  test009: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    productID: allconsts.productIDVirtual,
    paymentAction: sharedActions.webATM,
    // logisticsOption: allconsts.ecpayOptions.logistics711,
    paymentOption: allconsts.ecpayOptions.paymentWebatm,
    paymentAIO: "12A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "12B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "12C", //廠商管理後台查詢結果截圖檔名
    needLogiScreenshot: false,
    needInvoiceScreenshot: false,
  }),

  test010: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    productID: allconsts.productIDLow,
    paymentAction: sharedActions.ATM,
    paymentOption: allconsts.ecpayOptions.paymentAtm,
    paymentAIO: "13A", //全方位金流付款結果頁面截圖檔名
    paymentMock: "13B",
    paymentWCBackStage: "13C", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "13D", //廠商管理後台查詢結果截圖檔名
  }),

  test011: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentAction: sharedActions.CVS,
    paymentOption: allconsts.ecpayOptions.paymentCvs,
    paymentAIO: "14A", //全方位金流付款結果頁面截圖檔名
    paymentMock: "14B",
    paymentWCBackStage: "14C", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "14D", //廠商管理後台查詢結果截圖檔名
  }),

  test012: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentAction: sharedActions.BARCODE,
    paymentOption: allconsts.ecpayOptions.paymentBarcode,
    paymentAIO: "15A", //全方位金流付款結果頁面截圖檔名
    paymentMock: "15B",
    paymentWCBackStage: "15C", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "15D", //廠商管理後台查詢結果截圖檔名
  }),

  test013: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentAction: sharedActions.TWQR,
    paymentOption: allconsts.ecpayOptions.paymentTwqr,
    paymentAIO: "16A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "16B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "16C", //廠商管理後台查詢結果截圖檔名
  }),

  test014: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentAction: sharedActions.BNPLYurich,
    paymentOption: allconsts.ecpayOptions.paymentBnpl,
    paymentAIO: "17A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "17B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "17C", //廠商管理後台查詢結果截圖檔名
    needLogiScreenshot: false,
    needInvoiceScreenshot: false,
  }),

  test015: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentAction: sharedActions.WeiXin,
    paymentOption: allconsts.ecpayOptions.paymentWeixin,
    paymentAIO: "19A", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "19B", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: "19C", //廠商管理後台查詢結果截圖檔名
    needLogiScreenshot: false,
    needInvoiceScreenshot: false,

  }),

  test016: createTest({
    ...defaulttest000,
    beforeSetupOption: true,
    paymentOption: allconsts.ecpayOptions.paymentCod,
    paymentAction: false,
    logisticsOption: allconsts.ecpayOptions.logistics711,
    logisticsWCBackStage: `${config.logisticsType === "C2C" ? "52A" : "64A"
      }`, //WC 訂單內頁截圖檔名
    logisticsECPayBackStage: `${config.logisticsType === "C2C" ? "52B" : "64B"
      }`, //廠商管理後台查詢結果截圖檔名

    needInvoiceScreenshot: false,

  }),

  test017: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentOption: allconsts.ecpayOptions.paymentCod,
    paymentAction: false,
    logisticsOption: allconsts.ecpayOptions.logisticsFamily,
    logisticsWCBackStage: `${config.logisticsType === "C2C" ? "55A" : "67A"
      }`, //WC 訂單內頁截圖檔名
    logisticsECPayBackStage: `${config.logisticsType === "C2C" ? "55B" : "67B"
      }`, //廠商管理後台查詢結果截圖檔名

    needInvoiceScreenshot: false,
  }),

  test018: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentOption: allconsts.ecpayOptions.paymentCod,
    paymentAction: false,
    carrierTypeSelect: "0",
    logisticsOption: allconsts.ecpayOptions.logisticsHilife,
    logisticsWCBackStage: `${config.logisticsType === "C2C" ? "58A" : "70A"
      }`, //WC 訂單內頁截圖檔名
    logisticsECPayBackStage: `${config.logisticsType === "C2C" ? "58B" : "70B"
      }`, //廠商管理後台查詢結果截圖檔名
  }),

  test019: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentOption: allconsts.ecpayOptions.paymentCod,
    paymentAction: false,
    logisticsOption: allconsts.ecpayOptions.logisticsOkmart,
    logisticsWCBackStage: "61A",
    logisticsECPayBackStage: "61B",
      needInvoiceScreenshot: false,

  }),

  test020: createTest({
    ...defaulttest000,
    beforeSetupOption: false,
    paymentOption: allconsts.ecpayOptions.paymentCod,
    paymentAction: false,
    logisticsOption: allconsts.ecpayOptions.logisticsTcat,
    logisticsWCBackStage: "74A",
    logisticsECPayBackStage: "74B",
      needInvoiceScreenshot: false,
  }),

  test021a: createTest({ //無卡分期：交易已核准但尚未請款
    ...defaulttest000,
    beforeSetupOption: false,
    paymentAction: sharedActions.BNPLZingala,
    paymentOption: allconsts.ecpayOptions.paymentBnpl,
    bnplOption: "18A",
    paymentAIO: "18B", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "18C", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: false, //廠商管理後台查詢結果截圖檔名
    needECPayPaymentScreeshot: false,
    needLogiScreenshot: false,
    needInvoiceScreenshot: false,
  }),

    test021b: createTest({ //無卡分期：交易已核准但尚未請款
    ...defaulttest000,
    beforeSetupOption: false,
    paymentAction: sharedActions.BNPLZingala,
    paymentOption: allconsts.ecpayOptions.paymentBnpl,
    bnplOption: "18D",
    paymentAIO: "18E", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "18F", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: false, //廠商管理後台查詢結果截圖檔名
    needECPayPaymentScreeshot: false,
   needLogiScreenshot: false,
    needInvoiceScreenshot: false,
  }),

      test021c: createTest({ //無卡分期：交易已核准但尚未請款
    ...defaulttest000,
    beforeSetupOption: false,
    paymentAction: sharedActions.BNPLZingala,
    paymentOption: allconsts.ecpayOptions.paymentBnpl,
    bnplOption: "18G",
    paymentAIO: "18H", //全方位金流付款結果頁面截圖檔名
    paymentWCBackStage: "18I", //WC 訂單內頁截圖檔名
    paymentECPayBackStage: false, //廠商管理後台查詢結果截圖檔名
    needECPayPaymentScreeshot: false,
    needLogiScreenshot: false,
    needInvoiceScreenshot: false,
  }),




};

export default alltests;
