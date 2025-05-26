namespace PortfolioTrackerApi.Models
{
    public class VerificationRequest
{
    public required string Email { get; set; }
    public required string Code { get; set; }
}
}