using Microsoft.EntityFrameworkCore;
using SalesBuzzProductExchangeApi.Models;
using SalesBuzz.Shared.Data;

namespace SalesBuzzProductExchangeApi.Data;

public class ProductExchangeDbContext : SalesBuzzDbContextBase
{
    public ProductExchangeDbContext(DbContextOptions options, ICurrentBUContext buContext)
        : base(options, buContext) { }

    public DbSet<ProductExchangeOrder> ProductExchangeOrders { get; set; }
}