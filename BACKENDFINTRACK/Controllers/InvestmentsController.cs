using Microsoft.AspNetCore.Mvc;
using PortfolioTrackerApi.Models;
using PortfolioTrackerApi.Services;
 
namespace PortfolioTrackerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvestmentController : ControllerBase
    {
        private readonly IInvestmentService _service;
 
        public InvestmentController(IInvestmentService investmentService)
        {
            _service = investmentService;
        }
 
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var investments = await _service.GetAllAsync();
                return Ok(investments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving investments.", error = ex.Message });
            }
        }
 
        [HttpGet("user/{UserId}")]
        public async Task<IActionResult> GetByUser(int UserId)
        {
            try
            {
                var investments = await _service.GetInvestmentsByUserAsync(UserId);
                return Ok(investments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving investments for the user.", error = ex.Message });
            }
        }
 
        [HttpPost("stock")]
        public async Task<IActionResult> AddStock([FromBody] StockInvestment stock)
        {
            stock.Type = "Stock";
 
            if (stock.TransactionType == "Buy")
            {
                if (stock.PurchaseDate == null || stock.PurchasePrice == null)
                    return BadRequest("Missing purchase info for Buy transaction.");
            }
            else if (stock.TransactionType == "Sell")
            {
                if (stock.SellDate == null || stock.SellPrice == null)
                    return BadRequest("Missing sell info for Sell transaction.");
            }
            else
            {
                return BadRequest("TransactionType must be 'Buy' or 'Sell'.");
            }
 
            try
            {
                await _service.AddInvestmentAsync(stock);
                return Ok(new { message = "Stock investment saved.", investment = stock });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving stock investment.", error = ex.Message });
            }
        }
 
        [HttpPost("bond")]
        public async Task<IActionResult> AddBond([FromBody] BondInvestment bond)
        {
            bond.Type = "Bond";
            try
            {
                await _service.AddInvestmentAsync(bond);
                return Ok(new { message = "Bond investment saved.", investment = bond });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving bond investment.", error = ex.Message });
            }
        }
 
        [HttpPost("mutualfund")]
        public async Task<IActionResult> AddMutualFund([FromBody] MutualFundInvestment mf)
        {
            mf.Type = "MutualFund";
            try
            {
                await _service.AddInvestmentAsync(mf);
                return Ok(new { message = "Mutual fund investment saved.", investment = mf });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving mutual fund investment.", error = ex.Message });
            }
        }
        //5-12-2025 2:04 p.m
        [HttpPut("stock/{id}")]
        public async Task<IActionResult> UpdateStock(string id, [FromBody] StockInvestment updatedStock)
        {
            Console.WriteLine($"Updating stock investment with ID: {id} and data: {updatedStock}");
            Console.WriteLine($"Updating stock investment with ID: {id}");
Console.WriteLine($"TransactionType: {updatedStock.TransactionType}, NumberOfShares: {updatedStock.NumberOfShares}, SellPrice: {updatedStock.SellPrice}");

            try
            {
                var result = await _service.UpdateStockInvestmentAsync(id, updatedStock);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating stock investment.", error = ex.Message });
            }
        }
        //5-13-2025 10:15 a.m
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvestment(string id)
        {
            var result = await _service.DeleteInvestmentByIdAsync(id);
 
            if (!result)
                return NotFound(new { message = "Investment not found." });
 
            return Ok(new { message = "Investment deleted successfully." });
        }

        [HttpPut("bond/{id}")]
        public async Task<IActionResult> UpdateBond(string id, [FromBody] BondInvestment updatedBond)
        {
            try
            {
                var result = await _service.UpdateBondInvestmentAsync(id, updatedBond);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating bond investment.", error = ex.Message });
            }
        }

        
    }
}