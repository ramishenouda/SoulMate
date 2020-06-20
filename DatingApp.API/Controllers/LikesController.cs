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

namespace DatingApp.API.Controllers
{
    [ServiceFilter(typeof(LogUserActivity))]
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LikesController : ControllerBase
    {
        private readonly IDatingRepository _repo;
        private readonly IMapper _mapper;

        public LikesController(IDatingRepository repo, IMapper mapper)
        {
            _mapper = mapper;
            _repo = repo;
        }

        [HttpGet("{id}/soul/{recipientId}")]
        public async Task<IActionResult> CheckUserSoul(int id, int recipientId)
        {
            if(id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var user = await _repo.GetUser(id);
            if(user == null)
                return Unauthorized();

            if(id == recipientId)
                return Ok(true);

            var userSoul = await _repo.GetLike(id, recipientId);
            var recipientUserSoul = await _repo.GetLike(recipientId, id);

            if(userSoul != null && recipientUserSoul != null)
                return Ok(true);

            return Ok(false);
        }

        [HttpPost("{id}/like/{recipientId}")]
        public async Task<IActionResult> LikeUser(int id, int recipientId)
        {
            if(id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            
            var like = await _repo.GetLike(id, recipientId);

            if(like != null)
                return BadRequest("You already like this user");
            
            var recipient = await _repo.GetUser(recipientId);
            var sender = await _repo.GetUser(id);

            if(await _repo.GetUser(recipientId) == null)
                return NotFound("User not found");
            
            if(sender == null)
                return Unauthorized();

            like = new Like
            {
                LikerId = id,
                LikeeId = recipientId,
                Likee = recipient,
                Liker = sender
            };

            _repo.Add<Like>(like);

            if(await _repo.SaveAll())
            {
                var isSoul = false;
                var recipientLike = await _repo.GetLike(recipientId, id);
                bool lastMessage = true;

                if(recipientLike != null)
                {
                    isSoul = true;
                    lastMessage = await _repo.GetLastMessage(sender.Id, recipient.Id) == null ? false : true;
                }

                return Ok(new {isSoul = isSoul, lastMessage = lastMessage});
            }

            return BadRequest("Failed to like user");
        }

        [HttpPost("{id}/unlike/{recipientId}")]
        public async Task<IActionResult> UnlikeUser(int id, int recipientId)
        {
            if(id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            
            var recipient = await _repo.GetUser(recipientId);
            var sender = await _repo.GetUser(id);

            if(recipient == null)
                return NotFound("User not found");

            if(sender == null)
                return Unauthorized();

            var like = await _repo.GetLike(id, recipientId);

            if(like == null)
                return BadRequest("You already unliked this user");

            _repo.Delete(like);

            if(await _repo.SaveAll())
                return Ok();

            return BadRequest("Failed to unlike user");
        }

        [HttpGet("{id}/isliked/{recipientId}")]
        public async Task<IActionResult> GetLike(int id, int recipientId) 
        {
            if(id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var like = await _repo.GetLike(id, recipientId);

            if(like != null)
                return Ok(true);
            
            return Ok(false);
        } 
    }
}