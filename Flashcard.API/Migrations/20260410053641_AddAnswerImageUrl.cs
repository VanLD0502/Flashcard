using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Flashcard.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAnswerImageUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AnswerImageUrl",
                table: "Flashcards",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnswerImageUrl",
                table: "Flashcards");
        }
    }
}
