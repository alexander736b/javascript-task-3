'use strict';

/**
 * Сделано задание на звездочку
 * Реализовано оба метода и tryLater
 */
const isStar = true;

const MINUTES_IN_HOURS = 60;
const HOURS_IN_DAY = 24;
const DAYS = { 'ПН': 0, 'ВТ': 1, 'СР': 2, 'ЧТ': 3, 'ПТ': 4, 'СБ': 5, 'ВС': 6 };
const DAYS_BEFORE_CLOSING = 3;
const MAX_ROBBERY_TIME = DAYS_BEFORE_CLOSING * HOURS_IN_DAY * MINUTES_IN_HOURS - 1;
const NEXT_TIME = 30;

class Time {
    constructor(day, hours, minutes, timeZone) {
        this.timeZone = timeZone;
        this.time = day * HOURS_IN_DAY * MINUTES_IN_HOURS + hours * MINUTES_IN_HOURS + minutes;
    }

    getDay() {
        const day = Math.floor(this.time / (HOURS_IN_DAY * MINUTES_IN_HOURS));
        const keys = Object.keys(DAYS);

        for (let i = 0; i < keys.length; i++) {
            if (Number(DAYS[keys[i]]) === day) {
                return keys[i];
            }
        }
    }

    getHours() {
        const hours = String(Math.floor(this.time % (HOURS_IN_DAY * MINUTES_IN_HOURS) /
        MINUTES_IN_HOURS));

        return this.getCorrectTime(hours);
    }

    getMinutes() {
        const minutes = String(this.time % MINUTES_IN_HOURS);

        return this.getCorrectTime(minutes);
    }

    getCorrectTime(time) {
        return time.length < 2 ? `0${time}` : time;
    }

    changeTimeZone(timeZone) {
        this.time += (timeZone - this.timeZone) * MINUTES_IN_HOURS;
        this.timeZone = timeZone;
    }
}

function copyTime(time, timeZone) {
    let cloneTime = new Time();
    cloneTime.time = time;
    cloneTime.timeZone = timeZone;

    return cloneTime;
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
function getAppropriateMoment(schedule, duration, workingHours) {
    const freeTime = getFreeTime(schedule, workingHours);
    const robberyTime = getRobberiesTime(freeTime, duration);
    let indexSuitableTime = 0;

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (robberyTime.length !== 0) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например, "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }

            template = template.replace(/%HH/, robberyTime[indexSuitableTime].getHours());
            template = template.replace(/%MM/, robberyTime[indexSuitableTime].getMinutes());
            template = template.replace(/%DD/, robberyTime[indexSuitableTime].getDay());

            return template;
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            if (robberyTime.length - 1 > indexSuitableTime) {
                indexSuitableTime++;

                return true;
            }

            return false;
        }
    };
}

function getRobberiesTime(freeTime, duration) {
    const robberyTime = [];

    freeTime.forEach(element => {
        let fTime = element.to.time - element.from.time;

        while (fTime >= duration) {
            robberyTime.push(copyTime(element.to.time - fTime, element.to.timeZone));
            fTime -= NEXT_TIME;
        }
    });

    return robberyTime;
}

function getFreeTime(schedule, workingHours) {
    const freeTime = [];
    let unsuitableTime = [];
    const keys = Object.keys(DAYS);

    for (let i = 0; i < DAYS_BEFORE_CLOSING; i++) {
        freeTime.push({
            from: convertStringToTime(`${keys[i]} ${workingHours.from}`),
            to: convertStringToTime(`${keys[i]} ${workingHours.to}`)
        });
    }

    for (let key in schedule) {
        if (!schedule.hasOwnProperty(key)) {
            continue;
        }

        unsuitableTime = unsuitableTime.concat(getUnsuitableTime(schedule[key],
            freeTime[0].from.timeZone));
    }

    return differenceIntervals(freeTime, unionIntervals(unsuitableTime));
}

function unionIntervals(unsuitableTime) {
    return unsuitableTime
        .sort((a, b) => {
            if (a.from.time === b.from.time) {
                return a.to.time > b.to.time ? 1 : -1;
            }

            return a.from.time > b.from.time ? 1 : -1;
        })
        .filter(element => element.from.time <= MAX_ROBBERY_TIME)
        .map(element => {
            if (element.to.time > MAX_ROBBERY_TIME) {
                element.to.time = MAX_ROBBERY_TIME;
            }

            return element;
        });
}

function differenceIntervals(freeTime, unsuitableTime) {
    let arrayFreeTime = [];

    freeTime.forEach(element => {
        arrayFreeTime = arrayFreeTime.concat(unsuitableTime.reduce((intervals, value) => {
            return getIntervals(intervals, value);
        }, [element]));
    });

    return arrayFreeTime;
}

function getIntervals(intervals, value) {
    for (let i = 0; i < intervals.length; i++) {
        const fromIncludedInTheInterval = intervals[i].from.time < value.from.time &&
        intervals[i].to.time > value.from.time;
        const toIncludedInTheInterval = intervals[i].from.time < value.to.time &&
        intervals[i].to.time > value.to.time;

        if (fromIncludedInTheInterval && toIncludedInTheInterval) {
            intervals.splice(i, 1, {
                from: intervals[i].from,
                to: value.from
            },
            {
                from: value.to,
                to: intervals[i].to
            });
        } else {
            intervals[i] = cutLimit(fromIncludedInTheInterval, toIncludedInTheInterval,
                intervals[i], value);
        }
    }

    return intervals;
}

function cutLimit(fromIncludedInTheInterval, toIncludedInTheInterval, intervals, value) {
    if (fromIncludedInTheInterval) {
        intervals.to.time = value.from.time;
    } else if (toIncludedInTheInterval) {
        intervals.from.time = value.to.time;
    }

    return intervals;
}

function getUnsuitableTime(intervals, timeZone) {
    return intervals.map(element => {
        const busyFrom = convertStringToTime(element.from);
        const busyTo = convertStringToTime(element.to);

        busyFrom.changeTimeZone(timeZone);
        busyTo.changeTimeZone(timeZone);

        return {
            from: busyFrom,
            to: busyTo
        };
    });
}

function convertStringToTime(stringRepresentationDate) {
    const dayAndTime = stringRepresentationDate.split(' ');
    const timeAndGTM = dayAndTime[1].split('+');
    const hoursAndMinutes = timeAndGTM[0].split(':');

    return new Time(DAYS[dayAndTime[0]], Number(hoursAndMinutes[0]), Number(hoursAndMinutes[1]),
        Number(timeAndGTM[1]));
}

module.exports = {
    getAppropriateMoment,

    isStar
};
