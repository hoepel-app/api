import {GenericRepository} from "./generic-repository";
import {Child, ContactPerson, Day, DayDate, IChild, IContactPerson, IDay, Price} from "types.hoepel.app";
import {ChildAttendanceService} from "./child-attendance-service";
import * as XLSX from "xlsx";
import {flatMap} from "lodash";

interface CertificateRow {
  firstName: string;
  lastName: string;
  street: string; // street with number
  city: string; // city with zip code
  birthDate?: DayDate;
  period: string; // e.g. 1/07/2015 tot 28/08/2015 or 1/07/2015 tot 21/08/2015 or 6/07/2015 tot 28/08/2015
  numberOfDays: number;
  dayPrice: string;
  totalReceivedAmount: string;
}

export class FiscalCertificateReportService {
  constructor(
    private childRepository: GenericRepository<IChild>,
    private contactPersonRepository: GenericRepository<IContactPerson>,
    private dayService: GenericRepository<IDay>,
    private childAttendanceService: ChildAttendanceService,
  ) {}

  async fiscalCertificateSheet(dbName: string, year: number) {
    const data = await this.allFiscalCertificateData(dbName, year);

    const wb = XLSX.utils.book_new();

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
      [ 'Voornaam', 'Familienaam', 'Straat', 'Gemeente', 'Geboortedatum', 'Periode', 'Aantal dagen', 'Dagprijs', 'Totaal ontvangen' ],
      ...data.map(row => [
        row.firstName, row.lastName, row.street, row.city, row.birthDate ? row.birthDate.toString() : '', row.period, row.numberOfDays, row.dayPrice, row.totalReceivedAmount
      ])
    ]);

    XLSX.utils.book_append_sheet(wb, ws, `Aanwezigheden in ${year}`);

    return XLSX.write(wb, {type: 'base64', bookType: 'xlsx'});
  }

  async allFiscalCertificateData(dbName: string, year: number): Promise<ReadonlyArray<CertificateRow>> {
    const allDays = await this.dayService.all(dbName);
    const allAttendances = await this.childAttendanceService.findAllRaw({dbName});
    const allChildren = Child.sorted((await this.childRepository.all(dbName)).map(ichild => new Child(ichild)));
    const allContactPeople = ContactPerson.sorted((await this.contactPersonRepository.all(dbName)).map(icp => new ContactPerson(icp)));

    const daysThisYear = Day.sorted(allDays.filter(day => day.date.year === year).map(iday => new Day(iday)));

    const uniqueChildIdsThisYear = new Set(allAttendances.filter(att => DayDate.fromDayId(att.dayId).year === year).map(att => att.childId));

    const childrenWithAttendancesThisYear = allChildren.filter(child => {
      return uniqueChildIdsThisYear.has(child.id);
    });

    const attendancesObj = {}; // Attendances object as array: attendancesObj[childId][dayId][shiftId] === true if child attended shift

    allAttendances.forEach(value => {
      if (DayDate.fromDayId(value.dayId).year !== year) {
        return;
      }

      if (!attendancesObj[value.childId]) {
        attendancesObj[value.childId] = { shifts: [], uniqueDays: new Set<string>() };
      }

      const matchedDay = allDays.find(day => day.id === value.dayId);

      if (!matchedDay || !matchedDay.shifts.find(shift => shift.id === value.shiftId)) {
        return;
      }

      attendancesObj[value.childId].shifts.push(matchedDay.shifts.find(shift => shift.id === value.shiftId));
      attendancesObj[value.childId].uniqueDays.add(value.dayId);
    });

    return flatMap(Object.keys(attendancesObj).filter(childId => childId).map(childId => {
      const child = allChildren.find(child => child.id === childId);
      if (!child) {
        return [];
      }

      return [{
        firstName: child.firstName,
        lastName: child.lastName,
        street: 'TODO',
        city: 'TODO',
        birthDate: child.birthDate ? new DayDate(child.birthDate) : null,
        period: '',
        numberOfDays: attendancesObj[childId].uniqueDays.size,
        dayPrice: '',
        totalReceivedAmount: this.getTotalPrice(attendancesObj[childId].shifts.map(shift => new Price(shift.price))).toString()
      }];
    }));
  }

  private getTotalPrice(prices: ReadonlyArray<Price>): Price {
    return prices.reduceRight((a, b) => a.add(b), new Price({ cents: 0, euro: 0 }));
  }
}
