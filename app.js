const CCL_PROGRAM =
    "mrd_onc_ptsched_mpage_ccl:group1";


const scheduleContainer =
    document.getElementById("scheduleContainer");

const statusMessage =
    document.getElementById("statusMessage");

const emptyMessage =
    document.getElementById("emptyMessage");

const refreshButton =
    document.getElementById("refreshButton");



/* =========================================================
   INITIAL LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadSchedule();
    }
);



/* =========================================================
   REFRESH BUTTON
   ========================================================= */

refreshButton.addEventListener(
    "click",
    function () {
        loadSchedule();
    }
);



/* =========================================================
   LOAD SCHEDULE FROM CCL
   ========================================================= */

function loadSchedule() {

    showLoadingStatus(
        "Loading upcoming oncology appointments..."
    );

    refreshButton.disabled = true;

    scheduleContainer.innerHTML = "";

    emptyMessage.style.display = "none";


    try {

        const request =
            new XMLCclRequest();


        request.onreadystatechange =
            function () {

                if (
                    request.readyState === 4
                ) {

                    refreshButton.disabled = false;


                    if (
                        request.status === 200
                    ) {

                        processScheduleResponse(
                            request.responseText
                        );

                    }
                    else {

                        showErrorStatus(
                            "Unable to retrieve the oncology schedule."
                        );

                    }

                }

            };


        request.open(
            "GET",
            CCL_PROGRAM,
            true
        );


        request.send(
            "^MINE^"
        );

    }
    catch (error) {

        refreshButton.disabled = false;

        console.error(
            "Schedule request error:",
            error
        );

        showErrorStatus(
            "Unable to load the oncology schedule."
        );

    }

}



/* =========================================================
   PROCESS CCL RESPONSE
   ========================================================= */

function processScheduleResponse(
    responseText
) {

    try {

        const response =
            JSON.parse(responseText);


        if (
            !response ||
            !response.reply
        ) {

            throw new Error(
                "Invalid CCL response."
            );

        }


        const appointments =
            response.reply.appointments || [];


        if (
            appointments.length === 0
        ) {

            showEmptySchedule();

            return;

        }


        renderSchedule(
            appointments
        );


        showSuccessStatus(
            appointments.length +
            " upcoming appointment" +
            (
                appointments.length === 1
                    ? ""
                    : "s"
            ) +
            " found."
        );

    }
    catch (error) {

        console.error(
            "Unable to process CCL response:",
            error
        );

        console.log(
            "Raw response:",
            responseText
        );


        showErrorStatus(
            "Unable to process oncology schedule data."
        );

    }

}



/* =========================================================
   RENDER SCHEDULE
   ========================================================= */

function renderSchedule(
    appointments
) {

    scheduleContainer.innerHTML = "";


    /*
        Sort appointments chronologically.
    */

    const sortedAppointments =
        [...appointments].sort(
            function (
                appointmentA,
                appointmentB
            ) {

                return (
                    parseCernerDate(
                        appointmentA
                            .appointmentDateTime
                    )
                    -
                    parseCernerDate(
                        appointmentB
                            .appointmentDateTime
                    )
                );

            }
        );


    /*
        Group by cycle.
    */

    const cycleGroups =
        groupAppointmentsByCycle(
            sortedAppointments
        );


    Object.keys(
        cycleGroups
    ).forEach(
        function (cycleName) {

            const cycleCard =
                createCycleCard(
                    cycleName,
                    cycleGroups[
                        cycleName
                    ]
                );


            scheduleContainer.appendChild(
                cycleCard
            );

        }
    );

}



/* =========================================================
   GROUP APPOINTMENTS BY CYCLE
   ========================================================= */

