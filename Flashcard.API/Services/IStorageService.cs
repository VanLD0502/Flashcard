using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Flashcard.API.Services
{
    public interface IStorageService
    {
        Task<string> UploadImageAsync(IFormFile file);
    }
}
