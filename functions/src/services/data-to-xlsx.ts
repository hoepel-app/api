import * as XLSX from 'xlsx';
import {
  Address,
  Child,
  ContactPerson,
  Crew,
  DayDate, DetailedChildAttendancesOnShift, DetailedChildAttendancesOnShifts,
  IChild,
  ICrew,
  IDetailedChildAttendance,
  Price,
  Shift,
} from '@hoepel.app/types';
import { AddressService } from './address.service';
import * as _ from 'lodash';

/** Supported types for Excel cells */
export type ExcelCellValue = string | number | boolean | DayDate | Price;

/** Represents an Excel worksheet (a "tab" in a spreadsheet) */
export interface ExcelWorksheet {
  name: string;

  columns: ReadonlyArray<{
    values: ReadonlyArray<ExcelCellValue>,
    width?: number,
  }>;
}

// This interface decouples the results so they don't use SheetJS directly
// TODO should be used in all functions in this file (and then they could be refactored into classes)
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
  const filteredCrew = Crew
    .sorted(allCrew)
    .filter(crew => attendances.map(att => !!att.attendances[crew.id]).includes(true));

  const data: ExcelData = {
    worksheets: [
      {
        name: `Aanwezigheden animatoren ${year}`,
        columns: [
          { values: [ '', '', 'Voornaam', ...filteredCrew.map(row => row.firstName) ], width: 20 },
          { values: [ '', '', 'Familienaam', ...filteredCrew.map(row => row.lastName) ], width: 25 },

          ...sortedShifts.map(shift => {

            return {
              values: [
                DayDate.fromDayId(shift.dayId),
                shift.kind,
                shift.description,
                ...filteredCrew.map(crew => {
                  const attendanceForShift = attendances.find(att => att.shiftId === shift.id);
                  if (attendanceForShift && attendanceForShift.attendances[crew.id] && attendanceForShift.attendances[crew.id].didAttend) {
                    return 1;
                  } else {
                    return 0;
                  }
                }),
              ],
              width: 22,
            }
          }),
        ]
      }
    ],
    filename: `Aanwezigheden animatoren ${year}`,
  };

  return createExcelFile(data);
};

export const createChildAttendanceXlsx = (
  allChildren: ReadonlyArray<Child>,
  shifts: ReadonlyArray<Shift>,
  attendances: ReadonlyArray<{ shiftId: string, attendances: { [childId: string]: IDetailedChildAttendance } }>,
  year: number,
  tenant: string): LocalFileCreationResult =>
{

  const sortedShifts = Shift.sort(shifts);
  const filteredChildren = Child
    .sorted(allChildren)
    // Only children with attendances
    .filter(child => attendances.map(att => !!att.attendances[child.id]).includes(true));

  const data: ExcelData = {
    worksheets: [
      {
        name: `Aanwezigheden kinderen ${year}`,
        columns: [
          { values: [ '', '', 'Voornaam', ...filteredChildren.map(row => row.firstName) ], width: 20 },
          { values: [ '', '', 'Familienaam', ...filteredChildren.map(row => row.lastName) ], width: 25 },

          ...sortedShifts.map(shift => {

            return {
              values: [
                DayDate.fromDayId(shift.dayId),
                shift.kind,
                shift.description,
                ...filteredChildren.map(child => {
                  const attendanceForShift = attendances.find(att => att.shiftId === shift.id);
                  if (attendanceForShift && attendanceForShift.attendances[child.id] && attendanceForShift.attendances[child.id].didAttend) {
                    return 1;
                  } else {
                    return 0;
                  }
                }),
              ],
              width: 22,
            }
          }),
        ]
      }
    ],
    filename: `Aanwezigheden kinderen ${year}`,
  };

  return createExcelFile(data);
};

