const http = require('http');
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: 'oBm8XWYqBXWOzef5sNk0JxyRC6QcLyE9ys9nwcfmBJ0jQGyOBN08ZXd8g9QFQMQM', // change this with your API key
    APISECRET: 'hPjQJFz4eEDKfJpB0mJ17uFjKOqS4DWmw9RJ78mTwSNpGD2A2iHh3ZdUiaiJIhD3', // change this with your API secret
    useServerTime: true, // If you get timestamp errors, synchronize with server time at startup
    test: false // If you want to use the testnet, set this to true
});

const interval = 5 * 60 * 1000; // 5 minutes
const symbol = 'BTCUSDT';
var balance = 0;

function runBot() {
    // Get price data
    binance.candlesticks(symbol, '5m', (error, ticks, symbol) => {
        if (error) {
            console.error(error);
            return;
        }

        // Calculate moving averages
        const period1 = 20;
        const period2 = 50;
        const ma1 = ticks.slice(-period1).reduce((sum, tick) => sum + parseFloat(tick[4]), 0) / period1;
        const ma2 = ticks.slice(-period2).reduce((sum, tick) => sum + parseFloat(tick[4]), 0) / period2;

        // Check for WT Cross signal
        if (ma1 > ma2) {
            // Buy signal
            const quantity = 0.001; // Buy 0.001 BTC
            const currentDateTime = new Date().toLocaleString();
            console.log('\x1b[42m', `Buy signal detected. Placing buy order for ${quantity} of ${symbol} at ${currentDateTime}`,);
            binance.marketBuy(symbol, quantity, (error, response) => {
                if (error) {
                    console.error(error);
                    return;
                }
                console.log(`Bought ${quantity} of ${symbol}`);
                // Place stop-loss and take-profit orders
                const stopPrice = ma1 * 0.95;
                const takePrice = ma1 * 1.05;
                binance.sell(symbol, quantity, takePrice, { stopPrice: stopPrice }, (error, response) => {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    console.log(`Placed stop-loss at ${stopPrice} and take-profit at ${takePrice}`);
                });
            });
        } else if (ma1 < ma2) {
            // Sell signal
            const currentDateTime = new Date().toLocaleString();
            console.log('\x1b[41m', `Sell signal detected. Placing sell order for all of ${symbol} at ${currentDateTime}`);
            binance.balance((error, balances) => {
                if (error) {
                    console.error(error);
                    return;
                }
                const quantity = balances.BTC.available;
                binance.marketSell(symbol, quantity, (error, response) => {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    console.log(`Sold ${quantity} of ${symbol}`);
                });
            });
        }
    });
}

// Run the bot every ** minutes
runBot();
setInterval(runBot, interval);

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.write('Merhaba Dünya!');
    res.end();

});

server.listen(3000, () => {
    console.log('App is running on port 3000');
});