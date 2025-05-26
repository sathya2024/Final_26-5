namespace PortfolioTrackerApi.Models
{
    public class StockQuote
    {
        public string Symbol { get; set; } = string.Empty;
        public decimal? CurrentPrice { get; set; }  // c
        public decimal? OpenPrice { get; set; }     // o
        public decimal? GainLoss { get; set; }      // d
        public decimal? GainLossPercentage { get; set; } // dp
    }
}