export const createAllFiscalCertsXlsx = (
  allChildren: ReadonlyArray<Child>,
  allContacts: ReadonlyArray<ContactPerson>,
  shifts: ReadonlyArray<Shift>,
  attendances: ReadonlyArray<{ shiftId: string, attendances: { [childId: string]: IDetailedChildAttendance } }>, year: number, tenant: string
): LocalFileCreationResult => {

  const sortedShifts = Shift.sort(shifts);
  const richAttendances = new DetailedChildAttendancesOnShifts(
    attendances.map(att => new DetailedChildAttendancesOnShift(att.shiftId, att.attendances))
  );
  const sortedChildren = Child.sorted(allChildren).filter(child => richAttendances.numberOfAttendances(child.id) > 0);

  const spacer = ['', '', ''];

  const data: ExcelData = {
    filename: `Data fiscale attesten ${year}`,
    worksheets: [{
      name: `Data fiscale attesten ${year}`,
      columns: [
        {
          width: 25,
          values: [...spacer, 'Voornaam', ...sortedChildren.map(child => child.firstName)],
        },
        {
          width: 25,
          values: [...spacer, 'Familienaam', ...sortedChildren.map(child => child.lastName)],
        },
        {
          width: 25,
          values: [...spacer, 'Totaal (incl. korting)', ...sortedChildren.map(child => richAttendances.amountPaidBy(child.id))],
        },
        {
          width: 25,
          values: [...spacer, 'Geboortedatum', ...sortedChildren.map(child => child.birthDate ? new DayDate(child.birthDate) : '')],
        },
        {
          width: 25,
          values: [...spacer, 'Contactpersoon', ...sortedChildren.map(child => {
            const primaryContactPerson = child.primaryContactPerson ?
              allContacts.find(contact => contact.id === child.primaryContactPerson.contactPersonId) || null :
              null;

            return primaryContactPerson ? primaryContactPerson.fullName : '';
          })],
        },
        {
          width: 25, values: [...spacer, 'Straat en nummer', ...sortedChildren.map(child => {
            const address = AddressService.getAddressForChildWithExistingContacts(child, allContacts) || new Address({});
            return (address.street || '') + ' ' + (address.number || '')
          })],
        },
        {
          width: 25, values: [...spacer, 'Postcode', ...sortedChildren.map(child => {
            const address = AddressService.getAddressForChildWithExistingContacts(child, allContacts) || new Address({});
            return address.zipCode || '';
          })],
        },
        {
          width: 25, values: [...spacer, 'Stad', ...sortedChildren.map(child => {
            const address = AddressService.getAddressForChildWithExistingContacts(child, allContacts) || new Address({});
            return address.city || '';
          })],
        },
        {
          width: 25, values: ['Dag', 'Type', 'Prijs']
        },
        ...sortedShifts.map(shift => {
          return {
            width: 22,
            values: [
              DayDate.fromDayId(shift.dayId),
              shift.kind,
              shift.price,
              shift.description,
              ...sortedChildren.map(child => richAttendances.didAttend(child.id, shift.id)),
            ]
          }
        })
      ],
    }],
  };

  return createExcelFile(data);
};

export const createChildrenPerDayXlsx = (
  allChildren: ReadonlyArray<Child>,
  shifts: ReadonlyArray<Shift>,
  allAttendances: ReadonlyArray<{ shiftId: string, attendances: { [childId: string]: IDetailedChildAttendance } }>,
  year: number,
  tenant: string
): LocalFileCreationResult => {

  const detailedAttendances = new DetailedChildAttendancesOnShifts(
    allAttendances.map(detailed => new DetailedChildAttendancesOnShift(detailed.shiftId, detailed.attendances))
  );

  const list = _.toPairs(_.groupBy(shifts, shift => shift.dayId))
    .map(( [dayId, shiftsOnDay] ) => {
      const uniqueAttendancesOnDay = detailedAttendances.uniqueAttendances(shiftsOnDay.map(shift => shift.id));

      return {
        day: DayDate.fromDayId(dayId),
        shifts: shiftsOnDay,
        uniqueAttendancesOnDay,
      }
    })
    .sort((a, b) => a.day.compareTo(b.day));

  const data: ExcelData = {
    worksheets: [
      {
        name: `Aantal unieke kinderen ${year}`,
        columns: [
          { values: [ 'Dag', ...list.map(row => row.day) ], width: 20 },
          { values: [ 'Aantal unieke kinderen', ...list.map(row => row.uniqueAttendancesOnDay) ], width: 25 },
        ]
      }
    ],
    filename: `Aantal unieke kinderen per dag ${year}`,
  };

  return createExcelFile(data);
};
