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
var dbProvider = builder.Configuration.GetValue<string>("DatabaseProvider");

// Auto-detect provider if not explicitly set
if (string.IsNullOrEmpty(dbProvider))
{
    if (connectionString.Contains("Host=") || connectionString.Contains("postgresql://") || connectionString.Contains("Server=ep-"))
        dbProvider = "PostgreSQL";
    else
        dbProvider = "SqlServer";
}

builder.Services.AddDbContext<FlashcardDbContext>(options =>
{
    if (dbProvider == "PostgreSQL")
    {
        options.UseNpgsql(connectionString);
        // Required for Npgsql 6.0+ with legacy timestamp behavior if needed
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
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
try 
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<FlashcardDbContext>();
        if (dbProvider == "PostgreSQL")
        {
            Console.WriteLine("[DB Init] Creating PostgreSQL Database if not exists...");
            db.Database.EnsureCreated(); 
        }
        else
        {
            Console.WriteLine("[DB Init] Migrating SQL Server Database...");
            db.Database.Migrate();
        }
        Console.WriteLine("[DB Init] Success!");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"[DB Init] CRITICAL ERROR: {ex.Message}");
    if (ex.InnerException != null) Console.WriteLine($"[DB Init] INNER: {ex.InnerException.Message}");
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
