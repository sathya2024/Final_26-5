using Microsoft.AspNetCore.Mvc;
using PortfolioTrackerApi.Models;
using PortfolioTrackerApi.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
 
namespace PortfolioTrackerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PortfolioHealthController : ControllerBase
    {
        private readonly IInvestmentService _service;
 
        public PortfolioHealthController(IInvestmentService investmentService)
        {
            _service = investmentService;
        }
 
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetHealthByUser(int userId)
        {
            try
            {
                var investments = await _service.GetInvestmentsByUserAsync(userId);
 
                if (investments == null || !investments.Any())
                    return NotFound(new { message = "No investments found for this user." });
 
                // Only analyze "Buy" transactions
                var buyInvestments = investments.Where(i => i.TransactionType == "Buy").ToList();
 
                var healthScore = CalculateHealthScore(buyInvestments);
                var riskLevel = CalculateRiskLevel(buyInvestments);
                var diversificationScore = CalculateDiversification(buyInvestments);
                var recommendations = GenerateRecommendations(buyInvestments, riskLevel, diversificationScore);
 
                return Ok(new
                {
                    healthScore,
                    riskLevel,
                    diversificationScore,
                    recommendations
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error calculating portfolio health.", error = ex.Message });
            }
        }
 
        // --- AI-inspired scoring logic below ---
 
        private int CalculateHealthScore(IEnumerable<Investment> investments)
        {
            double riskScore = CalculateRiskScore(investments);
            double diversificationScore = CalculateDiversificationScore(investments);
            double performanceScore = CalculatePerformanceScore(investments);
 
            return (int)Math.Round((riskScore * 0.4) + (diversificationScore * 0.3) + (performanceScore * 0.3));
        }
 
        private double CalculateRiskScore(IEnumerable<Investment> investments)
        {
            int stockCount = investments.Count(i => i.Type == "Stock");
            int bondCount = investments.Count(i => i.Type == "Bond");
            int mfCount = investments.Count(i => i.Type == "MutualFund");
            int totalCount = investments.Count();
 
            // More stocks = higher risk, more bonds/mutual funds = lower risk
            if (totalCount > 0 && stockCount == totalCount)
                return 60;
            if (totalCount > 0 && (double)stockCount / totalCount < 0.7)
                return 80;
            return 70;
        }
 
        private double CalculateDiversificationScore(IEnumerable<Investment> investments)
        {
            // Use StockName, FixedIncomeName, SchemeName as asset names
            var assetNames = new HashSet<string>();
            foreach (var inv in investments)
            {
                if (inv is StockInvestment s && !string.IsNullOrEmpty(s.StockName))
                    assetNames.Add(s.StockName);
                else if (inv is BondInvestment b && !string.IsNullOrEmpty(b.FixedIncomeName))
                    assetNames.Add(b.FixedIncomeName);
                else if (inv is MutualFundInvestment m && !string.IsNullOrEmpty(m.SchemeName))
                    assetNames.Add(m.SchemeName);
            }
            int uniqueAssets = assetNames.Count;
            if (uniqueAssets >= 10)
                return 90;
            else if (uniqueAssets >= 5)
                return 70;
            else if (uniqueAssets >= 3)
                return 50;
            else
                return 30;
        }
 
        private double CalculatePerformanceScore(IEnumerable<Investment> investments)
        {
            double totalGainLossPercent = 0;
            int count = 0;
            foreach (var inv in investments)
            {
                double? purchasePrice = null;
                double? currentPrice = null;
                int units = 1;
 
                if (inv is StockInvestment s)
                {
                    purchasePrice = s.PurchasePrice;
                    currentPrice = s.SellPrice ?? s.PurchasePrice; // Use SellPrice if sold, else PurchasePrice
                    units = s.NumberOfShares > 0 ? s.NumberOfShares : 1;
                }
                else if (inv is BondInvestment b)
                {
                    purchasePrice = b.InvestmentAmount;
                    currentPrice = b.SellPrice ?? b.InvestmentAmount;
                    units = 1;
                }
                else if (inv is MutualFundInvestment m)
                {
                    purchasePrice = m.Price;
                    currentPrice = m.SellPrice ?? m.Price;
                    units = 1;
                }
 
                if (purchasePrice.HasValue && currentPrice.HasValue && purchasePrice > 0)
                {
                    double gainLossPercent = ((currentPrice.Value - purchasePrice.Value) / purchasePrice.Value) * 100;
                    totalGainLossPercent += gainLossPercent * units;
                    count += units;
                }
            }
            double avgGainLossPercent = count > 0 ? totalGainLossPercent / count : 0;
            if (avgGainLossPercent >= 15)
                return 90;
            else if (avgGainLossPercent >= 5)
                return 75;
            else if (avgGainLossPercent >= 0)
                return 60;
            else
                return 40;
        }
 
        private string CalculateRiskLevel(IEnumerable<Investment> investments)
        {
            int stockCount = investments.Count(i => i.Type == "Stock");
            int totalCount = investments.Count();
            double stockRatio = totalCount > 0 ? (double)stockCount / totalCount : 0;
            if (stockRatio > 0.8)
                return "High";
            else if (stockRatio > 0.5)
                return "Moderate";
            else
                return "Low";
        }
 
        private string CalculateDiversification(IEnumerable<Investment> investments)
        {
            // Use StockName, FixedIncomeName, SchemeName as asset names
            var assetNames = new HashSet<string>();
            foreach (var inv in investments)
            {
                if (inv is StockInvestment s && !string.IsNullOrEmpty(s.StockName))
                    assetNames.Add(s.StockName);
                else if (inv is BondInvestment b && !string.IsNullOrEmpty(b.FixedIncomeName))
                    assetNames.Add(b.FixedIncomeName);
                else if (inv is MutualFundInvestment m && !string.IsNullOrEmpty(m.SchemeName))
                    assetNames.Add(m.SchemeName);
            }
            int uniqueAssets = assetNames.Count;
            if (uniqueAssets >= 8)
                return "High";
            else if (uniqueAssets >= 4)
                return "Medium";
            else
                return "Low";
        }
 
        private List<string> GenerateRecommendations(IEnumerable<Investment> investments, string riskLevel, string diversificationScore)
{
    var recommendations = new List<string>();
 
    // Risk-based recommendations
    if (riskLevel == "High")
    {
        recommendations.Add("Your portfolio risk is high due to heavy stock exposure. Consider adding bonds or mutual funds to balance risk and provide stability during market downturns.");
    }
    else if (riskLevel == "Moderate")
    {
        recommendations.Add("Your portfolio risk is moderate. If you expect market volatility, consider increasing allocation to bonds or defensive sectors.");
    }
    else
    {
        recommendations.Add("Your portfolio risk is low. If you are seeking higher returns and can tolerate more risk, consider increasing equity exposure.");
    }
 
    // Diversification recommendations
    if (diversificationScore == "Low")
    {
        recommendations.Add("Diversification is low. Add investments from different sectors, asset classes, or geographies to reduce concentration risk.");
    }
    else if (diversificationScore == "Medium")
    {
        recommendations.Add("Diversification is moderate. Review your portfolio for overexposure to any single asset or sector.");
    }
    else
    {
        recommendations.Add("Diversification is high. Maintain regular reviews to ensure this balance as markets change.");
    }
 
    // Concentration in individual stocks
    var stockNames = investments
        .OfType<StockInvestment>()
        .GroupBy(s => s.StockName)
        .Select(g => new { Name = g.Key, Count = g.Count() })
        .OrderByDescending(x => x.Count)
        .ToList();
    if (stockNames.Any() && stockNames.First().Count > investments.Count() * 0.5)
    {
        recommendations.Add($"More than half your stock investments are in {stockNames.First().Name}. Consider spreading your investments across more companies to avoid single-stock risk.");
    }
 
    // Bond maturity check
    var bondInvestments = investments.OfType<BondInvestment>().Where(b => b.MaturityDate.HasValue);
    foreach (var bond in bondInvestments)
    {
        if (bond.MaturityDate.Value < DateTime.Now.AddMonths(6))
        {
            recommendations.Add($"Bond '{bond.FixedIncomeName}' is maturing soon ({bond.MaturityDate.Value.ToShortDateString()}). Plan for reinvestment or use of proceeds.");
        }
    }
 
    // Mutual fund fee awareness
    var mutualFunds = investments.OfType<MutualFundInvestment>();
    if (mutualFunds.Any())
    {
        recommendations.Add("Review the expense ratios and recent performance of your mutual funds. High fees can erode long-term returns.");
    }
 
    // Rebalancing suggestion
    recommendations.Add("Consider rebalancing your portfolio at least once a year to maintain your target allocation and risk profile.");
 
    // Performance-based recommendation
    double avgGainLoss = CalculatePerformanceScore(investments);
    if (avgGainLoss < 0)
    {
        recommendations.Add("Your portfolio has a negative average return. Review underperforming assets and consider replacing them with better-performing alternatives.");
    }
    else if (avgGainLoss > 10)
    {
        recommendations.Add("Your portfolio is performing well. Consider taking some profits or increasing your investment in high-performing areas if it fits your risk profile.");
    }
 
    // Emergency fund reminder
    recommendations.Add("Ensure you have an emergency fund separate from your investments for unexpected expenses.");
 
    // General review reminder
    recommendations.Add("Review your portfolio regularly, especially after major life events or significant market changes.");
 
    return recommendations;
}
 
    }
}
 
 