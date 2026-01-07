# 這是什麼？
綠界的 ECPay Ecommerce for WooCommerce 外掛模組能夠於 WooCommerce 網站整合 ECPay 金流、物流、電子發票功能。因應模組更新後測試需求，本專案能夠測試 ECPay Ecommerce for WooCommerce 模組的各項功能，包含：

| 金流 | 物流 (B2C / C2C) | 電子發票 |
|---|---|---|
| 信用卡一次付清 | 自動/手動建立物流訂單 | 自動 / 手動開電子發票 |
| 信用卡分期付款 | 列印物流託運單 | 捐贈發票 |
| 信用卡 定期定額 | 取貨付款 | 打統編 |
| WebATM | 7-11 | 紙本發票 |
| ATM | 全家 | 雲端發票(綠界會員載具) |
| CVS | 萊爾富 | 自然人憑證 |
| BARCODE | OK | 手機條碼 |
| TWQR | 黑貓 | |
| BNPL(URICH / ZINGALA) | 中華郵政 | |
| 微信支付 | | |

# 使用工具
- Node.js V22
- Playwright V1.5
- Tesseract.js V6.0.1

# 如何使用？
1. 先於網路上部署好 WooCommerce 網站並安裝最新版 ECPay Ecommerce for WooCommerce 
2. 網站設置(至少)三種商品，包含：小於3000元的實體商品、大於3000元的實體商品、虛擬商品至少三種
3. 於 WooCommerce 後台啟用所有綠界金流付款方式與物流運送方式，並完成其餘必要設置，參考：[https://developers.ecpay.com.tw/?p=59720](https://developers.ecpay.com.tw/?p=59720)
4. 於本機安裝 Node.js、Playwright
5. 將本專案下載並安裝至本機
6. 於專案根目錄新增 .env 檔，增加登入 WooCommerce 後台的網址、管理員帳號密碼：
```
baseURL=XXX
WC_UserName=XXX
WC_PassWord=XXX
```
7. 以網頁瀏覽器開發者工具打開 WooCommerce 結帳頁面的 HTML：
 - 取得前述三樣商品於 <button> 標籤的屬性 `data-product_id` 值，並分別輸入 `allconsts.js` 的 `productIDLow`、`productIDHigh`、` productIDVirtual` 中
 - 檢查 `allconsts.js` 的各參數值是否與網頁 DOM 的標籤值相符合，參閱「注意事項」。
8. 於 `config.js` 設定是否要自動開發票、自動建立物流訂單、物流子類型，同時 WooCommerce 設定也一併同步調整；要測試的測案。

# 注意事項
- 執行過程中若有步驟未進行(例如結帳頁面並未點選指定的付款方式)，則請優先檢查 HTML 標籤值與 `allconsts.js` 設定的值是否正確。例如

1. 結帳頁面的信用卡選項，其 HTML 為：
```<input id="radio-control-wc-payment-method-options-Wooecpay_Gateway_Credit" class="wc-block-components-radio-control__input" type="radio" name="radio-control-wc-payment-method-options" aria-describedby="radio-control-wc-payment-method-options-Wooecpay_Gateway_Credit__content" aria-disabled="false" value="Wooecpay_Gateway_Credit">```

其中 `value="Wooecpay_Gateway_Credit"` 對應 allconsts.js 的 `paymentCredit: "Wooecpay_Gateway_Credit"`

2. 結帳頁面的物流運送選項，7-ELEVEN 為：
```<input id="radio-control-0-Wooecpay_Logistic_CVS_711:9" class="wc-block-components-radio-control__input" type="radio" name="radio-control-0" aria-describedby="radio-control-0-Wooecpay_Logistic_CVS_711:9__secondary-label" aria-disabled="false" value="Wooecpay_Logistic_CVS_711:9" checked="">```

其中 `value="Wooecpay_Logistic_CVS_711:9"` 對應 allconsts.js 的 `logistics711: "Wooecpay_Logistic_CVS_711"`；實際執行程式碼 `` await page.click(`input[value^="${alltests[test].logisticsOption}"]`) `` 因以 `^=` 抓取，故仍可對應到該元素。

#  待更新功能
- 將自動開發票、自動建立物流訂單、物流子類型功能加入自動化作業中，不需要再手動到 WooCommerce 後台調整。