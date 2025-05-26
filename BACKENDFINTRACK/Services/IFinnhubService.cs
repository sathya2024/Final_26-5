using System.Collections.Generic;
using System.Threading.Tasks;
using PortfolioTrackerApi.Models;

namespace PortfolioTrackerApi.Services
{
    public interface IFinnhubService
    {
        Task<List<StockMatch>> SearchSymbolAsync(string query, string? exchange = null);
        Task<StockQuote> GetQuoteAsync(string symbol);
         Task<List<CompanyNewsItem>> GetCompanyNewsAsync(string symbol, DateTime from, DateTime to);
 
    }
}
