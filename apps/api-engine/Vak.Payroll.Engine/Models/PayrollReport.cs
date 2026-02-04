using System.Text.Json.Serialization;

namespace Vak.Payroll.Engine.Models
{
    public class PayrollReport
    {
        [JsonPropertyName("employeeId")]
        public required string EmployeeId { get; set; }

        [JsonPropertyName("totalHours")]
        public double TotalHours { get; set; }

        [JsonPropertyName("regularHours")]
        public double RegularHours { get; set; }

        [JsonPropertyName("overtimeHours")]
        public double OvertimeHours { get; set; }
    }
}
