import { Author } from 'src/components/models'

export default function joinAuthors (authors: Author[] = []) {
  return authors.reduce((accumulator: string, currAuthor: Author) => {
    return ` ${accumulator} ${currAuthor.given} ${currAuthor.family},`
  }, '').slice(0, -1).trim()
}
