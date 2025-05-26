using Microsoft.AspNetCore.Mvc;
using PortfolioTrackerApi.Models;
using PortfolioTrackerApi.Services;
using PortfolioTrackerApi.Constants;

namespace PortfolioTrackerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User newUser)
        {
            if (string.IsNullOrWhiteSpace(newUser.UserName) || string.IsNullOrWhiteSpace(newUser.Password))
                return BadRequest(ErrorMessages.UsernameAndPasswordRequired);

            try
            {
                var success = await _userService.RegisterUserAsync(newUser);
                if (!success)
                    return Conflict(ErrorMessages.UserAlreadyExists);

                return Ok("Registration successful.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ErrorMessages.RegistrationFailed);
                return StatusCode(500, ErrorMessages.InternalServerError);
            }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest loginRequest)
        {
            if (string.IsNullOrWhiteSpace(loginRequest.Email) || string.IsNullOrWhiteSpace(loginRequest.Password))
                return BadRequest(ErrorMessages.EmailAndPasswordRequired);

            var user = _userService.FindUserByEmail(loginRequest.Email);
            if (user == null)
                return Unauthorized(ErrorMessages.InvalidEmailOrPassword);

            bool passwordMatches = BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.Password);
            if (!passwordMatches)
                return Unauthorized(ErrorMessages.InvalidEmailOrPassword);

            var token = _userService.GenerateJwtToken(user);

            return Ok(new
            {
                token = token,
                userId = user.userId,
                user = new
                {
                    user.Name,
                    user.Email,
                    user.UserName
                }
            });
        }

        [HttpPut("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.SecurityQuestion) ||
                string.IsNullOrWhiteSpace(request.SecurityAnswer) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(ErrorMessages.AllFieldsRequired);
            }

            var user = _userService.FindUserByEmail(request.Email);
            if (user == null)
            {
                return NotFound(ErrorMessages.UserNotFound);
            }

            var updated = await _userService.UpdatePasswordAsync(
                request.Email,
                request.SecurityQuestion,
                request.SecurityAnswer,
                request.NewPassword
            );

            if (!updated)
            {
                return BadRequest(ErrorMessages.SecurityQuestionOrAnswerIncorrect);
            }
            return Ok(ErrorMessages.PasswordUpdatedSuccessfully);
        }

        [HttpGet("verify")]
        public IActionResult Verify([FromQuery] string email, [FromQuery] string question, [FromQuery] string answer)
        {
            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(question) ||
                string.IsNullOrWhiteSpace(answer))
            {
                return BadRequest(ErrorMessages.AllFieldsRequired);
            }

            var user = _userService.FindUserByEmail(email);
            if (user == null)
            {
                return NotFound(ErrorMessages.UserNotFound);
            }

            if (!user.SecurityQuestion.Equals(question, StringComparison.OrdinalIgnoreCase) ||
                !user.SecurityAnswer.Equals(answer, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(ErrorMessages.SecurityQuestionOrAnswerIncorrect);
            }

            return Ok(ErrorMessages.VerificationSuccessful);
        }
    }
}