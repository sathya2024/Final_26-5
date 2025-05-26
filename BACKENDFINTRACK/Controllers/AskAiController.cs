using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.IO;
using System.Linq;
using System.Collections.Generic;
 
namespace PortfolioTrackerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AskAiController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _openAiApiKey;
        private readonly string _investmentFilePath;
 
        public AskAiController(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _openAiApiKey = config["OpenAI:ApiKey"];
            _investmentFilePath = @"C:\Users\sathyasai.s\OneDrive - Mphasis\Desktop\BACKENDFINTRACK\Data\investments.json";
        }
 
        public class AskAiRequest
        {
            public string Question { get; set; }
            public int? UserId { get; set; } // Optional
        }
 
        public class Investment
        {
            // Stock fields
            public string StockName { get; set; }
            public string DematAccount { get; set; }
            public DateTime? PurchaseDate { get; set; }
            public int? NumberOfShares { get; set; }
            public decimal? PurchasePrice { get; set; }
            public decimal? SellPrice { get; set; }
            public DateTime? SellDate { get; set; }
            public decimal? Brokerage { get; set; }
            public string BrokerageType { get; set; }
 
            // Bond fields
            public string FixedIncomeName { get; set; }
            public DateTime? InvestmentDate { get; set; }
            public decimal? InvestmentAmount { get; set; }
            public double? CouponRate { get; set; }
            public string CompoundingFrequency { get; set; }
            public string InterestType { get; set; }
            public DateTime? MaturityDate { get; set; }
 
            // Common fields
            public string Id { get; set; }
            public int UserId { get; set; }
            public string Type { get; set; } // "Stock" or "Bond"
            public string TransactionType { get; set; } // "Buy" or "Sell"
        }
 
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] AskAiRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
                return BadRequest("Question is required.");
 
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _openAiApiKey);
 
            // --- 1. Classifier: Is this question finance-related (including portfolio/project)? ---
            var classifierPrompt = $@"
You are a classifier. For each question, reply only ""Finance"" or ""Other"".
 
If the question is about finance, stocks, bonds, investments, banking, personal finance, financial markets, or the FinTrack project, reply ""Finance"".
If it is about any other topic, reply ""Other"".
 
Examples:
Q: What is a P/E ratio?
A: Finance
 
Q: How do I diversify my portfolio?
A: Finance
 
Q: What are the benefits of mutual funds?
A: Finance
 
Q: How do I reset my password in FinTrack?
A: Finance
 
Q: What does the dashboard show in this app?
A: Finance
 
Q: How much have I gained from Tesla?
A: Finance
 
Q: Which of my stocks is underperforming?
A: Finance
 
Q: Tell me about my bond investments.
A: Finance
 
Q: How to cook pasta?
A: Other
 
Q: Tell me a joke.
A: Other
 
Q: Who won the football match?
A: Other
 
Now, answer for this question:
Q: {request.Question}
A:
";
            var classificationPayload = new
            {
                model = "gemini-2.0-flash",
                messages = new[]
                {
                    new { role = "user", content = classifierPrompt }
                }
            };
 
            var classificationContent = new StringContent(JsonSerializer.Serialize(classificationPayload), Encoding.UTF8, "application/json");
            var classificationResponse = await httpClient.PostAsync(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                classificationContent
            );
 
            if (!classificationResponse.IsSuccessStatusCode)
                return StatusCode((int)classificationResponse.StatusCode, await classificationResponse.Content.ReadAsStringAsync());
 
            var classificationResult = await classificationResponse.Content.ReadAsStringAsync();
            bool isFinanceQuestion = classificationResult.Contains("Finance");
 
            if (!isFinanceQuestion)
            {
                return Ok(new { answer = "Sorry, I can only answer questions related to the finance domain." });
            }
 
            // --- 2. Check if this is a portfolio-specific question ---
            // We'll use a second classifier to decide if we need to include the user's portfolio
            var portfolioClassifierPrompt = $@"
You are a classifier. For each question, reply only ""Portfolio"" or ""General"".
 
If the question is about the user's own portfolio, holdings, gains, losses, or performance, reply ""Portfolio"".
If the question is general about finance, stocks, bonds, or the project, reply ""General"".
 
Examples:
Q: How much have I gained from Tesla?
A: Portfolio
 
Q: Which of my stocks is underperforming?
A: Portfolio
 
Q: Tell me about my bond investments.
A: Portfolio
 
Q: What is a P/E ratio?
A: General
 
Q: How do I diversify my portfolio?
A: General
 
Q: What are the benefits of mutual funds?
A: General
 
Q: How do I reset my password in FinTrack?
A: General
 
Q: What does the dashboard show in this app?
A: General
 
