using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.API.Helpers
{
    public class PagedList<T> : List<T>
    {
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }

        public PagedList(List<T> items, int totalCount, int pageNumber, int pageSize)
        {
            this.TotalCount = totalCount;
            this.CurrentPage = pageNumber;
            this.PageSize = pageSize;
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            this.AddRange(items);
        }

        public static async Task<PagedList<T>> CreateAsync(IQueryable<T> source, int pageNumber, int pageSize) 
        {
            int totalCount = await source.CountAsync();
            var items = await source.Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();

            return new PagedList<T>(items, totalCount, pageNumber, pageSize);
        }

        public static PagedList<T> CreateFromList(List<T> source, int pageNumber, int pageSize)
        {
            int totalCount = source.Count;
            var items = source.Skip((pageNumber - 1) * pageSize).Take(pageSize);

            return new PagedList<T>(items.ToList(), totalCount, pageNumber, pageSize);
        }
    }
}