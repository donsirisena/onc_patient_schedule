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

const futureButton =
    document.getElementById("futureButton");

const completedButton =
    document.getElementById("completedButton");


let currentView = "future";

futureButton.addEventListener(
    "click",
    function () {

        currentView = "future";

        updateViewButtons();

        loadSchedule();

    }
);


completedButton.addEventListener(
    "click",
    function () {

        currentView = "completed";

        updateViewButtons();

        loadSchedule();

    }
);

function updateViewButtons() {

    if (currentView === "future") {

        futureButton.classList.add("active");

        completedButton.classList.remove("active");

    }
    else {

        completedButton.classList.add("active");

        futureButton.classList.remove("active");

    }

}



document.addEventListener(
    "DOMContentLoaded",
    function () {
        loadSchedule();
    }
);


refreshButton.addEventListener(
    "click",
    function () {
        loadSchedule();
    }
);


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

                if (request.readyState === 4) {

                    refreshButton.disabled = false;


                    if (request.status === 200) {

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


    const viewMode =
        currentView === "future"
        ? 1
        : 2;


        request.send(
        "^MINE^," +
        viewMode
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


const viewText =
    currentView === "future"
        ? "future"
        : "completed";


showSuccessStatus(
    appointments.length +
    " " +
    viewText +
    " appointment" +
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


function renderSchedule(
    appointments
) {

    scheduleContainer.innerHTML = "";


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


    const tableCard =
        document.createElement(
            "div"
        );

    tableCard.className =
        "table-card";


    const tableScroll =
        document.createElement(
            "div"
        );

    tableScroll.className =
        "table-scroll";


    const table =
        document.createElement(
            "table"
        );


    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Appointment Type</th>
                <th>Duration</th>
                <th>Resource</th>
                <th>Cycle</th>
                <th>DOT</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;


    const tableBody =
        table.querySelector(
            "tbody"
        );


    sortedAppointments.forEach(
        function (appointment) {

            const row =
                createAppointmentRow(
                    appointment
                );


            tableBody.appendChild(
                row
            );

        }
    );


    tableScroll.appendChild(
        table
    );

    tableCard.appendChild(
        tableScroll
    );

    scheduleContainer.appendChild(
        tableCard
    );

}


function createAppointmentRow(
    appointment
) {

    const row =
        document.createElement(
            "tr"
        );


    const dateTime =
        parseCernerDate(
            appointment
                .appointmentDateTime
        );


    const scheduleState =
        appointment.scheduleState || "";


    const badgeClass =
        scheduleState
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );


    row.innerHTML = `
        <td class="appointment-date">
            ${formatCalendarDate(dateTime)}
        </td>

        <td class="appointment-time">
            ${formatAppointmentTime(dateTime)}
        </td>

        <td class="appointment-type">
            ${escapeHtml(
                appointment.appointmentType || ""
            )}
        </td>

        <td>
            ${
                appointment.duration
                    ? appointment.duration + " min"
                    : ""
            }
        </td>

        <td>
            ${escapeHtml(
                appointment.resource || ""
            )}
        </td>

        <td class="cycle-cell">
            ${escapeHtml(
                appointment.cycleName ||
                appointment.regimen ||
                ""
            )}
        </td>

        <td class="dot-cell">
            ${escapeHtml(
                appointment.dayOfTreatment || ""
            )}
        </td>

        <td>
            <span class="status-badge ${badgeClass}">
                ${escapeHtml(scheduleState)}
            </span>
        </td>
    `;


    return row;

}


function parseCernerDate(
    dateString
) {

    if (!dateString) {

        return new Date();

    }


    const parts =
        dateString
            .trim()
            .split(" ");


    const datePart =
        parts[0];


    const timePart =
        parts[1] || "00:00";


    const datePieces =
        datePart.split("-");


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
        timePart.split(":");


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
        months[monthText],
        day,
        hour,
        minute
    );

}


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


function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;

}


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


function showEmptySchedule() {

    scheduleContainer.innerHTML = "";

    emptyMessage.style.display =
        "block";


    if (currentView === "future") {

        emptyMessage.textContent =
            "No future oncology appointments were found.";

        showSuccessStatus(
            "No future oncology appointments found."
        );

    }
    else {

        emptyMessage.textContent =
            "No completed oncology appointments were found.";

        showSuccessStatus(
            "No completed oncology appointments found."
        );

    }

}
