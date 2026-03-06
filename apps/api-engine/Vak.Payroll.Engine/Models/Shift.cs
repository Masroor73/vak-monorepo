using System;
using System.Text.Json.Serialization;

namespace Vak.Payroll.Engine.Models
{
    public class Shift
    {
        // Using JsonPropertyName ensures stable JSON even if C# naming changes
        [JsonPropertyName("id")]
        public required string Id { get; set; }

        [JsonPropertyName("employee_id")]
        public required string EmployeeId { get; set; }

        // ISO 8601 recommended, e.g. "2026-02-01T09:00:00"
        [JsonPropertyName("start_time")]
        public DateTime StartTime { get; set; }

        [JsonPropertyName("end_time")]
        public DateTime EndTime { get; set; }

        [JsonPropertyName("actual_start_time")]
        public DateTime? ActualStartTime { get; set; }

        [JsonPropertyName("actual_end_time")]
        public DateTime? ActualEndTime { get; set; }

        [JsonPropertyName("clock_in_lat")]
        public double? ClockInLat { get; set; }

        [JsonPropertyName("clock_in_long")]
        public double? ClockInLong { get; set; }

        // Role at time of shift — matches contract JobRoleEnum: SERVER, BARTENDER, LINE_COOK, etc.
        [JsonPropertyName("role_at_time_of_shift")]
        public string? RoleAtTimeOfShift { get; set; }

        [JsonPropertyName("unpaid_break_minutes")]
        public double UnpaidBreakMinutes { get; set; } = 0;

        [JsonPropertyName("is_holiday")]
        public bool IsHoliday { get; set; } = false;

        // Optional: convenience computed property (not serialized)
        [JsonIgnore]
        public double NetHours =>
            (EndTime - StartTime).TotalHours - (UnpaidBreakMinutes / 60.0);
    }
}