function groupAppointmentsByCycle(
    appointments
) {

    const groups = {};


    appointments.forEach(
        function (appointment) {

            const cycleName =
                appointment.cycleName
                ||
                appointment.regimen
                ||
                "Other Appointments";


            if (
                !groups[
                    cycleName
                ]
            ) {

                groups[
                    cycleName
                ] = [];

            }


            groups[
                cycleName
            ].push(
                appointment
            );

        }
    );


    return groups;

}



/* =========================================================
   CREATE CYCLE CARD
   ========================================================= */

function createCycleCard(
    cycleName,
    appointments
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "cycle-card";


    /*
        Cycle header
    */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "cycle-header";


    const label =
        document.createElement(
            "div"
        );


    label.className =
        "cycle-label";

    label.textContent =
        "Treatment Cycle";


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "cycle-name";

    name.textContent =
        cycleName;


    header.appendChild(
        label
    );

    header.appendChild(
        name
    );


    card.appendChild(
        header
    );


    /*
        Group this cycle by
        Day of Treatment.
    */

    const dayGroups =
        groupAppointmentsByDay(
            appointments
        );


    Object.keys(
        dayGroups
    ).forEach(
        function (dayName) {

            const daySection =
                createDaySection(
                    dayName,
                    dayGroups[
                        dayName
                    ]
                );


            card.appendChild(
                daySection
            );

        }
    );


    return card;

}



/* =========================================================
   GROUP BY DAY OF TREATMENT
   ========================================================= */

function groupAppointmentsByDay(
    appointments
) {

    const groups = {};


    appointments.forEach(
        function (appointment) {

            const day =
                appointment
                    .dayOfTreatment
                ||
                "Other";


            if (
                !groups[
                    day
                ]
            ) {

                groups[
                    day
                ] = [];

            }


            groups[
                day
            ].push(
                appointment
            );

        }
    );


    return groups;

}



/* =========================================================
   CREATE DAY SECTION
   ========================================================= */

function createDaySection(
    dayName,
    appointments
) {

    const section =
        document.createElement(
            "div"
        );


    section.className =
        "day-section";


    if (
        dayName
            .toLowerCase()
            .includes(
                "day 0"
            )
    ) {

        section.classList.add(
            "pretreatment"
        );

    }


    /*
        Day header
    */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "day-header";


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "day-name";

    name.textContent =
        dayName;


    const date =
        document.createElement(
            "div"
        );


    date.className =
        "day-date";

    date.textContent =
        getDayDateText(
            appointments
        );


    header.appendChild(
        name
    );

    header.appendChild(
        date
    );


    section.appendChild(
        header
    );


    /*
        Appointment rows
    */

    appointments.forEach(
        function (appointment) {

            const row =
                createAppointmentRow(
                    appointment
                );


            section.appendChild(
                row
            );

        }
    );


    return section;

}



/* =========================================================
   CREATE APPOINTMENT ROW
   ========================================================= */

function createAppointmentRow(
    appointment
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "appointment-row";


    /*
        Time / Date
    */

    const dateTime =
        parseCernerDate(
            appointment
                .appointmentDateTime
        );


    const time =
        document.createElement(
            "div"
        );


    time.className =
        "appointment-time";


    time.textContent =
        formatAppointmentTime(
            dateTime
        );


    /*
        Appointment type
    */

    const type =
        document.createElement(
            "div"
        );


    type.className =
        "appointment-type";

    type.textContent =
        appointment
            .appointmentType
        ||
        "";


    /*
        Resource
    */

    const resource =
        document.createElement(
            "div"
        );


    resource.className =
        "appointment-resource";

    resource.textContent =
        appointment.resource
        ||
        "";


    /*
        Duration
    */

    const duration =
        document.createElement(
            "div"
        );


    duration.className =
        "appointment-duration";


    if (
        appointment.duration
    ) {

        duration.textContent =
            appointment.duration +
            " min";

    }
    else {

        duration.textContent =
            "";

    }


    /*
        Schedule state badge
    */

    const statusContainer =
        document.createElement(
            "div"
        );


    const badge =
        document.createElement(
            "span"
        );


    badge.className =
        "status-badge";


    const scheduleState =
        appointment.scheduleState
        ||
        "";


    badge.textContent =
        scheduleState;


    const stateClass =
        scheduleState
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );


    if (
        stateClass
    ) {

        badge.classList.add(
            stateClass
        );

    }


    statusContainer.appendChild(
        badge
    );


    row.appendChild(
        time
    );

    row.appendChild(
        type
    );

    row.appendChild(
        resource
    );

    row.appendChild(
        duration
    );

    row.appendChild(
        statusContainer
    );


    return row;

}



