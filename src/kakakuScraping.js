const puppeteer = require('puppeteer');
const fs = require('fs');

// 検索する商品名
const query = 'ipad';

puppeteer.launch({
  headless: false, // フルバージョンのChromeを使用
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
  // console.log(results);

  var products = [];

  // 商品ループ
  for (const result of results) {
    
    await page.waitFor(1000); // スクレイピングする際にはアクセス間隔を1秒あける.
    await page.goto(result);

    // リンク先が、価格.comのレビューページか商品の外部リンクの2択あるのでその選別
    if (page.url().match(/kakaku.com/)) {
      // #レビューの存在をチェック
      if(await page.$('#ovBtnBox > ul > .review > .btn > .stars').then(res => !!res)) {

        page.click('#ovBtnBox > ul > .review');
        await page.waitForNavigation({timeout: 60000, waitUntil: "domcontentloaded"});

        let pageTitle =　await page.$eval("#titleBox > .boxL > h2", selector => {
          return selector.textContent.trim();// タイトル取得
        })
        // console.log(pageTitle);

        const reviews = await page.evaluate(() => Array.from(document.querySelectorAll(".reviewBoxWtInner")).map(el => {
          return {
            date: el.querySelector(".entryDate").textContent.trim(), // 日付取得
            refer: el.querySelector(".referCount > span").textContent.trim(), // 参考になった人数取得
            title: el.querySelector(".revMainClmWrap > .reviewTitle > span").textContent.trim(), // レビューのタイトル
            cont: el.querySelector(".revEntryCont").textContent, // レビューの内容
          }
        }));
        products.push({
          proTitle: pageTitle,
          proUrl: result,
          reviews: reviews
        });
        // console.log(products);
        // console.log(reviews);
      // } else {
      //   console.log('kakaku.comのサイトではありません。')
      // }
      // break;
      }

      await page.waitFor(1000); // スクレイピングする際にはアクセス間隔を1秒あける.
    }
  }

  //結果をファイルに出力
  fs.writeFile('../data/query_' + query + '.json', JSON.stringify(products, null , "\t"),(err) => {
    if (err) throw err;
   console.log('done!');
  });

  browser.close();
});