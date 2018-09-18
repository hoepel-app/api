import * as XLSX from 'xlsx';
import { GenericRepository } from './generic-repository';
import { DayDate, IChild } from 'types.hoepel.app';

export class ExportService {
  constructor(private childRepository: GenericRepository<IChild>) {}

  async downloadChildren(dbName: string): Promise<string> {
    const allChildren = await this.childRepository.all(dbName);

    const rows = allChildren.map((child: IChild) => {
      const birthDate = child.birthDate ? new DayDate(child.birthDate).nativeDate : '';

      return { firstName: child.firstName, lastName: child.lastName, birthDate, remarks: child.remarks };
    });

    const data = [
      [ 'Voornaam', 'Familienaam', 'Geboortedatum', 'Opmerkingen' ],
      ...rows.map(row => [ row.firstName, row.lastName, row.birthDate, row.remarks ]),
    ];

    const wb = XLSX.utils.book_new();

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, 'Alle kinderen');

    return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  }

  async downloadChildrenWithRemarks(dbName: string): Promise<string> {
    const allChildren = await this.childRepository.all(dbName);

    const rows = allChildren.filter(child => child.remarks).map((child: IChild) => {
      const birthDate = child.birthDate ? new DayDate(child.birthDate).nativeDate : '';

      return { firstName: child.firstName, lastName: child.lastName, birthDate, remarks: child.remarks };
    });

    const data = [
      [ 'Voornaam', 'Familienaam', 'Geboortedatum', 'Opmerkingen' ],
      ...rows.map(row => [ row.firstName, row.lastName, row.birthDate, row.remarks ]),
    ];

    const wb = XLSX.utils.book_new();

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, 'Alle kinderen');

    return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  }
  downloadCrew(dbName: string): Promise<string> {
    throw new Error('Not implemented');
    // TODO
  }

}
