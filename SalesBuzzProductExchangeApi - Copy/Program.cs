using Microsoft.OpenApi;
using SalesBuzz.Shared.Authorization;
using SalesBuzz.Shared.Data;
using SalesBuzz.Shared.Helpers;
using SalesBuzz.Shared.Middleware;
using SalesBuzzProductExchangeApi.Data;

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