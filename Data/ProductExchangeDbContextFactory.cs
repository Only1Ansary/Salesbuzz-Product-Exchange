using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using SalesBuzz.Shared.Data;

namespace SalesBuzzProductExchangeApi.Data
{
    public class ProductExchangeDbContextFactory : IDesignTimeDbContextFactory<ProductExchangeDbContext>
    {
        public ProductExchangeDbContext CreateDbContext(string[] args)
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            var connectionString = ConnectionStringUtility.Read_ConStr(config);

            var optionsBuilder = new DbContextOptionsBuilder<ProductExchangeDbContext>();
            optionsBuilder.UseSqlServer(connectionString);

            return new ProductExchangeDbContext(optionsBuilder.Options, new DesignTimeCurrentBUContext());
        }
    }
    internal class DesignTimeCurrentBUContext : ICurrentBUContext
    {
        public string GetUserName() => "system";
        public string GetUserBUID() => "C100";
        public string GetClaim(string claimType) => string.Empty;
    }
}