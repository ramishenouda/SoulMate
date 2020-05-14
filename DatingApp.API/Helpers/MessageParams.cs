namespace DatingApp.API.Helpers
{
    public class MessageParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize = 10;
        public int UserId { get; set; }
        public string MessageContainer { get; set; } = "Unread";
    }
}