using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Flashcard.API.Models
{
    public class FlashcardItem
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid StudySetId { get; set; }

        public string QuestionText { get; set; } = string.Empty;

        public string? QuestionImageUrl { get; set; }

        [Required]
        public string AnswerText { get; set; } = string.Empty;

        public string? AnswerImageUrl { get; set; }

        // Navigation property
        [ForeignKey("StudySetId")]
        public StudySet? StudySet { get; set; }
    }
}
