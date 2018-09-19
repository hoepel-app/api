import * as XLSX from 'xlsx';
import {GenericRepository} from './generic-repository';
import {Child, Crew, Day, DayDate, IChild, ICrew, IDay, Price, Shift} from "types.hoepel.app";
import {ChildAttendanceService} from "./child-attendance-service";
import {flatMap, zip, zipWith} from 'lodash';
import {CrewAttendanceService} from "./crew-attendance-service";

export class ReportService {
  constructor(
    private childRepository: GenericRepository<IChild>,
    private crewRepository: GenericRepository<ICrew>,
    private dayService: GenericRepository<IDay>,
    private childAttendanceService: ChildAttendanceService,
    private crewAttendanceService: CrewAttendanceService,
  ) {
  }

  async childAttendanceReport(dbName: string, year: number) {
    const allDays = await this.dayService.all(dbName);
    const allAttendances = await this.childAttendanceService.findAllRaw({dbName});
    const allChildren = Child.sorted((await this.childRepository.all(dbName)).map(ichild => new Child(ichild)));

    const daysThisYear = Day.sorted(allDays.filter(day => day.date.year === year).map(iday => new Day(iday)));

    const uniqueChildIdsThisYear = new Set(allAttendances.filter(att => DayDate.fromDayId(att.dayId).year === year).map(att => att.childId));

    const childrenWithAttendancesThisYear = allChildren.filter(child => {
      return uniqueChildIdsThisYear.has(child.id);
    });

    const attendancesObj = {}; // Attendances object as array: attendancesObj[dayId][shiftId][childId] === true if child attended shift

    allAttendances.forEach(value => {
      if (!attendancesObj[value.dayId]) {
        attendancesObj[value.dayId] = {};
      }

      if (!attendancesObj[value.dayId][value.shiftId]) {
        attendancesObj[value.dayId][value.shiftId] = {};
      }

      attendancesObj[value.dayId][value.shiftId][value.childId] = true;
    });

    const shiftColumns = flatMap(daysThisYear, (day) => Shift.sort(day.shifts.filter(shift => shift.childrenCanBePresent)).map(shift => {
      return [day.date.toString(), shift.kind, new Price(shift.price).toString(), ...childrenWithAttendancesThisYear.map(child => {
          if (attendancesObj[day.id] && attendancesObj[day.id][shift.id] && attendancesObj[day.id][shift.id][child.id] === true) {
            return 1;
          } else {
            return 0;
          }
        }
      )
      ];
    }));

    // What we want:
    //
    // Name     Day 1           Day 1           Day 2           Day 3
    //          shift 1         shift 2         shift 1         shift 1
    //          Price 1         Price 2         Price 3         Price 4
    // Child 1  1               0               1               1
    // Child 2  0               0               0               1
    // Child 3  0               1               1               0

    const nameColumns = [['Voornaam', 'Familienaam'], ['', ''], ['', ''], ...childrenWithAttendancesThisYear.map(child => {
      return [ child.firstName, child.lastName ];
    })];


    const shiftColumnsTransposed = zip(...shiftColumns); // zip(...[ [], []]) transposes matrix

    const sheetColumns = [ ...zipWith(nameColumns, shiftColumnsTransposed, (a, b) => [...a, ...b])];

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetColumns);

    XLSX.utils.book_append_sheet(wb, ws, `Aanwezigheden in ${year}`);

    return XLSX.write(wb, {type: 'base64', bookType: 'xlsx'});
  }

  async crewAttendanceReport(dbName: string, year: number) {
    const allDays = await this.dayService.all(dbName);
    const allAttendances = await this.crewAttendanceService.findAllRaw({dbName});
    const allCrew = Crew.sorted((await this.crewRepository.all(dbName)).map(icrew => new Crew(icrew)));

    const daysThisYear = Day.sorted(allDays.filter(day => day.date.year === year).map(iday => new Day(iday)));

    const uniqueCrewIdsThisYear = new Set(allAttendances.filter(att => DayDate.fromDayId(att.dayId).year === year).map(att => att.crewId));

    const crewWithAttendancesThisYear = allCrew.filter(crew => {
      return uniqueCrewIdsThisYear.has(crew.id);
    });

    const attendancesObj = {}; // Attendances object as array: attendancesObj[dayId][shiftId][crewId] === true if crew attended shift

    allAttendances.forEach(value => {
      if (!attendancesObj[value.dayId]) {
        attendancesObj[value.dayId] = {};
      }

      if (!attendancesObj[value.dayId][value.shiftId]) {
        attendancesObj[value.dayId][value.shiftId] = {};
      }

      attendancesObj[value.dayId][value.shiftId][value.crewId] = true;
    });

    const shiftColumns = flatMap(daysThisYear, (day) => Shift.sort(day.shifts.filter(shift => shift.crewCanBePresent)).map(shift => {
      return [day.date.toString(), shift.kind, ...crewWithAttendancesThisYear.map(crew => {
          if (attendancesObj[day.id] && attendancesObj[day.id][shift.id] && attendancesObj[day.id][shift.id][crew.id] === true) {
            return 1;
          } else {
            return 0;
          }
        }
      )
      ];
    }));

    // What we want:
    //
    // Name     Day 1           Day 1           Day 2           Day 3
    //          shift 1         shift 2         shift 1         shift 1
    //          Price 1         Price 2         Price 3         Price 4
    // Crew  1  1               0               1               1
    // Crew  2  0               0               0               1
    // Crew  3  0               1               1               0

    const nameColumns = [['Voornaam', 'Familienaam'], ['', ''], ...crewWithAttendancesThisYear.map(crew => {
      return [ crew.firstName, crew.lastName ];
    })];


    const shiftColumnsTransposed = zip(...shiftColumns); // zip(...[ [], []]) transposes matrix

    const sheetColumns = [ ...zipWith(nameColumns, shiftColumnsTransposed, (a, b) => [...a, ...b])];

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetColumns);

    XLSX.utils.book_append_sheet(wb, ws, `Aanwezigheden in ${year}`);

    return XLSX.write(wb, {type: 'base64', bookType: 'xlsx'});
  }

}
