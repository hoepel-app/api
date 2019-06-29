import * as XLSX from 'xlsx';
import {
  Address,
  Child,
  ContactPerson,
  Crew,
  DayDate,
  IChild,
  ICrew,
  IDetailedChildAttendance,
  Price,
  Shift,
} from '@hoepel.app/types';
import { AddressService } from './address.service';
import * as _ from 'lodash';

// Supported types for Excel cells
export type ExcelCellValue = string | number | boolean | DayDate | Price;

export interface ExcelWorksheet {
  name: string;

  columns: ReadonlyArray<{
    values: ReadonlyArray<ExcelCellValue>,
    width?: number,
  }>;
}

// This interface decouples the results so they don't use SheetJS directly
// TODO should be used in all functions in this file (and then they should be refactored into classes)
export interface ExcelData {
  filename?: string;
  worksheets: ReadonlyArray<ExcelWorksheet>;
}

export interface LocalFileCreationResult {
  downloadFileName: string;
  file: Buffer, // the actual file
  description: string;
  format: 'XLSX' | 'PDF' | 'DOCX';
}

export const createExcelFile = (data: ExcelData): LocalFileCreationResult => {

  // Turn cell value into a sheetjs-compatible value
  const transformCellValue = (v: ExcelCellValue): XLSX.CellObject => {
    if (typeof  v === 'number') {
      return { v, t: 'n' };
    } else if (typeof v === 'string') {
      return { v, t: 's' };
    } else if (typeof v === 'boolean') {
      return { v: v ? 1 : 0, t: 'n' };
    } else if (v instanceof DayDate) {
      return { v: v.nativeDate, t: 'd' };
    } else if (v instanceof Price) {
      return { v: v.toString(), t: 's'}; // TODO currency formatting
    } else if (v === undefined) {
      return { t: 'z' };
    } else {
      throw new Error(`Could not transform unsupported cell value: ${v} (type: ${typeof v})`);
    }
  };

  const createWorksheet = (ws: ExcelWorksheet): XLSX.WorkSheet => {
    const result: XLSX.WorkSheet = {};

    ws.columns.forEach(( column, columnIdx ) => {
      column.values.forEach((cellValue, rowIdx) => {
        result[XLSX.utils.encode_cell({ c: columnIdx, r: rowIdx })] = transformCellValue(cellValue);
      });
    });

    // Set column widths
    result['!cols'] = ws.columns.map(column => column.width ? ({ wch: column.width }) : {});

    // Set sheet range
    const numColumns = ws.columns.length;
    const numRows = Math.max(...ws.columns.map(column => column.values.length));
    result['!ref'] = XLSX.utils.encode_cell({ c: 0, r: 0 })
      + ':'
      + XLSX.utils.encode_cell({ c: numColumns + 1, r: numRows + 1 });

    console.log(JSON.stringify(result));

    return result;
  };

  const workbook = XLSX.utils.book_new();

  data.worksheets.forEach(worksheet => {
    XLSX.utils.book_append_sheet(workbook, createWorksheet(worksheet), worksheet.name)
  });

  const file = XLSX.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'buffer' });

  return {
    format: 'XLSX',
    description: data.filename,
    downloadFileName: data.filename + '.xlsx',
    file,
  };
};

export const childListToXlsx = (list: ReadonlyArray<IChild>, tenant: string): LocalFileCreationResult => {
  const data: ExcelData = {
    worksheets: [
      {
        name: 'Alle kinderen',
        columns: [
          { values: [ 'Voornaam', ...list.map(row => row.firstName) ], width: 20 },
          { values: [ 'Familienaam', ...list.map(row => row.lastName) ], width: 25 },
          { values: [ 'Geboortedatum', ...list.map(row => row.birthDate ? new DayDate(row.birthDate) : undefined) ], width: 15 },
          { values: [ 'Telefoonnummer', ...list.map(row => {
              return row.phone.map(p => p.phoneNumber + (p.comment ? `(${p.comment})` : '') ).join(', ');
            })], width: 25
          },
          { values: [ 'Emailadres', ...list.map(row => row.email.join(', '))], width: 25 },
          { values: [ 'Adres', ...list.map(row => new Address(row.address).formatted()) ], width: 30 },
          { values: [ 'Gender', ...list.map(row => {
              switch (row.gender) {
                case 'male': return 'Man';
                case 'female': return 'Vrouw';
                case 'other': return 'Anders';
                default: return '';
              }
            }) ] },
          { values: [ 'Uitpasnummer', ...list.map(row => row.uitpasNumber) ], width: 25 },
          { values: [ 'Opmerkingen', ...list.map(row => row.remarks) ], width: 75 },
        ]
      }
    ],
    filename: 'Alle kinderen',
  };

  return createExcelFile(data);
};


