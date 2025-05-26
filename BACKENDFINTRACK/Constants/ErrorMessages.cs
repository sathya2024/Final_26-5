namespace PortfolioTrackerApi.Constants
{
    public static class ErrorMessages
    {
        // General error messages
        public const string InternalServerError = "An internal server error occurred.";

        // Bond-related error messages
        public const string BondQueryRequired = "Query 'fixedIncomeName' is required.";
        public const string BondNotFound = "Bond not found.";

        // Login-related error messages
        public const string MissingCredentials = "Username or password not provided.";
        public const string InvalidCredentials = "Invalid credentials.";
        public const string LoginError = "An error occurred during login.";

        // Registration-related error messages
        public const string RegisterError = "An error occurred during registration.";
        public const string UserExists = "Username or Email already exists.";
        public const string UserRegistered = "User registered successfully.";

        //Email verification-related error messages
        public const string EmailRequired = "Email address is required.";
        public const string VerificationCodeRequired = "Email and verification code are required.";
        public const string VerificationFailed = "Invalid verification code or email.";
        public const string VerificationSuccess = "Email verified successfully.";
        public const string VerificationCodeSent = "Verification code sent to {0}.";
        public const string EmailVerificationError = "An error occurred while sending the verification email.";
    
        // Finnhub-related error messages
        public const string QueryRequired = "Query 'q' is required.";
        public const string SymbolRequired = "Query 'symbol' is required.";

        // Investment-related error messages
        public const string InvestmentRetrievalError = "Error retrieving investments.";
        public const string UserInvestmentRetrievalError = "Error retrieving investments for the user.";
        public const string StockSaveError = "Error saving stock investment.";
        public const string BondSaveError = "Error saving bond investment.";
        public const string MutualFundSaveError = "Error saving mutual fund investment.";
        public const string StockUpdateError = "Error updating stock investment.";
        public const string BondUpdateError = "Error updating bond investment.";
        public const string InvestmentDeleteError = "Error deleting investment.";
        public const string InvestmentNotFound = "Investment not found.";
        public const string MissingPurchaseInfo = "Missing purchase info for Buy transaction.";
        public const string MissingSellInfo = "Missing sell info for Sell transaction.";
        public const string InvalidTransactionType = "TransactionType must be 'Buy' or 'Sell'.";

        // User-related error messages
        public const string UsernameAndPasswordRequired = "Username and password are required.";
        public const string EmailAndPasswordRequired = "Email and password are required.";
        public const string UserAlreadyExists = "User already exists.";
        public const string RegistrationFailed = "Registration failed.";
        public const string InvalidEmailOrPassword = "Invalid email or password.";
        public const string AllFieldsRequired = "All fields are required.";
        public const string UserNotFound = "User not found.";
        public const string SecurityQuestionOrAnswerIncorrect = "Security question or answer is incorrect.";
        public const string PasswordUpdatedSuccessfully = "Password updated successfully.";
        public const string VerificationSuccessful = "Verification successful.";
    
    }
}