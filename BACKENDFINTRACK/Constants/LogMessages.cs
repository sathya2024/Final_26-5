namespace PortfolioTrackerApi.Constants
{
    public static class LogMessages
    {
        // Login-related log messages
        public const string LoginRequestReceived = "Login request received for email: {Email}.";
        public const string LoginSuccessful = "Login successful for email: {Email}.";
        public const string LoginFailed = "Login failed for email: {Email}. {Message}";

        // Registration-related log messages
        public const string RegisterRequestReceived = "Register request received for username: {UserName}, email: {Email}.";
        public const string RegistrationFailed = "Registration failed for username: {UserName}, email: {Email}. {Message}";
        public const string RegistrationSuccessful = "User registered successfully: {UserName}, email: {Email}.";

        // General log messages
        public const string InternalServerError = "An internal server error occurred.";
    }
}