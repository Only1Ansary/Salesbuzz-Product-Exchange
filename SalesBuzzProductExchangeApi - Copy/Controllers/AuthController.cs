using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SalesBuzz.Shared.Helpers;
using SalesBuzzProductExchangeApi.Data;

namespace SalesBuzzProductExchangeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ProductExchangeDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(ProductExchangeDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    // TEMP / DEV-ONLY — remove after seeding real passwords.
    // Uses the SDK's own TextEncryptor.EncryptPassword so the resulting
    // ciphertext is guaranteed to match what DecryptPassword expects below.
    // GET api/auth/dev-encrypt?password=demo123
    [HttpGet("dev-encrypt")]
    public ActionResult<string> DevEncrypt([FromQuery] string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            return BadRequest("password query parameter is required.");
        }

        return Ok(TextEncryptor.EncryptPassword(password));
    }

    // POST api/auth/login
    // Validates against SalesBuzz.Shared's own loginusers table (via SalesBuzzDbContextBase)
    // and TextEncryptor, then issues a JWT carrying the claims SalesBuzz.Shared expects:
    // ClaimTypes.Name (read by ICurrentBUContext.GetUserName) and "BUID"
    // (read by ICurrentBUContext.GetUserBUID).
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Username and password are required.");
        }

        var user = await _db.loginusers
            .FirstOrDefaultAsync(u => u.userName == request.Username);

        if (user is null || user.InActive == 1)
        {
            return Unauthorized("Invalid username or password.");
        }

        var decryptedPassword = TextEncryptor.DecryptPassword(user.EncPassword);
        if (decryptedPassword != request.Password)
        {
            return Unauthorized("Invalid username or password.");
        }

        if (string.IsNullOrWhiteSpace(user.BUID))
        {
            return StatusCode(500, "This user has no BUID assigned in loginusers.");
        }

        if (string.IsNullOrWhiteSpace(user.RoleID))
        {
            return StatusCode(500, "This user has no RoleID assigned in loginusers.");
        }

        var jwtKey = _config["JWT:Key"];
        var issuer = _config["JWT:ValidIssuer"];
        var audience = _config["JWT:ValidAudience"];

        if (string.IsNullOrEmpty(jwtKey))
        {
            return StatusCode(500, "JWT:Key is not configured.");
        }

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, user.userName),
            new Claim("BUID", user.BUID),
            new Claim(ClaimTypes.Role, user.RoleID)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddHours(2);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new LoginResponse
        {
            Token = tokenString,
            ExpiresAt = expires
        });
    }
}