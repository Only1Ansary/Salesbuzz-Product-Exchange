using SalesBuzz.Shared.Authorization;
using SalesBuzz.Shared.Data;
using SalesBuzz.Shared.Helpers;
using SalesBuzz.Shared.Middleware;
using SalesBuzzProductExchangeApi.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddNewtonsoftJson();

builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();

builder.Services.AddSalesBuzzCurrentBU();

builder.Services.AddSalesBuzzJwt(builder.Configuration);
builder.Services.AddAuthorization();

builder.Services.AddSalesBuzzDb<ProductExchangeDbContext>(builder.Configuration);

builder.Services.AddSalesBuzzExceptionHandling();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

app.UseSalesBuzzExceptionHandling();
app.UseStaticHttpContext();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
app.UseSalesBuzzTokenValidation();

app.MapControllers();
app.Run();