using System;
using System.Text.Json.Serialization;

namespace Vak.Payroll.Engine.Models
{
    public class Shift
    {
        // Using JsonPropertyName ensures stable JSON even if C# naming changes
        [JsonPropertyName("id")]
        public required string Id { get; set; }

        [JsonPropertyName("employeeId")]
        public required string EmployeeId { get; set; }

        // ISO 8601 recommended, e.g. "2026-02-01T09:00:00"
        [JsonPropertyName("startTime")]
        public DateTime StartTime { get; set; }

        [JsonPropertyName("endTime")]
        public DateTime EndTime { get; set; }

        [JsonPropertyName("unpaidBreakMinutes")]
        public double UnpaidBreakMinutes { get; set; } = 0;

        [JsonPropertyName("isHoliday")]
        public bool IsHoliday { get; set; } = false;

        // Optional: convenience computed property (not serialized)
        [JsonIgnore]
        public double NetHours =>
            (EndTime - StartTime).TotalHours - (UnpaidBreakMinutes / 60.0);
    }
}
