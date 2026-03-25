using Vak.Payroll.Api.Routes;
using Vak.Payroll.Api.Swagger;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    // Browser calls from Expo web / local dev (e.g. localhost:8082) require CORS on POST /payroll.
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<EndpointDocumentationFilter>();
    c.OperationFilter<ResponseDescriptionFilter>();
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseHttpsRedirection();

// ✅ ONLY ONCE
app.MapModerationRoutes();

// your main APIs
app.MapApiRoutes();

app.Run();