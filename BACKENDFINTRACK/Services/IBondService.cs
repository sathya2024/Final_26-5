using System.Threading.Tasks;
using PortfolioTrackerApi.Models;

namespace PortfolioTrackerApi.Services
{
    public interface IBondService
    {
        Task<BondQuote?> GetBondQuoteAsync(string fixedIncomeName);
         Task<List<BondQuote>> GetAllBondsAsync();
 
    }
}
