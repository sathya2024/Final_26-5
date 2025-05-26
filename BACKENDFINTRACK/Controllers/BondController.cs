using Microsoft.AspNetCore.Mvc;
using PortfolioTrackerApi.Services;
using PortfolioTrackerApi.Constants;
using System.Threading.Tasks;

namespace PortfolioTrackerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BondController : ControllerBase
    {
        private readonly IBondService _bondService;

        public BondController(IBondService bondService)
        {
            _bondService = bondService;
        }

        [HttpGet("quote")]
        public async Task<IActionResult> Quote([FromQuery] string fixedIncomeName)
        {
            if (string.IsNullOrWhiteSpace(fixedIncomeName))
                return BadRequest(ErrorMessages.BondQueryRequired);

            var quote = await _bondService.GetBondQuoteAsync(fixedIncomeName);
            if (quote == null)
                return NotFound(ErrorMessages.BondNotFound);

            return Ok(quote);
        }
         [HttpGet("names")]
        public async Task<IActionResult> GetAllBondNames()
        {
            var bonds = await _bondService.GetAllBondsAsync();
            var names = bonds.Select(b => b.FixedIncomeName).ToList();
            return Ok(names);
        }
    }
}
