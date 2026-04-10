using Flashcard.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Flashcard.API.Data
{
    public class FlashcardDbContext : DbContext
    {
        public FlashcardDbContext(DbContextOptions<FlashcardDbContext> options) : base(options)
        {
        }

        public DbSet<StudySet> StudySets { get; set; }
        public DbSet<FlashcardItem> Flashcards { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<StudySet>()
                .HasMany(s => s.Flashcards)
                .WithOne(f => f.StudySet)
                .HasForeignKey(f => f.StudySetId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasMany(u => u.StudySets)
                .WithOne(s => s.User)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
