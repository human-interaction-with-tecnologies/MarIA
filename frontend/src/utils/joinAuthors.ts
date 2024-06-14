import { type Name } from '@retorquere/bibtex-parser'

export default function joinAuthors (authors: Name[] = []) {
  return authors.reduce((accumulator: string, currAuthor: Name) => {
    return ` ${accumulator} ${currAuthor.firstName} ${currAuthor.lastName},`
  }, '').slice(0, -1).trim()
}
