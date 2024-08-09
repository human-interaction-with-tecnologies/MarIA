import { type Entry } from '@retorquere/bibtex-parser'

export interface Author {
  firstName: string;
  lastName: string;
}

export interface ReviwedEntry extends Entry {
  accepted: boolean | 'null';
}
