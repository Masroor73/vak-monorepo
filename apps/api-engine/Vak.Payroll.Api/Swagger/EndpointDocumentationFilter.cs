using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Vak.Payroll.Api.Swagger;

/// <summary>
/// Applies the intended Swagger layout: tags, summary, description, parameter descriptions, and response codes with descriptions.
/// Swashbuckle does not use WithOpenApi, so we apply this via IOperationFilter.
/// </summary>
public class EndpointDocumentationFilter : IOperationFilter
{
    private static readonly Dictionary<string, (string Summary, string Description, string Tag)> OperationDocs =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Health"] = (
                "Health check",
                "Returns service status and name. Use to verify the API is running.",
                "Health"
            ),
            ["CalculatePayrollForEmployee"] = (
                "Get payroll report for a specific employee",
                "Calculates and returns the payroll report for the given employee. Request body must be a JSON array of shifts for that employee.",
                "Payroll"
            ),
            ["CalculatePayrollForAllEmployees"] = (
                "Get payroll reports for all employees in the payload",
                "Calculates and returns a list of payroll reports, one per distinct employee present in the request body. Request body must be a non-empty JSON array of shifts.",
                "Payroll"
            ),
        };

    private static readonly Dictionary<string, string> ParameterDescriptions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["employeeId"] = "Employee ID (e.g. UUID).",
        };

    private static readonly Dictionary<string, string> ResponseDescriptions =
        new(StringComparer.Ordinal)
        {
            ["200"] = "Success",
            ["400"] = "Bad Request",
            ["404"] = "Not Found",
            ["500"] = "Server Error",
        };

    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var operationId = operation.OperationId;

        if (operationId != null && OperationDocs.TryGetValue(operationId, out var docs))
        {
            operation.Summary = docs.Summary;
            operation.Description = docs.Description;
            operation.Tags = [new OpenApiTag { Name = docs.Tag }];
        }

        foreach (var parameter in operation.Parameters)
        {
            if (ParameterDescriptions.TryGetValue(parameter.Name, out var desc))
                parameter.Description = desc;
        }

        // Ensure standard response codes exist with descriptions (like reference Swagger: 200, 404, 500)
        var codesToEnsure = operationId == "CalculatePayrollForEmployee"
            ? new[] { "200", "400", "404", "500" }
            : new[] { "200", "400", "500" };

        foreach (var code in codesToEnsure)
        {
            if (!operation.Responses.ContainsKey(code))
                operation.Responses[code] = new OpenApiResponse();
            if (ResponseDescriptions.TryGetValue(code, out var responseDesc) && string.IsNullOrEmpty(operation.Responses[code].Description))
                operation.Responses[code].Description = responseDesc;
        }
    }
}
