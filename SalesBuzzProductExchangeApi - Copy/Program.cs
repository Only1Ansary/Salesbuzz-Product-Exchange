using Microsoft.AspNetCore.OData;
using Microsoft.OpenApi;
using Microsoft.OData.Edm;
using Microsoft.OData.ModelBuilder;
using SalesBuzz.Shared.Authorization;
using SalesBuzz.Shared.Data;
using SalesBuzz.Shared.Helpers;
using SalesBuzz.Shared.Middleware;
using SalesBuzz.Shared.OData;
using SalesBuzzProductExchangeApi.Data;
using SalesBuzzProductExchangeApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddControllers()
    .AddNewtonsoftJson();

// OData via the SalesBuzz.Shared OData extension (the "OData part" shipped in BI-SDK)
// -> enables $count/$filter/$expand/$select/$orderby (max top 1000), $batch, MyConvention,
//    and the shared HttpResponseExceptionFilter. EntitySet<T>("Name") routes to /Name.
builder.Services.AddSalesBuzzOData(GetEdmModel());

//builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your JWT token."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});
builder.Services.AddMemoryCache();

builder.Services.AddSalesBuzzCurrentBU();

// AddSalesBuzzJwt registers authentication + the "Bearer" scheme internally,
// so no separate builder.Services.AddAuthentication()/.AddJwtBearer() call here.
builder.Services.AddSalesBuzzJwt(builder.Configuration);
builder.Services.AddAuthorization();

builder.Services.AddSalesBuzzDb<ProductExchangeDbContext>(builder.Configuration);

builder.Services.AddSalesBuzzExceptionHandling();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    //app.MapOpenApi();
}

//app.UseSalesBuzzExceptionHandling();
app.UseStaticHttpContext();
app.UseHttpsRedirection();
app.UseCors("AngularPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseSalesBuzzTokenValidation();
app.MapControllers();
app.Run();

// Builds the OData EDM model; each EntitySet<T>("Name") becomes a route at /Name.
// Add a new EntitySet line here for every entity you want exposed via OData.
static IEdmModel GetEdmModel()
{
    var builder = new ODataConventionModelBuilder();
    builder.EntitySet<ProductExchangeOrder>("ProductExchangeOrders");
    return builder.GetEdmModel();
}