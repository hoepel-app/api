import * as XLSX from 'xlsx';
import { GenericRepository } from './generic-repository';
import { DayDate, IChild } from 'types.hoepel.app';

export class ExportService {
  constructor(private childRepository: GenericRepository<IChild>) {}

  async downloadChildren(dbName: string): Promise<string> {
    // TODO - INCOMPLETE
    // TODO This doesn't seem to work... Makes Lambda hang without explanation, sometimes gives a 'module initialization error'
    // TODO  but nothing in logs...

    const allChildren = await this.childRepository.all(dbName);

    const rows = allChildren.map((child: IChild) => {
      const birthDate = child.birthDate ? new DayDate(child.birthDate).nativeDate : '';

      return [ child.firstName, child.lastName, birthDate ]
    });

    const data = [
      [ 'Voornaam', 'Familienaam', 'Geboortedatum' ],
      ...rows,
    ];

    const wb = XLSX.utils.book_new();

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, 'Alle kinderen');

    return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  }

  async downloadChildrenWithRemarks(dbName: string): Promise<string> {
    throw new Error('Not implemented');
    // TODO
  }
  downloadCrew(dbName: string): Promise<string> {
    throw new Error('Not implemented');
    // TODO
  }

}
