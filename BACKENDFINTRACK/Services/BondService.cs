using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using PortfolioTrackerApi.Models;

namespace PortfolioTrackerApi.Services
{
    public class BondService : IBondService
    {
        private readonly string _jsonFilePath;

        public BondService(IHostEnvironment env)
        {
            _jsonFilePath = Path.Combine(env.ContentRootPath, "Data", "bond-prices.json");
        }

        public async Task<BondQuote?> GetBondQuoteAsync(string fixedIncomeName)
        {
            if (!File.Exists(_jsonFilePath))
                return null;

            var json = await File.ReadAllTextAsync(_jsonFilePath);
            var bonds = JsonSerializer.Deserialize<List<BondQuote>>(json);

            return bonds?.Find(b => b.FixedIncomeName.Equals(fixedIncomeName, System.StringComparison.OrdinalIgnoreCase));
        }
         public async Task<List<BondQuote>> GetAllBondsAsync()
        {
            if (!File.Exists(_jsonFilePath))
                return new List<BondQuote>();
 
            var json = await File.ReadAllTextAsync(_jsonFilePath);
            return JsonSerializer.Deserialize<List<BondQuote>>(json) ?? new List<BondQuote>();
        }
    }
}
