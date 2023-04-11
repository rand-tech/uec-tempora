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
    if (month < 3) {
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
        const dayAndPeriod = course.course_schedule_day_and_period[0].split(":").map((s) => parseInt(s) + 1).join(".");
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

        const timeZone = "Asia/Tokyo";  
        const getEventDate = (baseDate: Date, dayOffset: number, time: string) => {
            const eventDate = new Date(baseDate);

            eventDate.setDate(baseDate.getDate() + dayOffset);
            eventDate.setHours(parseInt(time.substring(0, 2), 10));
            eventDate.setMinutes(parseInt(time.substring(2, 4), 10));
            eventDate.setSeconds(parseInt(time.substring(4, 6), 10));

            return eventDate.toLocaleString('ja-JP', {
                timeZone,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            }).replace(" ", "T").replace(/[-:/]/g, "").slice(0, 15);
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
DESCRIPTION:Instructor: ${course.lecturer_name}\\nCode: ${course.code}\\n## Course Website:\\n${course.offering_course_website}
DTSTART;TZID=${timeZone}:${startDate}
DTEND;TZID=${timeZone}:${endDate}
RRULE:FREQ=WEEKLY;COUNT=15
END:VEVENT`;
                })
            );

            const icsContent = icsHeader + events.join("\n") + icsFooter;
            return icsContent;
        };
        const icsContent = constExportICS();

        setExportResult(icsContent);

        const blob = new Blob([icsContent], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `UEC-Tempora-timetable-${new Date().toISOString().replace(/[:]/g, "").slice(0, 15)}.ics`);
    };

    const exportBookmark = () => {
        const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;
        const extractUrls = (text: string) => {
            const urlRegex = /https?:\/\/[^\s]+/g;
            return text.match(urlRegex) || [];
        };
        const generateBookmarkPath = (course: Course) => {
            const _path = generateFolderPath(course);
            const yearTerm = _path.split("/")[0]; 
            const path = _path.split("/").slice(1, -1).join("/");
            return { path, yearTerm };
        };

        const createUrls = (course: Course) => {
            const syllabusUrl = `https://kyoumu.office.uec.ac.jp/syllabus/${getJapaneseCalendarYear()}/31/31_${course.course_schedule_timetable_code}.html`;
            const createGoogleSearchUrl = (course: Course) => {
                const query = encodeURIComponent(`("${course.course_title_ja}" OR "${course.course_title_en}") ${course.lecturer_name} site:uec.ac.jp`);
                return {
                    url: `https://www.google.com/search?q=${query}`,
                    title: "Google Search",
                };
            };
            const createTwitterSearchUrl = (course: Course) => {
                const query = encodeURIComponent(
                    `(${course.course_title_ja} OR ${course.course_title_en})`
                );
                return {
                    url: `https://twitter.com/search?q=${query}&pf=on`,
                    title: "Twitter Search",
                };
            };
            return [
                ...extractUrls(course.offering_course_website).map((url) => ({
                    url,
                    title: "Course Website",
                })),
                { url: syllabusUrl, title: "Public Syllabus" },
                createGoogleSearchUrl(course),
                createTwitterSearchUrl(course),
            ];
        };

        // Sort selectedCourses by year and term
        const sortedCourses = selectedCourses.sort((a, b) => {
            const aInfo = a.course_schedule_day_and_period[0].replace(/:/g, "");
            const bInfo = b.course_schedule_day_and_period[0].replace(/:/g, "");
            return parseInt(aInfo, 10) - parseInt(bInfo, 10);
        });

        const bookmarks = sortedCourses.map((course) => {
            const { path, yearTerm } = generateBookmarkPath(course);
            const yearTermFolderStart = `    <DT><H3 ADD_DATE="0" LAST_MODIFIED="0">${yearTerm}</H3>\n    <DL><p>`;
            const folderStart = `        <DT><H3 ADD_DATE="0" LAST_MODIFIED="0">${path}</H3>\n        <DL><p>`;
            const bookmarks = createUrls(course).map(({ url, title }) => `            <DT><A HREF="${url}" ADD_DATE="0" LAST_VISIT="0" LAST_MODIFIED="0">${title}</A>`);
            const folderEnd = "        </DL><p>";
            const yearTermFolderEnd = "    </DL><p>";

            return `${yearTermFolderStart}\n${folderStart}${bookmarks.join("\n")}\n${folderEnd}\n${yearTermFolderEnd}`;
        });
        const footer = `\n</DT></DL><p>`;
        const bookmarkHTMLContent = `${header}${bookmarks.join("\n")}${footer}`;

        setExportResult(bookmarkHTMLContent);
        const blob = new Blob([bookmarkHTMLContent], { type: "text/html;charset=utf-8", });
        saveAs(blob, "UEC-Tempora-bookmarks-" + new Date().toISOString().replace(/[:]/g, "").replace(/T\d{2}/g, "-").slice(0, 15) + ".html");
    };

    return (
        <>
            <ExportButtonsContainer>
                <ExportButton onClick={exportShellScript}>Export as Shell Script</ExportButton>
                <ExportButton onClick={exportBookmark}>Download Bookmark File</ExportButton>
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
