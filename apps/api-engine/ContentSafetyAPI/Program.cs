var builder = WebApplication.CreateBuilder(args);

// 🔥 Enable CORS
builder.Services.AddCors(options =>
{
      options.AddPolicy("AllowAll",
          policy => policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowAll");

// 🔥 YOUR MODERATION API
app.MapPost("/moderate", async (HttpContext context) =>
{
      return Results.Ok(new
      {
            categoriesAnalysis = new[]
          {
            new { severity = 0 } // always safe for now
        }
      });
});

app.Run();