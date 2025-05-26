using Microsoft.AspNetCore.Mvc;
using PortfolioTrackerApi.Models;
using PortfolioTrackerApi.Services;
using PortfolioTrackerApi.Constants;
using System;
using System.Threading.Tasks;

namespace PortfolioTrackerApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailVerificationController : ControllerBase
    {
        private readonly IEmailVerificationService _emailVerificationService;

        public EmailVerificationController(IEmailVerificationService emailVerificationService)
        {
            _emailVerificationService = emailVerificationService ?? throw new ArgumentNullException(nameof(emailVerificationService));
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendVerificationCode([FromBody] EmailRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(ErrorMessages.EmailRequired);

            try
            {
                await _emailVerificationService.SendVerificationCode(request.Email);
                return Ok(new { success = true, message = string.Format(ErrorMessages.VerificationCodeSent, request.Email) });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"{ErrorMessages.EmailVerificationError} Details: {ex.Message}");
            }
        }

        [HttpPost("verify")]
        public IActionResult VerifyCode([FromBody] VerificationRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code))
                return BadRequest(new { success = false, message = ErrorMessages.VerificationCodeRequired });

            try
            {
                bool isVerified = _emailVerificationService.VerifyCode(request.Email, request.Code);
                if (isVerified)
                    return Ok(new { success = true, message = ErrorMessages.VerificationSuccess });
                else
                    return BadRequest(new { success = false, message = ErrorMessages.VerificationFailed });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"{ErrorMessages.InternalServerError} Details: {ex.Message}" });
            }
        }
    }
}