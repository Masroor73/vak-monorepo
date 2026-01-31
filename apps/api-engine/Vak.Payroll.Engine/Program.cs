using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace Vak.Payroll.Engine
{
    // 1. Define the Data Structures (Mirroring our Types.ts Contract)

    public class Shift
{
    public required string Id { get; set; }        // Added 'required'
    public required string EmployeeId { get; set; } // Added 'required'
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public double UnpaidBreakMinutes { get; set; }
    public bool IsHoliday { get; set; }
}

public class PayrollReport
{
    public required string EmployeeId { get; set; } // Added 'required'
    public double TotalHours { get; set; }
    public double RegularHours { get; set; }
    public double OvertimeHours { get; set; }
}
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
            List<Shift>? shifts;

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
                shifts = JsonSerializer.Deserialize<List<Shift>>(json, options);
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

            // Loop through the shifts and calculate the payroll for each shift, and output the result on the console
            for (int i = 0; i < shifts.Count; i++)
            {
                var shift = shifts[i];
                var employeeId = shift.EmployeeId;
                var report = CalculatePayroll(employeeId, shifts);

                //Output on the console
                Console.WriteLine("=== payroll report ===");
                Console.WriteLine($"Employee: {report.EmployeeId}");
                Console.WriteLine($"Total Hours: {report.TotalHours}");
                Console.WriteLine($"Regular Hours: {report.RegularHours}");
                Console.WriteLine($"Overtime Hours: {report.OvertimeHours}");
                Console.WriteLine("=== end of payroll report ===");
                Console.WriteLine();
            }
        }

        static PayrollReport CalculatePayroll(string employeeId, List<Shift> shifts)
        {
            double totalWorked = 0;
            double dailyOvertimeAccumulator = 0;

            //Filter the shifts by the employeeId to only process the shifts for the employee     
            foreach (var shift in shifts.Where(s => s.EmployeeId == employeeId))
            {
                var duration = (shift.EndTime - shift.StartTime).TotalHours;
                var netHours = duration - (shift.UnpaidBreakMinutes / 60.0);

                totalWorked += netHours;

                // Rule 1: Daily Overtime (> 8 hours)
                if (netHours > 8)
                {
                    dailyOvertimeAccumulator += (netHours - 8);
                }
            }

            // Rule 2: Weekly Overtime (> 44 hours)
            double weeklyOvertime = 0;
            if (totalWorked > 44)
            {
                weeklyOvertime = totalWorked - 44;
            }

            // The Alberta Rule: Whichever is GREATER is the overtime payable
            double finalOvertime = Math.Max(dailyOvertimeAccumulator, weeklyOvertime);
            double regularHours = totalWorked - finalOvertime;

            return new PayrollReport
            {
                EmployeeId = employeeId,
                TotalHours = totalWorked,
                RegularHours = regularHours,
                OvertimeHours = finalOvertime
            };
        }
    }
}
