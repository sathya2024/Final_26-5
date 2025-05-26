using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using PortfolioTrackerApi.Models;
using PortfolioTrackerApi.Services;
using PortfolioTrackerApi.Constants;

namespace PortfolioTrackerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IJwtTokenService _jwtTokenService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IUserService userService, IJwtTokenService jwtTokenService, ILogger<AuthController> logger)
        {
            _userService = userService;
            _jwtTokenService = jwtTokenService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            _logger.LogInformation(LogMessages.LoginRequestReceived, request?.Email);

            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                _logger.LogWarning(LogMessages.LoginFailed, request?.Email, ErrorMessages.MissingCredentials);
                return BadRequest(ErrorMessages.MissingCredentials);
            }

            try
            {
                var user = await _userService.ValidateCredentialsAsync(request.Email, request.Password);

                if (user == null)
                {
                    _logger.LogWarning(LogMessages.LoginFailed, request.Email, ErrorMessages.InvalidCredentials);
                    return Unauthorized(ErrorMessages.InvalidCredentials);
                }

                var token = _jwtTokenService.GenerateToken(user);

                _logger.LogInformation(LogMessages.LoginSuccessful, request.Email);
                return Ok(new
                {
                    Token = token,
                    User = new { user.UserName },
                    UserId = user.userId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ErrorMessages.LoginError);
                return StatusCode(500, ErrorMessages.InternalServerError);
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User newUser)
        {
            _logger.LogInformation(LogMessages.RegisterRequestReceived, newUser?.UserName, newUser?.Email);

            try
            {
                var result = await _userService.RegisterUserAsync(newUser);

                if (!result)
                {
                    _logger.LogWarning(LogMessages.RegistrationFailed, newUser?.UserName, newUser?.Email, ErrorMessages.UserExists);
                    return BadRequest(new { message = ErrorMessages.UserExists });
                }

                _logger.LogInformation(LogMessages.RegistrationSuccessful, newUser?.UserName, newUser?.Email);
                return Ok(new { message = ErrorMessages.UserRegistered });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ErrorMessages.RegisterError);
                return StatusCode(500, ErrorMessages.InternalServerError);
            }
        }
    }
}

