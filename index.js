const request = require('request');
const tulind = require('tulind');
const Binance = require('binance-api-node').default;
const BinanceAPI = require('node-binance-api');
const binance = new BinanceAPI().options({
  APIKEY: '063bc1ef7978e633e2aa2b30c4ce47139acb0880524d1302a8e52086323f0119',
  APISECRET: 'f4744207a99b585cf3faa2907e290b6c41e51c71f02fc8ba43023509b5ee9a64',
  useServerTime: true, // If you get timestamp errors, synchronize with server time at startup
  test: true // If you want to use the testnet, set this to true
});

const client = Binance({
  APIKEY: '063bc1ef7978e633e2aa2b30c4ce47139acb0880524d1302a8e52086323f0119', // change this with your API key
  APISECRET: 'f4744207a99b585cf3faa2907e290b6c41e51c71f02fc8ba43023509b5ee9a64', // change this with your API secret
  useServerTime: true, // If you get timestamp errors, synchronize with server time at startup
  test: true // If you want to use the testnet, set this to true
});

const symbol = 'BTCUSDT'; // Binance'da kullanılan sembol
const interval = '1h'; // 1 saatlik zaman aralığı
const tradeAmount = 0.03; // Her işlemde kullanılacak miktar
const leverage = 100;
var balance = 1000;
const minRSI = 52;
const maxRSI = 70;

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

async function buy({ rsi }) {
  const currentDateTime = new Date().toLocaleString();
  console.log('\x1b[32m', 'Alim sinyali geldi, aliniyor...', currentDateTime);
  const sellModel = {
    // balance: balance - tradeAmount,
    leverage,
    name: symbol,
    rsi: parseFloat(rsi).toFixed(2),
    tradeAmount,
    time: currentDateTime,
    type: 'sale',
  };
  transactionsList.push(sellModel);
  // console.log({ transactionsList })
  // buy
  await binance.futuresLeverage(symbol, leverage);
  binance.futuresMarketBuy(symbol, tradeAmount)
    .then(order => {
      console.log(order);
      balance = parseFloat(order.origQty);
    })
    .catch(error => console.error(error));
}

async function sell({ rsi }) {
  const currentDateTime = new Date().toLocaleString();
  console.log('\x1b[31m', 'Satis sinyali geldi, satiliyor...', currentDateTime);
  const buyModel = {
    // balance: balance + tradeAmount,
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
  await binance.futuresLeverage(symbol, leverage);

  binance.futuresMarketSell(symbol, tradeAmount)
    .then(order => {
      console.log(order);
      balance = parseFloat(order.origQty);
    })
    .catch(error => console.error(error));
}

async function getFuturesPositions() {
  let position_data = await binance.futuresPositionRisk(), markets = Object.keys(position_data);
  for (let market of markets) {
    let obj = position_data[market], size = Number(obj.positionAmt);
    if (size == 0) continue;
    console.info(`${leverage}x\t${market}\t${obj.unRealizedProfit}`);
    //console.info( obj ); //positionAmt entryPrice markPrice unRealizedProfit liquidationPrice leverage marginType isolatedMargin isAutoAddMargin maxNotionalValue
  }
}

async function checkSignal() {
  // mantık;
  // RSI'ın 30'un altına düşmesi alım sinyali,
  // 70'in üzerine çıkması ise satım sinyalidir.
  const currentDateTime = new Date().toLocaleString();
  getRSI(rsi => {
    if (lastRSI < minRSI) {
      return buy({ rsi });
    } else if (lastRSI >= maxRSI) {
      return sell({ rsi });
    }
    return console.log('\x1b[33m', 'Durum: Takipte,', `Tarih: ${currentDateTime},`, `RSI: ${parseFloat(rsi).toFixed(2)}`);
  });
}

// setInterval(checkSignal, 1000 * 60 * 60); // Her saatte bir sinyal kontrolü yap
// setInterval(checkSignal, 1000 * 60); // Her dakikada bir sinyal kontrolü yap
setInterval(checkSignal, 1000 * 60 * 10);
checkSignal();