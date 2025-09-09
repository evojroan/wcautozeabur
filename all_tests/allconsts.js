
import dotenv from 'dotenv';
dotenv.config();

export default {
  baseURL: process.env.baseURL,
 
  WCLogin: { WC_UserName: process.env.WC_UserName, WC_PassWord: process.env.WC_PassWord },
  ECPayLogin: {
    Payment: {
      username: "stagetest3", //3002607
      password: "test1234",
      identifier: "00000000",
    },

    Logistics: {
      B2C: {
        username: "stagetest1234", //2000132
        password: "test1234",
        identifier: "53538851",
      },
      C2C: {
        username: "LogisticsC2CTest", //2000933
        password: "test1234",
        identifier: "59780857",
      },
    },

    Invoice: {
      username: "stagetest1234", //2000132
      password: "test1234",
      identifier: "53538851",
    },
  },

  mockMerchantURL:
    "https://payment-beta.ecpay.com.tw/MockMerchant/FinishTradeTest?Environment=Stage",

  //(第一個商品)小於3000元的實體商品 data_producT_id
  productIDLow: 16,
  //  productIDLow: 13,

  //(第二個商品)大於3000元的實體商品 data_producT_id
  productIDHigh: 13,
  //  productIDHigh: 14,

  //(第三個商品)虛擬商品 data_producT_id
  productIDVirtual: 14,
  //productIDVirtual: 15,

  // 結帳頁面的收件者資料
  wcInput: {
    email: "123@test.com",
    shippingFirstName: "Alice",
    shippingLastName: "Lin",
    shippingAddress1: "台北市南港區三重路19之2號D棟6樓",
    shippingCity: "南港區",
    shippingState: "台北市",
    shippingPostcode: "115",
    shippingPhone: "0987654321",
    carrierNumberCitizen: "AA01234567891234",
    carrierNumberCell: "/TS9E3PV",
    companyName: "歐付寶電子支付股份有限公司",
    identifierNumber: "53538851",
    loveCode: "168001",
  },

  //發票選項
  invoiceOptions: {
    invoiceTypeInput: 'select:has(option[value="p"])', //結帳頁面的發票開立選項 - 包含個人選項的選擇器
    invoiceTypeInputAlt: 'select[name*="invoice"], select[id*="invoice"], select option[value="p"]', //替代選擇器
    carrierTypeInput: 'select:has(option[value="0"])', //結帳頁面的載具類型選項 - 包含紙本發票選項的選擇器
    carrierTypeInputAlt: 'select[name*="carrier"], select[id*="carrier"], select option[value="0"]', //替代選擇器
    carrierNumberInput: "#inspector-text-control-0",
  },

  identifier: {
    companyNameTitle: "inspector-text-control-3", //「公司行號」字串
    companyNameInput: "#inspector-text-control-3",
    identifierNumberInput: "#inspector-text-control-4",
  },

  loveCode: {
    loveCodeTitle: "inspector-text-control-6", //「捐贈碼」字串
    loveCodeInput: "#inspector-text-control-3",
  },

  // 物流選項
  ecpayOptions: {
    // logisticsFree: "free_shipping:1",
    // logistics711: "Wooecpay_Logistic_CVS_711:1",
    // logisticsFamily: "Wooecpay_Logistic_CVS_Family:3",
    // logisticsHilife: "Wooecpay_Logistic_CVS_Hilife:2",
    // logisticsOkmart: "Wooecpay_Logistic_CVS_Okmart:4",
    // logisticsTcat: "Wooecpay_Logistic_Home_Tcat:5",
    // logisticsPost: "Wooecpay_Logistic_Home_Post:6",


    logisticsFree: "free_shipping:1",
    logistics711: "Wooecpay_Logistic_CVS_711",
    logisticsFamily: "Wooecpay_Logistic_CVS_Family",
    logisticsHilife: "Wooecpay_Logistic_CVS_Hilife",
    logisticsOkmart: "Wooecpay_Logistic_CVS_Okmart",
    logisticsTcat: "Wooecpay_Logistic_Home_Tcat",
    logisticsPost: "Wooecpay_Logistic_Home_Post",

    // 付款選項
    paymentCod: "cod",
    paymentCredit: "Wooecpay_Gateway_Credit",
    paymentCreditInstallment: "Wooecpay_Gateway_Credit_Installment",
    paymentCreditDCA: "Wooecpay_Gateway_Dca",
    paymentWebatm: "Wooecpay_Gateway_Webatm",
    paymentAtm: "Wooecpay_Gateway_Atm",
    paymentCvs: "Wooecpay_Gateway_Cvs",
    paymentBarcode: "Wooecpay_Gateway_Barcode",
    paymentDca: "Wooecpay_Gateway_Dca",
    paymentTwqr: "Wooecpay_Gateway_Twqr",
    paymentBnpl: "Wooecpay_Gateway_Bnpl",
    paymentWeixin:"Wooecpay_Gateway_Weixin"
  },
};
