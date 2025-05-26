
using System.Text.Json;
using PortfolioTrackerApi.Models;
using System.Text.Json;
using BCrypt.Net;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
 
namespace PortfolioTrackerApi.Services
{
    public class UserService : IUserService
    {
        private readonly string _filePath = "Data/user.json";
       private readonly string _jwtKey;
 
public UserService(IConfiguration configuration)
{
    _jwtKey = configuration["Jwt:Key"] ?? throw new ArgumentNullException("JWT key not found in configuration.");
}
 
        public async Task<User?> ValidateCredentialsAsync(string userName, string password)
        {
            var users = await LoadUsersAsync();
            return users.FirstOrDefault(u =>
            (u.UserName == userName || u.Email == userName) && BCrypt.Net.BCrypt.Verify(password, u.Password) );
        }
 
        public async Task<bool> RegisterUserAsync(User newUser)
        {
            var users = await LoadUsersAsync();
       
           
            if (users.Any(u => u.Email == newUser.Email))
                return false;
       
             newUser.Password = BCrypt.Net.BCrypt.HashPassword(newUser.Password);
 
            newUser.userId = users.Any() ? users.Max(u => u.userId) + 1 : 1;
           
            users.Add(newUser);
            await SaveUsersAsync(users);
            return true;
        }
 
             public string GenerateJwtToken(User user)
{
    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.ASCII.GetBytes(_jwtKey); // Replace with a strong key and move to appsettings
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.userId.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email)
        }),
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
 
    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
}
   
        private async Task<List<User>> LoadUsersAsync()
        {
            if (!File.Exists(_filePath))
                return new List<User>();
       
            try
            {
                var json = await File.ReadAllTextAsync(_filePath);
                return JsonSerializer.Deserialize<List<User>>(json) ?? new List<User>();
            }
            catch (JsonException)
            {
               
                return new List<User>();
            }
        }
 
        private async Task SaveUsersAsync(List<User> users)
        {
            var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_filePath, json);
        }
 
        public List<User> GetAllUsers()
    {
        if (!File.Exists(_filePath)) return new List<User>();
        var json = File.ReadAllText(_filePath);
        return JsonSerializer.Deserialize<List<User>>(json) ?? new List<User>();
    }
public User? FindUserByEmail(string email)
    {
        return GetAllUsers().FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
    }
 
public async Task<bool> UpdatePasswordAsync(string email, string securityQuestion, string securityAnswer, string newPassword)
{
    var users = GetAllUsers();
    var user = users.FirstOrDefault(u =>
        u.Email.Equals(email, StringComparison.OrdinalIgnoreCase) &&
        u.SecurityQuestion.Equals(securityQuestion, StringComparison.OrdinalIgnoreCase) &&
        u.SecurityAnswer.Equals(securityAnswer, StringComparison.OrdinalIgnoreCase));
 
    if (user == null)
        return false;
 
    user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword); // hash recommended
    await SaveUsersAsync(users);
 
    return true;
}
 
 
    }
}
 
 