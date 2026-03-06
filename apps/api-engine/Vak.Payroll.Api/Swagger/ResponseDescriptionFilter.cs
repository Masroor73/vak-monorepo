using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Vak.Payroll.Api.Swagger;

/// <summary>
/// Ensures standard HTTP response codes have descriptions in Swagger UI.
/// </summary>
public class ResponseDescriptionFilter : IOperationFilter
{
    private static readonly IReadOnlyDictionary<string, string> DefaultDescriptions = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["200"] = "Success",
        ["400"] = "Bad Request",
        ["404"] = "Not Found",
        ["500"] = "Server Error",
    };

    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        foreach (var response in operation.Responses)
        {
            if (string.IsNullOrEmpty(response.Value.Description) && DefaultDescriptions.TryGetValue(response.Key, out var description))
                response.Value.Description = description;
        }
    }
}
