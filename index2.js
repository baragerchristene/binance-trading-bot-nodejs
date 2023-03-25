const http = require('http');
const Binance = require('node-binance-api');
const TechnicalIndicators = require('technicalindicators');

const binance = new Binance().options({
    APIKEY: 'WjHagHrMfwaIS62XzUAAMfKuPMt0QBszPU5Qm8t7be6Ku0EbpWlO8xzmJRc28HHR',
    APISECRET: 'nJOf6JAjWj599XpLKBeN0EvcTTX3RfTIYglHUTQ8Xbhs0zRD4PDjvOo0JkuXHGIL',
    useServerTime: true, // If you get timestamp errors, synchronize to server time at startup
    test: true // If you want to use sandbox mode where orders are simulated
});

const sma = TechnicalIndicators.SMA;
const ema = TechnicalIndicators.EMA;

const calculateWTcross = (symbol, interval, callback) => {
    binance.candlesticks(symbol, interval, (error, ticks, symbol) => {
        if (error) {
            console.error(error);
            return;
        }

        const closes = ticks.map(tick => parseFloat(tick[4]));
        const wt = new TechnicalIndicators.WilliamsR({
            period: 14,
            values: [],
            reversedInput: true
        });
        
        const wtResult = wt.getResult({ values: closes });
        console.log('burdayım1')
        const wtLast = wtResult[wtResult.length - 1];

        const ema20 = ema.calculate({ period: 20, values: closes });
        const sma50 = sma.calculate({ period: 50, values: closes });

        const lastClose = closes[closes.length - 1];
        if (wtLast >= -80 && lastClose > ema20 && lastClose > sma50) {
            console.log('Buy signal detected');

            // satın alma işlemi aç
            console.log(`Buy order placed for ${symbol}`);

            // binance.marketBuy(symbol, 0.001, (error, response) => {
            //     if (error) {
            //         console.error(error);
            //         return;
            //     }
            //     console.log(response);
            // });
        } else if (wtLast <= -20 && lastClose < ema20 && lastClose < sma50) {
            console.log('Sell signal detected');

            // satış işlemi aç
            console.log(`Sell order placed for ${symbol}`);

            // binance.marketSell(symbol, 0.001, (error, response) => {
            //     if (error) {
            //         console.error(error);
            //         return;
            //     }
            //     console.log(response);
            // });
        } else {
            console.log('No signal detected');
        }

        if (callback) {
            callback();
        }
    });
};

setInterval(() => {
    calculateWTcross('BTCUSDT', '1m', () => {
        console.log('WT cross calculated');
    });
}, 5000);

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write('Merhaba Dünya!');
    res.end();

});
server.listen(3000, () => {
    console.log('Uygulama çalıştırıldı...');
});