/* =========================================================
   DAY DATE LABEL
   ========================================================= */

function getDayDateText(
    appointments
) {

    if (
        appointments.length === 0
    ) {

        return "";

    }


    const dates =
        appointments.map(
            function (appointment) {

                return parseCernerDate(
                    appointment
                        .appointmentDateTime
                );

            }
        );


    dates.sort(
        function (
            dateA,
            dateB
        ) {

            return (
                dateA -
                dateB
            );

        }
    );


    const firstDate =
        dates[0];


    const lastDate =
        dates[
            dates.length - 1
        ];


    if (
        isSameCalendarDay(
            firstDate,
            lastDate
        )
    ) {

        return formatCalendarDate(
            firstDate
        );

    }


    return (
        formatCalendarDate(
            firstDate
        )
        +
        " – "
        +
        formatCalendarDate(
            lastDate
        )
    );

}



/* =========================================================
   PARSE CCL DATE

   Example:
   2026-SEP-13 08:55
   ========================================================= */

function parseCernerDate(
    dateString
) {

    if (
        !dateString
    ) {

        return new Date();

    }


    const parts =
        dateString
            .trim()
            .split(
                " "
            );


    const datePart =
        parts[0];

    const timePart =
        parts[1]
        ||
        "00:00";


    const datePieces =
        datePart.split(
            "-"
        );


    const year =
        Number(
            datePieces[0]
        );


    const monthText =
        datePieces[1]
            .toUpperCase();


    const day =
        Number(
            datePieces[2]
        );


    const months = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MAY: 4,
        JUN: 5,
        JUL: 6,
        AUG: 7,
        SEP: 8,
        OCT: 9,
        NOV: 10,
        DEC: 11
    };


    const timePieces =
        timePart.split(
            ":"
        );


    const hour =
        Number(
            timePieces[0]
        );


    const minute =
        Number(
            timePieces[1]
        );


    return new Date(
        year,
        months[
            monthText
        ],
        day,
        hour,
        minute
    );

}



/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatCalendarDate(
    date
) {

    return date.toLocaleDateString(
        "en-CA",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}



/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatAppointmentTime(
    date
) {

    return date.toLocaleTimeString(
        "en-CA",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}



/* =========================================================
   COMPARE DAYS
   ========================================================= */

function isSameCalendarDay(
    dateA,
    dateB
) {

    return (
        dateA.getFullYear()
        ===
        dateB.getFullYear()

        &&

        dateA.getMonth()
        ===
        dateB.getMonth()

        &&

        dateA.getDate()
        ===
        dateB.getDate()
    );

}



/* =========================================================
   STATUS HELPERS
   ========================================================= */

function showLoadingStatus(
    message
) {

    statusMessage.className =
        "status loading";

    statusMessage.textContent =
        message;

}



function showSuccessStatus(
    message
) {

    statusMessage.className =
        "status";

    statusMessage.textContent =
        message;

}



function showErrorStatus(
    message
) {

    statusMessage.className =
        "status error";

    statusMessage.textContent =
        message;

}



/* =========================================================
   EMPTY SCHEDULE
   ========================================================= */

function showEmptySchedule() {

    scheduleContainer.innerHTML =
        "";

    emptyMessage.style.display =
        "block";


    showSuccessStatus(
        "No upcoming oncology appointments found."
    );

}