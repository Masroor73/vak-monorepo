using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace Vak.Payroll.Engine
{
    //Definition of Data Structures were moved to the Models folder to keep the code clean and readable.
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("--- V.A.K Compliance Engine (Alberta 8/44) ---");
            
            // Accept a JSON filepath via CLI args, deserialize, then calculate.
            // Example usage (future state):
            // dotnet run -- "path/to/test_shifts.json"

            if (args.Length < 1)
            {
                Console.WriteLine("Usage: dotnet run -- \"path/to/shifts.json\"");
                return;
            }

            //Extract the JSON filepath from the CLI args
            string jsonFilePath = args[0];
            List<Models.Shift>? shifts;

            if (!File.Exists(jsonFilePath))
            {
                Console.WriteLine($"Error: File not found: {jsonFilePath}");
                return;
            }

            // Try to read and parse the JSON file, if it fails, print the error and return
            try
            {
                var json = File.ReadAllText(jsonFilePath);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                shifts = JsonSerializer.Deserialize<List<Models.Shift>>(json, options);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error reading/parsing shifts file: {ex.Message}");
                return;
            }
            
            // If the shifts are null or empty, print the error and return
            if (shifts == null || shifts.Count == 0)
            {
                Console.WriteLine("Error: No shifts found in the file.");
                return;
            }

            /*
            Sprint 1 assumptions:
            1. CalculatePayroll function has not filtering logic for the shiftID, employeeID, or start/end time so we will need to add it later.
            2. CalculatePayroll function has not logic to handle the unpaid break minutes so we will need to add it later.
            3. Each shift will have only one employee assigned to it so we will need to add a restriction later.
            */

            var uniqueEmployeeIds = shifts.Select(s => s.EmployeeId).Distinct();

            foreach (var employeeId in uniqueEmployeeIds)
            {
                var report = PayrollCalculator.CalculatePayroll(employeeId, shifts);
                Console.WriteLine($"=== payroll report for employee: {report.EmployeeId} ===");
                Console.WriteLine($"Total Hours: {report.TotalHours}");
                Console.WriteLine($"Regular Hours: {report.RegularHours}");
                Console.WriteLine($"Overtime Hours: {report.OvertimeHours}");
                Console.WriteLine("=== end of payroll report ===");
                Console.WriteLine();
            }
        }

        /*
        The CalculatePayroll function has been moved to the PayrollCalculator class within the API project to keep the code clean and readable.
        */
    }
}
