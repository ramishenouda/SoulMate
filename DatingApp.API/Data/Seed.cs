using System.Collections.Generic;
using System.IO;
using System.Linq;
using DatingApp.API.Models;
using Newtonsoft.Json;

namespace DatingApp.API.Data
{
    public class Seed
    {
        public static void SeedUsers(DataContext context)
        {
            if(!context.Users.Any())
            {
                try 
                {
                    var usersData = System.IO.File.ReadAllText("Data/UserSeedData.json");
                    var users = JsonConvert.DeserializeObject<List<User>>(usersData);
                    foreach(var user in users)
                    {
                        byte[] passwordHash, passwordSalt;
                        CreatePasswordHash("password", out passwordHash, out passwordSalt);

                        user.PasswordHash = passwordHash;
                        user.PasswordSalt = passwordSalt;
                        user.Username = user.Username.ToLower();
                        
                        context.Users.Add(user);
                    }

                    context.SaveChanges();
                }
                catch (FileNotFoundException)
                {
                    return;
                }
            }
        }

        private static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using(var hmac = new System.Security.Cryptography.HMACSHA512())
            {
                passwordSalt = hmac.Key;
                passwordHash = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            }
        }
    }
}