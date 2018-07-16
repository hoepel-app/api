import { Callback } from '../callback';
import * as XLSX from 'xlsx';
import { GenericRepository } from './generic-repository';
import { DayDate, IChild } from 'types.hoepel.app';

export class ExportService {
  constructor(private childRepository: GenericRepository<IChild>) {}

  downloadChildren(dbName: string, callback: Callback<any>) {
    // TODO - INCOMPLETE
    // TODO This doesn't seem to work... Makes Lambda hang without explanation, sometimes gives a 'module initialization error'
    // TODO  but nothing in logs...

    this.childRepository.all(dbName, (err, allChildren) => {
      if (err) {
        callback(err, null);
        return;
      }

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

      callback(null, XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }));

    });
  }

  downloadChildrenWithRemarks(dbName: string, callback: Callback<string>) {
    // TODO
  }
  downloadCrew(dbName: string, callback: Callback<string>) {
    // TODO
  }

}
