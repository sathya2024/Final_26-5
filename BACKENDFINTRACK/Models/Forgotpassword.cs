namespace PortfolioTrackerApi.Models
{
    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string SecurityQuestion { get; set; } = string.Empty;
        public string SecurityAnswer { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
 
 