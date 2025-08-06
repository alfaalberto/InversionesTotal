export type Stock = {
  id: string;
  ticker: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE' | 'BMV' | 'OTCM';
  currency: 'USD' | 'MXN';
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  logoUrl?: string;
};

export type PortfolioData = Stock[];

export const rawInitialPortfolioData: Omit<Stock, 'id' | 'currentPrice' | 'logoUrl' | 'name'>[] = [
    { ticker: 'BOTZ', exchange: 'NASDAQ', currency: 'USD', quantity: 5, purchasePrice: 20.34, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'HOOD', exchange: 'NASDAQ', currency: 'USD', quantity: 5, purchasePrice: 17.25, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'INTC', exchange: 'NASDAQ', currency: 'USD', quantity: 0, purchasePrice: 0, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'PFE', exchange: 'NYSE', currency: 'USD', quantity: 2, purchasePrice: 73.34, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'PYPL', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 3.88, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'SOFI', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 310.00, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'AMD', exchange: 'NASDAQ', currency: 'USD', quantity: 7, purchasePrice: 158.92, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'TDOC', exchange: 'NYSE', currency: 'USD', quantity: 1, purchasePrice: 9.10, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'ENPH', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 31.63, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'QQQ', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 14.44, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'WBA', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 17.23, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'SBUX', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 86.00, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'NIO', exchange: 'NYSE', currency: 'USD', quantity: 3, purchasePrice: 1.06, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'RIVN', exchange: 'NASDAQ', currency: 'USD', quantity: 3, purchasePrice: 58.75, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'SHOP', exchange: 'NYSE', currency: 'USD', quantity: 10, purchasePrice: 34.43, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'DIS', exchange: 'NYSE', currency: 'USD', quantity: 1, purchasePrice: 449.42, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'CUERVO*', exchange: 'BMV', currency: 'MXN', quantity: 1, purchasePrice: 16.84, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'BIMBOA', exchange: 'BMV', currency: 'MXN', quantity: 5, purchasePrice: 59.94, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'LABB', exchange: 'BMV', currency: 'MXN', quantity: 10, purchasePrice: 33.17, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'FEMSAUB', exchange: 'BMV', currency: 'USD', quantity: 0, purchasePrice: 0, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'SITES1A-1', exchange: 'BMV', currency: 'MXN', quantity: 2, purchasePrice: 12.40, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'QLYS', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 139.32, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'NVDA', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 56.05, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'HUM', exchange: 'NYSE', currency: 'USD', quantity: 1, purchasePrice: 96.00, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'DOX', exchange: 'NASDAQ', currency: 'USD', quantity: 5, purchasePrice: 71.18, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'NKE', exchange: 'NYSE', currency: 'USD', quantity: 1, purchasePrice: 178.06, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'BA', exchange: 'NYSE', currency: 'USD', quantity: 2, purchasePrice: 43.62, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'CVS', exchange: 'NYSE', currency: 'USD', quantity: 1, purchasePrice: 2.87, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'WHR', exchange: 'NYSE', currency: 'USD', quantity: 1, purchasePrice: 92.29, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'PTON', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 85.82, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'SPWRQ', exchange: 'OTCM', currency: 'USD', quantity: 2, purchasePrice: 156.41, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'PLUG', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 3.17, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'FCEL', exchange: 'NASDAQ', currency: 'USD', quantity: 1, purchasePrice: 97.77, purchaseDate: '2024-06-17T00:00:00-06:00' },
    { ticker: 'TDOC', exchange: 'NYSE', currency: 'USD', quantity: 10, purchasePrice: 5.11, purchaseDate: '2024-06-17T00:00:00-06:00' },
];

export const exchangeRateHistory = [
    { date: 'Ene', rate: 17.10 },
    { date: 'Feb', rate: 17.05 },
    { date: 'Mar', rate: 16.70 },
    { date: 'Abr', rate: 16.40 },
    { date: 'May', rate: 16.80 },
    { date: 'Jun', rate: 17.50 },
    { date: 'Jul', rate: 18.20 },
]

export const getPortfolioMetrics = (data: PortfolioData) => {
    const metrics = data.map(stock => {
        const purchaseValue = stock.quantity * stock.purchasePrice;
        const currentValue = stock.quantity * stock.currentPrice;
        const pnl = currentValue - purchaseValue;
        const pnlPercent = purchaseValue > 0 ? (pnl / purchaseValue) * 100 : 0;
        
        return {
            ...stock,
            purchaseValue,
            currentValue,
            pnl,
            pnlPercent,
        };
    });

    const totalPortfolioValue = metrics.reduce((acc, stock) => acc + stock.currentValue, 0);

    return metrics.map(stock => ({
        ...stock,
        portfolioShare: totalPortfolioValue > 0 ? (stock.currentValue / totalPortfolioValue) * 100 : 0,
    })).filter(stock => stock.quantity > 0);
};
