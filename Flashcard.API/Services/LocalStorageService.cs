using Microsoft.AspNetCore.Http;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Flashcard.API.Services
{
    public class LocalStorageService : IStorageService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly string _uploadPath;

        public LocalStorageService(IHttpContextAccessor httpContextAccessor, IWebHostEnvironment env)
        {
            _httpContextAccessor = httpContextAccessor;
            _uploadPath = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");

            if (!Directory.Exists(_uploadPath))
            {
                Directory.CreateDirectory(_uploadPath);
            }
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return string.Empty;

            try
            {
                // Generate unique filename
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
                
                if (!Array.Exists(allowedExtensions, ext => ext == extension))
                {
                    extension = ".jpg"; // fallback
                }

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(_uploadPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Build the URL
                var request = _httpContextAccessor.HttpContext?.Request;
                var baseUrl = $"{request?.Scheme}://{request?.Host}";
                return $"{baseUrl}/uploads/{fileName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LocalStorage Error] Failed to save image: {ex.Message}");
                return string.Empty;
            }
        }
    }
}
