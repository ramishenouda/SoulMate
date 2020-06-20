using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DatingApp.API.Helpers;
using DatingApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.API.Data
{
    public class DatingRepository : IDatingRepository
    {
        private readonly DataContext _context;

        public DatingRepository(DataContext context)
        {
            _context = context;
        }
        public void Add<T>(T Entity) where T : class
        {
            _context.Add(Entity);
        }

        public void Delete<T>(T Entity) where T : class
        {
            _context.Remove(Entity);
        }

        public void unlike(Like like)
        {
            _context.Likes.Remove(like);
        }

        public async Task<Like> GetLike(int userId, int recipientId)
        {
            return await _context.Likes.FirstOrDefaultAsync(u => u.LikerId == userId && u.LikeeId == recipientId);
        }

        public async Task<List<Photo>> GetMainPhoto(int userId)
        {
            return await _context.Photos.Where(u => u.UserId == userId).Where(p => p.IsMain == true).ToListAsync();
        }

        public async Task<Photo> GetPhoto(int id)
        {
            return await _context.Photos.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<User> GetUser(int id)
        {
            return await _context.Users.Include(p => p.Photos).FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<PagedList<User>> GetUsers(UserParams userParams)
        {
            var users = _context.Users.Include(p => p.Photos).AsQueryable();

            users = users.Where(u => u.Id != userParams.UserId);
            if(userParams.Gender != "mix")
                users = users.Where(u => u.Gender == userParams.Gender);
            
            if(userParams.Likers)
            {
                var userLikers = await GetUserLikes(userParams.UserId, userParams.Likers);
                users = users.Where(u => userLikers.Contains(u.Id));
            }

            if(userParams.Likees)
            {
                var userLikees = await GetUserLikes(userParams.UserId, userParams.Likers);
                users = users.Where(u => userLikees.Contains(u.Id));
            }

            if(userParams.NoConnection)
            {
                var userLikees = await GetUserLikes(userParams.UserId, userParams.Likers);
                users = users.Where(u => !userLikees.Contains(u.Id));
            }

            if(!string.IsNullOrEmpty(userParams.OrderBy))
            {
                switch(userParams.OrderBy)
                {
                    case "created":
                        users = users.OrderByDescending(u => u.Created);
                        break;
                    default:
                        users = users.OrderByDescending(u => u.LastActive);
                        break;
                }
            }
            else
                users = users.OrderByDescending(u => u.LastActive);

            if(userParams.MinAge != 18 || userParams.MaxAge != 99)
            {
                var minDob = DateTime.Now.AddYears(-userParams.MaxAge - 1);
                var maxDob = DateTime.Now.AddYears(-userParams.MinAge);

                users = users.Where(u => u.DateOfBirth >= minDob && u.DateOfBirth <= maxDob);
            }

            return await PagedList<User>.CreateAsync(users, userParams.PageNumber, userParams.PageSize);
        }

        public async Task<IEnumerable<int>> GetUserLikes(int id, bool likers)
        {
            var user = await _context.Users
                .Include(x => x.Likers)
                .Include(x => x.Likees)
                .FirstOrDefaultAsync(u => u.Id == id);

            if(likers)
                return user.Likers.Where(u => u.LikeeId == id).Select(i => i.LikerId);

            return user.Likees.Where(u => u.LikerId == id).Select(i => i.LikeeId);
        }

        public async Task<bool> SaveAll()
        {
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<Message> GetMessage(int id)
        {
            return await _context.Messages.FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<PagedList<Message>> GetMessagesForUser(MessageParams messageParams)
        {
            var messages = _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                .AsQueryable();
            
            switch (messageParams.MessageContainer)
            {
                case "Inbox":
                    messages = messages.Where(u => u.RecipientId == messageParams.UserId && u.RecipientDeleted == false);
                    break;
                case "Outbox":
                    messages = messages.Where(u => u.SenderId == messageParams.UserId && u.SenderDeleted == false);
                    break;
                default:
                    messages = messages.Where(u => u.RecipientId == messageParams.UserId &&!u.IsRead && u.RecipientDeleted == false);
                    break;
            }

            messages = messages.OrderByDescending(u => u.SentDate);

            return await PagedList<Message>.CreateAsync(messages, messageParams.PageNumber, messageParams.PageSize);
        }

        public async Task<bool> CheckUserSoul(int userId, int recipientId)
        {
            var userLike = await GetLike(userId, recipientId);
            if(userLike == null)
                return false;
            var recipientLike = await GetLike(recipientId, userId);
            if(recipientLike == null)
                return false;
            
            return true;
        }

        public async Task<List<User>> GetUserSouls(SoulParams soulParams)
        {
            var likees = await GetUserLikes(soulParams.UserId, false);

            var userSouls = _context.Likes
                .Where(l => likees.Contains(l.LikerId) && l.LikeeId == soulParams.UserId)
                .Include(p => p.Liker.Photos)
                .Select(u => u.Liker);

            var lastMessages = new List<Message>();
            foreach (var soul in userSouls)
            {
                var message = await GetLastMessage(soulParams.UserId, soul.Id);
                if(message == null)
                    continue;

                if(lastMessages.Count != 0)
                {
                    bool inserted = false;

                    for(int i = 0; i< lastMessages.Count; i++)
                    {
                        if(lastMessages[i].SentDate < message.SentDate)
                        {
                            lastMessages.Insert(i, message);
                            inserted = true;
                            break;
                        }
                    }

                    if(!inserted)
                        lastMessages.Add(message);
                }
                else
                    lastMessages.Add(message);
            }

            var orderedSouls = new List<User>();
            for (int i = 0; i < lastMessages.Count; i++)
            {
                int senderId = lastMessages[i].SenderId;
                int recipientId = lastMessages[i].RecipientId;

                var user = userSouls.Where(i => i.Id == senderId || i.Id == recipientId).Select(i => i).First();
                orderedSouls.Add(user);
            }

            foreach (var soul in userSouls)
            {
                bool exist = false;
                foreach(var orderedSoul in orderedSouls)
                {
                    if(orderedSoul.Id == soul.Id)
                    {
                        exist = true;
                        break;
                    }
                }

                if(!exist)
                    orderedSouls.Add(soul);
            }

            return orderedSouls;
        }

        public async Task<PagedList<Message>> GetMessagesThread(int userId, int recipientId, MessageParams messageParams, int maximumId = -1)
        {
            var messages = _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos).AsQueryable();
            
            if(maximumId != -1)
                messages = messages.Where(m => m.Id < maximumId);
            
            messages = messages.Where(m => 
            (
                (m.RecipientId == userId && m.SenderId == recipientId && m.RecipientDeleted == false)
                                                        ||
                (m.RecipientId == recipientId && m.SenderId == userId && m.SenderDeleted == false)
            )).OrderByDescending(m => m.SentDate);

            return await PagedList<Message>.CreateAsync(messages, messageParams.PageNumber, messageParams.PageSize);
        }

        public async Task<Message> GetLastMessage(int userId, int recipientId)
        {
            var lastMessage = await _context.Messages.AsQueryable()
                .Where
                (m => 
                    (m.RecipientId == recipientId && m.SenderId == userId && m.SenderDeleted == false)
                                                        || 
                    (m.RecipientId == userId && m.SenderId == recipientId && m.RecipientDeleted == false)
                )
                .OrderByDescending(m => m.SentDate)
                .Take(1).ToListAsync();

            if(lastMessage.ToArray().Length > 0)
                return lastMessage[0];  

            return null;
        }

        public async Task<IEnumerable<Message>> GetUnreadMessages(int userId, int recipientId)
        {

            var lastUnreadMessage = await _context.Messages.OrderByDescending(m => m.SentDate)
            .LastOrDefaultAsync
            (
                m => m.IsRead == false && (m.SenderId == recipientId && m.RecipientId == userId)
            );

            int lastUnreadMessageId;

            if(lastUnreadMessage != null)
                lastUnreadMessageId = lastUnreadMessage.Id;
            else 
                lastUnreadMessageId = 0;

            var messages = _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos).AsQueryable();

            if(recipientId != -1)
            {
                var _messages = messages.Where(m => 
                (
                    ((m.RecipientId == userId && m.SenderId == recipientId && m.RecipientDeleted == false)
                                                            ||
                    (m.RecipientId == recipientId && m.SenderId == userId && m.SenderDeleted == false))
                                                            &&
                                                (m.Id >= lastUnreadMessageId)
                )).OrderByDescending(m => m.SentDate).AsQueryable();

                if(lastUnreadMessageId != 0)
                    return _messages;
                else
                    return await PagedList<Message>.CreateAsync(_messages, 0, 10);
            }

            else 
            {
                var _messages = await messages
                .Where(m => m.RecipientId == userId && !m.IsReceived).ToListAsync();
                return _messages;
            }
        }
    }
}