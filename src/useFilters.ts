import { useState, useEffect } from 'react';

interface FilterSettings {
    courseTermFilter: string | undefined;
    courseOpeningTermFilter: string | undefined;
    courseAcademicYearFilter: string | undefined;
    courseYearOfferedFilter: string | undefined;
}

const loadFilterSettings = (): FilterSettings => {
    const filterSettings = localStorage.getItem('filterSettings');
    return filterSettings ? JSON.parse(filterSettings) : {};
};

const saveFilterSettings = (settings: FilterSettings) => {
    localStorage.setItem('filterSettings', JSON.stringify(settings));
};

export const useFilters = (): [FilterSettings, (e: React.ChangeEvent<HTMLSelectElement>, filterName: string) => void] => {
    const [filterSettings, setFilterSettings] = useState<FilterSettings>(loadFilterSettings());

    useEffect(() => {
        saveFilterSettings(filterSettings);
    }, [filterSettings]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>, filterName: string) => {
        setFilterSettings({
            ...filterSettings,
            [filterName]: e.target.value || undefined,
        });
    };

    return [filterSettings, handleFilterChange];
};
