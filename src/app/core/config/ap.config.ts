export const AppConfig = {
    api: {
      baseUrl: 'http://localhost:5154/api',
      getInvestments: (userId: string | number) => `http://localhost:5154/api/investment/user/${userId}`,
      getQuote: (symbol: string) => `http://localhost:5154/api/finnhub/quote?symbol=${symbol}`
    },
    charts: {
      PerformanceChart:'performanceChart',
      asset:'assetAllocationChart',
      type : 'line',
      invType:'investmentTypeChart',
      dollar:'$',
      rupees:'$',
      assetAllocationColors: ['#5a8fcf', '#6da86e', '#d4b662', '#b45f66', '#7e6bbd', 
  '#4f76b2', '#8ab8d6', '#589e5a', '#9bcf92', '#e0ca7f', 
  '#c7a13d', '#a74b52', '#d08187', '#6d5ca7', '#988cd4', 
  '#44697d', '#4a7e69', '#bba561', '#87556f', '#605488'
],
      investmentTypeColors: ['#4a6fa1', '#5c8265', '#b59b48', '#a35a5f'],
      performanceLine: {
        borderColor: '#007bff',
        backgroundColor: 'rgba(16, 129, 251, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    },
    transactionType:{
      buy: 'Buy',
      sell: 'Sell',
      Stock: 'Stock',
      MutualFund: 'MutualFund',
      Bond:'Bond',
      Rupees : 'Rupees'
    },
    growthFactor: {
      bond: 1.02,
      default: 1.05,
      s1:0.05
    }
  };
   