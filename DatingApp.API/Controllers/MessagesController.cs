using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using DatingApp.API.Data;
using DatingApp.API.Dtos;
using DatingApp.API.Helpers;
using DatingApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.API.Controller
{
    [ServiceFilter(typeof(LogUserActivity))]
    [ApiController]
    [Route("api/users/{userId}/[controller]")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IDatingRepository _repo;
        private readonly IMapper _mapper;
        public MessagesController(IDatingRepository repo, IMapper mapper)
        {
            _mapper = mapper;
            _repo = repo;
        }

        [HttpGet("{id}", Name = "GetMessage")]
        public async Task<IActionResult> GetMessage(int userId, int id)
        {
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var messageFromRepo = await _repo.GetMessage(id);


            if(messageFromRepo == null)
                return NotFound();

            var messageToReturn = _mapper.Map<MessageToReturnDto>(messageFromRepo);
            return Ok(messageToReturn);
        }

        [HttpGet("lastMessage/{recipientId}")]
        public async Task<IActionResult> GetLastMessage(int userId, int recipientId)
        {
            var sender = await _repo.GetUser(userId);
            if(sender.Id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var recipient = await _repo.GetUser(recipientId);

            var messageFromRepo = await _repo.GetLastMessage(userId, recipientId);
            
            if(messageFromRepo == null)
                return Ok(new { content =  "" , sentDate = new DateTime()});

            return Ok(new 
            { 
                content = messageFromRepo.Content,
                sentDate = messageFromRepo.SentDate,
                senderId = messageFromRepo.SenderId
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetMessagesForUser(int userId, [FromQuery]MessageParams messageParams)
        {
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            
            messageParams.UserId = userId;

            var messagesFromRepo = await _repo.GetMessagesForUser(messageParams);

            var messages = _mapper.Map<IEnumerable<MessageToReturnDto>>(messagesFromRepo);

            Response.AddPagination(messagesFromRepo.CurrentPage, messagesFromRepo.PageSize,
                messagesFromRepo.TotalCount, messagesFromRepo.TotalPages);


            return Ok(messages);
        }

        [HttpGet("thread/{recipientId}/{maximumId}")]
        public async Task<IActionResult> GetMessageThread(int userId, int recipientId, [FromQuery]MessageParams messageParams, int maximumId)
        {
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var currentLoggedInUser = await _repo.GetUser(userId);
            if(currentLoggedInUser == null)
                return Unauthorized();

            var messages = await _repo.GetMessagesThread(userId, recipientId, messageParams, maximumId);
            var messagesToReturn = _mapper.Map<IEnumerable<MessageToReturnDto>>(messages);

            Response.AddPagination(messages.CurrentPage, messages.PageSize, messages.TotalCount, messages.TotalPages);

            return Ok(messagesToReturn);
        }

        [HttpGet("unread/{recipientId}")]
        public async Task<IActionResult> GetUnreadMessages(int userId, int recipientId)
        {
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var currentLoggedInUser = await _repo.GetUser(userId);
            if(currentLoggedInUser == null)
                return Unauthorized();

            var messages = await _repo.GetUnreadMessages(userId, recipientId);
            var messagesToReturn = _mapper.Map<IEnumerable<MessageToReturnDto>>(messages);

            return Ok(messagesToReturn);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMessage(int userId, MessageForCreationDto messageForCreationDto)
        {
            var sender = await _repo.GetUser(userId);

            if(sender.Id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            
            messageForCreationDto.SenderId = userId;

            var recipient = await _repo.GetUser(messageForCreationDto.RecipientId);

            if(recipient == null)
                return BadRequest("Could not find user");
            
            var usersSouled = await _repo.CheckUserSoul(userId, messageForCreationDto.RecipientId);

            if (!usersSouled && sender.Id != recipient.Id)
                return Unauthorized();

            var message = _mapper.Map<Message>(messageForCreationDto);
            _repo.Add(message);

            if(await _repo.SaveAll())
            {
                var messageToReturn = _mapper.Map<MessageToReturnDto>(message);
                return CreatedAtRoute("GetMessage", new { userId = userId, id = message.Id }, messageToReturn);
            }
           
            throw new Exception("Failed to send the message");
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> DeleteMessage(int id, int userId)
        {
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            
            var messageFromRepo = await _repo.GetMessage(id);

            if(userId == messageFromRepo.SenderId)
                messageFromRepo.SenderDeleted = true;

            else if(userId == messageFromRepo.RecipientId)
                messageFromRepo.RecipientDeleted = true;
            
            if (messageFromRepo.SenderDeleted && messageFromRepo.RecipientDeleted)
                _repo.Delete(messageFromRepo);

            if(await _repo.SaveAll())
                return NoContent();
            
            throw new Exception("Error while deleting the message");
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkMessageRead(int userId, int id) 
        {
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            
            var message = await _repo.GetMessage(id);

            if(message.RecipientId != userId)
                return Unauthorized();
            
            message.IsRead = true;
            message.ReadDate = DateTime.Now;

            await _repo.SaveAll();

            return NoContent();
        }

        [HttpPost("{id}/receive")]
        public async Task<IActionResult> MarkMessageReceived(int userId, int id) 
        {
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            
            var message = await _repo.GetMessage(id);

            if(message.RecipientId != userId)
                return Unauthorized();
            
            message.IsReceived = true;
            message.ReceivedDate = DateTime.Now;

            await _repo.SaveAll();

            return NoContent();
        }
    }
}