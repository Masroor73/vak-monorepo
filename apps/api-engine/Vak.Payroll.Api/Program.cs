using Vak.Payroll.Engine;
using Vak.Payroll.Engine.Models;

var builder = WebApplication.CreateBuilder(args);

// Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Swagger middleware
app.UseSwagger();
app.UseSwaggerUI();

// Keep HTTPS redirection (fine for local dev too)
app.UseHttpsRedirection();

app.MapGet("/", () => Results.Ok(new { status = "ok", service = "Vak.Payroll.Api" }))
   .WithName("Health");

// Calculate payroll for one employee
// Body: JSON array of shifts
app.MapPost("/payroll/{employeeId}", (string employeeId, List<Shift> shifts) =>
{
    if (string.IsNullOrWhiteSpace(employeeId))
        return Results.BadRequest("employeeId is required.");

    if (shifts == null || shifts.Count == 0)
        return Results.BadRequest("Request body must be a non-empty array of shifts.");

    var report = PayrollCalculator.CalculatePayroll(employeeId, shifts);
    return Results.Ok(report);

}).WithName("CalculatePayrollForEmployee");

// Calculate payroll for all employees present in payload
app.MapPost("/payroll", (List<Shift> shifts) =>
{
    if (shifts == null || shifts.Count == 0)
        return Results.BadRequest("Request body must be a non-empty array of shifts.");

    var employeeIds = shifts.Select(s => s.EmployeeId).Where(id => !string.IsNullOrWhiteSpace(id)).Distinct();

    var reports = employeeIds
        .Select(id => PayrollCalculator.CalculatePayroll(id, shifts))
        .ToList();

    return Results.Ok(reports);

}).WithName("CalculatePayrollForAllEmployees");

app.Run();
