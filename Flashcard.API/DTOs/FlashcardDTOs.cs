using System;
using System.Collections.Generic;

namespace Flashcard.API.DTOs
{
    public class StudySetCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class FlashcardCreateDto
    {
        public string QuestionText { get; set; } = string.Empty;
        public string AnswerText { get; set; } = string.Empty;
    }
    
    public class QuizQuestionDto
    {
        public Guid FlashcardId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string? QuestionImageUrl { get; set; }
        public List<string> Options { get; set; } = new List<string>();
        // Answer is not sent to the frontend for security, or maybe sent so UI can check instantly. 
        // For Quizlet-style instant feedback, we will send CorrectAnswer.
        public string CorrectAnswer { get; set; } = string.Empty;
    }
}
