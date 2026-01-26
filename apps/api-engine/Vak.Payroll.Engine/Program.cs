using System;
using System.Collections.Generic;
using System.Linq;

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

            // 2. Mock Data (Simulating a heavy work week)
            var shifts = new List<Shift>
            {
                // Day 1: 10 Hours (2 Hours OT daily)
                new Shift { Id = "S1", EmployeeId = "EMP001", StartTime = DateTime.Parse("2026-02-01 09:00"), EndTime = DateTime.Parse("2026-02-01 19:00"), UnpaidBreakMinutes = 0 },
                // Day 2: 8 Hours (Normal)
                new Shift { Id = "S2", EmployeeId = "EMP001", StartTime = DateTime.Parse("2026-02-02 09:00"), EndTime = DateTime.Parse("2026-02-02 17:00"), UnpaidBreakMinutes = 0 },
                // Day 3: 12 Hours (4 Hours OT daily)
                new Shift { Id = "S3", EmployeeId = "EMP001", StartTime = DateTime.Parse("2026-02-03 09:00"), EndTime = DateTime.Parse("2026-02-03 21:00"), UnpaidBreakMinutes = 0 },
                // Day 4: 8 Hours
                new Shift { Id = "S4", EmployeeId = "EMP001", StartTime = DateTime.Parse("2026-02-04 09:00"), EndTime = DateTime.Parse("2026-02-04 17:00"), UnpaidBreakMinutes = 0 },
                // Day 5: 8 Hours (Triggers Weekly OT > 44?)
                new Shift { Id = "S5", EmployeeId = "EMP001", StartTime = DateTime.Parse("2026-02-05 09:00"), EndTime = DateTime.Parse("2026-02-05 17:00"), UnpaidBreakMinutes = 0 },
                 // Day 6: 8 Hours
                new Shift { Id = "S6", EmployeeId = "EMP001", StartTime = DateTime.Parse("2026-02-06 09:00"), EndTime = DateTime.Parse("2026-02-06 17:00"), UnpaidBreakMinutes = 0 }
            };

            // 3. Run Calculation
            var report = CalculatePayroll("EMP001", shifts);

            // 4. Output Result
            Console.WriteLine($"Employee: {report.EmployeeId}");
            Console.WriteLine($"Total Hours: {report.TotalHours}");
            Console.WriteLine($"Regular Hours: {report.RegularHours}");
            Console.WriteLine($"Overtime Hours: {report.OvertimeHours} (High Risk)");
        }

        static PayrollReport CalculatePayroll(string employeeId, List<Shift> shifts)
        {
            double totalWorked = 0;
            double dailyOvertimeAccumulator = 0;

            foreach (var shift in shifts)
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
