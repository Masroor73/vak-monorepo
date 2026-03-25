using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Text.Json;

namespace Vak.Payroll.Api.Routes
{
    public static class ModerationRoutes
    {
        public static void MapModerationRoutes(this WebApplication app)
        {
            app.MapPost("/moderate", async (HttpContext context, IConfiguration config) =>
            {
                try
                {
                    using var reader = new StreamReader(context.Request.Body);
                    var body = await reader.ReadToEndAsync();

                    var requestData = JsonSerializer.Deserialize<Dictionary<string, string>>(body);

                    if (requestData == null || !requestData.ContainsKey("text"))
                    {
                        return Results.BadRequest(new { error = "Invalid request" });
                    }

                    string text = requestData["text"];

                    var endpoint = config["AZURE_CONTENT_SAFETY_ENDPOINT"];
                    var key = config["AZURE_CONTENT_SAFETY_KEY"];

                    using var client = new HttpClient();
                    client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", key);

                    var payload = JsonSerializer.Serialize(new { text });

                    var content = new StringContent(payload, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(
                        $"{endpoint}/contentsafety/text:analyze?api-version=2023-10-01",
                        content
                    );

                    var result = await response.Content.ReadAsStringAsync();

                    Console.WriteLine("AZURE RESPONSE: " + result);

                    // 🔥 AI DECISION (REAL)
                    bool unsafeContent =
                        result.Contains("\"severity\":3") ||
                        result.Contains("\"severity\":4");

                    return Results.Ok(new { safe = !unsafeContent });
                }
                catch (Exception ex)
                {
                    Console.WriteLine("ERROR: " + ex.Message);

                    // fallback (safe mode)
                    return Results.Ok(new { safe = false });
                }
            });
        }
    }
}