using System.Text.Json.Serialization;

namespace Vak.Payroll.Engine.Models
{
    public class PayrollReport
    {
        [JsonPropertyName("employee_id")]
        public required string EmployeeId { get; set; }

        [JsonPropertyName("total_hours")]
        public double TotalHours { get; set; }

        [JsonPropertyName("regular_hours")]
        public double RegularHours { get; set; }

        [JsonPropertyName("overtime_hours")]
        public double OvertimeHours { get; set; }
    }
}
