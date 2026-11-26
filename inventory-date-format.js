(function (root) {
  "use strict";

  function formatAnswerDates(value) {
    return String(value ?? "").replace(/\\b(\\d{4})-(\\d{2})-(\\d{2})\\b/g, (match, year, month, day) => {
      const y = Number(year);
      const m = Number(month);
      const d = Number(day);

      if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return match;

      const date = new Date(0);
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCFullYear(y, m - 1, d);

      if (
        date.getUTCFullYear() !== y ||
        date.getUTCMonth() !== m - 1 ||
        date.getUTCDate() !== d
      ) return match;

      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }).format(date);
    });
  }

  root.AZXInventoryDateFormat = Object.freeze({ formatAnswerDates });
})(globalThis);
