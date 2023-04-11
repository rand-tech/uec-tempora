import React, { useState } from "react";
import styled from "styled-components";
import { Course } from "./Models";
import { ExportButton, ExportButtonsContainer } from "./styledComponents";
import { saveAs } from "file-saver";



const ExportResult = styled.pre`
  background-color: #f5f5f5;
  padding: 10px;
  font-size: 14px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

interface CourseExportProps {
    selectedCourses: Course[];
}

function greekToAscii(str: string) {
    const greekSmallNumerals = "ⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹⅺⅻ";
    const asciiNumerals = "0123456789";

    let result = "";
    let previousCharIsGreek = false;

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const smallIndex = greekSmallNumerals.indexOf(char);
        let asciiChar = "";

        if (smallIndex !== -1) {
            asciiChar = asciiNumerals[smallIndex + 1];
        }

        if (asciiChar !== "") {
            if (
                !previousCharIsGreek &&
                i > 0 &&
                !["-", "_", "."].includes(str[i - 1])
            ) {
                result += "-";
            }
            result += asciiChar;
            previousCharIsGreek = true;
        } else {
            result += char;
            previousCharIsGreek = false;
        }
    }

    return result;
}
const getJapaneseCalendarYear = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month <= 3) {
        return year - 1;
    }
    return year;
};

const CourseExport: React.FC<CourseExportProps> = ({ selectedCourses }) => {
    const [exportResult, setExportResult] = useState("");

    const generateFolderPath = (course: Course) => {
        const year = getJapaneseCalendarYear();

        const term =
            course.course_schedule_term.startsWith("後") ||
                course.course_schedule_term.startsWith("秋") ||
                course.course_schedule_term.startsWith("冬")
                ? 1
                : 0;
        const quarterMap: { [key: string]: string } = {
            春: "Q1",
            夏: "Q2",
            秋: "Q3",
            冬: "Q4",
        };

        const quarter = quarterMap[course.course_schedule_term[0]] || "";
        const quarterDelimiter = quarter !== "" ? "-" : "";
        const dayAndPeriod = course.course_schedule_day_and_period[0].replace(/:/g, ".");
        const titleEnStripped = greekToAscii(
            course.course_title_en.toLowerCase().replace(/[_\s,."'}{\/\\・¥-]+/g, "-")
        );

        return `${year}-${term}/${quarter}${quarterDelimiter}${dayAndPeriod}-${titleEnStripped}/`;
    };

    const exportShellScript = () => {
        const directoryName = "UEC";
        const commands =
            `mkdir -p ${directoryName}/{` +
            selectedCourses
                .map((course) => `"${generateFolderPath(course)}"`)
                .sort()
                .join(",") +
            `}\n`;
        setExportResult(commands);

        navigator.clipboard
            .writeText(commands)
            .then(() => { })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
            });
    };

    const exportTable = (delimiter: string) => {
        const headers = [
            "course_schedule_day_and_period",
            "course_schedule_timetable_code",
            "course_title_ja",
            "course_title_en",
            "code",
            "lecturer_name",
        ];

        const tableContent =
            headers.join(delimiter) +
            "\n" +
            selectedCourses
                .map((course) =>
                    [
                        course.course_schedule_day_and_period,
                        course.course_schedule_timetable_code,
                        course.course_title_ja,
                        course.course_title_en,
                        course.code,
                        course.lecturer_name,
                    ].join(delimiter)
                )
                .join("\n");
        setExportResult(tableContent);
        navigator.clipboard
            .writeText(tableContent)
            .then(() => { })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
            });
    };
    const exportICS = () => {
        const timeTablePeriod: { [key: string]: { start: string; end: string } } = {
            "0": { start: "090000", end: "103000" },
            "1": { start: "104000", end: "121000" },
            "2": { start: "130000", end: "143000" },
            "3": { start: "144000", end: "161000" },
            "4": { start: "161500", end: "174500" },
        };

        const getEventDate = (baseDate: Date, dayOffset: number, time: string) => {
            const eventDate = new Date(baseDate);

            eventDate.setDate(baseDate.getDate() + dayOffset);
            eventDate.setHours(parseInt(time.substring(0, 2), 10));
            eventDate.setMinutes(parseInt(time.substring(2, 4), 10));
            eventDate.setSeconds(parseInt(time.substring(4, 6), 10));
            return eventDate.toISOString().replace(/[-:]/g, "").slice(0, 15);
        };
        const constExportICS = () => {
            const icsHeader = "BEGIN:VCALENDAR\nCALSCALE:GREGORIAN\nVERSION:2.0\n";
            const icsFooter = "END:VCALENDAR\n";
            const baseDate = new Date("2023-04-10T00:00:00+09:00");

            const events = selectedCourses.flatMap((course) =>
                course.course_schedule_day_and_period.map((dayAndPeriod) => {
                    const [day, period] = dayAndPeriod.split(":");
                    const startDate = getEventDate(baseDate, parseInt(day, 10), timeTablePeriod[period].start);
                    const endDate = getEventDate(baseDate, parseInt(day, 10), timeTablePeriod[period].end);

                    return `BEGIN:VEVENT
SUMMARY:${course.course_title_ja} (${course.course_title_en})
DESCRIPTION:Instructor: ${course.lecturer_name}\\nCode: ${course.code}\\nTimetable Code: ${course.course_schedule_timetable_code}
DTSTART:${startDate}
DTEND:${endDate}
RRULE:FREQ=WEEKLY;COUNT=15
END:VEVENT`;
                })
            );

            const icsContent = icsHeader + events.join("\n") + icsFooter;
            return icsContent;
        }
        const icsContent = constExportICS();

        setExportResult(icsContent);

        const blob = new Blob([icsContent], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `UEC-Tempora-timetable-${new Date().toISOString().replace(/[:]/g, "").slice(0, 15)}.ics`);
    };

    return (
        <>
            <ExportButtonsContainer>
                <ExportButton onClick={exportShellScript}>Export as Shell Script</ExportButton>
                <ExportButton onClick={exportICS}>Download Calendar File</ExportButton>
                <ExportButton onClick={() => exportTable("\t")}>Export as TSV</ExportButton>
            </ExportButtonsContainer>
            {exportResult !== "" &&
                <ExportResult>{exportResult}</ExportResult>
            }
        </>
    );
};

export default CourseExport;