Now, answer for this question:
Q: {request.Question}
A:
";
            var portfolioClassifierPayload = new
            {
                model = "gemini-2.0-flash",
                messages = new[]
                {
                    new { role = "user", content = portfolioClassifierPrompt }
                }
            };
 
            var portfolioClassifierContent = new StringContent(JsonSerializer.Serialize(portfolioClassifierPayload), Encoding.UTF8, "application/json");
            var portfolioClassifierResponse = await httpClient.PostAsync(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                portfolioClassifierContent
            );
 
            if (!portfolioClassifierResponse.IsSuccessStatusCode)
                return StatusCode((int)portfolioClassifierResponse.StatusCode, await portfolioClassifierResponse.Content.ReadAsStringAsync());
 
            var portfolioClassifierResult = await portfolioClassifierResponse.Content.ReadAsStringAsync();
            bool isPortfolioQuestion = portfolioClassifierResult.Contains("Portfolio");
 
            string aiPrompt;
 
            if (isPortfolioQuestion)
            {
                // --- 3. Portfolio question: require UserId and include portfolio details ---
                if (!request.UserId.HasValue)
                    return Ok(new { answer = "To answer questions about your portfolio, please provide your UserId." });
 
                if (!System.IO.File.Exists(_investmentFilePath))
                    return StatusCode(500, "Investment data file not found.");
 
                var json = await System.IO.File.ReadAllTextAsync(_investmentFilePath);
                var allInvestments = JsonSerializer.Deserialize<List<Investment>>(json);
 
                var userInvestments = allInvestments
                    .Where(i => i.UserId == request.UserId && i.TransactionType == "Buy")
                    .ToList();
 
                if (!userInvestments.Any())
                    return Ok(new { answer = "Your portfolio is empty or unavailable." });
 
                // Aggregate stocks
                var stockHoldings = userInvestments
                    .Where(i => i.Type == "Stock")
                    .GroupBy(i => i.StockName)
                    .Select(g => new
                    {
                        StockName = g.Key,
                        TotalShares = g.Sum(i => i.NumberOfShares ?? 0),
                        AvgBuyPrice = g.Sum(i => (i.PurchasePrice ?? 0) * (i.NumberOfShares ?? 0)) /
                                      (g.Sum(i => i.NumberOfShares ?? 0) == 0 ? 1 : g.Sum(i => i.NumberOfShares ?? 0)),
                        LastKnownPrice = g.OrderByDescending(i => i.PurchaseDate).First().PurchasePrice ?? 0
                    })
                    .ToList();
 
                // Aggregate bonds
                var bondHoldings = userInvestments
                    .Where(i => i.Type == "Bond")
                    .Select(b => new
                    {
                        BondName = b.FixedIncomeName,
                        InvestmentAmount = b.InvestmentAmount ?? 0,
                        CouponRate = b.CouponRate ?? 0,
                        InvestmentDate = b.InvestmentDate?.ToString("yyyy-MM-dd") ?? "N/A",
                        MaturityDate = b.MaturityDate?.ToString("yyyy-MM-dd") ?? "N/A",
                        CompoundingFrequency = b.CompoundingFrequency ?? "N/A",
                        InterestType = b.InterestType ?? "N/A"
                    })
                    .ToList();
 
                var sb = new StringBuilder();
                if (stockHoldings.Any())
                {
                    sb.AppendLine("Stocks:");
                    foreach (var s in stockHoldings)
                    {
                        sb.AppendLine($"- {s.StockName}: {s.TotalShares} shares, avg buy price {s.AvgBuyPrice:C}, last known price {s.LastKnownPrice:C}");
                    }
                }
                if (bondHoldings.Any())
                {
                    sb.AppendLine("Bonds:");
                    foreach (var b in bondHoldings)
                    {
                        sb.AppendLine($"- {b.BondName}: Invested {b.InvestmentAmount:C} at {b.CouponRate}% ({b.CompoundingFrequency}, {b.InterestType}), on {b.InvestmentDate}, matures {b.MaturityDate}");
                    }
                }
 
                aiPrompt = $@"
User question: ""{request.Question}""
 
Portfolio:
{sb}
 
Answer the user's question in 2-3 lines.
";
            }
            else
            {
                // --- 4. General finance/project question ---
                aiPrompt = $@"
User question: ""{request.Question}""
Answer in 2-3 lines.
";
            }
 
            // --- 5. Get answer from Gemini ---
            var payload = new
            {
                model = "gemini-2.0-flash",
                messages = new[]
                {
                    new { role = "system", content = "You are a helpful financial assistant. Answer user questions about stocks, bonds, finance, their portfolio, or the FinTrack project. If portfolio details are provided, use them. Keep answers concise (2-3 lines)." },
                    new { role = "user", content = aiPrompt }
                }
            };
 
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                content
            );
 
            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, await response.Content.ReadAsStringAsync());
 
            using var responseStream = await response.Content.ReadAsStreamAsync();
            using var doc = await JsonDocument.ParseAsync(responseStream);
            var answer = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
 
            return Ok(new { answer });
        }
    }
}
 
 