export const crewListToXlsx = (list: ReadonlyArray<ICrew>, tenant: string): LocalFileCreationResult => {
  const data: ExcelData = {
    worksheets: [
      {
        name: 'Alle animatoren',
        columns: [
          { values: [ 'Voornaam', ...list.map(row => row.firstName) ], width: 20 },
          { values: [ 'Familienaam', ...list.map(row => row.lastName) ], width: 25 },
          { values: [ 'Geboortedatum', ...list.map(row => row.birthDate ? new DayDate(row.birthDate) : undefined) ], width: 15 },
          { values: [ 'Telefoonnummer', ...list.map(row => {
              return row.phone.map(p => p.phoneNumber + (p.comment ? `(${p.comment})` : '') ).join(', ');
            })], width: 25
          },
          { values: [ 'Emailadres', ...list.map(row => row.email.join(', '))], width: 25 },
          { values: [ 'Adres', ...list.map(row => new Address(row.address).formatted()) ], width: 30 },
          { values: [ 'Actief', ...list.map(row => row.active ? 'Ja' : 'Nee' ) ] },
          { values: [ 'Rekeningnummer', ...list.map(row => row.bankAccount ) ], width: 25 },
          { values: [ 'Gestart in', ...list.map(row => row.yearStarted ) ] },
          { values: [ 'Attesten', ...list.map(row => {
            if (!row.certificates) {
              return '';
            }

            return [
              row.certificates.hasPlayworkerCertificate ? 'Attest animator' : '',
              row.certificates.hasTeamleaderCertificate ? 'Attest hoofdanimator' : '',
              row.certificates.hasTrainerCertificate ? 'Attest instructeur' : '',
            ].filter(x => x).join(', ')
            }) ], width: 35 },
          { values: [ 'Opmerkingen', ...list.map(row => row.remarks) ], width: 75 },
        ]
      }
    ],
    filename: 'Alle animatoren',
  };


  return createExcelFile(data);
};

export const childrenWithCommentsListToXlsx = (list: ReadonlyArray<IChild>, tenant: string): LocalFileCreationResult => {
  const data: ExcelData = {
    worksheets: [
      {
        name: 'Kinderen met opmerking',
        columns: [
          { values: [ 'Voornaam', ...list.map(row => row.firstName) ], width: 20 },
          { values: [ 'Familienaam', ...list.map(row => row.lastName) ], width: 25 },
          { values: [ 'Geboortedatum', ...list.map(row => row.birthDate ? new DayDate(row.birthDate) : undefined) ], width: 15 },
          { values: [ 'Telefoonnummer', ...list.map(row => {
              return row.phone.map(p => p.phoneNumber + (p.comment ? `(${p.comment})` : '') ).join(', ');
            })], width: 25
          },
          { values: [ 'Emailadres', ...list.map(row => row.email.join(', '))], width: 25 },
          { values: [ 'Adres', ...list.map(row => new Address(row.address).formatted()) ], width: 30 },
          { values: [ 'Gender', ...list.map(row => {
              switch (row.gender) {
                case 'male': return 'Man';
                case 'female': return 'Vrouw';
                case 'other': return 'Anders';
                default: return '';
              }
            }) ] },
          { values: [ 'Uitpasnummer', ...list.map(row => row.uitpasNumber) ], width: 25 },
          { values: [ 'Opmerkingen', ...list.map(row => row.remarks) ], width: 75 },
        ]
      }
    ],
    filename: 'Alle kinderen',
  };

  return createExcelFile(data);
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
    { wch: 20 }, { wch: 25 }, ...sortedShifts.map(ignored => ({ wch: 22 }))
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Aanwezigheden animatoren ${year}`);
  const file = XLSX.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'buffer' });

  return {
    format: 'XLSX',
    description: `Aanwezigheden animatoren ${year}`,
    downloadFileName: `Aanwezigheden animatoren ${year}.xlsx`,
    file,
  };
};

export const createChildAttendanceXlsx = (
  allChildren: ReadonlyArray<Child>,
  shifts: ReadonlyArray<Shift>,
  attendances: ReadonlyArray<{ shiftId: string, attendances: { [childId: string]: IDetailedChildAttendance } }>,
  year: number,
  tenant: string): LocalFileCreationResult =>
{

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
    { wch: 20 }, { wch: 25 }, ...sortedShifts.map(ignored => ({ wch: 22 }))
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Aanwezigheden kinderen ${year}`);
  const file = XLSX.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'buffer' });

  return {
    format: 'XLSX',
    description: `Aanwezigheden kinderen ${year}`,
    downloadFileName: `Aanwezigheden kinderen ${year}.xlsx`,
    file,
  };
};

