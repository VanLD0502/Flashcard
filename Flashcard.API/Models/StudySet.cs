using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Flashcard.API.Models
{
    public class StudySet
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ICollection<FlashcardItem> Flashcards { get; set; } = new List<FlashcardItem>();

        public int UserId { get; set; }
        public User? User { get; set; }
    }
}
