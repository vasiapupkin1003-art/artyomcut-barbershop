/* ============================================================
   ArtyomCut — добавление записи в календарь
   ------------------------------------------------------------
   Работает без сервера: строит ссылку на Google Календарь и файл .ics.
   Используется на сайте (окно успешной записи) и в админке.
   ============================================================ */
(function () {
    'use strict';

    var SITE = 'https://artyomcut-barbershopgijon.es';
    var ADDRESS = 'Calle de San Manuel, 13, 33210 Gijón';
    var TIMEZONE = 'Europe/Madrid';
    var DEFAULT_DURATION = 60;

    var LABELS = {
        ru: { add_google: 'ДОБАВИТЬ В GOOGLE КАЛЕНДАРЬ', download_ics: 'СКАЧАТЬ .ICS' },
        es: { add_google: 'AÑADIR A GOOGLE CALENDAR', download_ics: 'DESCARGAR .ICS' },
        en: { add_google: 'ADD TO GOOGLE CALENDAR', download_ics: 'DOWNLOAD .ICS' },
        uk: { add_google: 'ДОДАТИ В GOOGLE КАЛЕНДАР', download_ics: 'ЗАВАНТАЖИТИ .ICS' }
    };

    function pad(value) { return String(value).padStart(2, '0'); }

    function parseLocal(dateString, timeString) {
        return new Date(dateString + 'T' + (timeString || '00:00') + ':00');
    }

    // 2026-11-30 + 10:00 -> 20261130T100000
    function stamp(dateString, timeString) {
        return String(dateString).replace(/-/g, '') + 'T' + String(timeString).replace(':', '') + '00';
    }

    function endTime(dateString, timeString, minutes) {
        var end = parseLocal(dateString, timeString);
        end.setMinutes(end.getMinutes() + (minutes || DEFAULT_DURATION));
        return {
            date: end.getFullYear() + '-' + pad(end.getMonth() + 1) + '-' + pad(end.getDate()),
            time: pad(end.getHours()) + ':' + pad(end.getMinutes())
        };
    }

    function normalize(input) {
        var end = endTime(input.date, input.time, input.duration);
        return {
            title: input.title || 'ArtyomCut Barbershop',
            date: input.date,
            time: input.time,
            endDate: end.date,
            endTime: end.time,
            details: input.details || '',
            location: input.location || ADDRESS,
            uid: input.uid || ('booking-' + input.date + '-' + String(input.time).replace(':', '') + '@artyomcut-barbershopgijon.es')
        };
    }

    function googleUrl(input) {
        var e = normalize(input);
        var params = [
            'action=TEMPLATE',
            'text=' + encodeURIComponent(e.title),
            'dates=' + stamp(e.date, e.time) + '/' + stamp(e.endDate, e.endTime),
            'ctz=' + encodeURIComponent(TIMEZONE),
            'location=' + encodeURIComponent(e.location),
            'details=' + encodeURIComponent(e.details)
        ];
        return 'https://calendar.google.com/calendar/render?' + params.join('&');
    }

    function icsEscape(text) {
        return String(text || '')
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/,/g, '\\,')
            .replace(/;/g, '\\;');
    }

    function icsStampUtc(date) {
        return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    function ics(input) {
        var e = normalize(input);
        var lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//ArtyomCut Barbershop//Booking//RU',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'UID:' + e.uid,
            'DTSTAMP:' + icsStampUtc(new Date()),
            'DTSTART:' + stamp(e.date, e.time),
            'DTEND:' + stamp(e.endDate, e.endTime),
            'SUMMARY:' + icsEscape(e.title),
            'DESCRIPTION:' + icsEscape(e.details),
            'LOCATION:' + icsEscape(e.location),
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ];
        return lines.join('\r\n') + '\r\n';
    }

    function download(input) {
        var e = normalize(input);
        var blob = new Blob([ics(e)], { type: 'text/calendar;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'artyomcut-' + e.date + '-' + String(e.time).replace(':', '-') + '.ics';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    }

    window.ACCalendar = {
        site: SITE,
        address: ADDRESS,
        timezone: TIMEZONE,
        labels: LABELS,
        googleUrl: googleUrl,
        ics: ics,
        download: download,
        // готовая запись для списка в админке
        forBooking: function (booking) {
            return {
                title: 'ArtyomCut — ' + (booking.service || 'Запись'),
                date: booking.date,
                time: booking.time,
                duration: DEFAULT_DURATION,
                details: (booking.name || '') + (booking.contact ? ' · ' + booking.contact : '') + '\n' + SITE,
                uid: 'booking-' + (booking.id || (booking.date + '-' + booking.time)) + '@artyomcut-barbershopgijon.es'
            };
        }
    };
})();
