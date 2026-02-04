using System;
using System.Collections.Generic;
using System.Linq;
using Vak.Payroll.Engine.Models;

namespace Vak.Payroll.Engine
{
    // Pure business logic. No file IO, no console, no web concerns.
    // This makes it reusable from:
    // - Console runner
    // - Web API endpoints
    // - Unit tests
    public static class PayrollCalculator
    {
        public static PayrollReport CalculatePayroll(string employeeId, List<Shift> shifts)
        {
            double totalWorked = 0;
            double dailyOvertimeAccumulator = 0;

            // Only compute for the requested employee (safe if shifts contains multiple employees)
            foreach (var shift in shifts.Where(s => s.EmployeeId == employeeId))
            {
                var duration = (shift.EndTime - shift.StartTime).TotalHours;
                var netHours = duration - (shift.UnpaidBreakMinutes / 60.0);

                totalWorked += netHours;

                // Rule 1: Daily overtime is earned for hours beyond 8/day
                if (netHours > 8)
                    dailyOvertimeAccumulator += (netHours - 8);
            }

            // Rule 2: Weekly overtime is earned for hours beyond 44/week
            double weeklyOvertime = totalWorked > 44 ? totalWorked - 44 : 0;

            // Alberta 8/44: payable OT is the greater of dailyOT vs weeklyOT
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
