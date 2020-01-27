const puppeteer = require('puppeteer');

// 検索する商品名
const query = 'ipad'

puppeteer.launch({
  headless: false, // 動いているところをみるため
  slowMo: 300      // 何が起こっているかを分かりやすくするため遅延
}).then(async browser => {
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 800 }); // view portの指定
  await page.goto('https://kakaku.com/');
  await page.type('#query', query);
  await page.click('#main_search_button');

  // タブを移動
  const pages = await browser.pages();
  const detailPage = pages[1];
  await detailPage.bringToFront();

  // 検索後の商品一覧から、商品のリンクを取得
  const results = await detailPage.evaluate(() => Array.from(document.querySelectorAll('.p-result_list_wrap > div > .c-list1_cell > div > .p-result_item_cell-1 > .c-positioning > p > a')).map(a => a.href));
  console.log(results);

  browser.close();
});