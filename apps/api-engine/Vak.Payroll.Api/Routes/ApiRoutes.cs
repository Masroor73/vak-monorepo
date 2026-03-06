using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi.Models;
using Vak.Payroll.Engine;
using Vak.Payroll.Engine.Models;

namespace Vak.Payroll.Api.Routes;

public static class ApiRoutes
{
    /// <summary>
    /// Maps all API endpoints for the Payroll API.
    /// </summary>
    public static void MapApiRoutes(this WebApplication app)
    {
        MapHealth(app);
        MapPayroll(app);
    }

    private static void MapHealth(WebApplication app)
    {
        app.MapGet("/", () => Results.Ok(new { status = "ok", service = "Vak.Payroll.Api" }))
            .WithName("Health")
            .WithTags("Health")
            .WithSummary("Health check")
            .WithDescription("Returns service status and name. Use to verify the API is running.")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Health check";
                operation.Description = "Returns service status and name. Use to verify the API is running.";
                operation.Tags = [new OpenApiTag { Name = "Health" }];
                EnsureResponseDescriptions(operation);
                return operation;
            })
            .Produces(200)
            .Produces(500);
    }

    private static void MapPayroll(WebApplication app)
    {
        // Calculate payroll for one employee — body: JSON array of shifts
        app.MapPost("/payroll/{employeeId}", (string employeeId, List<Shift> shifts) =>
        {
            if (string.IsNullOrWhiteSpace(employeeId))
                return Results.BadRequest("employeeId is required.");

            if (shifts == null || shifts.Count == 0)
                return Results.BadRequest("Request body must be a non-empty array of shifts.");

            var report = PayrollCalculator.CalculatePayroll(employeeId, shifts);
            return Results.Ok(report);
        })
            .WithName("CalculatePayrollForEmployee")
            .WithTags("Payroll")
            .WithSummary("Get payroll report for a specific employee")
            .WithDescription("Calculates and returns the payroll report for the given employee. Request body must be a JSON array of shifts for that employee.")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Get payroll report for a specific employee";
                operation.Description = "Calculates and returns the payroll report for the given employee. Request body must be a JSON array of shifts for that employee.";
                operation.Tags = [new OpenApiTag { Name = "Payroll" }];
                if (operation.Parameters.Count > 0)
                    operation.Parameters[0].Description = "Employee ID (e.g. UUID).";
                EnsureResponseDescriptions(operation);
                return operation;
            })
            .Produces<PayrollReport>(200)
            .Produces(400)
            .Produces(404)
            .Produces(500);

        // Calculate and return the payroll for all employees present in payload
        app.MapPost("/payroll", (List<Shift> shifts) =>
        {
            if (shifts == null || shifts.Count == 0)
                return Results.BadRequest("Request body must be a non-empty array of shifts.");

            var employeeIds = shifts.Select(s => s.EmployeeId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct();

            var reports = employeeIds
                .Select(id => PayrollCalculator.CalculatePayroll(id, shifts))
                .ToList();

            return Results.Ok(reports);
        })
            .WithName("CalculatePayrollForAllEmployees")
            .WithTags("Payroll")
            .WithSummary("Get payroll reports for all employees in the payload")
            .WithDescription("Calculates and returns a list of payroll reports, one per distinct employee present in the request body. Request body must be a non-empty JSON array of shifts.")
            .WithOpenApi(operation =>
            {
                operation.Summary = "Get payroll reports for all employees in the payload";
                operation.Description = "Calculates and returns a list of payroll reports, one per distinct employee present in the request body. Request body must be a non-empty JSON array of shifts.";
                operation.Tags = [new OpenApiTag { Name = "Payroll" }];
                EnsureResponseDescriptions(operation);
                return operation;
            })
            .Produces<List<PayrollReport>>(200)
            .Produces(400)
            .Produces(500);
    }

    /// <summary>
    /// Ensures standard response codes have descriptions so Swagger UI shows them (e.g. Success, Bad Request, Server Error).
    /// </summary>
    private static void EnsureResponseDescriptions(OpenApiOperation operation)
    {
        var defaults = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["200"] = "Success",
            ["400"] = "Bad Request",
            ["404"] = "Not Found",
            ["500"] = "Server Error",
        };
        foreach (var (code, description) in defaults)
        {
            if (operation.Responses.TryGetValue(code, out var response) && string.IsNullOrEmpty(response.Description))
                response.Description = description;
        }
    }
}
