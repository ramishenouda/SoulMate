using System.Collections.Generic;
using System.Threading.Tasks;
using DatingApp.API.Helpers;
using DatingApp.API.Models;

namespace DatingApp.API.Data
{
    public interface IDatingRepository
    {
        void Add<T>(T Entity) where T: class;
        void Delete<T>(T Entity) where T: class;
        void unlike(Like like);
        Task<bool> SaveAll();
        Task<PagedList<User>> GetUsers(UserParams paginationParams);
        Task<User> GetUser(int id);
        Task<Photo> GetPhoto(int id);
        Task<List<Photo>> GetMainPhoto(int userId);
        Task<Like> GetLike(int userId, int recipientId);
        Task<Message> GetMessage(int id);
        Task<PagedList<Message>> GetMessagesForUser(MessageParams messageParams);
        Task<PagedList<Message>> GetMessagesThread(int userId, int recipientId, MessageParams messageParams, int maximumId);
        Task<IEnumerable<Message>> GetUnreadMessages(int userId, int recipientId);
    }
}