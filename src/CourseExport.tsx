import React, { useState } from "react";
import styled from "styled-components";
import { Course } from "./Models";
import { ExportButton, ExportButtonsContainer } from "./styledComponents";



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

const CourseExport: React.FC<CourseExportProps> = ({ selectedCourses }) => {
    const [exportResult, setExportResult] = useState("");

    const generateFolderPath = (course: Course) => {
        const year = new Date().getFullYear();

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

        return `${year + term
            }/${quarter}${quarterDelimiter}${dayAndPeriod}-${titleEnStripped}/`;
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

    return (
        <>
            <ExportButtonsContainer>
                <ExportButton onClick={exportShellScript}>Export as Shell Script</ExportButton>
                <ExportButton onClick={() => exportTable("\t")}>Export as TSV</ExportButton>
            </ExportButtonsContainer>
            {exportResult !== "" &&
                <ExportResult>{exportResult}</ExportResult>
            }
        </>
    );
};

export default CourseExport;
