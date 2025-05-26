using Microsoft.AspNetCore.Mvc;
using PortfolioTrackerApi.Services;
using System.Threading.Tasks;

namespace PortfolioTrackerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FinnhubController : ControllerBase
    {
        private readonly IFinnhubService _finnhubService;

        public FinnhubController(IFinnhubService finnhubService)
        {
            _finnhubService = finnhubService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] string? exchange = null)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest("Query 'q' is required.");

            var results = await _finnhubService.SearchSymbolAsync(q, exchange);
            return Ok(results);
        }

        [HttpGet("quote")]
        public async Task<IActionResult> Quote([FromQuery] string symbol)
        {
            if (string.IsNullOrWhiteSpace(symbol))
                return BadRequest("Query 'symbol' is required.");

            var quote = await _finnhubService.GetQuoteAsync(symbol);
            return Ok(quote);
        }
        [HttpGet("news")]
public async Task<IActionResult> GetNews(string symbol, DateTime from, DateTime to)
{
    Console.WriteLine($"News request: symbol={symbol}, from={from}, to={to}");
    var news = await _finnhubService.GetCompanyNewsAsync(symbol, from, to);
    return Ok(news);
}
 
    }
}
