namespace PortfolioTrackerApi.Models
{
    public class BondQuote
    {
        public string FixedIncomeName { get; set; } = string.Empty;
        public decimal? CurrentPrice { get; set; }
    }
}