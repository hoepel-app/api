import * as XLSX from 'xlsx';
import {
  Address,
  Child,
  ContactPerson,
  Crew,
  DayDate,
  IChild,
  ICrew,
  IDetailedChildAttendance, Price,
  Shift,
} from '@hoepel.app/types';
import { AddressService } from './address.service';
import * as _ from 'lodash';

export interface LocalFileCreationResult {
  downloadFileName: string;
  file: Buffer, // the actual file
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
  const file = XLSX.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'buffer' });

  return {
    format: 'XLSX',
    description: 'Alle kinderen',
    downloadFileName: 'Alle kinderen.xlsx',
    file,
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
  const file = XLSX.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'buffer' });

  return {
    format: 'XLSX',
    description: 'Alle animatoren',
    downloadFileName: 'Alle animatoren.xlsx',
    file,
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

  const file = XLSX.write(workbook, { bookType: 'xlsx', bookSST: false, type: 'buffer' });

  return {
    format: 'XLSX',
    description: 'Alle kinderen met opmerking',
    downloadFileName: 'Alle kinderen met opmerking.xlsx',
    file,
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
