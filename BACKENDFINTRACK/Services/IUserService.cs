using PortfolioTrackerApi.Models;

namespace PortfolioTrackerApi.Services
{
    public interface IUserService
    {
        Task<User?> ValidateCredentialsAsync(string userName, string password);
        Task<bool> RegisterUserAsync(User newUser); 
        string GenerateJwtToken(User user);
        User? FindUserByEmail(string email);
        Task<bool> UpdatePasswordAsync(string email, string securityQuestion, string securityAnswer, string newPassword);
    }
}