export const createAllFiscalCertsXlsx = (
  allChildren: ReadonlyArray<Child>,
  allContacts: ReadonlyArray<ContactPerson>,
  shifts: ReadonlyArray<Shift>,
  attendances: ReadonlyArray<{ shiftId: string, attendances: { [childId: string]: IDetailedChildAttendance } }>, year: number, tenant: string
): LocalFileCreationResult => {

  const sortedShifts = Shift.sort(shifts);

  const rows = Child.sorted(allChildren).map(child => {
    const address = AddressService.getAddressForChildWithExistingContacts(child, allContacts);

    const primaryContactPerson = child.primaryContactPerson ?
      allContacts.find(contact => contact.id === child.primaryContactPerson.contactPersonId) || null :
      null;

    return {
      child,
      primaryContactPerson,
      address: address ? address : new Address({ }),
      attendances: sortedShifts.map(shift => {
        const attendanceForShift = attendances.find(att => att.shiftId === shift.id);
        if (attendanceForShift && attendanceForShift.attendances[child.id] && attendanceForShift.attendances[child.id].didAttend) {
          return 1;
        } else {
          return 0;
        }
      }),
      totalPaid: Price.total(...sortedShifts.map(shift => {
        const attendanceForShift = attendances.find(att => att.shiftId === shift.id);
        if (attendanceForShift && attendanceForShift.attendances[child.id] && attendanceForShift.attendances[child.id].didAttend) {
          return new Price(attendanceForShift.attendances[child.id].amountPaid);
        } else {
          return Price.zero;
        }
      })),
    };
  }).filter(row => row.attendances.find(att => att === 1)); // Only children with attendances

  const data = [
    [ ...Array(8).fill(''), 'Dag', ...sortedShifts.map(shift => DayDate.fromDayId(shift.dayId).nativeDate) ],
    [ ...Array(8).fill(''), 'Type', ...sortedShifts.map(shift => shift.kind) ],
    [ ...Array(8).fill(''), 'Prijs', ...sortedShifts.map(shift => shift.price.toString()) ],
    [ 'Voornaam', 'Familienaam', 'Totaal (incl. korting)', 'Geboortedatum', 'Contactpersoon', 'Straat en nummer', 'Postcode', 'Stad', '', ...sortedShifts.map(shift => shift.description) ],
    ...rows.map(row => {
      const birthDate = row.child.birthDate ? new DayDate(row.child.birthDate).nativeDate : '';
      return [
        row.child.firstName,
        row.child.lastName,
        row.totalPaid.toString(),
        birthDate,
        row.primaryContactPerson ? row.primaryContactPerson.fullName : '',
        (row.address.street || '') + ' ' + (row.address.number || ''),
        row.address.zipCode || '',
        row.address.city || '',
        '',
        ...row.attendances
      ];
    }),
  ];

  const workbook = XLSX.utils.book_new();

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
  worksheet['!cols'] = [
    ... Array(9).fill({ wch: 25 }),
    ...sortedShifts.map(ignored => ({ wch: 22 }))
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Fiscale attesten ${year}`);
  const file = XLSX.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'buffer' });

  return {
    format: 'XLSX',
    description: `Data fiscale attesten ${year}`,
    downloadFileName: `Data fiscale attesten ${year}.xlsx`,
    file,
  };
};

export const createChildrenPerDayXlsx = (
  allChildren: ReadonlyArray<Child>,
  shifts: ReadonlyArray<Shift>,
  attendances: ReadonlyArray<{ shiftId: string, attendances: { [childId: string]: IDetailedChildAttendance } }>,
  year: number,
  tenant: string
): LocalFileCreationResult => {

  // TODO This function should filter out attendances where didAttend === false

  const data = _.toPairs(_.groupBy(shifts, shift => shift.dayId))
    .map(( [dayId, shiftsOnDay] ) => {
      const attendancesForShiftsOnDay = attendances.filter(att => {
        return shiftsOnDay.map(shift => shift.id).includes(att.shiftId);
      });

      const childAttendancesOnDay = attendancesForShiftsOnDay
        .reduce((a, b) => {
          return a.concat(_.toPairs(b.attendances).map(pair => ( { ...pair[1], childId: pair[0] })));
        }, [] as ReadonlyArray<IDetailedChildAttendance & { childId: string }>)
        .map(att => att.childId);

      const uniqueAttendancesOnDay = [ ...new Set(childAttendancesOnDay) ].length;

      return {
        day: DayDate.fromDayId(dayId),
        shifts: shiftsOnDay,
        attendances: attendancesForShiftsOnDay,
        uniqueAttendancesOnDay,
      }
    })
    .sort((a, b) => a.day.compareTo(b.day))
    .map(obj => {
      return [ obj.day.nativeDate, obj.uniqueAttendancesOnDay ];
    });

  const workbook = XLSX.utils.book_new();

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([ ['Dag', 'Aantal unieke kinderen'], ...data ]);

  worksheet['!cols'] = [ { wch: 20 }, { wch: 25 } ];

  XLSX.utils.book_append_sheet(workbook, worksheet, `Aantal kinderen per dag ${year}`);
  const file = XLSX.write(workbook, {bookType: 'xlsx', bookSST: false, type: 'buffer'});

  return {
    format: 'XLSX',
    description: `Aantal kinderen per dag ${year}`,
    downloadFileName: `Aantal unieke kinderen per dag ${year}.xlsx`,
    file,
  };
};
