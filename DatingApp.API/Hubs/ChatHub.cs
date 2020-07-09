using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using DatingApp.API.Data;
using DatingApp.API.Dtos;
using DatingApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;

namespace DatingApp.API.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        public static ConcurrentDictionary<int, List<string>> MyUsers = new ConcurrentDictionary<int, List<string>>();
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly IDatingRepository _repo;
        private readonly IMapper _mapper;

        public ChatHub(IHttpContextAccessor contextAccessor, IDatingRepository repo, IMapper mapper)
        {
            _mapper = mapper;
            _repo = repo;
            _contextAccessor = contextAccessor;
        }

        public async Task<string> SendMessage(int userId, int recipientId, string content, string hubConnectionId)
        {
            var messageForCreationDto = new MessageForCreationDto
            {
                RecipientId = recipientId,
                Content = content
            };
            
            var sender = await _repo.GetUser(userId);
            if(sender == null)
                throw new Exception("Unauthorize");

            List<string> existingUserConnectionIds;

            MyUsers.TryGetValue(messageForCreationDto.RecipientId, out existingUserConnectionIds);

            if (sender.Id != int.Parse(_contextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier).Value))
                throw new Exception("Unauthorize");

            messageForCreationDto.SenderId = userId;

            var recipient = await _repo.GetUser(messageForCreationDto.RecipientId);

            if (recipient == null)
            {
                throw new Exception("User no longer exist");
            }

            if(await _repo.CheckUserSoul(messageForCreationDto.SenderId, messageForCreationDto.RecipientId) == false)
                throw new Exception("Unauthorize");

            var message = _mapper.Map<Message>(messageForCreationDto);

            _repo.Add(message);
            if (await _repo.SaveAll())
            {
                MyUsers.TryGetValue(messageForCreationDto.SenderId, out existingUserConnectionIds);
                if(userId != recipientId)
                {
                    if(await EmitMessageToUser(message.SenderId, message.RecipientId, message.Id, message.Content, message.SentDate))
                        await Clients.Clients(existingUserConnectionIds).SendAsync("messageReceived", recipientId, 
                        message.Id, message.SentDate, message.Content, true, hubConnectionId);
                    else 
                        await Clients.Clients(existingUserConnectionIds).SendAsync("messageReceived", recipientId, message.Id, 
                            message.SentDate, message.Content, false, hubConnectionId);

                }
                return message.SentDate.ToString() + '-' + message.Id;
            }

            throw new Exception("Failed to send the message");
        }

        public async Task<string> MarkMessageAsRead(int senderId, int messageId)
        {
            List<string> existingUserConnectionIds;
            var message = await _repo.GetMessage(messageId);
            if(message == null)
                return new DateTime(1999, 05, 11).ToString();

            message.IsRead = true;
            message.ReadDate = DateTime.Now;
            if(await _repo.SaveAll())
            {
                MyUsers.TryGetValue(senderId, out existingUserConnectionIds);
                if(existingUserConnectionIds != null)
                    await Clients.Clients(existingUserConnectionIds).SendAsync("markMessageAsRead", message.ReadDate.ToString(), message.Id);
                return message.ReadDate.ToString();
            }

            else
                return new DateTime(1999, 05, 11).ToString();
        }
        public async Task<string> MarkMessageAsReceived(int senderId, int messageId)
        {
            List<string> existingUserConnectionIds;
            var message = await _repo.GetMessage(messageId);
            if(message == null)
                return new DateTime(1999, 05, 11).ToString();

            message.IsReceived = true;
            message.ReceivedDate = DateTime.Now;
            if(await _repo.SaveAll())
            {
                MyUsers.TryGetValue(senderId, out existingUserConnectionIds);
                
                if(existingUserConnectionIds != null)
                    await Clients.Clients(existingUserConnectionIds).SendAsync("markMessageAsReceived", message.ReceivedDate.ToString(), message.Id);

                return message.ReceivedDate.ToString();
            }

            else
                return new DateTime(1999, 05, 11).ToString();
        }

        public async Task<bool> EmitMessageToUser(int senderId, int recipientId, int messageId, string message, DateTime sentDate)
        {
            List<string> existingUserConnectionIds;
            MyUsers.TryGetValue(recipientId, out existingUserConnectionIds);

            if (existingUserConnectionIds != null)
            {
                var messageFromRepo = await _repo.GetMessage(messageId);
                
                messageFromRepo.IsReceived = true;
                messageFromRepo.ReceivedDate = DateTime.Now;

                if(await _repo.SaveAll())
                {
                    await Clients.Clients(existingUserConnectionIds).SendAsync
                    (
                        "receiveMessage", messageId, message, sentDate, messageFromRepo.SenderId, messageFromRepo.Sender.KnownAs
                    );

                    return true;
                }
            }

            return false;
        }

        public override Task OnConnectedAsync()
        {
            Trace.TraceInformation("MapHub started. ID: {0}", Context.ConnectionId);

            var userId = int.Parse(_contextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier).Value);

            //Try to get a List of existing user connections from the cache
            List<string> existingUserConnectionIds;
            MyUsers.TryGetValue(userId, out existingUserConnectionIds);

            // happens on the very first connection from the user
            if (existingUserConnectionIds == null)
            {
                existingUserConnectionIds = new List<string>();
            }

            // First add to a List of existing user connections (i.e. multiple web browser tabs)
            existingUserConnectionIds.Add(Context.ConnectionId);

            // Add to the global dictionary of connected users
            MyUsers.TryAdd(userId, existingUserConnectionIds);

            var offset = TimeZoneInfo.Local.GetUtcOffset(DateTime.UtcNow);

            Clients.Client(Context.ConnectionId).SendAsync("serverTimezoneOffset", offset);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception ex)
        {
            var userId = int.Parse(_contextAccessor.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier).Value);

            List<string> existingUserConnectionIds;
            MyUsers.TryGetValue(userId, out existingUserConnectionIds);

            // remove the connection id from the List 
            existingUserConnectionIds.Remove(Context.ConnectionId);

            // If there are no connection ids in the List, delete the user from the global cache (ConnectedUsers).
            if (existingUserConnectionIds.Count == 0)
            {
                // if there are no connections for the user,
                // just delete the userName key from the ConnectedUsers concurent dictionary
                List<string> garbage; // to be collected by the Garbage Collector
                MyUsers.TryRemove(userId, out garbage);
            }

            return base.OnDisconnectedAsync(ex);
        }
    }
}