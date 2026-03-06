using Vak.Payroll.Api.Routes;
using Vak.Payroll.Api.Swagger;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.OperationFilter<EndpointDocumentationFilter>();
    c.OperationFilter<ResponseDescriptionFilter>();
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();

app.MapApiRoutes();

app.Run();
