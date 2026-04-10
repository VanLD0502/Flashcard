using Flashcard.API.Data;
using Flashcard.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// Add DbContext - PostgreSQL for production (Render), SQL Server for local dev
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
var dbProvider = builder.Configuration.GetValue<string>("DatabaseProvider") ?? "SqlServer";

builder.Services.AddDbContext<FlashcardDbContext>(options =>
{
    if (dbProvider == "PostgreSQL")
        options.UseNpgsql(connectionString);
    else
        options.UseSqlServer(connectionString);
});

// Add DI
builder.Services.AddScoped<IStorageService, CloudinaryStorageService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration.GetSection("Jwt:Key").Value!)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<FlashcardDbContext>();
    if (dbProvider == "PostgreSQL")
        db.Database.EnsureCreated(); // Create schema from model (no SQL Server-specific migrations)
    else
        db.Database.Migrate(); // Use existing SQL Server migrations
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseStaticFiles();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
