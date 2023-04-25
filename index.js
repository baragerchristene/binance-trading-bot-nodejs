const request = require('request');
const tulind = require('tulind');
const Binance = require('binance-api-node').default;
const client = Binance({
  APIKEY: 'oBm8XWYqBXWOzef5sNk0JxyRC6QcLyE9ys9nwcfmBJ0jQGyOBN08ZXd8g9QFQMQM', // change this with your API key
  APISECRET: 'hPjQJFz4eEDKfJpB0mJ17uFjKOqS4DWmw9RJ78mTwSNpGD2A2iHh3ZdUiaiJIhD3', // change this with your API secret
  // useServerTime: true, // If you get timestamp errors, synchronize with server time at startup
  // test: false // If you want to use the testnet, set this to true
});

const symbol = 'BTCUSDT'; // Binance'da kullanılan sembol
const interval = '1h'; // 1 saatlik zaman aralığı
const tradeAmount = 10; // Her işlemde kullanılacak miktar
const leverage = 100;
var balance = 1000;

let lastRSI;

const apiUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}`;

var transactionsList = [];

function getRSI(callback) {
  request(apiUrl, function (error, response, body) {
    if (error) throw new Error(error);

    const data = JSON.parse(body);
    const closePrices = data.map(d => parseFloat(d[4]));

    tulind.indicators.rsi.indicator([closePrices], [14], (err, results) => {
      if (err) throw new Error(err);

      const rsi = results[0][results[0].length - 1];
      lastRSI = rsi;
      callback(rsi);
    });
  });
}

function getCurrentPrice() {
  return client.futuresPrices().then((prices) => {
    const currentPrice = parseFloat(prices['BTCUSDT']);
    console.log('Mevcut fiyat:', currentPrice);
    return currentPrice;
  });
}

function buy({ rsi }) {
  const currentDateTime = new Date().toLocaleString();
  console.log('\x1b[32m', 'Alim sinyali geldi, aliniyor...', currentDateTime);
  const sellModel = {
    balance: balance - tradeAmount,
    leverage,
    name: symbol,
    rsi: parseFloat(rsi).toFixed(2),
    tradeAmount,
    time: currentDateTime,
    type: 'sale',
  };
  transactionsList.push(sellModel);
  // console.log({ transactionsList })
  // // buy
  // client.futuresMarketBuy(symbol, { quantity: tradeAmount, leverage })
  //   .then(order => {
  //     console.log(order);
  //     balance = parseFloat(order.origQty);
  //   })
  //   .catch(error => console.error(error));
}

function sell({ rsi }) {
  const currentDateTime = new Date().toLocaleString();
  console.log('\x1b[31m', 'Satis sinyali geldi, satiliyor...', currentDateTime);
  const buyModel = {
    balance: balance + tradeAmount,
    leverage,
    name: symbol,
    rsi: parseFloat(rsi).toFixed(2),
    tradeAmount,
    time: currentDateTime,
    type: 'buy'
  };
  transactionsList.push(buyModel);
  // console.log({ transactionsList })

  // sell
  // client.futuresMarketSell(symbol, { quantity: tradeAmount, leverage })
  //   .then(order => {
  //     console.log(order);
  //     balance = parseFloat(order.origQty);
  //   })
  //   .catch(error => console.error(error));
}

function checkSignal() {
  // mantık;
  // RSI'ın 30'un altına düşmesi alım sinyali,
  // 70'in üzerine çıkması ise satım sinyalidir.
  const currentDateTime = new Date().toLocaleString();
  getRSI(rsi => {
    if (lastRSI < 52) {
      return buy({ rsi });
    } else if (lastRSI >= 70) {
      return sell({ rsi });
    }
    return console.log('\x1b[33m', 'Durum: Takipte,', `Tarih: ${currentDateTime},`, `RSI: ${parseFloat(rsi).toFixed(2)}`, `Bakiye: ${balance}`);
  });
}

// setInterval(checkSignal, 1000 * 60 * 60); // Her saatte bir sinyal kontrolü yap
setInterval(checkSignal, 1000 * 60); // Her dakikada bir sinyal kontrolü yap
checkSignal();