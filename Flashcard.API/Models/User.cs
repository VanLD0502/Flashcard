namespace Flashcard.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        // Navigation property
        public ICollection<StudySet> StudySets { get; set; } = new List<StudySet>();
    }
}
