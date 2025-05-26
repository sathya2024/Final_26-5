using System.Text.Json;
using PortfolioTrackerApi.Models;
using PortfolioTrackerApi.Services;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
 
namespace PortfolioTrackerApi.Services
{
    public class InvestmentService : IInvestmentService
    {
        private readonly string _jsonPath = "Data/investments.json";
 
        public async Task AddInvestmentAsync(Investment investment)
        {
            var investments = await LoadInvestmentsAsync();
            investment.Id = Guid.NewGuid().ToString(); // Generate a unique string ID
           
            investments.Add(investment);
           
            var options = new JsonSerializerOptions { WriteIndented = true, Converters = { new InvestmentJsonConverter() } };
            var json = JsonSerializer.Serialize(investments, options);
            await File.WriteAllTextAsync(_jsonPath, json);
        }
 
        public async Task<List<Investment>> LoadInvestmentsAsync()
        {
            if (!File.Exists(_jsonPath)) return new List<Investment>();
            var json = await File.ReadAllTextAsync(_jsonPath);
            return JsonSerializer.Deserialize<List<Investment>>(json, new JsonSerializerOptions
            {
                Converters = { new InvestmentJsonConverter() }
            }) ?? new List<Investment>();
        }
 
        public async Task<IEnumerable<Investment>> GetAllAsync()
        {
            return await LoadInvestmentsAsync();
        }
 
        public async Task<IEnumerable<Investment>> GetInvestmentsByUserAsync(int UserId)
        {
            var investments = await LoadInvestmentsAsync();
            return investments.Where(i => i.UserId == UserId);
        }
        //5-12-2025 2:04 p.m
        public async Task<object> UpdateStockInvestmentAsync(string id, StockInvestment updatedStock)
        {
            var investments = await LoadInvestmentsAsync();
            var existing = investments.OfType<StockInvestment>().FirstOrDefault(i => i.Id == id);
 

            if (existing == null) throw new Exception("Stock not found.");
 
            if (updatedStock.TransactionType == "Sell" && existing.TransactionType != "Sell")
            {
                // Full conversion to Sell
                existing.TransactionType = "Sell";
                existing.SellPrice = updatedStock.SellPrice;
                existing.SellDate = updatedStock.SellDate ?? DateTime.Now;
                existing.PurchasePrice = null;
                existing.PurchaseDate = null;
            }
            else if (updatedStock.NumberOfShares < existing.NumberOfShares && updatedStock.SellPrice.HasValue)
            {
                // Partial Sell
               
                int soldShares = existing.NumberOfShares - updatedStock.NumberOfShares;
                existing.NumberOfShares = updatedStock.NumberOfShares;
                existing.PurchasePrice = updatedStock.PurchasePrice;
 
                var sellEntry = new StockInvestment
                {
                    Id = Guid.NewGuid().ToString(),
                    StockName = existing.StockName,
                    DematAccount = existing.DematAccount,
                    SellDate = updatedStock.SellDate ?? DateTime.Now,
                    SellPrice = updatedStock.SellPrice.Value, // Explicitly access the non-nullable value
                    NumberOfShares = soldShares,
                    Brokerage = existing.Brokerage,
                    BrokerageType = existing.BrokerageType,
                    UserId = existing.UserId,
                    Type = "Stock",
                    TransactionType = "Sell"
                };
 
                investments.Add(sellEntry);
            }
            else
            {
                // Simple update (price, increased shares, etc.)
                existing.NumberOfShares = updatedStock.NumberOfShares;
                existing.PurchasePrice = updatedStock.PurchasePrice;
                existing.Brokerage = updatedStock.Brokerage;
                existing.BrokerageType = updatedStock.BrokerageType;
                existing.PurchaseDate = updatedStock.PurchaseDate;
            }
 
            var options = new JsonSerializerOptions { WriteIndented = true, Converters = { new InvestmentJsonConverter() } };
            var json = JsonSerializer.Serialize(investments, options);
            await File.WriteAllTextAsync(_jsonPath, json);
 
            return new { message = "Stock investment updated." };
        }
 
        //13-5-2025 10:13 a.m
        public async Task<bool> DeleteInvestmentByIdAsync(string id)
        {
            var investments = await LoadInvestmentsAsync();
            var toRemove = investments.FirstOrDefault(i => i.Id == id);
 
            if (toRemove == null)
                return false;
 
            investments.Remove(toRemove);
 
            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                Converters = { new InvestmentJsonConverter() }
            };
 
            var json = JsonSerializer.Serialize(investments, options);
            await File.WriteAllTextAsync(_jsonPath, json);
 
            return true;
        }

        public async Task<object> UpdateBondInvestmentAsync(string id, BondInvestment updatedBond)
        {
            var investments = await LoadInvestmentsAsync();
            var existing = investments.OfType<BondInvestment>().FirstOrDefault(i => i.Id == id);

            if (existing == null)
                throw new Exception("Bond investment not found.");

            // Update common properties
            existing.FixedIncomeName = updatedBond.FixedIncomeName;
            existing.InvestmentDate = updatedBond.InvestmentDate;
            existing.InvestmentAmount = updatedBond.InvestmentAmount;
            existing.CouponRate = updatedBond.CouponRate;
            existing.CompoundingFrequency = updatedBond.CompoundingFrequency;
            existing.InterestType = updatedBond.InterestType;
            existing.MaturityDate = updatedBond.MaturityDate;
            existing.UserId = updatedBond.UserId;

            // Update TransactionType and selling details
            if (existing.TransactionType == "Buy" && updatedBond.TransactionType == "Sell")
            {
                existing.TransactionType = "Sell"; // Change TransactionType to Sell
                existing.SellPrice = updatedBond.SellPrice;
                existing.SellDate = updatedBond.SellDate ?? DateTime.Now;
            }
            else if (updatedBond.TransactionType == "Buy")
            {
                // Reset Sell details if changing back to Buy
                existing.TransactionType = "Buy";
                existing.SellPrice = null;
                existing.SellDate = null;
            }

            // Serialize and save the updated investments
            var options = new JsonSerializerOptions { WriteIndented = true, Converters = { new InvestmentJsonConverter() } };
            var json = JsonSerializer.Serialize(investments, options);
            await File.WriteAllTextAsync(_jsonPath, json);

            return new { message = "Bond investment updated." };
        }
    }
}
