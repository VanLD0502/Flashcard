using Flashcard.API.Data;
using Flashcard.API.DTOs;
using Flashcard.API.Models;
using Flashcard.API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Flashcard.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudySetsController : ControllerBase
    {
        private readonly FlashcardDbContext _context;
        private readonly IStorageService _storageService;

        public StudySetsController(FlashcardDbContext context, IStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        [HttpGet]
        public async Task<ActionResult<object>> GetStudySets([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.StudySets.Include(s => s.User).AsQueryable();
            var totalItems = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);

            var items = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new {
                    s.Id,
                    s.Title,
                    s.Description,
                    s.CreatedAt,
                    Username = s.User != null ? s.User.Username : "Unknown"
                })
                .ToListAsync();

            return Ok(new {
                items,
                page,
                pageSize,
                totalItems,
                totalPages
            });
        }

        [HttpGet("my-sets")]
        [Authorize]
        public async Task<ActionResult<object>> GetMyStudySets()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var sets = await _context.StudySets
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new {
                    s.Id,
                    s.Title,
                    s.Description,
                    s.CreatedAt,
                    CardCount = s.Flashcards.Count
                })
                .ToListAsync();

            return Ok(sets);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StudySet>> GetStudySet(Guid id)
        {
            var studySet = await _context.StudySets
                .Include(s => s.Flashcards)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (studySet == null) return NotFound();

            return studySet;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<StudySet>> CreateStudySet([FromForm] CreateSetModel request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var studySet = new StudySet
            {
                Title = request.Title,
                Description = request.Description,
                UserId = userId
            };

            foreach (var c in request.Cards)
            {
                string imageUrl = string.Empty;
                string answerImageUrl = string.Empty;
                if (c.Image != null)
                {
                    imageUrl = await _storageService.UploadImageAsync(c.Image);
                }
                if (c.AnswerImage != null)
                {
                    answerImageUrl = await _storageService.UploadImageAsync(c.AnswerImage);
                }

                if (!string.IsNullOrWhiteSpace(c.Term) || !string.IsNullOrWhiteSpace(c.Definition))
                {
                    studySet.Flashcards.Add(new FlashcardItem
                    {
                        QuestionText = c.Term,
                        AnswerText = c.Definition,
                        QuestionImageUrl = string.IsNullOrEmpty(imageUrl) ? null : imageUrl,
                        AnswerImageUrl = string.IsNullOrEmpty(answerImageUrl) ? null : answerImageUrl
                    });
                }
            }

            _context.StudySets.Add(studySet);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetStudySet), new { id = studySet.Id }, studySet);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> EditStudySet(Guid id, [FromForm] EditSetModel request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var studySet = await _context.StudySets
                .Include(s => s.Flashcards)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (studySet == null) return NotFound();
            if (studySet.UserId != userId) return Forbid();

            studySet.Title = request.Title;
            studySet.Description = request.Description;

            var existingCards = studySet.Flashcards.ToDictionary(f => f.Id);
            var incomingCardIds = new HashSet<Guid>();

            // Process existing and new cards
            foreach (var c in request.Cards)
            {
                if (string.IsNullOrWhiteSpace(c.Term) && string.IsNullOrWhiteSpace(c.Definition) && c.Image == null)
                    continue;

                string imageUrl = string.Empty;
                string answerImageUrl = string.Empty;
                if (c.Image != null)
                {
                    imageUrl = await _storageService.UploadImageAsync(c.Image);
                }
                if (c.AnswerImage != null)
                {
                    answerImageUrl = await _storageService.UploadImageAsync(c.AnswerImage);
                }

                if (c.Id.HasValue && existingCards.TryGetValue(c.Id.Value, out var existingCard))
                {
                    // Update existing
                    existingCard.QuestionText = c.Term ?? "";
                    existingCard.AnswerText = c.Definition ?? "";
                    
                    if (c.Image != null)
                    {
                        existingCard.QuestionImageUrl = imageUrl;
                    }
                    else if (c.IsImageDeleted)
                    {
                        existingCard.QuestionImageUrl = null;
                    }

                    if (c.AnswerImage != null)
                    {
                        existingCard.AnswerImageUrl = answerImageUrl;
                    }
                    else if (c.IsAnswerImageDeleted)
                    {
                        existingCard.AnswerImageUrl = null;
                    }
                    
                    incomingCardIds.Add(c.Id.Value);
                }
                else
                {
                    // Add new card
                    var newCard = new FlashcardItem
                    {
                        QuestionText = c.Term ?? "",
                        AnswerText = c.Definition ?? "",
                        QuestionImageUrl = string.IsNullOrEmpty(imageUrl) ? null : imageUrl,
                        AnswerImageUrl = string.IsNullOrEmpty(answerImageUrl) ? null : answerImageUrl,
                        StudySetId = id
                    };
                    _context.Flashcards.Add(newCard);
                }
            }

            // Correctly identify cards to remove: ones that existed but weren't in the update list
            var cardsToRemove = existingCards.Values
                .Where(f => !incomingCardIds.Contains(f.Id))
                .ToList();

            if (cardsToRemove.Any())
            {
                _context.Flashcards.RemoveRange(cardsToRemove);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                // Log the exception if needed
                Console.WriteLine($"Concurrency error: {ex.Message}");
                throw;
            }

            return NoContent();
        }

        [HttpGet("{id}/quiz")]
        public async Task<ActionResult<IEnumerable<QuizQuestionDto>>> GenerateQuiz(Guid id)
        {
            var flashcards = await _context.Flashcards.Where(f => f.StudySetId == id).ToListAsync();
            
            if (flashcards.Count < 4)
                return BadRequest("Not enough flashcards to generate a quiz. Need at least 4.");

            var allAnswers = flashcards.Select(f => f.AnswerText).Distinct().ToList();
            var quizQuestions = new List<QuizQuestionDto>();
            var random = new Random();

            foreach (var card in flashcards)
            {
                var options = new List<string> { card.AnswerText };
                var wrongAnswers = allAnswers.Where(a => a != card.AnswerText).OrderBy(x => random.Next()).Take(3).ToList();
                
                // If distinct answers are less than 4, we might not get 3 wrong answers. We can generate dummy ones if needed, but for now just use what's available.
                options.AddRange(wrongAnswers);
                
                var quizQuestion = new QuizQuestionDto
                {
                    FlashcardId = card.Id,
                    QuestionText = card.QuestionText,
                    QuestionImageUrl = card.QuestionImageUrl,
                    CorrectAnswer = card.AnswerText,
                    Options = options.OrderBy(x => random.Next()).ToList() // Shuffle options
                };

                quizQuestions.Add(quizQuestion);
            }

            return Ok(quizQuestions.OrderBy(x => random.Next()).ToList());
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteStudySet(Guid id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var studySet = await _context.StudySets
                .Include(s => s.Flashcards)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (studySet == null) return NotFound();
            if (studySet.UserId != userId) return Forbid();

            _context.Flashcards.RemoveRange(studySet.Flashcards);
            _context.StudySets.Remove(studySet);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class CreateSetModel
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<CreateCardModel> Cards { get; set; } = new List<CreateCardModel>();
    }

    public class CreateCardModel
    {
        public string Term { get; set; } = string.Empty;
        public string Definition { get; set; } = string.Empty;
        public IFormFile? Image { get; set; }
        public IFormFile? AnswerImage { get; set; }
    }

    public class EditSetModel
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<EditCardModel> Cards { get; set; } = new List<EditCardModel>();
    }

    public class EditCardModel
    {
        public Guid? Id { get; set; }
        public string Term { get; set; } = string.Empty;
        public string Definition { get; set; } = string.Empty;
        public IFormFile? Image { get; set; }
        public bool IsImageDeleted { get; set; }
        public IFormFile? AnswerImage { get; set; }
        public bool IsAnswerImageDeleted { get; set; }
    }
}
