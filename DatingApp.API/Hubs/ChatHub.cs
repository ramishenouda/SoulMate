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

        public async Task<string> SendMessage(int userId, int recipientId, string content)
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

            var message = _mapper.Map<Message>(messageForCreationDto);
            _repo.Add(message);

            if (await _repo.SaveAll())
            {
                MyUsers.TryGetValue(messageForCreationDto.SenderId, out existingUserConnectionIds);
                if(userId != recipientId)
                {
                    Console.WriteLine(userId);
                    Console.WriteLine(recipientId);
                    if(await EmitMessageToUser(message.RecipientId, message.Id, message.Content, message.SentDate))
                    {
                        Console.WriteLine("Yup");
                        await Clients.Clients(existingUserConnectionIds).SendAsync("messageReceived", message.Id, message.SentDate);
                    }
                }
                return message.SentDate.ToString() + '-' + message.Id;
            }

            throw new Exception("Failed to send the message");
        }

        public async Task<bool> EmitMessageToUser(int recipientId, int messageId, string message, DateTime sentDate)
        {
            List<string> existingUserConnectionIds;
            MyUsers.TryGetValue(recipientId, out existingUserConnectionIds);

            if (existingUserConnectionIds != null)
            {
                var messageFromRepo = await _repo.GetMessage(messageId);
                
                messageFromRepo.IsReceived = true;
                messageFromRepo.ReceivedDate = DateTime.Now;

                await _repo.SaveAll();

                await Clients.Clients(existingUserConnectionIds).SendAsync
                (
                    "receiveMessage", messageId, message, sentDate, messageFromRepo.Sender.KnownAs
                );

                return true;
            }

            return false;
        }

        public override Task OnConnectedAsync()
        {
            Console.WriteLine("------------------------------------------------");
            Console.WriteLine("Connection");
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

            foreach (var user in MyUsers)
            {
                Console.WriteLine("The user is connected with : " + user.Key);
                foreach (var value in MyUsers[user.Key])
                {
                    Console.WriteLine("\t" + value);
                }
            }

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

            Console.WriteLine("------------------------------------------------");
            Console.WriteLine("Disconnection");
            foreach (var user in MyUsers)
            {
                Console.WriteLine("The user is connected with : " + user.Key);
                try 
                {
                    foreach (var value in MyUsers[user.Key])
                    {
                        Console.WriteLine("\t" + value);
                    }
                } 
                catch (KeyNotFoundException) 
                {
                    Console.WriteLine("Key Exception"); 
                    continue;
                }
            }

            return base.OnDisconnectedAsync(ex);
        }
    }
}