using PortfolioTrackerApi.Models;
namespace PortfolioTrackerApi.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
    }
}
