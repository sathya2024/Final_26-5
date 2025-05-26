using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using PortfolioTrackerApi.Services;
using PortfolioTrackerApi.Models;
using System.Text;
 
 
var builder = WebApplication.CreateBuilder(args);
 
 
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new InvestmentJsonConverter());
    });
 
 
 
builder.Services.AddHttpClient<IFinnhubService, FinnhubService>();
builder.Services.AddHttpClient();
 
 
// Register other services
builder.Services.AddSingleton<IEmailVerificationService, EmailVerificationService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<IInvestmentService, InvestmentService>();
builder.Services.AddSignalR();
 
builder.Services.AddScoped<IBondService, BondService>();
 
 
// Enable CORS for Angular
builder.Services.AddCors();
 
// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
 
// JWT Authentication config
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Key"];
 
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});
 
var app = builder.Build();
 
// -------------------- CONFIGURE MIDDLEWARE --------------------
 
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
 
 
app.UseCors(policy =>
    policy.WithOrigins("http://localhost:4200")
          .AllowAnyHeader()
          .AllowAnyMethod()
           .AllowCredentials());
 
app.UseHttpsRedirection();
 
// Add JWT Authentication and Authorization middleware
app.UseAuthentication();
app.UseAuthorization();
app.UseRouting();
 
 
 
 
app.MapControllers();
 
app.Run();
 
 
 
 