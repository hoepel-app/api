import { tmpdir } from 'os';
import { join } from 'path';
import * as XLSX from 'xlsx';
import {Child, Crew, DayDate, IChild, ICrew, IDetailedChildAttendance, Shift} from '@hoepel.app/types';

export interface LocalFileCreationResult {
  path: string;
  downloadFileName: string;
  localFileName: string;
  description: string;
  format: 'XLSX' | 'PDF' | 'DOCX';
}

export const childListToXlsx = (children: ReadonlyArray<IChild>, tenant: string): LocalFileCreationResult => {
  const rows = children.map((child: IChild) => {
    const birthDate = child.birthDate ? new DayDate(child.birthDate).nativeDate : '';

    return { firstName: child.firstName, lastName: child.lastName, birthDate, remarks: child.remarks };
  });

  const data = [
    [ 'Voornaam', 'Familienaam', 'Geboortedatum', 'Opmerkingen' ],
    ...rows.map(row => [ row.firstName, row.lastName, row.birthDate, row.remarks ]),
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 75 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alle kinderen');

  const realFileName = `${new Date().getTime()} ${tenant} Alle kinderen.xlsx`;
  const path = join(tmpdir(), realFileName);
  XLSX.writeFile(workbook, path, { bookType: 'xlsx', bookSST: false });

  return {
    format: 'XLSX',
    description: 'Alle kinderen',
    downloadFileName: 'Alle kinderen.xlsx',
    path,
    localFileName: realFileName,
  };
};


export const crewListToXlsx = (allCrew: ReadonlyArray<ICrew>, tenant: string): LocalFileCreationResult => {
  const rows = allCrew.map((crew: ICrew) => {
    const birthDate = crew.birthDate ? new DayDate(crew.birthDate).nativeDate : '';

    return { firstName: crew.firstName, lastName: crew.lastName, birthDate, remarks: crew.remarks };
  });

  const data = [
    [ 'Voornaam', 'Familienaam', 'Geboortedatum', 'Opmerkingen' ],
    ...rows.map(row => [ row.firstName, row.lastName, row.birthDate, row.remarks ]),
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 75 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alle animatoren');

  const realFileName = `${new Date().getTime()} ${tenant} Alle animatoren.xlsx`;
  const path = join(tmpdir(), realFileName);
  XLSX.writeFile(workbook, path, { bookType: 'xlsx', bookSST: false });

  return {
    format: 'XLSX',
    description: 'Alle animatoren',
    downloadFileName: 'Alle animatoren.xlsx',
    path,
    localFileName: realFileName,
  };
};

export const childrenWithCommentsListToXlsx = (children: ReadonlyArray<IChild>, tenant: string): LocalFileCreationResult => {
  const rows = children.map((child: IChild) => {
    const birthDate = child.birthDate ? new DayDate(child.birthDate).nativeDate : '';

    return { firstName: child.firstName, lastName: child.lastName, birthDate, remarks: child.remarks };
  });

  const data = [
    [ 'Voornaam', 'Familienaam', 'Geboortedatum', 'Opmerkingen' ],
    ...rows.map(row => [ row.firstName, row.lastName, row.birthDate, row.remarks ]),
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 75 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Alle kinderen met opmerking');

  const realFileName = `${new Date().getTime()} ${tenant} Alle kinderen met opmerking.xlsx`;
  const path = join(tmpdir(), realFileName);
  XLSX.writeFile(workbook, path, { bookType: 'xlsx', bookSST: false });

  return {
    format: 'XLSX',
    description: 'Alle kinderen met opmerking',
    downloadFileName: 'Alle kinderen met opmerking.xlsx',
    path,
    localFileName: realFileName,
  };
};

export const createCrewAttendanceXlsx = (allCrew: ReadonlyArray<Crew>, shifts: ReadonlyArray<Shift>, attendances: ReadonlyArray<{ shiftId: string, attendances: ReadonlyArray<any> }>, year: number, tenant: string): LocalFileCreationResult => {

  const sortedShifts = Shift.sort(shifts);

  const rows = Crew.sorted(allCrew).map(crew => {
    return {
      crew,
      attendances: sortedShifts.map(shift => {
        const attendanceForShift = attendances.find(att => att.shiftId === shift.id);
        if (attendanceForShift && attendanceForShift.attendances[crew.id] && attendanceForShift.attendances[crew.id].didAttend) {
          return 1;
        } else {
          return 0;
        }
      }),
    };
  });

  const data = [
    [ '', 'Dag', ...sortedShifts.map(shift => DayDate.fromDayId(shift.dayId).nativeDate) ],
    [ '', 'Type', ...sortedShifts.map(shift => shift.kind) ],
    [ 'Voornaam', 'Familienaam', ...sortedShifts.map(shift => shift.description) ],
    ...rows.map(row => [ row.crew.firstName, row.crew.lastName, ...row.attendances ]),
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 25 }, ...sortedShifts.map(_ => ({ wch: 22 }))
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Aanwezigheden animatoren ${year}`);

  const realFileName = `${new Date().getTime()} ${tenant} Aanwezigheden animatoren ${year}.xlsx`;
  const path = join(tmpdir(), realFileName);
  XLSX.writeFile(workbook, path, { bookType: 'xlsx', bookSST: false });

  return {
    format: 'XLSX',
    description: `Aanwezigheden animatoren ${year}`,
    downloadFileName: `Aanwezigheden animatoren ${year}.xlsx`,
    path,
    localFileName: realFileName,
  };
};

export const createChildAttendanceXlsx = (allChildren: ReadonlyArray<Child>, shifts: ReadonlyArray<Shift>, attendances: ReadonlyArray<{ shiftId: string, attendances: ReadonlyArray<any> }>, year: number, tenant: string): LocalFileCreationResult => {

  const sortedShifts = Shift.sort(shifts);

  const rows = Child.sorted(allChildren).map(child => {
    return {
      child,
      attendances: sortedShifts.map(shift => {
        const attendanceForShift = attendances.find(att => att.shiftId === shift.id);
        if (attendanceForShift && attendanceForShift.attendances[child.id] && attendanceForShift.attendances[child.id].didAttend) {
          return 1;
        } else {
          return 0;
        }
      }),
    };
  }).filter(row => row.attendances.find(att => att === 1)); // Only children with attendances

  const data = [
    [ '', 'Dag', ...sortedShifts.map(shift => DayDate.fromDayId(shift.dayId).nativeDate) ],
    [ '', 'Type', ...sortedShifts.map(shift => shift.kind) ],
    [ 'Voornaam', 'Familienaam', ...sortedShifts.map(shift => shift.description) ],
    ...rows.map(row => [ row.child.firstName, row.child.lastName, ...row.attendances ]),
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 25 }, ...sortedShifts.map(_ => ({ wch: 22 }))
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Aanwezigheden kinderen ${year}`);

  const realFileName = `${new Date().getTime()} ${tenant} Aanwezigheden kinderen ${year}.xlsx`;
  const path = join(tmpdir(), realFileName);
  XLSX.writeFile(workbook, path, { bookType: 'xlsx', bookSST: false });

  return {
    format: 'XLSX',
    description: `Aanwezigheden kinderen ${year}`,
    downloadFileName: `Aanwezigheden kinderen ${year}.xlsx`,
    path,
    localFileName: realFileName,
  };
};

export const createAllFiscalCertsXlsx = (allChildren: ReadonlyArray<Child>, shifts: ReadonlyArray<Shift>, attendances: ReadonlyArray<{ shiftId: string, attendances: ReadonlyArray<IDetailedChildAttendance> }>, year: number, tenant: string): LocalFileCreationResult => {

  const sortedShifts = Shift.sort(shifts);

  const rows = Child.sorted(allChildren).map(child => {
    return {
      child,
      attendances: sortedShifts.map(shift => {
        const attendanceForShift = attendances.find(att => att.shiftId === shift.id);
        if (attendanceForShift && attendanceForShift.attendances[child.id] && attendanceForShift.attendances[child.id].didAttend) {
          return 1;
        } else {
          return 0;
        }
      }),
    };
  }).filter(row => row.attendances.find(att => att === 1)); // Only children with attendances

  const data = [
    [ '', 'Dag', ...sortedShifts.map(shift => DayDate.fromDayId(shift.dayId).nativeDate) ],
    [ '', 'Type', ...sortedShifts.map(shift => shift.kind) ],
    [ '', 'Prijs', ...sortedShifts.map(shift => shift.price.toString()) ],
    [ 'Voornaam', 'Familienaam', ...sortedShifts.map(shift => shift.description) ],
    ...rows.map(row => [ row.child.firstName, row.child.lastName, ...row.attendances ]),
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 20 }, { wch: 25 }, ...sortedShifts.map(_ => ({ wch: 22 }))
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Fiscale attesten ${year}`);

  const realFileName = `${new Date().getTime()} ${tenant} Fiscale attesten ${year}.xlsx`;
  const path = join(tmpdir(), realFileName);
  XLSX.writeFile(workbook, path, { bookType: 'xlsx', bookSST: false });

  return {
    format: 'XLSX',
    description: `Data fiscale attesten ${year}`,
    downloadFileName: `Data fiscale attesten${year}.xlsx`,
    path,
    localFileName: realFileName,
  };
};

