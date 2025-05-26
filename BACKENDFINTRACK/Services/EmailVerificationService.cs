using System;
using System.Collections.Concurrent;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
 
namespace PortfolioTrackerApi.Services
{
    public class EmailVerificationService : IEmailVerificationService
    {
        private readonly ConcurrentDictionary<string, VerificationEntry> _verificationCodes = new();
        private readonly TimeSpan _codeExpiration = TimeSpan.FromMinutes(5);
        private readonly string _sendGridApiKey;
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailVerificationService> _logger;
 
        public EmailVerificationService(IConfiguration configuration, ILogger<EmailVerificationService> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
 
            _sendGridApiKey = configuration["SendGrid:ApiKey"];
            if (string.IsNullOrWhiteSpace(_sendGridApiKey))
                throw new InvalidOperationException("SendGrid API key is not configured.");
 
            _emailSettings = configuration.GetSection("EmailSettings").Get<EmailSettings>()
                ?? throw new InvalidOperationException("Email settings are not configured properly.");
        }
 
        public async Task SendVerificationCode(string email)
        {
            if (!IsValidEmail(email))
                throw new ArgumentException("Invalid email address.");
 
            if (VerifiedEmailStore.IsEmailVerified(email))
                throw new ArgumentException("Email is already verified.");
 
            var code = GenerateSecureCode();
 
            var entry = new VerificationEntry
            {
                Code = code,
                CreatedAt = DateTime.UtcNow
            };
 
            _verificationCodes[email] = entry;
 
            try
            {
                await SendEmailAsync(email, code);
                _logger.LogInformation("Verification email sent to {Email}.", email);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email to {Email}.", email);
                throw new EmailSendingException($"Failed to send verification email to {email}.", ex);
            }
        }
 
        public bool VerifyCode(string email, string code)
        {
            if (VerifiedEmailStore.IsEmailVerified(email))
                return true;
 
            if (_verificationCodes.TryGetValue(email, out var entry))
            {
                if (DateTime.UtcNow - entry.CreatedAt > _codeExpiration)
                {
                    _verificationCodes.TryRemove(email, out _);
                    _logger.LogWarning("Verification code for {Email} expired.", email);
                    return false;
                }
 
                if (entry.Code == code)
                {
                    _verificationCodes.TryRemove(email, out _);
                    VerifiedEmailStore.SaveVerifiedEmail(email);
                    _logger.LogInformation("Email {Email} successfully verified.", email);
                    return true;
                }
            }
 
            _logger.LogWarning("Verification failed for {Email}. Incorrect code.", email);
            return false;
        }
 
        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
 
        private static string GenerateSecureCode()
        {
            return RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        }
 
        private async Task SendEmailAsync(string toEmail, string code)
        {
            var client = new SendGridClient(_sendGridApiKey);
            var from = new EmailAddress(_emailSettings.FromEmail, _emailSettings.FromName);
            var to = new EmailAddress(toEmail);
            var subject = _emailSettings.Subject;
 
            var plainTextContent = _emailSettings.PlainTextTemplate.Replace("{code}", code);
            var htmlContent = _emailSettings.HtmlTemplate.Replace("{code}", code);
 
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            var response = await client.SendEmailAsync(msg);
 
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Body.ReadAsStringAsync();
                throw new EmailSendingException($"Failed to send email: {errorBody}");
            }
        }
 
        private class VerificationEntry
        {
            public required string Code { get; set; }
            public DateTime CreatedAt { get; set; }
        }
    }
 
    public class EmailSendingException : Exception
    {
        public EmailSendingException(string message) : base(message) { }
        public EmailSendingException(string message, Exception innerException) : base(message, innerException) { }
    }
 
    public class EmailSettings
    {
        public required string FromEmail { get; set; }
        public required string FromName { get; set; }
        public required string Subject { get; set; }
        public required string PlainTextTemplate { get; set; }
        public required string HtmlTemplate { get; set; }
    }
}
 
 